-- ============================================================================
-- REVERT SCRIPT — restores RLS policies to their exact pre-S32 state
-- ============================================================================
-- Captures the original policy definitions exactly as pulled from pg_policies
-- at the START of the S32 RLS policy-writing phase, BEFORE any of tonight's
-- changes were applied. Run this if live testing next month reveals that any
-- of tonight's tightened policies broke real functionality.
--
-- Covers all 8 tables touched so far in the S32 RLS policy-writing phase:
-- escrow_transactions, buyer_strikes, direct_messages, message_threads,
-- shipping_addresses, shipping_profiles, shipment_groups, notifications.
--
-- NOTE: this restores the OLD (weaker) policies, including the dead
-- app.wallet checks and the redundant permissive `true` policies on
-- shipping_profiles/shipment_groups/notifications that were bugs. This is a
-- deliberate full revert to the exact prior state, not a "fixed" version —
-- use only if tonight's changes need to be fully undone.
--
-- Does NOT touch: request_verified_wallet_address(), verify_wallet_jwt(),
-- or any app-code changes (those are safe to leave in place regardless of
-- which RLS policies are active, and reverting app code separately via git
-- is a different concern from reverting SQL).
-- ============================================================================

-- ── escrow_transactions ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "escrow_transactions_select" ON public.escrow_transactions;
CREATE POLICY "escrow_transactions_select"
ON public.escrow_transactions
FOR SELECT
USING (
  (request_wallet_address() = 'CVqvsLBSQ3Q8ZiZDB6pvavYQZ4aKchrJ2g7Eh2BLKXyT'::text)
  OR (from_wallet = request_wallet_address())
  OR (to_wallet = request_wallet_address())
);

-- ── buyer_strikes ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "strikes admin only write" ON public.buyer_strikes;
CREATE POLICY "strikes admin only write"
ON public.buyer_strikes
FOR ALL
USING (
  (((current_setting('request.headers'::text, true))::json ->> 'x-wallet-address'::text) = 'CVqvsLBSQ3Q8ZiZDB6pvavYQZ4aKchrJ2g7Eh2BLKXyT'::text)
);

DROP POLICY IF EXISTS "strikes viewable by owner" ON public.buyer_strikes;
CREATE POLICY "strikes viewable by owner"
ON public.buyer_strikes
FOR SELECT
USING (
  wallet_address = ((current_setting('request.headers'::text, true))::json ->> 'x-wallet-address'::text)
);

-- ── direct_messages ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "messages participant only" ON public.direct_messages;
CREATE POLICY "messages participant only"
ON public.direct_messages
FOR ALL
USING (
  (sender_wallet = ((current_setting('request.headers'::text, true))::json ->> 'x-wallet-address'::text))
  OR (thread_id IN (
    SELECT message_threads.id
    FROM message_threads
    WHERE (message_threads.buyer_wallet = ((current_setting('request.headers'::text, true))::json ->> 'x-wallet-address'::text))
       OR (message_threads.seller_wallet = ((current_setting('request.headers'::text, true))::json ->> 'x-wallet-address'::text))
  ))
);

-- ── message_threads ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "threads participant only" ON public.message_threads;
CREATE POLICY "threads participant only"
ON public.message_threads
FOR ALL
USING (
  (buyer_wallet = ((current_setting('request.headers'::text, true))::json ->> 'x-wallet-address'::text))
  OR (seller_wallet = ((current_setting('request.headers'::text, true))::json ->> 'x-wallet-address'::text))
);

-- ── shipping_addresses ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "shipping addresses owner only" ON public.shipping_addresses;
DROP POLICY IF EXISTS "Users can manage own addresses" ON public.shipping_addresses;

CREATE POLICY "Users can manage own addresses"
ON public.shipping_addresses
FOR ALL
USING (wallet_address = current_setting('app.wallet'::text, true));

CREATE POLICY "shipping addresses owner only"
ON public.shipping_addresses
FOR ALL
USING (
  wallet_address = ((current_setting('request.headers'::text, true))::json ->> 'x-wallet-address'::text)
);

-- ── shipping_profiles ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "shipping profiles owner only write" ON public.shipping_profiles;
DROP POLICY IF EXISTS "shipping profiles are viewable" ON public.shipping_profiles;

CREATE POLICY "Users can manage own shipping profiles"
ON public.shipping_profiles
FOR ALL
USING (seller_wallet = current_setting('app.wallet'::text, true));

CREATE POLICY "shipping profiles are viewable"
ON public.shipping_profiles
FOR SELECT
USING (true);

CREATE POLICY "shipping profiles can be deleted"
ON public.shipping_profiles
FOR DELETE
USING (true);

CREATE POLICY "shipping profiles can be inserted"
ON public.shipping_profiles
FOR INSERT
WITH CHECK (true);

CREATE POLICY "shipping profiles can be updated"
ON public.shipping_profiles
FOR UPDATE
USING (true)
WITH CHECK (true);

-- ── shipment_groups ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "shipment groups owner only write" ON public.shipment_groups;
DROP POLICY IF EXISTS "shipment groups are viewable" ON public.shipment_groups;

CREATE POLICY "Users can manage own shipment groups"
ON public.shipment_groups
FOR ALL
USING (seller_wallet = current_setting('app.wallet'::text, true));

CREATE POLICY "shipment groups are viewable"
ON public.shipment_groups
FOR SELECT
USING (true);

CREATE POLICY "shipment groups can be deleted"
ON public.shipment_groups
FOR DELETE
USING (true);

CREATE POLICY "shipment groups can be inserted"
ON public.shipment_groups
FOR INSERT
WITH CHECK (true);

CREATE POLICY "shipment groups can be updated"
ON public.shipment_groups
FOR UPDATE
USING (true)
WITH CHECK (true);

-- ── notifications ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "notifications owner only" ON public.notifications;
DROP POLICY IF EXISTS "notifications owner only update" ON public.notifications;

CREATE POLICY "notifications owner only"
ON public.notifications
FOR ALL
USING (
  wallet_address = ((current_setting('request.headers'::text, true))::json ->> 'x-wallet-address'::text)
);

CREATE POLICY "notifications_insert"
ON public.notifications
FOR INSERT
WITH CHECK (true);

CREATE POLICY "notifications_select"
ON public.notifications
FOR SELECT
USING (true);

CREATE POLICY "notifications_update"
ON public.notifications
FOR UPDATE
USING (true)
WITH CHECK (true);

-- ============================================================================
-- END REVERT SCRIPT
-- ============================================================================
