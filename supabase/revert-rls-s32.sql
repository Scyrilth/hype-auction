-- ============================================================================
-- REVERT SCRIPT (v2) — restores RLS policies to their exact pre-S32 state
-- ============================================================================
-- Captures the original policy definitions exactly as pulled from pg_policies
-- at the START of the S32 RLS policy-writing phase, BEFORE any changes were
-- applied. Run this if live testing next month (once funded) reveals that
-- any of the S32 policy changes broke real functionality.
--
-- Covers ALL 18 tables touched during the S32 RLS policy-writing phase:
-- escrow_transactions, buyer_strikes, direct_messages, message_threads,
-- shipping_addresses, shipping_profiles, shipment_groups, notifications,
-- bids, users, auctions, messages, reviews, follows, watchlist,
-- collections, collection_items, collection_likes, collection_comments.
--
-- This SUPERSEDES the original supabase/revert-rls-s32.sql, which only
-- covered the first 8 tables. This version (v2) is the complete safety net.
--
-- NOTE: this restores the OLD (weaker) policies, including the dead
-- app.wallet checks, redundant permissive `true` policies, and duplicate
-- SELECT policies that were bugs. This is a deliberate full revert to the
-- exact prior state, not a "fixed" version — use only if S32's changes need
-- to be fully undone.
--
-- Does NOT touch: request_verified_wallet_address(), verify_wallet_jwt(),
-- or any app-code changes made during S32 (e.g. bid-placement.ts,
-- logistics.ts, messages.ts, seller.ts, api/listings/route.ts client fixes).
-- Those app-code changes are safe to leave in place regardless of which RLS
-- policies are active — reverting SQL and reverting app code are separate
-- concerns. If app code also needs reverting, use git to check out the
-- relevant commits individually.
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

-- ── bids ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "bids are viewable by everyone" ON public.bids;
DROP POLICY IF EXISTS "bids insert by bidder" ON public.bids;

CREATE POLICY "bids are viewable by everyone"
ON public.bids
FOR SELECT
USING (true);

CREATE POLICY "bids can be inserted by anyone"
ON public.bids
FOR INSERT
WITH CHECK (true);

-- ── users ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "users can update own record only" ON public.users;

CREATE POLICY "users can update own record only"
ON public.users
FOR UPDATE
USING (
  wallet_address = ((current_setting('request.headers'::text, true))::json ->> 'x-wallet-address'::text)
);
-- Note: "users are viewable by everyone" (SELECT true) and
-- "users can be created by anyone" (INSERT true) were never changed by S32
-- and remain in place regardless.

-- ── auctions ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "auctions are viewable by everyone" ON public.auctions;
DROP POLICY IF EXISTS "auctions insert by owner" ON public.auctions;
DROP POLICY IF EXISTS "auctions update by owner buyer or expiry" ON public.auctions;

CREATE POLICY "auctions are viewable by everyone"
ON public.auctions
FOR SELECT
USING (true);

CREATE POLICY "auctions can be created by anyone"
ON public.auctions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "auctions current_bid can be updated"
ON public.auctions
FOR UPDATE
USING (true)
WITH CHECK (true);

-- ── messages (public auction chat) ──────────────────────────────────────
DROP POLICY IF EXISTS "messages are viewable by everyone" ON public.messages;
DROP POLICY IF EXISTS "messages insert by sender" ON public.messages;

CREATE POLICY "messages are viewable by everyone"
ON public.messages
FOR SELECT
USING (true);

CREATE POLICY "messages can be inserted by anyone"
ON public.messages
FOR INSERT
WITH CHECK (true);

-- ── reviews ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "reviews are viewable by everyone" ON public.reviews;
DROP POLICY IF EXISTS "reviews insert by reviewer" ON public.reviews;
DROP POLICY IF EXISTS "reviews update by reviewer or vendor" ON public.reviews;

CREATE POLICY "reviews are viewable by everyone"
ON public.reviews
FOR SELECT
USING (true);

CREATE POLICY "reviews viewable by everyone"
ON public.reviews
FOR SELECT
USING (true);

CREATE POLICY "reviews can be inserted by anyone"
ON public.reviews
FOR INSERT
WITH CHECK (true);

CREATE POLICY "reviews can be updated by anyone"
ON public.reviews
FOR UPDATE
USING (true)
WITH CHECK (true);

-- ── follows ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "follows viewable by everyone" ON public.follows;
DROP POLICY IF EXISTS "follows insert by follower" ON public.follows;
DROP POLICY IF EXISTS "follows delete by follower" ON public.follows;

CREATE POLICY "follows viewable by everyone"
ON public.follows
FOR SELECT
USING (true);

CREATE POLICY "follows can be inserted by anyone"
ON public.follows
FOR INSERT
WITH CHECK (true);

CREATE POLICY "follows can be deleted by anyone"
ON public.follows
FOR DELETE
USING (true);

-- ── watchlist ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "watchlist owner only" ON public.watchlist;

CREATE POLICY "watchlist is viewable"
ON public.watchlist
FOR SELECT
USING (true);

CREATE POLICY "watchlist viewable by owner"
ON public.watchlist
FOR ALL
USING (true);

CREATE POLICY "watchlist can be inserted"
ON public.watchlist
FOR INSERT
WITH CHECK (true);

CREATE POLICY "watchlist can be deleted"
ON public.watchlist
FOR DELETE
USING (true);

-- ── collections ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "collections viewable by everyone" ON public.collections;
DROP POLICY IF EXISTS "collections insert by owner" ON public.collections;
DROP POLICY IF EXISTS "collections update by owner or view count" ON public.collections;
DROP POLICY IF EXISTS "collections delete by owner" ON public.collections;

CREATE POLICY "collections access"
ON public.collections
FOR ALL
USING (true);

-- ── collection_items ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "collection_items viewable by everyone" ON public.collection_items;
DROP POLICY IF EXISTS "collection_items owner only write" ON public.collection_items;

CREATE POLICY "collection_items access"
ON public.collection_items
FOR ALL
USING (true);

-- ── collection_likes ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "collection_likes viewable by everyone" ON public.collection_likes;
DROP POLICY IF EXISTS "collection_likes insert by liker" ON public.collection_likes;
DROP POLICY IF EXISTS "collection_likes delete by liker" ON public.collection_likes;

CREATE POLICY "collection_likes access"
ON public.collection_likes
FOR ALL
USING (true);

-- ── collection_comments ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "collection_comments viewable by everyone" ON public.collection_comments;
DROP POLICY IF EXISTS "collection_comments insert by commenter" ON public.collection_comments;

CREATE POLICY "collection_comments access"
ON public.collection_comments
FOR ALL
USING (true);

-- ============================================================================
-- END REVERT SCRIPT (v2)
-- ============================================================================
