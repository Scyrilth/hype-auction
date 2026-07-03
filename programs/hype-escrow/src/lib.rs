#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;
use anchor_lang::system_program::{self, Transfer};

declare_id!("DWvYLFF7iYYsZF97mYP7EhkEXXf1FPxs6SieTfgT5dYT");

/// Payment window for winner attempt 1 (10 minutes).
pub const PAYMENT_WINDOW_ATTEMPT_1: i64 = 600;
/// Payment window for winner attempt 2 (2 hours).
pub const PAYMENT_WINDOW_ATTEMPT_2: i64 = 7_200;
/// Payment window for winner attempt 3 (4 hours).
pub const PAYMENT_WINDOW_ATTEMPT_3: i64 = 14_400;
/// Seller must confirm shipping within 3 days of funding.
pub const SHIPPING_DEADLINE_SECONDS: i64 = 259_200;
/// Permissionless auto-refund after 7 days without shipping confirmation.
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
        let window = payment_window_seconds(attempt_number)?;

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
            require!(
                now <= escrow.payment_deadline,
                EscrowError::PaymentWindowExpired
            );

            (
                escrow.total_lamports()?,
                escrow.amount_lamports,
                escrow.shipping_lamports,
                escrow.buyer,
            )
        };

        fund_escrow(
            &ctx.accounts.buyer,
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
        require!(
            now > escrow.payment_deadline,
            EscrowError::PaymentWindowNotExpired
        );

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

        fund_escrow(
            &ctx.accounts.buyer,
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
        let shipping_deadline = escrow
            .funded_at
            .checked_add(SHIPPING_DEADLINE_SECONDS)
            .ok_or(EscrowError::InvalidAmount)?;
        require!(now <= shipping_deadline, EscrowError::TooLateToShip);

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

        let release_accounts = ctx.accounts.into_release_accounts();
        let (seller_amount, platform_fee) =
            release_to_seller_and_platform(&ctx.accounts.escrow, &release_accounts)?;

        let escrow = &mut ctx.accounts.escrow;
        escrow.state = EscrowState::Complete;

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
            let release_accounts = ctx.accounts.into_release_accounts();
            let (seller_amount, platform_fee) =
                release_to_seller_and_platform(&ctx.accounts.escrow, &release_accounts)?;

            ctx.accounts.escrow.state = EscrowState::Complete;

            emit!(ReleaseEvent {
                auction_id,
                seller: ctx.accounts.escrow.seller,
                seller_amount,
                platform_fee,
            });
        } else {
            let refund_accounts = ctx.accounts.into_refund_accounts();
            let amount = refund_buyer(&ctx.accounts.escrow, &refund_accounts)?;
            ctx.accounts.escrow.state = EscrowState::Refunded;

            emit!(AutoRefundEvent {
                auction_id,
                buyer: ctx.accounts.escrow.buyer,
                amount,
                refunded_at: now,
            });
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
            require!(
                now > escrow
                    .funded_at
                    .checked_add(AUTO_REFUND_SECONDS)
                    .ok_or(EscrowError::InvalidAmount)?,
                EscrowError::TooEarlyForRefund
            );

            (escrow.buyer, escrow.total_lamports()?)
        };

        let refund_accounts = ctx.accounts.into_refund_accounts();
        refund_buyer(&ctx.accounts.escrow, &refund_accounts)?;

        let now = Clock::get()?.unix_timestamp;
        let escrow = &mut ctx.accounts.escrow;
        escrow.state = EscrowState::Refunded;

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
// Accounts
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
        let platform_fee = self
            .amount_lamports
            .checked_mul(self.platform_fee_bps as u64)
            .ok_or(error!(EscrowError::InvalidAmount))?
            .checked_div(10_000)
            .ok_or(error!(EscrowError::InvalidAmount))?;
        let seller_amount = self
            .total_lamports()?
            .checked_sub(platform_fee)
            .ok_or(error!(EscrowError::InvalidAmount))?;
        Ok((seller_amount, platform_fee))
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
// Instruction contexts
// ---------------------------------------------------------------------------

#[derive(Accounts)]
#[instruction(auction_id: [u8; 32])]
pub struct InitializeEscrow<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    /// CHECK: Validated against instruction arg and stored on escrow.
    pub seller: UncheckedAccount<'info>,

    /// CHECK: Validated against instruction arg and stored on escrow.
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

    /// CHECK: Validated against instruction arg and stored on escrow.
    pub seller: UncheckedAccount<'info>,

    /// CHECK: Validated against instruction arg and stored on escrow.
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

    /// CHECK: Must match escrow.seller; receives seller proceeds.
    #[account(mut, address = escrow.seller)]
    pub seller: UncheckedAccount<'info>,

    /// CHECK: Must match escrow.platform_wallet; receives platform fee.
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
    #[account(mut)]
    pub platform_wallet: Signer<'info>,

    /// CHECK: Must match escrow.buyer; refund destination when applicable.
    #[account(mut, address = escrow.buyer)]
    pub buyer: UncheckedAccount<'info>,

    /// CHECK: Must match escrow.seller; release destination when applicable.
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

impl<'info> ResolveDispute<'info> {
    fn into_release_accounts(&self) -> ReleaseAccounts<'info> {
        ReleaseAccounts {
            seller: self.seller.to_account_info(),
            platform_wallet: self.platform_wallet.to_account_info(),
            escrow: self.escrow.to_account_info(),
            system_program: self.system_program.to_account_info(),
        }
    }

    fn into_refund_accounts(&self) -> RefundAccounts<'info> {
        RefundAccounts {
            buyer: self.buyer.to_account_info(),
            escrow: self.escrow.to_account_info(),
            system_program: self.system_program.to_account_info(),
        }
    }
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

impl<'info> AutoRefund<'info> {
    fn into_refund_accounts(&self) -> RefundAccounts<'info> {
        RefundAccounts {
            buyer: self.buyer.to_account_info(),
            escrow: self.escrow.to_account_info(),
            system_program: self.system_program.to_account_info(),
        }
    }
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
// CPI helpers
// ---------------------------------------------------------------------------

struct ReleaseAccounts<'info> {
    seller: AccountInfo<'info>,
    platform_wallet: AccountInfo<'info>,
    escrow: AccountInfo<'info>,
    system_program: AccountInfo<'info>,
}

struct RefundAccounts<'info> {
    buyer: AccountInfo<'info>,
    escrow: AccountInfo<'info>,
    system_program: AccountInfo<'info>,
}

fn payment_window_seconds(attempt_number: u8) -> Result<i64> {
    match attempt_number {
        1 => Ok(PAYMENT_WINDOW_ATTEMPT_1),
        2 => Ok(PAYMENT_WINDOW_ATTEMPT_2),
        3 => Ok(PAYMENT_WINDOW_ATTEMPT_3),
        _ => err!(EscrowError::InvalidAttemptNumber),
    }
}

fn fund_escrow<'info>(
    buyer: &Signer<'info>,
    escrow: &AccountInfo<'info>,
    system_program: &Program<'info, System>,
    amount: u64,
) -> Result<()> {
    require!(amount > 0, EscrowError::InvalidAmount);

    system_program::transfer(
        CpiContext::new(
            system_program.to_account_info(),
            Transfer {
                from: buyer.to_account_info(),
                to: escrow.clone(),
            },
        ),
        amount,
    )
}

fn transfer_lamports_from_escrow<'info>(
    escrow: &AccountInfo<'info>,
    recipient: &AccountInfo<'info>,
    amount: u64,
) -> Result<()> {
    require!(amount > 0, EscrowError::InvalidAmount);

    let mut escrow_lamports = escrow.try_borrow_mut_lamports()?;
    let mut recipient_lamports = recipient.try_borrow_mut_lamports()?;

    **escrow_lamports = escrow_lamports
        .checked_sub(amount)
        .ok_or(EscrowError::InvalidAmount)?;
    **recipient_lamports = recipient_lamports
        .checked_add(amount)
        .ok_or(EscrowError::InvalidAmount)?;

    Ok(())
}

fn release_to_seller_and_platform<'info>(
    escrow: &EscrowAccount,
    accounts: &ReleaseAccounts<'info>,
) -> Result<(u64, u64)> {
    let (seller_amount, platform_fee) = escrow.fee_split()?;
    let total = escrow.total_lamports()?;

    require!(
        accounts.escrow.lamports() >= total,
        EscrowError::InvalidAmount
    );

    if accounts.seller.key() == accounts.platform_wallet.key() {
        transfer_lamports_from_escrow(&accounts.escrow, &accounts.seller, total)?;
    } else {
        if seller_amount > 0 {
            transfer_lamports_from_escrow(&accounts.escrow, &accounts.seller, seller_amount)?;
        }

        if platform_fee > 0 {
            transfer_lamports_from_escrow(
                &accounts.escrow,
                &accounts.platform_wallet,
                platform_fee,
            )?;
        }
    }

    Ok((seller_amount, platform_fee))
}

fn refund_buyer<'info>(escrow: &EscrowAccount, accounts: &RefundAccounts<'info>) -> Result<u64> {
    let total = escrow.total_lamports()?;

    require!(
        accounts.escrow.lamports() >= total,
        EscrowError::InvalidAmount
    );

    transfer_lamports_from_escrow(&accounts.escrow, &accounts.buyer, total)?;

    Ok(total)
}

fn escrow_signer_seeds(escrow: &EscrowAccount) -> [&[u8]; 3] {
    [
        b"escrow",
        escrow.auction_id.as_ref(),
        core::slice::from_ref(&escrow.bump),
    ]
}

impl<'info> Release<'info> {
    fn into_release_accounts(&self) -> ReleaseAccounts<'info> {
        ReleaseAccounts {
            seller: self.seller.to_account_info(),
            platform_wallet: self.platform_wallet.to_account_info(),
            escrow: self.escrow.to_account_info(),
            system_program: self.system_program.to_account_info(),
        }
    }
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
