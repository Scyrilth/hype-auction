-- Escrow transaction ledger — append-only audit trail (run in Supabase SQL Editor)

CREATE SEQUENCE IF NOT EXISTS platform_transaction_seq START 1;

CREATE OR REPLACE FUNCTION public.next_platform_transaction_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  n BIGINT;
BEGIN
  n := nextval('platform_transaction_seq');
  RETURN 'HA-TXN-' || lpad(n::text, 6, '0');
END;
$$;

CREATE TABLE IF NOT EXISTS public.escrow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_transaction_id TEXT NOT NULL,
  auction_id UUID NOT NULL REFERENCES public.auctions (id) ON DELETE RESTRICT,
  thread_id UUID REFERENCES public.message_threads (id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'funded',
      'shipped',
      'released',
      'refunded',
      'disputed',
      'dispute_resolved',
      'fee_collected'
    )
  ),
  direction TEXT NOT NULL CHECK (direction IN ('inward', 'outward')),
  from_wallet TEXT NOT NULL,
  to_wallet TEXT NOT NULL,
  amount_lamports BIGINT NOT NULL CHECK (amount_lamports > 0),
  is_platform_fee BOOLEAN NOT NULL DEFAULT false,
  on_chain_signature TEXT,
  solscan_url TEXT,
  escrow_pda TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS escrow_transactions_auction_idx
  ON public.escrow_transactions (auction_id, created_at DESC);

CREATE INDEX IF NOT EXISTS escrow_transactions_platform_txn_idx
  ON public.escrow_transactions (platform_transaction_id, created_at DESC);

CREATE INDEX IF NOT EXISTS escrow_transactions_from_wallet_idx
  ON public.escrow_transactions (from_wallet, created_at DESC);

CREATE INDEX IF NOT EXISTS escrow_transactions_to_wallet_idx
  ON public.escrow_transactions (to_wallet, created_at DESC);

CREATE INDEX IF NOT EXISTS escrow_transactions_event_type_idx
  ON public.escrow_transactions (event_type, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS escrow_transactions_signature_event_uidx
  ON public.escrow_transactions (on_chain_signature, event_type)
  WHERE on_chain_signature IS NOT NULL AND on_chain_signature <> '';

ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- RLS (defense-in-depth — not the app's primary access path)
--
-- Real reads: GET /api/transactions and GET /api/admin/escrow-monitor use
-- getNotificationClient() (service_role), which bypasses RLS.
-- Real writes: POST /api/escrow/ledger uses service_role after on-chain confirm.
--
-- getAuthenticatedClient() sends x-wallet-address but connects as the anon
-- Postgres role (anon API key), not authenticated. This project's browser
-- traffic therefore never satisfies TO authenticated below.
--
-- request_wallet_address() / request.headers has not been validated in this
-- Supabase project; message_threads does not use this pattern.
--
-- REVOKE FROM anon blocks direct anon REST reads regardless. The SELECT
-- policy documents intended wallet-scoped access if a future path uses
-- Supabase Auth (authenticated role) + x-wallet-address; it is inert today.
-- ---------------------------------------------------------------------------

-- Wallet header helper (x-wallet-address from getAuthenticatedClient).
CREATE OR REPLACE FUNCTION public.request_wallet_address()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT nullif(
    trim(
      coalesce(
        current_setting('request.headers', true)::json->>'x-wallet-address',
        ''
      )
    ),
    ''
  );
$$;

-- Anon cannot read or write via PostgREST; service_role bypasses RLS for server routes.
REVOKE ALL ON public.escrow_transactions FROM anon;
GRANT SELECT ON public.escrow_transactions TO authenticated;

DROP POLICY IF EXISTS "escrow_transactions_select" ON public.escrow_transactions;
DROP POLICY IF EXISTS "escrow_transactions_insert" ON public.escrow_transactions;

-- TO authenticated: inert for current anon-key clients; see block above.
CREATE POLICY "escrow_transactions_select"
  ON public.escrow_transactions
  FOR SELECT
  TO authenticated
  USING (
    public.request_wallet_address() = 'CVqvsLBSQ3Q8ZiZDB6pvavYQZ4aKchrJ2g7Eh2BLKXyT'
    OR from_wallet = public.request_wallet_address()
    OR to_wallet = public.request_wallet_address()
  );

-- No INSERT policy: only service_role may insert (bypasses RLS).

-- ---------------------------------------------------------------------------
-- Backfill: live mainnet test auctions (escrow PDAs from recovery / UI tests)
-- Re-run safe: skips rows when signature+event_type already exists.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  rec RECORD;
  ptid TEXT;
  buyer_wallet TEXT;
  seller_wallet TEXT;
  platform_wallet TEXT := 'CVqvsLBSQ3Q8ZiZDB6pvavYQZ4aKchrJ2g7Eh2BLKXyT';
  total_lamports BIGINT;
  fee_lamports BIGINT;
  seller_lamports BIGINT;
  thread_uuid UUID;
  funded_sig TEXT;
BEGIN
  FOR rec IN
    SELECT
      a.id AS auction_id,
      a.escrow_pda,
      a.escrow_tx_signature,
      a.escrow_amount_lamports,
      a.escrow_state,
      a.seller_wallet,
      a.payment_completed_at,
      a.tracking_uploaded_at,
      a.reference_number
    FROM public.auctions a
    WHERE a.escrow_pda IN (
      '6rvMGANJ3FkotvpLtAs7qEQ15jApBPBYjU9n7bep38jk',
      '4dyfqYfvhkpFXpXErQuk4BpzhwzZ9EoxSpBTrYPDohmp'
    )
       OR a.reference_number = 'HA-202606-S5KREM'
  LOOP
    SELECT b.bidder_wallet
    INTO buyer_wallet
    FROM public.bids b
    WHERE b.auction_id = rec.auction_id
    ORDER BY b.amount DESC
    LIMIT 1;

    IF buyer_wallet IS NULL THEN
      CONTINUE;
    END IF;

    seller_wallet := rec.seller_wallet;
    total_lamports := COALESCE(rec.escrow_amount_lamports, 0);
    IF total_lamports <= 0 THEN
      CONTINUE;
    END IF;

    fee_lamports := (total_lamports * 400) / 10000;
    seller_lamports := total_lamports - fee_lamports;

    SELECT mt.id
    INTO thread_uuid
    FROM public.message_threads mt
    WHERE mt.auction_id = rec.auction_id
      AND mt.buyer_wallet = buyer_wallet
    ORDER BY mt.created_at DESC
    LIMIT 1;

    ptid := public.next_platform_transaction_id();
    funded_sig := NULLIF(TRIM(rec.escrow_tx_signature), '');

    IF funded_sig IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.escrow_transactions et
      WHERE et.on_chain_signature = funded_sig AND et.event_type = 'funded'
    ) THEN
      INSERT INTO public.escrow_transactions (
        platform_transaction_id,
        auction_id,
        thread_id,
        event_type,
        direction,
        from_wallet,
        to_wallet,
        amount_lamports,
        is_platform_fee,
        on_chain_signature,
        solscan_url,
        escrow_pda,
        created_at
      ) VALUES (
        ptid,
        rec.auction_id,
        thread_uuid,
        'funded',
        'outward',
        buyer_wallet,
        rec.escrow_pda,
        total_lamports,
        false,
        funded_sig,
        'https://solscan.io/tx/' || funded_sig,
        rec.escrow_pda,
        COALESCE(rec.payment_completed_at, now())
      );
    END IF;

    IF rec.tracking_uploaded_at IS NOT NULL
       AND rec.escrow_state IN ('shipped', 'complete', 'released')
       AND NOT EXISTS (
         SELECT 1 FROM public.escrow_transactions et
         WHERE et.auction_id = rec.auction_id AND et.event_type = 'shipped'
       ) THEN
      INSERT INTO public.escrow_transactions (
        platform_transaction_id,
        auction_id,
        thread_id,
        event_type,
        direction,
        from_wallet,
        to_wallet,
        amount_lamports,
        is_platform_fee,
        escrow_pda,
        created_at
      ) VALUES (
        ptid,
        rec.auction_id,
        thread_uuid,
        'shipped',
        'outward',
        seller_wallet,
        rec.escrow_pda,
        total_lamports,
        false,
        NULL,
        rec.escrow_pda,
        COALESCE(rec.tracking_uploaded_at, now())
      );
    END IF;

    IF rec.escrow_state IN ('complete', 'released')
       AND NOT EXISTS (
         SELECT 1 FROM public.escrow_transactions et
         WHERE et.auction_id = rec.auction_id AND et.event_type = 'released'
       ) THEN
      INSERT INTO public.escrow_transactions (
        platform_transaction_id,
        auction_id,
        thread_id,
        event_type,
        direction,
        from_wallet,
        to_wallet,
        amount_lamports,
        is_platform_fee,
        escrow_pda,
        created_at
      ) VALUES (
        ptid,
        rec.auction_id,
        thread_uuid,
        'released',
        'inward',
        rec.escrow_pda,
        seller_wallet,
        seller_lamports,
        false,
        rec.escrow_pda,
        now()
      );

      IF fee_lamports > 0 AND NOT EXISTS (
        SELECT 1 FROM public.escrow_transactions et
        WHERE et.auction_id = rec.auction_id AND et.event_type = 'fee_collected'
      ) THEN
        INSERT INTO public.escrow_transactions (
          platform_transaction_id,
          auction_id,
          thread_id,
          event_type,
          direction,
          from_wallet,
          to_wallet,
          amount_lamports,
          is_platform_fee,
          escrow_pda,
          created_at
        ) VALUES (
          ptid,
          rec.auction_id,
          thread_uuid,
          'fee_collected',
          'inward',
          rec.escrow_pda,
          platform_wallet,
          fee_lamports,
          true,
          rec.escrow_pda,
          now()
        );
      END IF;
    END IF;
  END LOOP;
END $$;
