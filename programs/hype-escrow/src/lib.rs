#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;
use anchor_lang::system_program::{self, Transfer};

declare_id!("FSfoXgb1g1zuW2n9VyUegWqf9fc6mfdaRrND4nFdLkMS");

pub const PAYMENT_WINDOW_ATTEMPT_1: i64 = 600;
pub const PAYMENT_WINDOW_ATTEMPT_2: i64 = 7_200;
pub const PAYMENT_WINDOW_ATTEMPT_3: i64 = 14_400;
pub const SHIPPING_DEADLINE_SECONDS: i64 = 259_200;
pub const AUTO_REFUND_SECONDS: i64 = 604_800;

#[program]
pub mod hype_escrow {
    use super::*;

    pub fn initialize_escrow(
        ctx: Context<InitializeEscrow>,
        auction_id: [u8; 32],
        seller: Pubkey,
        platform_wallet: Pubkey,
        amount_lamports: u64,
        shipping_lamports: u64,
        platform_fee_bps: u16,
        attempt_number: u8,
    ) -> Result<()> {
        require!(
            (1..=3).contains(&attempt_number),
            EscrowError::InvalidAttemptNumber
        );
        require!(amount_lamports > 0, EscrowError::InvalidAmount);
        require_keys_eq!(ctx.accounts.seller.key(), seller, EscrowError::Unauthorized);
        require_keys_eq!(
            ctx.accounts.platform_wallet.key(),
            platform_wallet,
            EscrowError::Unauthorized
        );

        let now = Clock::get()?.unix_timestamp;
        let window = payment_window_for_attempt(attempt_number)?;

        let escrow = &mut ctx.accounts.escrow;
        escrow.auction_id = auction_id;
        escrow.buyer = ctx.accounts.buyer.key();
        escrow.seller = seller;
        escrow.platform_wallet = platform_wallet;
        escrow.amount_lamports = amount_lamports;
        escrow.shipping_lamports = shipping_lamports;
        escrow.platform_fee_bps = platform_fee_bps;
        escrow.state = EscrowState::Pending;
        escrow.attempt_number = attempt_number;
        escrow.payment_deadline = now
            .checked_add(window)
            .ok_or(EscrowError::InvalidAmount)?;
        escrow.funded_at = 0;
        escrow.shipped_at = 0;
        escrow.dispute_opened_at = 0;
        escrow.bump = ctx.bumps.escrow;

        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, auction_id: [u8; 32]) -> Result<()> {
        let (total, amount_lamports, shipping_lamports, buyer) = {
            let escrow = &ctx.accounts.escrow;
            require!(escrow.auction_id == auction_id, EscrowError::InvalidState);
            match escrow.state {
                EscrowState::Pending => {}
                EscrowState::Funded => return err!(EscrowError::AlreadyClaimed),
                _ => return err!(EscrowError::InvalidState),
            }
            require_keys_eq!(escrow.buyer, ctx.accounts.buyer.key(), EscrowError::Unauthorized);

            let now = Clock::get()?.unix_timestamp;
            require!(now <= escrow.payment_deadline, EscrowError::PaymentWindowExpired);

            (
                escrow.total_lamports()?,
                escrow.amount_lamports,
                escrow.shipping_lamports,
                escrow.buyer,
            )
        };

        transfer_lamports(
            &ctx.accounts.buyer.to_account_info(),
            &ctx.accounts.escrow.to_account_info(),
            &ctx.accounts.system_program,
            total,
        )?;

        let now = Clock::get()?.unix_timestamp;
        let escrow = &mut ctx.accounts.escrow;
        escrow.state = EscrowState::Funded;
        escrow.funded_at = now;

        emit!(DepositEvent {
            auction_id,
            buyer,
            amount_lamports,
            shipping_lamports,
            funded_at: now,
        });

        Ok(())
    }

    pub fn expire_escrow(ctx: Context<ExpireEscrow>, auction_id: [u8; 32]) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(escrow.auction_id == auction_id, EscrowError::InvalidState);
        require!(escrow.state == EscrowState::Pending, EscrowError::InvalidState);

        let now = Clock::get()?.unix_timestamp;
        require!(now > escrow.payment_deadline, EscrowError::PaymentWindowNotExpired);

        let attempt_number = escrow.attempt_number;
        escrow.state = EscrowState::Expired;

        emit!(ExpiredEvent {
            auction_id,
            attempt_number,
            expired_at: now,
        });

        Ok(())
    }

    pub fn buy_now(
        ctx: Context<BuyNow>,
        auction_id: [u8; 32],
        seller: Pubkey,
        platform_wallet: Pubkey,
        amount_lamports: u64,
        shipping_lamports: u64,
        platform_fee_bps: u16,
    ) -> Result<()> {
        require!(amount_lamports > 0, EscrowError::InvalidAmount);
        require_keys_eq!(ctx.accounts.seller.key(), seller, EscrowError::Unauthorized);
        require_keys_eq!(
            ctx.accounts.platform_wallet.key(),
            platform_wallet,
            EscrowError::Unauthorized
        );

        let (total, buyer) = {
            let escrow = &mut ctx.accounts.escrow;
            escrow.auction_id = auction_id;
            escrow.buyer = ctx.accounts.buyer.key();
            escrow.seller = seller;
            escrow.platform_wallet = platform_wallet;
            escrow.amount_lamports = amount_lamports;
            escrow.shipping_lamports = shipping_lamports;
            escrow.platform_fee_bps = platform_fee_bps;
            escrow.state = EscrowState::Pending;
            escrow.attempt_number = 1;
            escrow.payment_deadline = 0;
            escrow.shipped_at = 0;
            escrow.dispute_opened_at = 0;
            escrow.bump = ctx.bumps.escrow;
            (escrow.total_lamports()?, escrow.buyer)
        };

        transfer_lamports(
            &ctx.accounts.buyer.to_account_info(),
            &ctx.accounts.escrow.to_account_info(),
            &ctx.accounts.system_program,
            total,
        )?;

        let now = Clock::get()?.unix_timestamp;
        let escrow = &mut ctx.accounts.escrow;
        escrow.state = EscrowState::Funded;
        escrow.funded_at = now;

        emit!(DepositEvent {
            auction_id,
            buyer,
            amount_lamports,
            shipping_lamports,
            funded_at: now,
        });

        Ok(())
    }

    pub fn confirm_shipping(ctx: Context<ConfirmShipping>, auction_id: [u8; 32]) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(escrow.auction_id == auction_id, EscrowError::InvalidState);
        require!(escrow.state == EscrowState::Funded, EscrowError::InvalidState);
        require_keys_eq!(escrow.seller, ctx.accounts.seller.key(), EscrowError::Unauthorized);

        let now = Clock::get()?.unix_timestamp;
        let deadline = escrow
            .funded_at
            .checked_add(SHIPPING_DEADLINE_SECONDS)
            .ok_or(EscrowError::InvalidAmount)?;
        require!(now <= deadline, EscrowError::TooLateToShip);

        escrow.state = EscrowState::Shipped;
        escrow.shipped_at = now;

        Ok(())
    }

    pub fn release(ctx: Context<Release>, auction_id: [u8; 32]) -> Result<()> {
        let seller = {
            let escrow = &ctx.accounts.escrow;
            require!(escrow.auction_id == auction_id, EscrowError::InvalidState);
            require!(escrow.state == EscrowState::Shipped, EscrowError::InvalidState);
            require_keys_eq!(escrow.buyer, ctx.accounts.buyer.key(), EscrowError::Unauthorized);
            escrow.seller
        };

        let (seller_amount, platform_fee) = execute_release(
            &ctx.accounts.escrow,
            &ctx.accounts.seller.to_account_info(),
            &ctx.accounts.platform_wallet.to_account_info(),
            &ctx.accounts.system_program,
        )?;

        ctx.accounts.escrow.state = EscrowState::Complete;

        emit!(ReleaseEvent {
            auction_id,
            seller,
            seller_amount,
            platform_fee,
        });

        Ok(())
    }

    pub fn open_dispute(ctx: Context<OpenDispute>, auction_id: [u8; 32]) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(escrow.auction_id == auction_id, EscrowError::InvalidState);
        require!(escrow.state == EscrowState::Shipped, EscrowError::InvalidState);
        require_keys_eq!(escrow.buyer, ctx.accounts.buyer.key(), EscrowError::Unauthorized);

        escrow.state = EscrowState::Disputed;
        escrow.dispute_opened_at = Clock::get()?.unix_timestamp;

        Ok(())
    }

    pub fn resolve_dispute(
        ctx: Context<ResolveDispute>,
        auction_id: [u8; 32],
        release_to_seller: bool,
    ) -> Result<()> {
        {
            let escrow = &ctx.accounts.escrow;
            require!(escrow.auction_id == auction_id, EscrowError::InvalidState);
            require!(escrow.state == EscrowState::Disputed, EscrowError::InvalidState);
            require_keys_eq!(
                escrow.platform_wallet,
                ctx.accounts.platform_wallet.key(),
                EscrowError::Unauthorized
            );
        }

        let now = Clock::get()?.unix_timestamp;

        if release_to_seller {
            let seller = ctx.accounts.escrow.seller;
            let (seller_amount, platform_fee) = execute_release(
                &ctx.accounts.escrow,
                &ctx.accounts.seller.to_account_info(),
                &ctx.accounts.platform_wallet.to_account_info(),
                &ctx.accounts.system_program,
            )?;
            ctx.accounts.escrow.state = EscrowState::Complete;

            emit!(ReleaseEvent {
                auction_id,
                seller,
                seller_amount,
                platform_fee,
            });
        } else {
            execute_refund(
                &ctx.accounts.escrow,
                &ctx.accounts.buyer.to_account_info(),
                &ctx.accounts.system_program,
            )?;
            ctx.accounts.escrow.state = EscrowState::Refunded;
        }

        emit!(DisputeResolvedEvent {
            auction_id,
            release_to_seller,
            resolved_at: now,
        });

        Ok(())
    }

    pub fn auto_refund(ctx: Context<AutoRefund>, auction_id: [u8; 32]) -> Result<()> {
        let (buyer, amount) = {
            let escrow = &ctx.accounts.escrow;
            require!(escrow.auction_id == auction_id, EscrowError::InvalidState);
            require!(escrow.state == EscrowState::Funded, EscrowError::InvalidState);

            let now = Clock::get()?.unix_timestamp;
            let deadline = escrow
                .funded_at
                .checked_add(AUTO_REFUND_SECONDS)
                .ok_or(EscrowError::InvalidAmount)?;
            require!(now > deadline, EscrowError::TooEarlyForRefund);

            (escrow.buyer, escrow.total_lamports()?)
        };

        execute_refund(
            &ctx.accounts.escrow,
            &ctx.accounts.buyer.to_account_info(),
            &ctx.accounts.system_program,
        )?;

        let now = Clock::get()?.unix_timestamp;
        ctx.accounts.escrow.state = EscrowState::Refunded;

        emit!(AutoRefundEvent {
            auction_id,
            buyer,
            amount,
            refunded_at: now,
        });

        Ok(())
    }

    pub fn cancel(ctx: Context<Cancel>, auction_id: [u8; 32]) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(escrow.auction_id == auction_id, EscrowError::InvalidState);
        require!(
            escrow.state == EscrowState::Pending || escrow.state == EscrowState::Expired,
            EscrowError::InvalidState
        );
        require_keys_eq!(
            escrow.platform_wallet,
            ctx.accounts.platform_wallet.key(),
            EscrowError::Unauthorized
        );

        escrow.state = EscrowState::Cancelled;

        Ok(())
    }
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

#[account]
#[derive(InitSpace)]
pub struct EscrowAccount {
    pub auction_id: [u8; 32],
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub platform_wallet: Pubkey,
    pub amount_lamports: u64,
    pub shipping_lamports: u64,
    pub platform_fee_bps: u16,
    pub state: EscrowState,
    pub attempt_number: u8,
    pub payment_deadline: i64,
    pub funded_at: i64,
    pub shipped_at: i64,
    pub dispute_opened_at: i64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum EscrowState {
    Pending,
    Funded,
    Shipped,
    Complete,
    Disputed,
    Refunded,
    Cancelled,
    Expired,
}

impl EscrowAccount {
    pub fn total_lamports(&self) -> Result<u64> {
        self.amount_lamports
            .checked_add(self.shipping_lamports)
            .ok_or(error!(EscrowError::InvalidAmount))
    }

    pub fn fee_split(&self) -> Result<(u64, u64)> {
        let total = self.total_lamports()?;
        let platform_fee = total
            .checked_mul(self.platform_fee_bps as u64)
            .ok_or(error!(EscrowError::InvalidAmount))?
            .checked_div(10_000)
            .ok_or(error!(EscrowError::InvalidAmount))?;
        let seller_amount = total
            .checked_sub(platform_fee)
            .ok_or(error!(EscrowError::InvalidAmount))?;
        Ok((seller_amount, platform_fee))
    }

    fn signer_seeds(&self) -> [&[u8]; 3] {
        [
            b"escrow",
            self.auction_id.as_ref(),
            core::slice::from_ref(&self.bump),
        ]
    }
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

#[event]
pub struct DepositEvent {
    pub auction_id: [u8; 32],
    pub buyer: Pubkey,
    pub amount_lamports: u64,
    pub shipping_lamports: u64,
    pub funded_at: i64,
}

#[event]
pub struct ReleaseEvent {
    pub auction_id: [u8; 32],
    pub seller: Pubkey,
    pub seller_amount: u64,
    pub platform_fee: u64,
}

#[event]
pub struct ExpiredEvent {
    pub auction_id: [u8; 32],
    pub attempt_number: u8,
    pub expired_at: i64,
}

#[event]
pub struct AutoRefundEvent {
    pub auction_id: [u8; 32],
    pub buyer: Pubkey,
    pub amount: u64,
    pub refunded_at: i64,
}

#[event]
pub struct DisputeResolvedEvent {
    pub auction_id: [u8; 32],
    pub release_to_seller: bool,
    pub resolved_at: i64,
}

// ---------------------------------------------------------------------------
// Account contexts
// ---------------------------------------------------------------------------

#[derive(Accounts)]
#[instruction(auction_id: [u8; 32])]
pub struct InitializeEscrow<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    /// CHECK: Validated against instruction arg.
    pub seller: UncheckedAccount<'info>,
    /// CHECK: Validated against instruction arg.
    pub platform_wallet: UncheckedAccount<'info>,
    #[account(
        init,
        payer = buyer,
        space = 8 + EscrowAccount::INIT_SPACE,
        seeds = [b"escrow", auction_id.as_ref()],
        bump
    )]
    pub escrow: Account<'info, EscrowAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(auction_id: [u8; 32])]
pub struct Deposit<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"escrow", auction_id.as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, EscrowAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(auction_id: [u8; 32])]
pub struct ExpireEscrow<'info> {
    #[account(
        mut,
        seeds = [b"escrow", auction_id.as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, EscrowAccount>,
}

#[derive(Accounts)]
#[instruction(auction_id: [u8; 32])]
pub struct BuyNow<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    /// CHECK: Validated against instruction arg.
    pub seller: UncheckedAccount<'info>,
    /// CHECK: Validated against instruction arg.
    pub platform_wallet: UncheckedAccount<'info>,
    #[account(
        init,
        payer = buyer,
        space = 8 + EscrowAccount::INIT_SPACE,
        seeds = [b"escrow", auction_id.as_ref()],
        bump
    )]
    pub escrow: Account<'info, EscrowAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(auction_id: [u8; 32])]
pub struct ConfirmShipping<'info> {
    pub seller: Signer<'info>,
    #[account(
        mut,
        seeds = [b"escrow", auction_id.as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, EscrowAccount>,
}

#[derive(Accounts)]
#[instruction(auction_id: [u8; 32])]
pub struct Release<'info> {
    pub buyer: Signer<'info>,
    /// CHECK: Must match escrow.seller.
    #[account(mut, address = escrow.seller)]
    pub seller: UncheckedAccount<'info>,
    /// CHECK: Must match escrow.platform_wallet.
    #[account(mut, address = escrow.platform_wallet)]
    pub platform_wallet: UncheckedAccount<'info>,
    #[account(
        mut,
        seeds = [b"escrow", auction_id.as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, EscrowAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(auction_id: [u8; 32])]
pub struct OpenDispute<'info> {
    pub buyer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"escrow", auction_id.as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, EscrowAccount>,
}

#[derive(Accounts)]
#[instruction(auction_id: [u8; 32])]
pub struct ResolveDispute<'info> {
    pub platform_wallet: Signer<'info>,
    /// CHECK: Must match escrow.buyer.
    #[account(mut, address = escrow.buyer)]
    pub buyer: UncheckedAccount<'info>,
    /// CHECK: Must match escrow.seller.
    #[account(mut, address = escrow.seller)]
    pub seller: UncheckedAccount<'info>,
    #[account(
        mut,
        seeds = [b"escrow", auction_id.as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, EscrowAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(auction_id: [u8; 32])]
pub struct AutoRefund<'info> {
    /// CHECK: Must match escrow.buyer.
    #[account(mut, address = escrow.buyer)]
    pub buyer: UncheckedAccount<'info>,
    #[account(
        mut,
        seeds = [b"escrow", auction_id.as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, EscrowAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(auction_id: [u8; 32])]
pub struct Cancel<'info> {
    pub platform_wallet: Signer<'info>,
    #[account(mut)]
    pub buyer: SystemAccount<'info>,
    #[account(
        mut,
        close = buyer,
        seeds = [b"escrow", auction_id.as_ref()],
        bump = escrow.bump
    )]
    pub escrow: Account<'info, EscrowAccount>,
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

fn payment_window_for_attempt(attempt_number: u8) -> Result<i64> {
    match attempt_number {
        1 => Ok(PAYMENT_WINDOW_ATTEMPT_1),
        2 => Ok(PAYMENT_WINDOW_ATTEMPT_2),
        3 => Ok(PAYMENT_WINDOW_ATTEMPT_3),
        _ => err!(EscrowError::InvalidAttemptNumber),
    }
}

fn transfer_lamports<'info>(
    from: &AccountInfo<'info>,
    to: &AccountInfo<'info>,
    system_program: &Program<'info, System>,
    amount: u64,
) -> Result<()> {
    require!(amount > 0, EscrowError::InvalidAmount);
    system_program::transfer(
        CpiContext::new(
            system_program.to_account_info(),
            Transfer {
                from: from.clone(),
                to: to.clone(),
            },
        ),
        amount,
    )
}

fn execute_release<'info>(
    escrow: &Account<'info, EscrowAccount>,
    seller: &AccountInfo<'info>,
    platform_wallet: &AccountInfo<'info>,
    system_program: &Program<'info, System>,
) -> Result<(u64, u64)> {
    let (seller_amount, platform_fee) = escrow.fee_split()?;
    let total = escrow.total_lamports()?;
    require!(
        escrow.to_account_info().lamports() >= total,
        EscrowError::InvalidAmount
    );

    let seeds = escrow.signer_seeds();
    let signer = &[&seeds[..]];
    let escrow_info = escrow.to_account_info();

    if seller_amount > 0 {
        system_program::transfer(
            CpiContext::new_with_signer(
                system_program.to_account_info(),
                Transfer {
                    from: escrow_info.clone(),
                    to: seller.clone(),
                },
                signer,
            ),
            seller_amount,
        )?;
    }

    if platform_fee > 0 {
        system_program::transfer(
            CpiContext::new_with_signer(
                system_program.to_account_info(),
                Transfer {
                    from: escrow_info,
                    to: platform_wallet.clone(),
                },
                signer,
            ),
            platform_fee,
        )?;
    }

    Ok((seller_amount, platform_fee))
}

fn execute_refund<'info>(
    escrow: &Account<'info, EscrowAccount>,
    buyer: &AccountInfo<'info>,
    system_program: &Program<'info, System>,
) -> Result<()> {
    let total = escrow.total_lamports()?;
    require!(
        escrow.to_account_info().lamports() >= total,
        EscrowError::InvalidAmount
    );

    let seeds = escrow.signer_seeds();
    let signer = &[&seeds[..]];

    system_program::transfer(
        CpiContext::new_with_signer(
            system_program.to_account_info(),
            Transfer {
                from: escrow.to_account_info(),
                to: buyer.clone(),
            },
            signer,
        ),
        total,
    )
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

#[error_code]
pub enum EscrowError {
    #[msg("Escrow is not in the required state for this instruction")]
    InvalidState,
    #[msg("Signer is not authorized for this instruction")]
    Unauthorized,
    #[msg("Payment window has expired")]
    PaymentWindowExpired,
    #[msg("Payment window has not expired yet")]
    PaymentWindowNotExpired,
    #[msg("Auto-refund is not yet available")]
    TooEarlyForRefund,
    #[msg("Seller confirmation window has passed")]
    TooLateToShip,
    #[msg("Attempt number must be 1, 2, or 3")]
    InvalidAttemptNumber,
    #[msg("Amount is invalid")]
    InvalidAmount,
    #[msg("Escrow has already been funded")]
    AlreadyClaimed,
}
