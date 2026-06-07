-- =============================================================================
-- DUMMY REVIEWS — Hype Auction
-- Run after reviews-extended.sql and dummy-data.sql
--
-- TO REMOVE DUMMY REVIEWS:
-- DELETE FROM public.reviews WHERE is_dummy = true;
-- DELETE FROM public.users WHERE wallet_address LIKE 'DUMMY_REVIEWER_%';
-- Then run refresh_vendor_stats for each affected vendor wallet.
-- =============================================================================

INSERT INTO public.users (wallet_address, username, avatar_url, reputation)
VALUES
  ('DUMMY_REVIEWER_001', 'collector_jay', 'https://api.dicebear.com/7.x/shapes/svg?seed=rev1', 0),
  ('DUMMY_REVIEWER_002', 'bidqueen', 'https://api.dicebear.com/7.x/shapes/svg?seed=rev2', 0),
  ('DUMMY_REVIEWER_003', 'solana_sam', 'https://api.dicebear.com/7.x/shapes/svg?seed=rev3', 0),
  ('DUMMY_REVIEWER_004', 'nft_nina', 'https://api.dicebear.com/7.x/shapes/svg?seed=rev4', 0),
  ('DUMMY_REVIEWER_005', 'hype_hunter', 'https://api.dicebear.com/7.x/shapes/svg?seed=rev5', 0),
  ('DUMMY_REVIEWER_006', 'vault_vex', 'https://api.dicebear.com/7.x/shapes/svg?seed=rev6', 0),
  ('DUMMY_REVIEWER_007', 'mint_mike', 'https://api.dicebear.com/7.x/shapes/svg?seed=rev7', 0),
  ('DUMMY_REVIEWER_008', 'rare_rina', 'https://api.dicebear.com/7.x/shapes/svg?seed=rev8', 0),
  ('DUMMY_REVIEWER_009', 'flip_flo', 'https://api.dicebear.com/7.x/shapes/svg?seed=rev9', 0),
  ('DUMMY_REVIEWER_010', 'gem_guru', 'https://api.dicebear.com/7.x/shapes/svg?seed=rev10', 0),
  ('DUMMY_REVIEWER_011', 'auction_ace', 'https://api.dicebear.com/7.x/shapes/svg?seed=rev11', 0),
  ('DUMMY_REVIEWER_012', 'pack_rat', 'https://api.dicebear.com/7.x/shapes/svg?seed=rev12', 0),
  ('DUMMY_REVIEWER_013', 'card_carl', 'https://api.dicebear.com/7.x/shapes/svg?seed=rev13', 0),
  ('DUMMY_REVIEWER_014', 'sneaker_sue', 'https://api.dicebear.com/7.x/shapes/svg?seed=rev14', 0),
  ('DUMMY_REVIEWER_015', 'watch_walt', 'https://api.dicebear.com/7.x/shapes/svg?seed=rev15', 0),
  ('CVqvsLBSQ3Q8ZiZDB6pvavYQZ4aKchrJ2g7Eh2BLKXyT', NULL, NULL, 0)
ON CONFLICT (wallet_address) DO NOTHING;

-- CardKing (DUMMY_VENDOR_001) — Trading Cards
INSERT INTO public.reviews (vendor_wallet, reviewer_wallet, auction_id, rating, comment, tags, is_dummy)
SELECT 'DUMMY_VENDOR_001', 'DUMMY_REVIEWER_001', a.id, 5,
  'PSA slab arrived exactly as pictured. CardKing is the real deal for graded TCG.',
  ARRAY['as_described', 'great_packaging', 'fast_shipping'], true
FROM public.auctions a
WHERE a.seller_wallet = 'DUMMY_VENDOR_001' AND a.status = 'ended'
ORDER BY a.end_time DESC LIMIT 1;

INSERT INTO public.reviews (vendor_wallet, reviewer_wallet, auction_id, rating, comment, tags, is_dummy)
VALUES
  ('DUMMY_VENDOR_001', 'DUMMY_REVIEWER_013', NULL, 4, 'Solid experience on a raw vintage holo. Packaging was secure and communication was quick.', ARRAY['as_described', 'great_communication'], true),
  ('DUMMY_VENDOR_001', 'DUMMY_REVIEWER_005', NULL, 5, 'Third purchase from CardKing — always accurate grades and fair descriptions.', ARRAY['as_described', 'would_buy_again'], true),
  ('DUMMY_VENDOR_001', 'DUMMY_REVIEWER_009', NULL, 5, 'Charizard listing matched the photos perfectly. Would bid again.', ARRAY['as_described', 'great_packaging', 'would_buy_again'], true),
  ('DUMMY_VENDOR_001', 'DUMMY_REVIEWER_011', NULL, 4, 'Great seller for sports rookies. Shipping took an extra day but item was mint.', ARRAY['as_described', 'slow_shipping'], true);

-- SneakerVault (DUMMY_VENDOR_002)
INSERT INTO public.reviews (vendor_wallet, reviewer_wallet, auction_id, rating, comment, tags, is_dummy)
SELECT 'DUMMY_VENDOR_002', 'DUMMY_REVIEWER_014', a.id, 5,
  'Deadstock Jordans authenticated and shipped fast. Box was pristine.',
  ARRAY['as_described', 'fast_shipping', 'great_packaging'], true
FROM public.auctions a
WHERE a.seller_wallet = 'DUMMY_VENDOR_002' AND a.status = 'ended'
ORDER BY a.end_time DESC LIMIT 1;

INSERT INTO public.reviews (vendor_wallet, reviewer_wallet, auction_id, rating, comment, tags, is_dummy)
VALUES
  ('DUMMY_VENDOR_002', 'DUMMY_REVIEWER_002', NULL, 4, 'Yeezys were legit. Slight box dent but shoes were flawless.', ARRAY['as_described', 'would_buy_again'], true),
  ('DUMMY_VENDOR_002', 'DUMMY_REVIEWER_006', NULL, 5, 'Best sneaker seller on the platform. Communication was excellent.', ARRAY['great_communication', 'fast_shipping', 'would_buy_again'], true),
  ('DUMMY_VENDOR_002', 'DUMMY_REVIEWER_010', NULL, 3, 'Shoes were real but took a while to arrive.', ARRAY['as_described', 'slow_shipping'], true);

-- StreetKicks (DUMMY_VENDOR_003)
INSERT INTO public.reviews (vendor_wallet, reviewer_wallet, auction_id, rating, comment, tags, is_dummy)
VALUES
  ('DUMMY_VENDOR_003', 'DUMMY_REVIEWER_004', NULL, 4, 'Supreme tee was authentic archive piece. Fits description.', ARRAY['as_described', 'great_packaging'], true),
  ('DUMMY_VENDOR_003', 'DUMMY_REVIEWER_007', NULL, 5, 'BAPE hoodie in great condition. Would buy again.', ARRAY['as_described', 'would_buy_again'], true),
  ('DUMMY_VENDOR_003', 'DUMMY_REVIEWER_012', NULL, 4, 'Streetwear heat delivered safely. Good comms throughout.', ARRAY['great_communication', 'fast_shipping'], true);

-- TechDrop (DUMMY_VENDOR_004)
INSERT INTO public.reviews (vendor_wallet, reviewer_wallet, auction_id, rating, comment, tags, is_dummy)
SELECT 'DUMMY_VENDOR_004', 'DUMMY_REVIEWER_003', a.id, 5,
  'Sealed GPU arrived double-boxed. Works perfectly, exactly as listed.',
  ARRAY['as_described', 'great_packaging', 'fast_shipping'], true
FROM public.auctions a
WHERE a.seller_wallet = 'DUMMY_VENDOR_004' AND a.status = 'ended'
ORDER BY a.end_time DESC LIMIT 1;

INSERT INTO public.reviews (vendor_wallet, reviewer_wallet, auction_id, rating, comment, tags, is_dummy)
VALUES
  ('DUMMY_VENDOR_004', 'DUMMY_REVIEWER_008', NULL, 4, 'Console was clean and fully functional. Minor shipping delay.', ARRAY['as_described', 'slow_shipping'], true),
  ('DUMMY_VENDOR_004', 'DUMMY_REVIEWER_001', NULL, 5, 'iPhone was unlocked and in stated condition. Great tech seller.', ARRAY['as_described', 'would_buy_again'], true),
  ('DUMMY_VENDOR_004', 'DUMMY_REVIEWER_015', NULL, 4, 'Fast ship on a sealed accessory. No complaints.', ARRAY['fast_shipping', 'great_communication'], true);

-- WatchCollector (DUMMY_VENDOR_005)
INSERT INTO public.reviews (vendor_wallet, reviewer_wallet, auction_id, rating, comment, tags, is_dummy)
VALUES
  ('DUMMY_VENDOR_005', 'DUMMY_REVIEWER_015', NULL, 5, 'Rolex came with papers and was exactly as described. White-glove packaging.', ARRAY['as_described', 'great_packaging', 'great_communication'], true),
  ('DUMMY_VENDOR_005', 'DUMMY_REVIEWER_006', NULL, 5, 'Omega Speedmaster was stunning. Authenticated and shipped insured.', ARRAY['as_described', 'fast_shipping'], true),
  ('DUMMY_VENDOR_005', 'DUMMY_REVIEWER_010', NULL, 5, 'Luxury watch buying done right. Will bid again.', ARRAY['would_buy_again', 'great_communication'], true),
  ('DUMMY_VENDOR_005', 'DUMMY_REVIEWER_002', NULL, 4, 'AP listing was accurate. Took a few extra days but worth the wait.', ARRAY['as_described', 'slow_shipping'], true),
  ('DUMMY_VENDOR_005', 'DUMMY_REVIEWER_011', NULL, 5, 'Top-tier seller for high-end timepieces.', ARRAY['as_described', 'would_buy_again'], true);

-- LuxeBags (DUMMY_VENDOR_006)
INSERT INTO public.reviews (vendor_wallet, reviewer_wallet, auction_id, rating, comment, tags, is_dummy)
SELECT 'DUMMY_VENDOR_006', 'DUMMY_REVIEWER_002', a.id, 5,
  'Chanel flap was authentic with serial card. Beautifully packaged.',
  ARRAY['as_described', 'great_packaging', 'would_buy_again'], true
FROM public.auctions a
WHERE a.seller_wallet = 'DUMMY_VENDOR_006' AND a.status = 'ended'
ORDER BY a.end_time DESC LIMIT 1;

INSERT INTO public.reviews (vendor_wallet, reviewer_wallet, auction_id, rating, comment, tags, is_dummy)
VALUES
  ('DUMMY_VENDOR_006', 'DUMMY_REVIEWER_004', NULL, 4, 'LV Neverfull in great shape. Slight color variance from photos but acceptable.', ARRAY['as_described'], true),
  ('DUMMY_VENDOR_006', 'DUMMY_REVIEWER_008', NULL, 5, 'Hermès listing was spot on. Fast insured shipping.', ARRAY['as_described', 'fast_shipping'], true),
  ('DUMMY_VENDOR_006', 'DUMMY_REVIEWER_012', NULL, 4, 'Reliable luxury bag seller. Good communication.', ARRAY['great_communication', 'would_buy_again'], true);

-- ArtBlock (DUMMY_VENDOR_007)
INSERT INTO public.reviews (vendor_wallet, reviewer_wallet, auction_id, rating, comment, tags, is_dummy)
VALUES
  ('DUMMY_VENDOR_007', 'DUMMY_REVIEWER_004', NULL, 5, 'Print arrived framed and protected. Colors match the listing.', ARRAY['as_described', 'great_packaging'], true),
  ('DUMMY_VENDOR_007', 'DUMMY_REVIEWER_007', NULL, 4, 'Original piece with COA. Seller was responsive to questions.', ARRAY['great_communication', 'as_described'], true),
  ('DUMMY_VENDOR_007', 'DUMMY_REVIEWER_009', NULL, 5, 'Art shipped with care. Would collect from this shop again.', ARRAY['would_buy_again', 'fast_shipping'], true);

-- CryptoVault (DUMMY_VENDOR_008)
INSERT INTO public.reviews (vendor_wallet, reviewer_wallet, auction_id, rating, comment, tags, is_dummy)
SELECT 'DUMMY_VENDOR_008', 'DUMMY_REVIEWER_003', a.id, 4,
  'Commemorative coin was as described. Nice addition to my collection.',
  ARRAY['as_described', 'great_packaging'], true
FROM public.auctions a
WHERE a.seller_wallet = 'DUMMY_VENDOR_008' AND a.status = 'ended'
ORDER BY a.end_time DESC LIMIT 1;

INSERT INTO public.reviews (vendor_wallet, reviewer_wallet, auction_id, rating, comment, tags, is_dummy)
VALUES
  ('DUMMY_VENDOR_008', 'DUMMY_REVIEWER_007', NULL, 5, 'Signed Devcon poster was legit. Packed flat and arrived safe.', ARRAY['as_described', 'fast_shipping'], true),
  ('DUMMY_VENDOR_008', 'DUMMY_REVIEWER_001', NULL, 4, 'NFT-adjacent collectibles seller with solid descriptions.', ARRAY['as_described', 'great_communication'], true);

-- LensLab (DUMMY_VENDOR_009)
INSERT INTO public.reviews (vendor_wallet, reviewer_wallet, auction_id, rating, comment, tags, is_dummy)
VALUES
  ('DUMMY_VENDOR_009', 'DUMMY_REVIEWER_015', NULL, 5, 'Leica M6 was CLA-ready and exactly as graded. Expert seller.', ARRAY['as_described', 'great_communication', 'would_buy_again'], true),
  ('DUMMY_VENDOR_009', 'DUMMY_REVIEWER_013', NULL, 4, 'Canon AE-1 works great. Lens had minor dust not mentioned but still happy.', ARRAY['as_described'], true),
  ('DUMMY_VENDOR_009', 'DUMMY_REVIEWER_005', NULL, 5, 'Film camera packed with foam inserts. Arrived in perfect shape.', ARRAY['great_packaging', 'fast_shipping'], true),
  ('DUMMY_VENDOR_009', 'DUMMY_REVIEWER_011', NULL, 4, 'Good experience on a vintage SLR. Would buy again.', ARRAY['would_buy_again'], true);

-- VinylVault (DUMMY_VENDOR_010)
INSERT INTO public.reviews (vendor_wallet, reviewer_wallet, auction_id, rating, comment, tags, is_dummy)
SELECT 'DUMMY_VENDOR_010', 'DUMMY_REVIEWER_012', a.id, 5,
  'Signed Folklore CD with COA. Exactly as promised.',
  ARRAY['as_described', 'great_packaging', 'would_buy_again'], true
FROM public.auctions a
WHERE a.seller_wallet = 'DUMMY_VENDOR_010' AND a.status = 'ended'
ORDER BY a.end_time DESC LIMIT 1;

INSERT INTO public.reviews (vendor_wallet, reviewer_wallet, auction_id, rating, comment, tags, is_dummy)
VALUES
  ('DUMMY_VENDOR_010', 'DUMMY_REVIEWER_014', NULL, 4, 'Nevermind first press sounds amazing. Sleeve was VG as stated.', ARRAY['as_described'], true),
  ('DUMMY_VENDOR_010', 'DUMMY_REVIEWER_006', NULL, 5, 'Music collectibles seller with accurate grading every time.', ARRAY['as_described', 'would_buy_again'], true),
  ('DUMMY_VENDOR_010', 'DUMMY_REVIEWER_008', NULL, 5, 'Fast shipping on a rare vinyl. Well protected.', ARRAY['fast_shipping', 'great_packaging'], true);

-- Optional review from real wallet if user exists
INSERT INTO public.reviews (vendor_wallet, reviewer_wallet, auction_id, rating, comment, tags, is_dummy)
SELECT 'DUMMY_VENDOR_001', 'CVqvsLBSQ3Q8ZiZDB6pvavYQZ4aKchrJ2g7Eh2BLKXyT', NULL, 5,
  'Great test purchase flow — CardKing shipped quickly and item matched listing.',
  ARRAY['as_described', 'fast_shipping'], true
WHERE EXISTS (
  SELECT 1 FROM public.users WHERE wallet_address = 'CVqvsLBSQ3Q8ZiZDB6pvavYQZ4aKchrJ2g7Eh2BLKXyT'
);

-- Refresh vendor ratings from non-flagged reviews
SELECT public.refresh_vendor_stats(wallet_address)
FROM public.users
WHERE wallet_address LIKE 'DUMMY_VENDOR_%';
