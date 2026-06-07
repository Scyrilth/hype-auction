-- =============================================================================
-- DUMMY TEST DATA — Hype Auction
-- Run in Supabase Dashboard → SQL Editor after vendor-shop.sql and
-- auction-listing-fields.sql migrations.
--
-- TO REMOVE ALL DUMMY DATA:
-- DELETE FROM public.auctions WHERE seller_wallet LIKE 'DUMMY_VENDOR_%';
-- DELETE FROM public.users WHERE wallet_address LIKE 'DUMMY_VENDOR_%';
-- =============================================================================

-- Dummy wallet IDs are shorter than real Solana addresses; relax length check.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_wallet_address_length;
ALTER TABLE public.users
  ADD CONSTRAINT users_wallet_address_length
  CHECK (char_length(wallet_address) BETWEEN 8 AND 64);

-- Ended listings need created_at before end_time (both in the past).
ALTER TABLE public.auctions DROP CONSTRAINT IF EXISTS auctions_end_time_future_on_create;

-- ---------------------------------------------------------------------------
-- 10 dummy vendors
-- ---------------------------------------------------------------------------
INSERT INTO public.users (
  wallet_address,
  username,
  shop_name,
  avatar_url,
  bio,
  shop_description,
  is_vendor,
  is_verified,
  followers_count,
  total_sales,
  average_rating,
  reputation
) VALUES
  (
    'DUMMY_VENDOR_001',
    'CardKing',
    'CardKing Collectibles',
    'https://api.dicebear.com/7.x/shapes/svg?seed=CardKing',
    'Graded TCG specialist. PSA, BGS, and raw vintage daily.',
    'Premium trading cards, Pokémon holos, and sports rookies.',
    true, true, 1847, 156, 4.85, 4.90
  ),
  (
    'DUMMY_VENDOR_002',
    'SneakerVault',
    'SneakerVault',
    'https://api.dicebear.com/7.x/shapes/svg?seed=SneakerVault',
    'Deadstock and lightly worn heat. Every pair authenticated.',
    'Jordan, Nike, Yeezy, and limited collab sneakers.',
    true, true, 923, 89, 4.72, 4.65
  ),
  (
    'DUMMY_VENDOR_003',
    'StreetKicks',
    'StreetKicks Archive',
    'https://api.dicebear.com/7.x/shapes/svg?seed=StreetKicks',
    'Supreme, BAPE, and archive streetwear drops.',
    'Rare tees, hoodies, and hype pieces from 2015–2024.',
    true, false, 412, 34, 4.55, 4.40
  ),
  (
    'DUMMY_VENDOR_004',
    'TechDrop',
    'TechDrop Auctions',
    'https://api.dicebear.com/7.x/shapes/svg?seed=TechDrop',
    'Phones, consoles, GPUs, and sealed electronics.',
    'Consumer tech auctions with fast shipping.',
    true, false, 678, 52, 4.60, 4.50
  ),
  (
    'DUMMY_VENDOR_005',
    'WatchCollector',
    'WatchCollector Boutique',
    'https://api.dicebear.com/7.x/shapes/svg?seed=WatchCollector',
    'Luxury watches only. Rolex, AP, Omega, and more.',
    'Authenticated luxury timepieces for serious collectors.',
    true, true, 1203, 67, 4.92, 4.88
  ),
  (
    'DUMMY_VENDOR_006',
    'JewelryBox',
    'JewelryBox',
    'https://api.dicebear.com/7.x/shapes/svg?seed=JewelryBox',
    'Gold chains, moissanite, and custom pieces.',
    'Fine jewelry auctions with insured shipping.',
    true, false, 356, 28, 4.48, 4.35
  ),
  (
    'DUMMY_VENDOR_007',
    'ArtHouse',
    'ArtHouse Gallery',
    'https://api.dicebear.com/7.x/shapes/svg?seed=ArtHouse',
    'Contemporary prints, originals, and signed editions.',
    'Curated art for collectors and interior designers.',
    true, false, 289, 19, 4.70, 4.55
  ),
  (
    'DUMMY_VENDOR_008',
    'CryptoCollect',
    'CryptoCollect',
    'https://api.dicebear.com/7.x/shapes/svg?seed=CryptoCollect',
    'NFT-adjacent collectibles and crypto memorabilia.',
    'Digital-native collectibles and limited crypto merch.',
    true, false, 534, 41, 4.35, 4.20
  ),
  (
    'DUMMY_VENDOR_009',
    'VintageFinds',
    'VintageFinds Emporium',
    'https://api.dicebear.com/7.x/shapes/svg?seed=VintageFinds',
    'Antiques, vintage toys, and one-of-a-kind finds.',
    'Treasure-hunt auctions updated weekly.',
    true, false, 771, 63, 4.58, 4.45
  ),
  (
    'DUMMY_VENDOR_010',
    'MusicVault',
    'MusicVault Records',
    'https://api.dicebear.com/7.x/shapes/svg?seed=MusicVault',
    'Vinyl, signed memorabilia, and rare pressings.',
    'Music collectors welcome — grading available on request.',
    true, false, 445, 37, 4.62, 4.50
  )
ON CONFLICT (wallet_address) DO UPDATE SET
  username = EXCLUDED.username,
  shop_name = EXCLUDED.shop_name,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio,
  shop_description = EXCLUDED.shop_description,
  is_vendor = EXCLUDED.is_vendor,
  is_verified = EXCLUDED.is_verified,
  followers_count = EXCLUDED.followers_count,
  total_sales = EXCLUDED.total_sales,
  average_rating = EXCLUDED.average_rating,
  reputation = EXCLUDED.reputation;

-- ---------------------------------------------------------------------------
-- 35 dummy listings (25 live, 10 ended) across all 15 categories
-- ---------------------------------------------------------------------------
INSERT INTO public.auctions (
  title,
  description,
  image_url,
  seller_wallet,
  current_bid,
  start_price,
  end_time,
  status,
  category,
  condition,
  item_details,
  created_at
) VALUES
  -- Trading Cards (3)
  (
    'PSA 9 Charizard Base Set Holo',
    'Iconic Base Set holo Charizard graded PSA 9 Mint. Clean centering with strong eye appeal.',
    'https://upload.wikimedia.org/wikipedia/en/a/a6/Pok%C3%A9mon_Pikachu_art.png',
    'DUMMY_VENDOR_001', 42.50, 2.00, now() + interval '18 hours', 'live', 'Trading Cards', 'Like New',
    '{"Set":"Base Set","Year":"1999","grading_company":"PSA","grade":"9","grade_label":"Mint"}'::jsonb,
    now() - interval '2 days'
  ),
  (
    'BGS 9.5 Gem Mint Pikachu #58',
    'Near-perfect BGS 9.5 Pikachu holo. Subgrades available in listing photos.',
    'https://upload.wikimedia.org/wikipedia/en/a/a6/Pok%C3%A9mon_Pikachu_art.png',
    'DUMMY_VENDOR_001', 18.75, 1.50, now() + interval '6 hours', 'live', 'Trading Cards', 'Very Good',
    '{"Set":"Jungle","Year":"1999","grading_company":"BGS","grade":"9.5","grade_label":"Gem Mint"}'::jsonb,
    now() - interval '1 day'
  ),
  (
    '1999 Pokemon Base Set Blastoise Holo Raw',
    'Raw Blastoise holo in excellent condition. Great candidate for grading.',
    'https://upload.wikimedia.org/wikipedia/en/a/a6/Pok%C3%A9mon_Pikachu_art.png',
    'DUMMY_VENDOR_009', 8.20, 0.50, now() - interval '2 days', 'ended', 'Trading Cards', 'Good',
    '{"Set":"Base Set","Year":"1999","Condition Notes":"Light edge wear"}'::jsonb,
    now() - interval '10 days'
  ),
  -- Sneakers (3)
  (
    'Nike Dunk Low Panda DS',
    'Deadstock Nike Dunk Low Panda. Size US 10 with original box.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Nike_Dunk_Low_white_black.jpg/640px-Nike_Dunk_Low_white_black.jpg',
    'DUMMY_VENDOR_002', 12.40, 1.00, now() + interval '24 hours', 'live', 'Sneakers', 'New',
    '{"Brand":"Nike","Size":"US 10","Colorway":"Panda","Style Code":"DD1391-100"}'::jsonb,
    now() - interval '1 day'
  ),
  (
    'Yeezy 350 V2 Zebra Size 10',
    'Adidas Yeezy Boost 350 V2 Zebra. Worn twice, includes receipt.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Adidas_Yeezy_Boost_350_V2_Zebra.jpg/640px-Adidas_Yeezy_Boost_350_V2_Zebra.jpg',
    'DUMMY_VENDOR_002', 28.00, 3.00, now() + interval '36 hours', 'live', 'Sneakers', 'Like New',
    '{"Brand":"Adidas","Model":"Yeezy 350 V2","Size":"US 10","Colorway":"Zebra"}'::jsonb,
    now() - interval '3 days'
  ),
  (
    'Air Jordan 1 Retro High OG Chicago',
    'Classic Chicago colorway AJ1. Lightly worn with OG box.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Air_Jordan_1.jpg/640px-Air_Jordan_1.jpg',
    'DUMMY_VENDOR_003', 35.00, 5.00, now() - interval '1 day', 'ended', 'Sneakers', 'Very Good',
    '{"Brand":"Nike","Model":"Air Jordan 1","Size":"US 11","Colorway":"Chicago"}'::jsonb,
    now() - interval '14 days'
  ),
  -- Streetwear (3)
  (
    'Supreme Box Logo Hoodie FW21',
    'Authentic Supreme box logo hoodie. Size Large, black colorway.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Supreme-logo.png/640px-Supreme-logo.png',
    'DUMMY_VENDOR_003', 22.50, 2.50, now() + interval '12 hours', 'live', 'Streetwear', 'Like New',
    '{"Brand":"Supreme","Size":"L","Season":"FW21","Color":"Black"}'::jsonb,
    now() - interval '2 days'
  ),
  (
    'BAPE Shark Full Zip Hoodie',
    'A Bathing Ape shark hoodie in camo. Size Medium with tags.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Supreme-logo.png/640px-Supreme-logo.png',
    'DUMMY_VENDOR_003', 15.80, 1.25, now() + interval '20 hours', 'live', 'Streetwear', 'New',
    '{"Brand":"BAPE","Size":"M","Color":"Camo"}'::jsonb,
    now() - interval '1 day'
  ),
  (
    'Off-White Industrial Belt Yellow',
    'Off-White classic industrial belt. One size, includes dust bag.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Supreme-logo.png/640px-Supreme-logo.png',
    'DUMMY_VENDOR_009', 9.50, 0.75, now() - interval '3 days', 'ended', 'Streetwear', 'Good',
    '{"Brand":"Off-White","Size":"One Size","Color":"Yellow"}'::jsonb,
    now() - interval '12 days'
  ),
  -- Electronics (3)
  (
    'Apple iPhone 15 Pro Max 256GB',
    'Unlocked iPhone 15 Pro Max in natural titanium. Battery health 98%.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/640px-Apple_logo_black.svg.png',
    'DUMMY_VENDOR_004', 31.00, 4.00, now() + interval '30 hours', 'live', 'Electronics', 'Like New',
    '{"Brand":"Apple","Model":"iPhone 15 Pro Max","Storage":"256GB","Color":"Natural Titanium"}'::jsonb,
    now() - interval '2 days'
  ),
  (
    'Sony PlayStation 5 Disc Edition',
    'PS5 disc console with two DualSense controllers. Fully tested.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/PlayStation_logo.svg/640px-PlayStation_logo.svg.png',
    'DUMMY_VENDOR_004', 19.25, 2.00, now() + interval '8 hours', 'live', 'Electronics', 'Very Good',
    '{"Brand":"Sony","Model":"PlayStation 5","Edition":"Disc","Includes":"2 Controllers"}'::jsonb,
    now() - interval '1 day'
  ),
  (
    'NVIDIA RTX 4090 Founders Edition',
    'RTX 4090 FE graphics card. Used for light gaming, never mined.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Nvidia_logo.svg/640px-Nvidia_logo.svg.png',
    'DUMMY_VENDOR_004', 48.00, 5.00, now() - interval '4 days', 'ended', 'Electronics', 'Very Good',
    '{"Brand":"NVIDIA","Model":"RTX 4090","Edition":"Founders Edition"}'::jsonb,
    now() - interval '20 days'
  ),
  -- Watches (3)
  (
    'Rolex Submariner Date 2023',
    'Rolex Submariner Date 41mm with box and papers. Purchased AD 2023.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Rolex_Submariner.jpg/640px-Rolex_Submariner.jpg',
    'DUMMY_VENDOR_005', 49.50, 5.00, now() + interval '40 hours', 'live', 'Watches', 'New',
    '{"Brand":"Rolex","Model":"Submariner","Year":"2023","Case Size":"41mm"}'::jsonb,
    now() - interval '3 days'
  ),
  (
    'AP Royal Oak 41mm Blue Dial',
    'Audemars Piguet Royal Oak 15500ST blue dial. Full set, serviced 2024.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Rolex_Submariner.jpg/640px-Rolex_Submariner.jpg',
    'DUMMY_VENDOR_005', 45.00, 4.50, now() + interval '16 hours', 'live', 'Watches', 'Like New',
    '{"Brand":"Audemars Piguet","Model":"Royal Oak","Case Size":"41mm","Dial":"Blue"}'::jsonb,
    now() - interval '2 days'
  ),
  (
    'Omega Seamaster Diver 300M',
    'Omega Seamaster Professional 300M on bracelet. Excellent daily wearer.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Rolex_Submariner.jpg/640px-Rolex_Submariner.jpg',
    'DUMMY_VENDOR_005', 21.00, 2.00, now() - interval '2 days', 'ended', 'Watches', 'Very Good',
    '{"Brand":"Omega","Model":"Seamaster 300M","Year":"2021","Case Size":"42mm"}'::jsonb,
    now() - interval '15 days'
  ),
  -- Jewelry (2)
  (
    '10k Gold Cuban Link Chain 24inch',
    'Solid 10k gold Cuban link chain, 24 inches, 120 grams approx.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Gold_nugget.jpg/640px-Gold_nugget.jpg',
    'DUMMY_VENDOR_006', 14.60, 1.50, now() + interval '22 hours', 'live', 'Jewelry', 'Like New',
    '{"Material":"10k Gold","Style":"Cuban Link","Length":"24 inch","Weight":"120g"}'::jsonb,
    now() - interval '1 day'
  ),
  (
    'VVS Moissanite Tennis Bracelet',
    'Sterling silver tennis bracelet with VVS moissanite stones.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Gold_nugget.jpg/640px-Gold_nugget.jpg',
    'DUMMY_VENDOR_006', 6.75, 0.50, now() - interval '5 days', 'ended', 'Jewelry', 'New',
    '{"Material":"Sterling Silver","Stones":"Moissanite","Length":"7 inch"}'::jsonb,
    now() - interval '11 days'
  ),
  -- Collectibles (2)
  (
    'Funko Pop Grail Lot of 5',
    'Five vaulted Funko Pop figures including chase variants.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Funko_Pop_logo.png/640px-Funko_Pop_logo.png',
    'DUMMY_VENDOR_009', 4.20, 0.25, now() + interval '14 hours', 'live', 'Collectibles', 'Good',
    '{"Type":"Funko Pop","Quantity":"5","Includes":"Chase variants"}'::jsonb,
    now() - interval '1 day'
  ),
  (
    'Hot Wheels Redline Custom Camaro',
    '1968 Hot Wheels Redline Custom Camaro in red. Displayed only.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Funko_Pop_logo.png/640px-Funko_Pop_logo.png',
    'DUMMY_VENDOR_009', 3.10, 0.20, now() + interval '28 hours', 'live', 'Collectibles', 'Very Good',
    '{"Brand":"Hot Wheels","Year":"1968","Model":"Custom Camaro","Series":"Redline"}'::jsonb,
    now() - interval '2 days'
  ),
  -- Sports Memorabilia (2)
  (
    'Signed Michael Jordan Framed Photo',
    'Framed 16x20 Michael Jordan photo with JSA COA.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Basketball.png/640px-Basketball.png',
    'DUMMY_VENDOR_001', 11.00, 1.00, now() + interval '10 hours', 'live', 'Sports Memorabilia', 'Like New',
    '{"Athlete":"Michael Jordan","Authentication":"JSA","Format":"Framed 16x20"}'::jsonb,
    now() - interval '1 day'
  ),
  (
    'Tom Brady Super Bowl LI Game Ball Replica',
    'Official size replica game ball with commemorative display case.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Basketball.png/640px-Basketball.png',
    'DUMMY_VENDOR_009', 5.50, 0.40, now() - interval '6 days', 'ended', 'Sports Memorabilia', 'Good',
    '{"Athlete":"Tom Brady","Event":"Super Bowl LI","Type":"Replica Game Ball"}'::jsonb,
    now() - interval '13 days'
  ),
  -- Art (2)
  (
    'Banksy Style Street Art Print Signed',
    'Limited edition street art print, signed and numbered 45/100.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Easel-icon.png/640px-Easel-icon.png',
    'DUMMY_VENDOR_007', 7.80, 0.60, now() + interval '32 hours', 'live', 'Art', 'New',
    '{"Medium":"Screen Print","Edition":"45/100","Signed":"Yes"}'::jsonb,
    now() - interval '2 days'
  ),
  (
    'Abstract Canvas Original 24x36',
    'Original acrylic abstract on gallery-wrapped canvas.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Easel-icon.png/640px-Easel-icon.png',
    'DUMMY_VENDOR_007', 13.25, 1.20, now() + interval '44 hours', 'live', 'Art', 'New',
    '{"Medium":"Acrylic on Canvas","Dimensions":"24x36 in","Framed":"No"}'::jsonb,
    now() - interval '3 days'
  ),
  -- Crypto & NFTs (2)
  (
    'Bitcoin Genesis Block Commemorative Coin',
    'Limited brass commemorative coin celebrating the genesis block.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Bitcoin.svg/640px-Bitcoin.svg.png',
    'DUMMY_VENDOR_008', 2.75, 0.15, now() + interval '9 hours', 'live', 'Crypto & NFTs', 'New',
    '{"Asset":"Bitcoin","Type":"Commemorative Coin","Material":"Brass"}'::jsonb,
    now() - interval '1 day'
  ),
  (
    'Ethereum Devcon 2019 Poster Signed',
    'Rare signed Devcon poster from 2019 Osaka event.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Bitcoin.svg/640px-Bitcoin.svg.png',
    'DUMMY_VENDOR_008', 4.00, 0.30, now() - interval '7 days', 'ended', 'Crypto & NFTs', 'Good',
    '{"Asset":"Ethereum","Event":"Devcon 2019","Signed":"Yes"}'::jsonb,
    now() - interval '16 days'
  ),
  -- Video Games (2)
  (
    'Sealed The Legend of Zelda Ocarina of Time N64',
    'Factory sealed Ocarina of Time for Nintendo 64. Collector grade.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/PlayStation_logo.svg/640px-PlayStation_logo.svg.png',
    'DUMMY_VENDOR_004', 16.50, 1.75, now() + interval '26 hours', 'live', 'Video Games', 'New',
    '{"Platform":"Nintendo 64","Title":"Ocarina of Time","Condition":"Sealed"}'::jsonb,
    now() - interval '2 days'
  ),
  (
    'Pokemon Emerald GBA CIB',
    'Complete in box Pokemon Emerald for Game Boy Advance.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/PlayStation_logo.svg/640px-PlayStation_logo.svg.png',
    'DUMMY_VENDOR_010', 9.90, 0.80, now() + interval '15 hours', 'live', 'Video Games', 'Very Good',
    '{"Platform":"Game Boy Advance","Title":"Pokemon Emerald","Complete":"CIB"}'::jsonb,
    now() - interval '1 day'
  ),
  -- Luxury Bags (2)
  (
    'Louis Vuitton Neverfull MM Damier',
    'Authentic LV Neverfull MM in Damier canvas with pochette.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Louis_Vuitton_logo_and_wordmark.svg/640px-Louis_Vuitton_logo_and_wordmark.svg.png',
    'DUMMY_VENDOR_006', 27.00, 2.50, now() + interval '34 hours', 'live', 'Luxury Bags', 'Like New',
    '{"Brand":"Louis Vuitton","Model":"Neverfull MM","Pattern":"Damier"}'::jsonb,
    now() - interval '2 days'
  ),
  (
    'Chanel Classic Flap Medium Black',
    'Chanel medium classic flap in black caviar with gold hardware.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Louis_Vuitton_logo_and_wordmark.svg/640px-Louis_Vuitton_logo_and_wordmark.svg.png',
    'DUMMY_VENDOR_006', 38.00, 4.00, now() - interval '3 days', 'ended', 'Luxury Bags', 'Very Good',
    '{"Brand":"Chanel","Model":"Classic Flap","Size":"Medium","Material":"Caviar"}'::jsonb,
    now() - interval '18 days'
  ),
  -- Cameras & Film (2)
  (
    'Leica M6 TTL 35mm Film Camera',
    'Leica M6 TTL rangefinder in excellent working condition.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Leica_Camera_logo.svg/640px-Leica_Camera_logo.svg.png',
    'DUMMY_VENDOR_009', 33.00, 3.50, now() + interval '38 hours', 'live', 'Cameras & Film', 'Very Good',
    '{"Brand":"Leica","Model":"M6 TTL","Format":"35mm Film"}'::jsonb,
    now() - interval '3 days'
  ),
  (
    'Canon AE-1 Program with 50mm Lens',
    'Classic Canon AE-1 Program SLR with FD 50mm f/1.8 lens.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Leica_Camera_logo.svg/640px-Leica_Camera_logo.svg.png',
    'DUMMY_VENDOR_009', 5.25, 0.35, now() + interval '11 hours', 'live', 'Cameras & Film', 'Good',
    '{"Brand":"Canon","Model":"AE-1 Program","Lens":"50mm f/1.8"}'::jsonb,
    now() - interval '1 day'
  ),
  -- Music (2)
  (
    'Nirvana Nevermind Vinyl First Press',
    'Original 1991 US pressing of Nevermind. VG+ vinyl, VG sleeve.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Vinyl_record.svg/640px-Vinyl_record.svg.png',
    'DUMMY_VENDOR_010', 8.50, 0.70, now() + interval '19 hours', 'live', 'Music', 'Very Good',
    '{"Artist":"Nirvana","Album":"Nevermind","Format":"Vinyl LP","Pressing":"First US"}'::jsonb,
    now() - interval '2 days'
  ),
  (
    'Taylor Swift Signed Folklore CD',
    'Signed Folklore CD insert with COA from reputable authenticator.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Vinyl_record.svg/640px-Vinyl_record.svg.png',
    'DUMMY_VENDOR_010', 6.20, 0.45, now() - interval '4 days', 'ended', 'Music', 'Like New',
    '{"Artist":"Taylor Swift","Album":"Folklore","Format":"CD","Signed":"Yes"}'::jsonb,
    now() - interval '12 days'
  ),
  -- Coins & Currency (2)
  (
    '1921 Morgan Silver Dollar MS63',
    '1921 Morgan dollar graded MS63. Blast white surfaces.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Gold_nugget.jpg/640px-Gold_nugget.jpg',
    'DUMMY_VENDOR_001', 3.85, 0.25, now() + interval '7 hours', 'live', 'Coins & Currency', 'Like New',
    '{"Year":"1921","Type":"Morgan Silver Dollar","Grade":"MS63"}'::jsonb,
    now() - interval '1 day'
  ),
  (
    '1957 $1 Silver Certificate Star Note',
    'Crisp 1957 $1 silver certificate star note. PMG graded 65 EPQ.',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Gold_nugget.jpg/640px-Gold_nugget.jpg',
    'DUMMY_VENDOR_009', 2.10, 0.10, now() + interval '42 hours', 'live', 'Coins & Currency', 'New',
    '{"Year":"1957","Denomination":"$1","Type":"Silver Certificate Star Note","Grade":"PMG 65 EPQ"}'::jsonb,
    now() - interval '2 days'
  );
