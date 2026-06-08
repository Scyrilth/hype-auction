-- =============================================================================
-- HYPE AUCTION — SEED DUMMY DATA
-- Run in Supabase Dashboard → SQL Editor
-- =============================================================================

-- ═══════════════════════════════════════════
-- CLEANUP — Run these to remove all dummy data
-- ═══════════════════════════════════════════
-- DELETE FROM public.direct_messages WHERE thread_id IN (SELECT id FROM public.message_threads WHERE auction_id IN (SELECT id FROM public.auctions WHERE is_dummy = true));
-- DELETE FROM public.message_threads WHERE auction_id IN (SELECT id FROM public.auctions WHERE is_dummy = true);
-- DELETE FROM public.notifications WHERE auction_id IN (SELECT id FROM public.auctions WHERE is_dummy = true);
-- DELETE FROM public.watchlist WHERE auction_id IN (SELECT id FROM public.auctions WHERE is_dummy = true);
-- DELETE FROM public.bids WHERE auction_id IN (SELECT id FROM public.auctions WHERE is_dummy = true);
-- DELETE FROM public.reviews WHERE is_dummy = true;
-- DELETE FROM public.auctions WHERE is_dummy = true;

ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS is_dummy BOOLEAN DEFAULT false;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_dummy BOOLEAN DEFAULT false;
ALTER TABLE public.auctions ADD COLUMN IF NOT EXISTS escrow_state TEXT DEFAULT 'none';

-- Allow ended auctions and dummy wallet IDs
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_wallet_address_length;
ALTER TABLE public.users
  ADD CONSTRAINT users_wallet_address_length
  CHECK (char_length(wallet_address) BETWEEN 8 AND 64);
ALTER TABLE public.auctions DROP CONSTRAINT IF EXISTS auctions_end_time_future_on_create;

-- Ensure main test wallet exists
INSERT INTO public.users (wallet_address, username, reputation)
VALUES ('CVqvsLBSQ3Q8ZiZDB6pvavYQZ4aKchrJ2g7Eh2BLKXyT', 'hype_tester', 0)
ON CONFLICT (wallet_address) DO NOTHING;

-- =============================================================================
-- PART 1 — CLEAN EXISTING DATA
-- =============================================================================
DELETE FROM public.direct_messages;
DELETE FROM public.message_threads;
DELETE FROM public.notifications;
DELETE FROM public.watchlist;
DELETE FROM public.bids;
DELETE FROM public.reviews;
DELETE FROM public.collection_items;
DELETE FROM public.collections;
DELETE FROM public.auctions;

-- =============================================================================
-- PART 3 — 50 AUCTION LISTINGS (is_dummy = true)
-- =============================================================================

INSERT INTO public.auctions (
  id, title, description, category, seller_wallet, start_price, current_bid,
  end_time, status, image_url, condition, item_details, is_dummy, created_at
) VALUES
  ('feb18f1d-f23b-53f1-c3cd-c7bb91df930d', 'PSA 10 1999 Pokémon Charizard Holo #4 Base Set', 'Iconic Base Set Charizard in PSA 10 gem mint condition. Slab is clean with sharp corners and vibrant holo swirl.', 'Trading Cards', 'DUMMY_VENDOR_001', 0.148, 0.148, now() + interval '73 hours', 'live', 'https://picsum.photos/seed/1001/400/400', 'near_mint', '{"set":"Base Set","year":"1999","card_number":"4","grade":"PSA 10","grade_score":"10","grading_company":"PSA","language":"English","first_edition":false}'::jsonb, true, now() - interval '1 days'),
  ('0ad9a983-4986-2479-b234-e6f4feb33743', 'BGS 9.5 2003 Pokémon Skyridge Crystal Charizard Holo #146', 'Rare Skyridge Crystal Charizard with strong subgrades. A centerpiece for any vintage Pokémon collection.', 'Trading Cards', 'DUMMY_VENDOR_002', 0.246, 0.246, now() + interval '74 hours', 'live', 'https://picsum.photos/seed/1002/400/400', 'excellent', '{"set":"Skyridge","year":"2003","card_number":"146","grade":"BGS 9.5","grade_score":"9.5","grading_company":"BGS","language":"English","first_edition":false}'::jsonb, true, now() - interval '2 days'),
  ('134ea0fe-d1cf-b180-f6b6-05d3685fe9e1', 'PSA 9 2019 Pokémon Hidden Fates Shiny Charizard GX #SV49', 'Shiny Vault Charizard GX graded PSA 9. Popular modern chase card with clean centering.', 'Trading Cards', 'DUMMY_VENDOR_003', 0.344, 0.344, now() + interval '27 hours', 'live', 'https://picsum.photos/seed/1003/400/400', 'good', '{"set":"Hidden Fates","year":"2019","card_number":"SV49","grade":"PSA 9","grade_score":"9","grading_company":"PSA","language":"English","first_edition":false}'::jsonb, true, now() - interval '3 days'),
  ('abec0670-5d61-6c30-ddf7-13a650019749', 'Raw 2000 Pokémon Neo Genesis Lugia Holo #9', 'Neo Genesis Lugia holo raw card in excellent condition. Light whitening on back corners only.', 'Trading Cards', 'DUMMY_VENDOR_004', 0.442, 0.442, now() + interval '76 hours', 'live', 'https://picsum.photos/seed/1004/400/400', 'fair', '{"set":"Neo Genesis","year":"2000","card_number":"9","grade":"Raw NM","grade_score":"8","grading_company":"None","language":"English","first_edition":false}'::jsonb, true, now() - interval '4 days'),
  ('8a759076-814d-4cda-a89b-aaf4d84e3c99', 'Nike Air Jordan 1 Retro High OG Chicago 2022 DS Size 10', 'Deadstock Chicago 1 Reimagined with full original packaging. Never tried on, factory laced.', 'Sneakers', 'DUMMY_VENDOR_005', 0.540, 0.540, now() + interval '77 hours', 'live', 'https://picsum.photos/seed/1005/400/400', 'mint', '{"brand":"Nike","model":"Air Jordan 1 Retro High OG","size":"US 10","colorway":"Chicago","year":"2022","condition_detail":"DS","box":"Original box included"}'::jsonb, true, now() - interval '5 days'),
  ('c4152f4c-96f1-2900-96ed-0e1d62670d9d', 'Adidas Yeezy Boost 350 V2 Zebra Size 11', 'Authentic Yeezy 350 Zebra lightly worn twice. Soles show minimal wear, uppers are clean.', 'Sneakers', 'DUMMY_VENDOR_006', 0.638, 0.638, now() + interval '30 hours', 'live', 'https://picsum.photos/seed/1006/400/400', 'near_mint', '{"brand":"Adidas","model":"Yeezy Boost 350 V2","size":"US 11","colorway":"Zebra","year":"2021","condition_detail":"VNDS","box":"Original box included"}'::jsonb, true, now() - interval '6 days'),
  ('9b2146e8-5901-f488-6ceb-9fbdea8229ec', 'New Balance 550 White Green Size 9.5', 'Clean NB 550 in white and green colorway. Great everyday pair with OG box.', 'Sneakers', 'DUMMY_VENDOR_007', 0.736, 0.736, now() + interval '4 hours', 'live', 'https://picsum.photos/seed/1007/400/400', 'excellent', '{"brand":"New Balance","model":"550","size":"US 9.5","colorway":"White Green","year":"2023","condition_detail":"DS","box":"Original box included"}'::jsonb, true, now() - interval '7 days'),
  ('5884ef51-b234-b281-cd49-fc4b924a251e', 'Nike Dunk Low Panda Size 8', 'Panda Dunk Low in near-mint condition. Worn indoors a handful of times.', 'Sneakers', 'DUMMY_VENDOR_008', 0.834, 0.834, now() + interval '80 hours', 'live', 'https://picsum.photos/seed/1008/400/400', 'good', '{"brand":"Nike","model":"Dunk Low","size":"US 8","colorway":"Black White","year":"2023","condition_detail":"Near DS","box":"Original box included"}'::jsonb, true, now() - interval '8 days'),
  ('fe743e11-a202-ee17-5312-223f76376c90', 'Supreme FW22 Box Logo Hoodie Black Large', 'Authentic Supreme box logo hoodie from FW22. Tags attached, never washed.', 'Streetwear', 'DUMMY_VENDOR_009', 0.932, 0.932, now() + interval '33 hours', 'live', 'https://picsum.photos/seed/1009/400/400', 'fair', '{"brand":"Supreme","size":"L","season":"FW22","colorway":"Black","tags":"attached"}'::jsonb, true, now() - interval '9 days'),
  ('9ac5131f-fda6-2ece-aa8e-c70cac9b7b29', 'BAPE Shark Full Zip Hoodie Camo Medium', 'Classic BAPE shark hoodie in green camo. Light wear, no fading on graphics.', 'Streetwear', 'DUMMY_VENDOR_010', 1.030, 1.030, now() + interval '82 hours', 'live', 'https://picsum.photos/seed/1010/400/400', 'mint', '{"brand":"A Bathing Ape","size":"M","season":"SS21","colorway":"Green Camo","tags":"removed"}'::jsonb, true, now() - interval '10 days'),
  ('81812bca-7cee-6696-6a3f-5139d6e3f372', 'Off-White Arrow Logo Tee White XL', 'Off-White arrow logo tee in white. Purchased from authorized retailer.', 'Streetwear', 'DUMMY_VENDOR_001', 1.128, 1.128, now() + interval '83 hours', 'live', 'https://picsum.photos/seed/1011/400/400', 'near_mint', '{"brand":"Off-White","size":"XL","season":"SS20","colorway":"White","tags":"attached"}'::jsonb, true, now() - interval '11 days'),
  ('cd60ada2-c96b-e47c-d872-950edf470844', 'Palace Tri-Ferg Hoodie Grey Large', 'Palace tri-ferg hoodie in heather grey. Great condition with minimal pilling.', 'Streetwear', 'DUMMY_VENDOR_002', 1.226, 1.226, now() + interval '24 hours', 'live', 'https://picsum.photos/seed/1012/400/400', 'excellent', '{"brand":"Palace","size":"L","season":"AW19","colorway":"Grey","tags":"attached"}'::jsonb, true, now() - interval '12 days'),
  ('a065e8ef-0064-7cf4-d719-8878ff7af11f', 'Mad Lads #4521 — Rare Gold Laser Eyes', 'Solana Mad Lads NFT with rare gold background and laser eyes traits. Transfer via escrow.', 'Crypto & NFTs', 'DUMMY_VENDOR_003', 1.324, 1.324, now() + interval '85 hours', 'live', 'https://picsum.photos/seed/1013/400/400', 'good', '{"blockchain":"Solana","collection":"Mad Lads","token_id":"#4521","rarity":"Rare","attributes":"Gold background, laser eyes"}'::jsonb, true, now() - interval '13 days'),
  ('cefc6762-dd6a-143a-7b75-dece6bccdf95', 'DeGods #1872 — Mythic Background', 'DeGods mythic background edition on Solana. Verified ownership, clean transfer history.', 'Crypto & NFTs', 'DUMMY_VENDOR_004', 1.422, 1.422, now() + interval '6 hours', 'live', 'https://picsum.photos/seed/1014/400/400', 'fair', '{"blockchain":"Solana","collection":"DeGods","token_id":"#1872","rarity":"Mythic","attributes":"Mythic background, crown trait"}'::jsonb, true, now() - interval '14 days'),
  ('40aaac0f-4379-885c-aed4-7abc5d83802b', 'Tensorians #903 — Animated Trait', 'Tensorians PFP with animated trait combo. Low serial mint from early collection drop.', 'Crypto & NFTs', 'DUMMY_VENDOR_005', 1.520, 1.520, now() + interval '27 hours', 'live', 'https://picsum.photos/seed/1015/400/400', 'mint', '{"blockchain":"Solana","collection":"Tensorians","token_id":"#903","rarity":"Uncommon","attributes":"Animated eyes, neon suit"}'::jsonb, true, now() - interval '1 days'),
  ('01c406fa-4797-acc6-73cb-45c51a77186c', 'Claynosaurz #2201 — Mythic Skin Variant', 'Claynosaurz NFT with mythic skin variant on Solana. Verified on Tensor marketplace.', 'Crypto & NFTs', 'DUMMY_VENDOR_006', 1.618, 1.618, now() + interval '88 hours', 'live', 'https://picsum.photos/seed/1016/400/400', 'near_mint', '{"blockchain":"Solana","collection":"Claynosaurz","token_id":"#2201","rarity":"Mythic","attributes":"Mythic skin, gold horns"}'::jsonb, true, now() - interval '2 days'),
  ('c2c73111-d08c-a1f9-2dff-888922ddd74e', 'Rolex Submariner 116610LN 2021 Full Set', 'Black Submariner Date with box, papers, and remaining factory warranty. Excellent daily wearer.', 'Watches', 'DUMMY_VENDOR_007', 1.716, 1.716, now() + interval '89 hours', 'live', 'https://picsum.photos/seed/1017/400/400', 'excellent', '{"brand":"Rolex","model":"Submariner Date","year":"2021","movement":"Automatic","case_size":"41mm","papers":true,"box":true}'::jsonb, true, now() - interval '3 days'),
  ('b96a49de-284e-c2b0-8689-8e49f54e11d7', 'Omega Speedmaster Professional Moonwatch 2022', 'Hesalite Speedmaster with full kit. Keeps excellent time and includes extra strap.', 'Watches', 'DUMMY_VENDOR_008', 1.814, 1.814, now() + interval '30 hours', 'live', 'https://picsum.photos/seed/1018/400/400', 'good', '{"brand":"Omega","model":"Speedmaster Professional","year":"2022","movement":"Manual","case_size":"42mm","papers":true,"box":true}'::jsonb, true, now() - interval '4 days'),
  ('b392d79e-0bbc-ccd2-a933-eebdc0f71c1a', 'TAG Heuer Carrera Calibre 16 Chronograph', 'Carrera chronograph with black dial and steel bracelet. Light desk wear only.', 'Watches', 'DUMMY_VENDOR_009', 1.912, 1.912, now() + interval '91 hours', 'live', 'https://picsum.photos/seed/1019/400/400', 'fair', '{"brand":"TAG Heuer","model":"Carrera Calibre 16","year":"2019","movement":"Automatic","case_size":"41mm","papers":true,"box":false}'::jsonb, true, now() - interval '5 days'),
  ('541f59f4-4ead-9aa2-ac3e-bcf64543b264', 'Seiko Prospex SPB143 Diver', 'Fan-favorite 62MAS reissue diver. Barely worn with original warranty card.', 'Watches', 'DUMMY_VENDOR_010', 2.010, 2.010, now() + interval '92 hours', 'live', 'https://picsum.photos/seed/1020/400/400', 'mint', '{"brand":"Seiko","model":"Prospex SPB143","year":"2023","movement":"Automatic","case_size":"40.5mm","papers":true,"box":true}'::jsonb, true, now() - interval '6 days'),
  ('b964bd86-11c4-290a-3c3c-9d36cc0401bd', '18k Gold Diamond Solitaire Ring 0.75ct GIA', 'Classic solitaire ring with GIA-certified diamond. Size 6.5, excellent sparkle.', 'Jewelry', 'DUMMY_VENDOR_001', 2.108, 2.108, now() + interval '3 hours', 'live', 'https://picsum.photos/seed/1021/400/400', 'near_mint', '{"metal":"Gold","karat":"18k","gemstone":"Diamond","weight":"5.2g","certificate":"GIA","style":"Ring"}'::jsonb, true, now() - interval '7 days'),
  ('06f66cfb-5362-2d2f-48d8-8a6a70cce4e8', 'Platinum Sapphire Pendant Necklace', 'Platinum pendant with natural blue sapphire. Includes appraisal documentation.', 'Jewelry', 'DUMMY_VENDOR_002', 2.206, 2.206, now() + interval '94 hours', 'live', 'https://picsum.photos/seed/1022/400/400', 'excellent', '{"metal":"Platinum","karat":"950","gemstone":"Sapphire","weight":"8.1g","certificate":"AGS","style":"Necklace"}'::jsonb, true, now() - interval '8 days'),
  ('b25eef23-4680-afab-3b27-2f5bf3969d7a', 'Sterling Silver Cuban Link Chain 22in', 'Heavy sterling Cuban link chain in polished finish. Clasp is secure and stamped .925.', 'Jewelry', 'DUMMY_VENDOR_003', 2.304, 2.304, now() + interval '95 hours', 'live', 'https://picsum.photos/seed/1023/400/400', 'good', '{"metal":"Silver","karat":"925","gemstone":"None","weight":"62g","certificate":"Hallmark","style":"Chain"}'::jsonb, true, now() - interval '9 days'),
  ('5785365d-4cba-4d7e-5a6e-4b4829eac8e6', '14k Rose Gold Morganite Halo Ring Size 7', 'Delicate rose gold halo ring with morganite center stone. Includes appraisal paperwork.', 'Jewelry', 'DUMMY_VENDOR_004', 2.402, 2.402, now() + interval '24 hours', 'live', 'https://picsum.photos/seed/1024/400/400', 'fair', '{"metal":"Gold","karat":"14k","gemstone":"Morganite","weight":"3.8g","certificate":"Appraisal","style":"Ring"}'::jsonb, true, now() - interval '10 days'),
  ('41cc157b-5801-c371-07cd-7cc27ce81b8c', 'Original Oil Painting — Coastal Sunset by M. Rivera', 'Signed original oil on canvas depicting a coastal sunset. Wired and ready to hang.', 'Art', 'DUMMY_VENDOR_005', 2.500, 2.500, now() + interval '97 hours', 'live', 'https://picsum.photos/seed/1025/400/400', 'mint', '{"artist":"M. Rivera","medium":"Oil on Canvas","dimensions":"24x36 inches","year":"2020","signed":true,"certificate":true}'::jsonb, true, now() - interval '11 days'),
  ('5232aa4f-8bc1-9e23-f3cb-24ea94060174', 'Limited Screen Print — Urban Geometry by K. Tan', 'Editioned screen print with bold geometric forms. Numbered 18/100 with COA.', 'Art', 'DUMMY_VENDOR_006', 2.598, 2.598, now() + interval '98 hours', 'live', 'https://picsum.photos/seed/1026/400/400', 'near_mint', '{"artist":"K. Tan","medium":"Screen Print","dimensions":"18x24 inches","year":"2021","signed":true,"certificate":true}'::jsonb, true, now() - interval '12 days'),
  ('2274dd4c-03aa-1a47-e393-92666b3bdc9f', 'Contemporary Acrylic Abstract No. 7', 'Vibrant acrylic abstract on gallery-wrapped canvas. Great statement piece for modern interiors.', 'Art', 'DUMMY_VENDOR_007', 2.696, 2.696, now() + interval '27 hours', 'live', 'https://picsum.photos/seed/1027/400/400', 'excellent', '{"artist":"L. Chen","medium":"Acrylic on Canvas","dimensions":"30x40 inches","year":"2022","signed":true,"certificate":false}'::jsonb, true, now() - interval '13 days'),
  ('e4947053-e360-62e8-aa1e-bbf0649ee5e4', 'Signed Lithograph — City Lights by A. Moss', 'Limited lithograph print numbered 42/200. Framed with archival matting.', 'Art', 'DUMMY_VENDOR_008', 2.794, 2.794, now() + interval '5 hours', 'live', 'https://picsum.photos/seed/1028/400/400', 'good', '{"artist":"A. Moss","medium":"Lithograph","dimensions":"20x28 inches","year":"2018","signed":true,"certificate":true}'::jsonb, true, now() - interval '14 days'),
  ('807801e6-2663-2c65-428d-2d504cebecb7', 'KAWS Companion Flayed Open Edition Brown', 'KAWS Companion flayed figure in brown. Displayed in smoke-free home, includes original packaging.', 'Collectibles', 'DUMMY_VENDOR_009', 2.892, 2.892, now() + interval '101 hours', 'live', 'https://picsum.photos/seed/1029/400/400', 'fair', '{"brand":"KAWS","series":"Companion","year":"2019","limited_edition":true,"numbered":"234/500","condition_detail":"sealed"}'::jsonb, true, now() - interval '1 days'),
  ('06df3c1b-5030-4efd-d851-e9ebcc27ede4', 'Funko Pop! Metallic Batman SDCC 2010', 'Rare SDCC metallic Batman Funko with protector. Box has minor shelf wear.', 'Collectibles', 'DUMMY_VENDOR_010', 2.990, 2.990, now() + interval '30 hours', 'live', 'https://picsum.photos/seed/1030/400/400', 'mint', '{"brand":"Funko","series":"Pop! Heroes","year":"2010","limited_edition":true,"numbered":"Unnumbered","condition_detail":"near mint box"}'::jsonb, true, now() - interval '2 days'),
  ('f39ff2d4-d426-3a74-010a-0399b3d11d97', 'Bearbrick 1000% Andy Warhol Banana', 'Large format Bearbrick collaboration piece. Stored in original shipper box.', 'Collectibles', 'DUMMY_VENDOR_001', 3.088, 3.088, now() + interval '103 hours', 'live', 'https://picsum.photos/seed/1031/400/400', 'near_mint', '{"brand":"Medicom Toy","series":"Bearbrick","year":"2018","limited_edition":true,"numbered":"Open edition","condition_detail":"displayed"}'::jsonb, true, now() - interval '3 days'),
  ('dea3dddd-f5fe-06e4-f7c6-e18de5f6496f', 'Apple iPhone 15 Pro 256GB Black Titanium — Sealed', 'Factory sealed iPhone 15 Pro unlocked model. Apple warranty intact.', 'Electronics', 'DUMMY_VENDOR_002', 3.186, 3.186, now() + interval '104 hours', 'live', 'https://picsum.photos/seed/1032/400/400', 'excellent', '{"brand":"Apple","model":"iPhone 15 Pro","year":"2023","storage":"256GB","color":"Black Titanium","condition_detail":"sealed","warranty":true}'::jsonb, true, now() - interval '4 days'),
  ('9ee8f4b6-4685-3b91-b04f-c5de925cffad', 'Sony PlayStation 5 Disc Edition Bundle', 'PS5 disc console with two controllers and charging dock. Light use, runs perfectly.', 'Electronics', 'DUMMY_VENDOR_003', 3.284, 3.284, now() + interval '33 hours', 'live', 'https://picsum.photos/seed/1033/400/400', 'good', '{"brand":"Sony","model":"PlayStation 5","year":"2022","storage":"825GB","color":"White","condition_detail":"excellent","warranty":false}'::jsonb, true, now() - interval '5 days'),
  ('c732abf2-6ae2-d34c-179c-8a2365fc45dc', 'NVIDIA GeForce RTX 4080 Founders Edition', 'FE 4080 used for light gaming only. Never mined, includes original box and accessories.', 'Electronics', 'DUMMY_VENDOR_004', 3.382, 3.382, now() + interval '106 hours', 'live', 'https://picsum.photos/seed/1034/400/400', 'fair', '{"brand":"NVIDIA","model":"RTX 4080 FE","year":"2023","storage":"16GB GDDR6X","color":"Black","condition_detail":"excellent","warranty":true}'::jsonb, true, now() - interval '6 days'),
  ('8eb26b78-227f-2112-8fa3-f2a76be92782', 'Apple MacBook Air M2 13-inch 512GB Midnight', 'M2 MacBook Air with low battery cycle count. Includes charger and original box.', 'Electronics', 'DUMMY_VENDOR_005', 3.480, 3.480, now() + interval '2 hours', 'live', 'https://picsum.photos/seed/1035/400/400', 'mint', '{"brand":"Apple","model":"MacBook Air M2","year":"2023","storage":"512GB","color":"Midnight","condition_detail":"like new","warranty":true}'::jsonb, true, now() - interval '7 days'),
  ('66d71966-c7ef-865e-72d3-8cb6d9c815ff', 'Kobe Bryant Signed Lakers Jersey JSA Authenticated', 'Purple Lakers jersey signed by Kobe Bryant with JSA COA. Framed with UV-protective glass.', 'Sports Memorabilia', 'DUMMY_VENDOR_006', 3.578, 3.578, now() + interval '24 hours', 'live', 'https://picsum.photos/seed/1036/400/400', 'near_mint', '{"sport":"Basketball","player":"Kobe Bryant","team":"Lakers","year":"2010","type":"Jersey","signed":true,"authentication":"JSA"}'::jsonb, true, now() - interval '8 days'),
  ('a1aa68dd-050a-88d7-91b8-bfe6d1ab6397', 'Tom Brady Signed Patriots Mini Helmet', 'Mini helmet signed by Tom Brady during Patriots era. Includes Beckett COA.', 'Sports Memorabilia', 'DUMMY_VENDOR_007', 3.676, 3.676, now() + interval '109 hours', 'live', 'https://picsum.photos/seed/1037/400/400', 'excellent', '{"sport":"Football","player":"Tom Brady","team":"Patriots","year":"2018","type":"Mini Helmet","signed":true,"authentication":"Beckett"}'::jsonb, true, now() - interval '9 days'),
  ('0f225290-c409-2292-c54a-80a15d4afb62', 'LeBron James Game-Used Warmup Jacket LOA', 'Cavs-era warmup jacket with photomatch LOA. Unique piece for serious basketball collectors.', 'Sports Memorabilia', 'DUMMY_VENDOR_008', 3.774, 3.774, now() + interval '110 hours', 'live', 'https://picsum.photos/seed/1038/400/400', 'good', '{"sport":"Basketball","player":"LeBron James","team":"Cavaliers","year":"2017","type":"Jacket","signed":false,"authentication":"Photo Match LOA"}'::jsonb, true, now() - interval '10 days'),
  ('a3ab95c2-a8b7-8a02-4e5e-a05581b8f327', '1970s Leather Flight Jacket USAF Style', 'Vintage brown leather bomber jacket with quilted lining. Broken-in patina with no major flaws.', 'Vintage', 'DUMMY_VENDOR_009', 3.872, 3.872, now() + interval '27 hours', 'live', 'https://picsum.photos/seed/1039/400/400', 'fair', '{"decade":"1970s","origin":"USA","material":"Leather","dimensions":"Size L","provenance":"Found at estate sale"}'::jsonb, true, now() - interval '11 days'),
  ('a65e13a0-ba2a-9a06-7f1a-ffa912aacd04', '1960s Kodak Instamatic Camera Working', 'Classic Instamatic camera in working condition. Includes original case and manual.', 'Vintage', 'DUMMY_VENDOR_010', 3.970, 3.970, now() + interval '112 hours', 'live', 'https://picsum.photos/seed/1040/400/400', 'mint', '{"decade":"1960s","origin":"USA","material":"Plastic/Metal","dimensions":"5x3 inches","provenance":"Estate collection"}'::jsonb, true, now() - interval '12 days'),
  ('d655251e-0c27-26d2-5d2b-b4b87563d211', '1980s Sony Walkman WM-2', 'Iconic yellow Sports Walkman tested and playing tapes smoothly. Minor cosmetic wear.', 'Vintage', 'DUMMY_VENDOR_001', 4.068, 4.068, now() + interval '113 hours', 'live', 'https://picsum.photos/seed/1041/400/400', 'near_mint', '{"decade":"1980s","origin":"Japan","material":"Plastic","dimensions":"4x3 inches","provenance":"Private collector"}'::jsonb, true, now() - interval '13 days'),
  ('d331ae2a-dcbe-06ba-5afa-e3c405bc9655', 'Bandai RG Nu Gundam Model Kit — Sealed', 'Real Grade Nu Gundam kit factory sealed. Perfect for Gunpla builders and collectors.', 'Toys & Games', 'DUMMY_VENDOR_002', 4.166, 4.166, now() + interval '4 hours', 'live', 'https://picsum.photos/seed/1042/400/400', 'excellent', '{"brand":"Bandai","series":"Gundam","year":"2020","condition_detail":"sealed","complete":true,"box":true}'::jsonb, true, now() - interval '14 days'),
  ('7e8d8a67-f952-d1b6-6615-9e5ef980cc76', 'LEGO Star Wars UCS Millennium Falcon 75192', 'Complete UCS Falcon with instructions and all minifigures. Built once and disassembled.', 'Toys & Games', 'DUMMY_VENDOR_003', 4.264, 4.264, now() + interval '115 hours', 'live', 'https://picsum.photos/seed/1043/400/400', 'good', '{"brand":"LEGO","series":"Star Wars UCS","year":"2017","condition_detail":"complete","complete":true,"box":true}'::jsonb, true, now() - interval '1 days'),
  ('ce2e0bd9-5d59-bb4e-e448-10cc848f3830', 'Magic: The Gathering Black Lotus Proxy Display Set', 'High-quality display proxies of Power Nine for showcase only. Not tournament legal.', 'Toys & Games', 'DUMMY_VENDOR_004', 4.362, 4.362, now() + interval '116 hours', 'live', 'https://picsum.photos/seed/1044/400/400', 'fair', '{"brand":"Wizards of the Coast","series":"Alpha","year":"1993","condition_detail":"display","complete":true,"box":false}'::jsonb, true, now() - interval '2 days'),
  ('e606337e-2a26-993c-8f46-62c20502f281', 'The Beatles Abbey Road First UK Pressing VG+', 'Original UK pressing of Abbey Road with trail-off markings. Plays cleanly with light sleeve wear.', 'Music', 'DUMMY_VENDOR_005', 4.460, 4.460, now() + interval '33 hours', 'live', 'https://picsum.photos/seed/1045/400/400', 'mint', '{"artist":"The Beatles","album":"Abbey Road","year":"1969","format":"Vinyl","pressing":"First UK pressing","grade":"VG+"}'::jsonb, true, now() - interval '3 days'),
  ('a816e744-b8e1-5173-8831-c2777366125f', 'Nirvana Nevermind 1991 US Pressing', 'Nevermind LP on DGC with original inner sleeve. Classic grunge essential.', 'Music', 'DUMMY_VENDOR_006', 4.558, 4.558, now() + interval '118 hours', 'live', 'https://picsum.photos/seed/1046/400/400', 'near_mint', '{"artist":"Nirvana","album":"Nevermind","year":"1991","format":"Vinyl","pressing":"US first press","grade":"VG"}'::jsonb, true, now() - interval '4 days'),
  ('e8c62efb-6513-990d-8c0b-8088f2ca1162', 'Amazing Spider-Man #300 CGC 9.8 First Venom', 'Key first full appearance of Venom in CGC 9.8 white pages. Investment-grade slab.', 'Comics', 'DUMMY_VENDOR_007', 4.656, 4.656, now() + interval '119 hours', 'live', 'https://picsum.photos/seed/1047/400/400', 'excellent', '{"title":"Amazing Spider-Man","issue":"#300","year":"1988","publisher":"Marvel","grade":"CGC 9.8","grading_company":"CGC","key_issue":true}'::jsonb, true, now() - interval '5 days'),
  ('7d708273-18aa-f701-1926-4e1897c42fe2', 'Batman The Dark Knight Returns #1 CGC 9.6', 'Frank Miller classic first print in CGC 9.6. Sharp corners and rich colors.', 'Comics', 'DUMMY_VENDOR_008', 4.754, 4.754, now() + interval '24 hours', 'live', 'https://picsum.photos/seed/1048/400/400', 'good', '{"title":"Batman: The Dark Knight Returns","issue":"#1","year":"1986","publisher":"DC","grade":"CGC 9.6","grading_company":"CGC","key_issue":true}'::jsonb, true, now() - interval '6 days'),
  ('88e53e4e-27a2-134c-b02e-3bf050a5ba5c', 'Louis Vuitton Neverfull MM Monogram Tote', 'Authentic Neverfull MM with pochette and date code. Interior clean, handles have light patina.', 'Luxury Goods', 'DUMMY_VENDOR_009', 4.852, 4.852, now() + interval '6 hours', 'live', 'https://picsum.photos/seed/1049/400/400', 'fair', '{"brand":"Louis Vuitton","item_type":"Bag","material":"Monogram Canvas","year":"2022","authentication":"card included","condition_detail":"like new"}'::jsonb, true, now() - interval '7 days'),
  ('faceb18a-c17a-e4aa-4edc-e2e1854c3f96', 'Gucci GG Marmont Small Shoulder Bag Black', 'Gucci Marmont in black leather with gold hardware. Includes dust bag and authenticity card.', 'Luxury Goods', 'DUMMY_VENDOR_010', 0.050, 0.050, now() + interval '122 hours', 'live', 'https://picsum.photos/seed/1050/400/400', 'mint', '{"brand":"Gucci","item_type":"Bag","material":"Leather","year":"2021","authentication":"card included","condition_detail":"excellent"}'::jsonb, true, now() - interval '8 days');

-- =============================================================================
-- PART 4 — BIDS ON ACTIVE LISTINGS
-- =============================================================================
INSERT INTO public.bids (id, auction_id, bidder_wallet, amount, created_at) VALUES
  (gen_random_uuid(), 'feb18f1d-f23b-53f1-c3cd-c7bb91df930d', 'DUMMY_VENDOR_002', 0.155, now() - interval '6 hours'),
  (gen_random_uuid(), 'feb18f1d-f23b-53f1-c3cd-c7bb91df930d', 'DUMMY_VENDOR_003', 0.167, now() - interval '4 hours'),
  (gen_random_uuid(), 'feb18f1d-f23b-53f1-c3cd-c7bb91df930d', 'CVqvsLBSQ3Q8ZiZDB6pvavYQZ4aKchrJ2g7Eh2BLKXyT', 0.185, now() - interval '2 hours'),
  (gen_random_uuid(), '0ad9a983-4986-2479-b234-e6f4feb33743', 'DUMMY_VENDOR_003', 0.258, now() - interval '12 hours'),
  (gen_random_uuid(), '0ad9a983-4986-2479-b234-e6f4feb33743', 'DUMMY_VENDOR_004', 0.279, now() - interval '9 hours'),
  (gen_random_uuid(), '0ad9a983-4986-2479-b234-e6f4feb33743', 'DUMMY_VENDOR_005', 0.310, now() - interval '6 hours'),
  (gen_random_uuid(), '0ad9a983-4986-2479-b234-e6f4feb33743', 'DUMMY_VENDOR_006', 0.326, now() - interval '3 hours'),
  (gen_random_uuid(), '134ea0fe-d1cf-b180-f6b6-05d3685fe9e1', 'DUMMY_VENDOR_004', 0.361, now() - interval '20 hours'),
  (gen_random_uuid(), '134ea0fe-d1cf-b180-f6b6-05d3685fe9e1', 'DUMMY_VENDOR_005', 0.390, now() - interval '16 hours'),
  (gen_random_uuid(), '134ea0fe-d1cf-b180-f6b6-05d3685fe9e1', 'DUMMY_VENDOR_006', 0.433, now() - interval '12 hours'),
  (gen_random_uuid(), '134ea0fe-d1cf-b180-f6b6-05d3685fe9e1', 'DUMMY_VENDOR_007', 0.455, now() - interval '8 hours'),
  (gen_random_uuid(), '134ea0fe-d1cf-b180-f6b6-05d3685fe9e1', 'DUMMY_VENDOR_008', 0.491, now() - interval '4 hours'),
  (gen_random_uuid(), 'abec0670-5d61-6c30-ddf7-13a650019749', 'DUMMY_VENDOR_005', 0.464, now() - interval '30 hours'),
  (gen_random_uuid(), 'abec0670-5d61-6c30-ddf7-13a650019749', 'DUMMY_VENDOR_006', 0.501, now() - interval '25 hours'),
  (gen_random_uuid(), 'abec0670-5d61-6c30-ddf7-13a650019749', 'DUMMY_VENDOR_007', 0.556, now() - interval '20 hours'),
  (gen_random_uuid(), 'abec0670-5d61-6c30-ddf7-13a650019749', 'DUMMY_VENDOR_008', 0.584, now() - interval '15 hours'),
  (gen_random_uuid(), 'abec0670-5d61-6c30-ddf7-13a650019749', 'DUMMY_VENDOR_009', 0.631, now() - interval '10 hours'),
  (gen_random_uuid(), 'abec0670-5d61-6c30-ddf7-13a650019749', 'DUMMY_VENDOR_010', 0.700, now() - interval '5 hours'),
  (gen_random_uuid(), 'c4152f4c-96f1-2900-96ed-0e1d62670d9d', 'DUMMY_VENDOR_007', 0.670, now() - interval '16 hours'),
  (gen_random_uuid(), 'c4152f4c-96f1-2900-96ed-0e1d62670d9d', 'DUMMY_VENDOR_008', 0.724, now() - interval '14 hours'),
  (gen_random_uuid(), 'c4152f4c-96f1-2900-96ed-0e1d62670d9d', 'DUMMY_VENDOR_009', 0.804, now() - interval '12 hours'),
  (gen_random_uuid(), 'c4152f4c-96f1-2900-96ed-0e1d62670d9d', 'DUMMY_VENDOR_010', 0.844, now() - interval '10 hours'),
  (gen_random_uuid(), 'c4152f4c-96f1-2900-96ed-0e1d62670d9d', 'DUMMY_VENDOR_001', 0.912, now() - interval '8 hours'),
  (gen_random_uuid(), 'c4152f4c-96f1-2900-96ed-0e1d62670d9d', 'DUMMY_VENDOR_002', 1.012, now() - interval '6 hours'),
  (gen_random_uuid(), 'c4152f4c-96f1-2900-96ed-0e1d62670d9d', 'DUMMY_VENDOR_003', 1.063, now() - interval '4 hours'),
  (gen_random_uuid(), 'c4152f4c-96f1-2900-96ed-0e1d62670d9d', 'DUMMY_VENDOR_004', 1.148, now() - interval '2 hours'),
  (gen_random_uuid(), '9b2146e8-5901-f488-6ceb-9fbdea8229ec', 'DUMMY_VENDOR_008', 0.773, now() - interval '9 hours'),
  (gen_random_uuid(), '9b2146e8-5901-f488-6ceb-9fbdea8229ec', 'DUMMY_VENDOR_009', 0.835, now() - interval '6 hours'),
  (gen_random_uuid(), '9b2146e8-5901-f488-6ceb-9fbdea8229ec', 'DUMMY_VENDOR_010', 0.927, now() - interval '3 hours'),
  (gen_random_uuid(), '5884ef51-b234-b281-cd49-fc4b924a251e', 'DUMMY_VENDOR_009', 0.876, now() - interval '16 hours'),
  (gen_random_uuid(), '5884ef51-b234-b281-cd49-fc4b924a251e', 'DUMMY_VENDOR_010', 0.946, now() - interval '12 hours'),
  (gen_random_uuid(), '5884ef51-b234-b281-cd49-fc4b924a251e', 'DUMMY_VENDOR_001', 1.050, now() - interval '8 hours'),
  (gen_random_uuid(), '5884ef51-b234-b281-cd49-fc4b924a251e', 'DUMMY_VENDOR_002', 1.103, now() - interval '4 hours'),
  (gen_random_uuid(), 'fe743e11-a202-ee17-5312-223f76376c90', 'DUMMY_VENDOR_010', 0.979, now() - interval '25 hours'),
  (gen_random_uuid(), 'fe743e11-a202-ee17-5312-223f76376c90', 'DUMMY_VENDOR_001', 1.057, now() - interval '20 hours'),
  (gen_random_uuid(), 'fe743e11-a202-ee17-5312-223f76376c90', 'DUMMY_VENDOR_002', 1.173, now() - interval '15 hours'),
  (gen_random_uuid(), 'fe743e11-a202-ee17-5312-223f76376c90', 'DUMMY_VENDOR_003', 1.232, now() - interval '10 hours'),
  (gen_random_uuid(), 'fe743e11-a202-ee17-5312-223f76376c90', 'DUMMY_VENDOR_004', 1.331, now() - interval '5 hours'),
  (gen_random_uuid(), '81812bca-7cee-6696-6a3f-5139d6e3f372', 'DUMMY_VENDOR_002', 1.184, now() - interval '14 hours'),
  (gen_random_uuid(), '81812bca-7cee-6696-6a3f-5139d6e3f372', 'DUMMY_VENDOR_003', 1.279, now() - interval '12 hours'),
  (gen_random_uuid(), '81812bca-7cee-6696-6a3f-5139d6e3f372', 'DUMMY_VENDOR_004', 1.420, now() - interval '10 hours'),
  (gen_random_uuid(), '81812bca-7cee-6696-6a3f-5139d6e3f372', 'DUMMY_VENDOR_005', 1.491, now() - interval '8 hours'),
  (gen_random_uuid(), '81812bca-7cee-6696-6a3f-5139d6e3f372', 'DUMMY_VENDOR_006', 1.610, now() - interval '6 hours'),
  (gen_random_uuid(), '81812bca-7cee-6696-6a3f-5139d6e3f372', 'DUMMY_VENDOR_007', 1.787, now() - interval '4 hours'),
  (gen_random_uuid(), '81812bca-7cee-6696-6a3f-5139d6e3f372', 'DUMMY_VENDOR_008', 1.876, now() - interval '2 hours'),
  (gen_random_uuid(), 'cd60ada2-c96b-e47c-d872-950edf470844', 'DUMMY_VENDOR_003', 1.287, now() - interval '24 hours'),
  (gen_random_uuid(), 'cd60ada2-c96b-e47c-d872-950edf470844', 'DUMMY_VENDOR_004', 1.390, now() - interval '21 hours'),
  (gen_random_uuid(), 'cd60ada2-c96b-e47c-d872-950edf470844', 'DUMMY_VENDOR_005', 1.543, now() - interval '18 hours'),
  (gen_random_uuid(), 'cd60ada2-c96b-e47c-d872-950edf470844', 'DUMMY_VENDOR_006', 1.620, now() - interval '15 hours'),
  (gen_random_uuid(), 'cd60ada2-c96b-e47c-d872-950edf470844', 'DUMMY_VENDOR_007', 1.750, now() - interval '12 hours'),
  (gen_random_uuid(), 'cd60ada2-c96b-e47c-d872-950edf470844', 'DUMMY_VENDOR_008', 1.943, now() - interval '9 hours'),
  (gen_random_uuid(), 'cd60ada2-c96b-e47c-d872-950edf470844', 'DUMMY_VENDOR_009', 2.040, now() - interval '6 hours'),
  (gen_random_uuid(), 'cd60ada2-c96b-e47c-d872-950edf470844', 'CVqvsLBSQ3Q8ZiZDB6pvavYQZ4aKchrJ2g7Eh2BLKXyT', 2.203, now() - interval '3 hours'),
  (gen_random_uuid(), 'a065e8ef-0064-7cf4-d719-8878ff7af11f', 'DUMMY_VENDOR_004', 1.390, now() - interval '12 hours'),
  (gen_random_uuid(), 'a065e8ef-0064-7cf4-d719-8878ff7af11f', 'DUMMY_VENDOR_005', 1.501, now() - interval '8 hours'),
  (gen_random_uuid(), 'a065e8ef-0064-7cf4-d719-8878ff7af11f', 'DUMMY_VENDOR_006', 1.666, now() - interval '4 hours'),
  (gen_random_uuid(), 'cefc6762-dd6a-143a-7b75-dece6bccdf95', 'DUMMY_VENDOR_005', 1.493, now() - interval '20 hours'),
  (gen_random_uuid(), 'cefc6762-dd6a-143a-7b75-dece6bccdf95', 'DUMMY_VENDOR_006', 1.612, now() - interval '15 hours'),
  (gen_random_uuid(), 'cefc6762-dd6a-143a-7b75-dece6bccdf95', 'DUMMY_VENDOR_007', 1.789, now() - interval '10 hours'),
  (gen_random_uuid(), 'cefc6762-dd6a-143a-7b75-dece6bccdf95', 'DUMMY_VENDOR_008', 1.878, now() - interval '5 hours'),
  (gen_random_uuid(), '01c406fa-4797-acc6-73cb-45c51a77186c', 'DUMMY_VENDOR_007', 1.699, now() - interval '12 hours'),
  (gen_random_uuid(), '01c406fa-4797-acc6-73cb-45c51a77186c', 'DUMMY_VENDOR_008', 1.835, now() - interval '10 hours'),
  (gen_random_uuid(), '01c406fa-4797-acc6-73cb-45c51a77186c', 'DUMMY_VENDOR_009', 2.037, now() - interval '8 hours'),
  (gen_random_uuid(), '01c406fa-4797-acc6-73cb-45c51a77186c', 'DUMMY_VENDOR_010', 2.139, now() - interval '6 hours'),
  (gen_random_uuid(), '01c406fa-4797-acc6-73cb-45c51a77186c', 'DUMMY_VENDOR_001', 2.310, now() - interval '4 hours'),
  (gen_random_uuid(), '01c406fa-4797-acc6-73cb-45c51a77186c', 'DUMMY_VENDOR_002', 2.564, now() - interval '2 hours'),
  (gen_random_uuid(), 'c2c73111-d08c-a1f9-2dff-888922ddd74e', 'DUMMY_VENDOR_008', 1.802, now() - interval '21 hours'),
  (gen_random_uuid(), 'c2c73111-d08c-a1f9-2dff-888922ddd74e', 'DUMMY_VENDOR_009', 1.946, now() - interval '18 hours'),
  (gen_random_uuid(), 'c2c73111-d08c-a1f9-2dff-888922ddd74e', 'DUMMY_VENDOR_010', 2.160, now() - interval '15 hours'),
  (gen_random_uuid(), 'c2c73111-d08c-a1f9-2dff-888922ddd74e', 'DUMMY_VENDOR_001', 2.268, now() - interval '12 hours'),
  (gen_random_uuid(), 'c2c73111-d08c-a1f9-2dff-888922ddd74e', 'DUMMY_VENDOR_002', 2.449, now() - interval '9 hours'),
  (gen_random_uuid(), 'c2c73111-d08c-a1f9-2dff-888922ddd74e', 'DUMMY_VENDOR_003', 2.718, now() - interval '6 hours'),
  (gen_random_uuid(), 'c2c73111-d08c-a1f9-2dff-888922ddd74e', 'DUMMY_VENDOR_004', 2.854, now() - interval '3 hours'),
  (gen_random_uuid(), 'b96a49de-284e-c2b0-8689-8e49f54e11d7', 'DUMMY_VENDOR_009', 1.905, now() - interval '32 hours'),
  (gen_random_uuid(), 'b96a49de-284e-c2b0-8689-8e49f54e11d7', 'DUMMY_VENDOR_010', 2.057, now() - interval '28 hours'),
  (gen_random_uuid(), 'b96a49de-284e-c2b0-8689-8e49f54e11d7', 'DUMMY_VENDOR_001', 2.283, now() - interval '24 hours'),
  (gen_random_uuid(), 'b96a49de-284e-c2b0-8689-8e49f54e11d7', 'DUMMY_VENDOR_002', 2.397, now() - interval '20 hours'),
  (gen_random_uuid(), 'b96a49de-284e-c2b0-8689-8e49f54e11d7', 'DUMMY_VENDOR_003', 2.589, now() - interval '16 hours'),
  (gen_random_uuid(), 'b96a49de-284e-c2b0-8689-8e49f54e11d7', 'DUMMY_VENDOR_004', 2.874, now() - interval '12 hours'),
  (gen_random_uuid(), 'b96a49de-284e-c2b0-8689-8e49f54e11d7', 'DUMMY_VENDOR_005', 3.018, now() - interval '8 hours'),
  (gen_random_uuid(), 'b96a49de-284e-c2b0-8689-8e49f54e11d7', 'DUMMY_VENDOR_006', 3.259, now() - interval '4 hours'),
  (gen_random_uuid(), 'b392d79e-0bbc-ccd2-a933-eebdc0f71c1a', 'DUMMY_VENDOR_010', 2.008, now() - interval '15 hours'),
  (gen_random_uuid(), 'b392d79e-0bbc-ccd2-a933-eebdc0f71c1a', 'DUMMY_VENDOR_001', 2.169, now() - interval '10 hours'),
  (gen_random_uuid(), 'b392d79e-0bbc-ccd2-a933-eebdc0f71c1a', 'DUMMY_VENDOR_002', 2.408, now() - interval '5 hours'),
  (gen_random_uuid(), 'b964bd86-11c4-290a-3c3c-9d36cc0401bd', 'DUMMY_VENDOR_002', 2.213, now() - interval '10 hours'),
  (gen_random_uuid(), 'b964bd86-11c4-290a-3c3c-9d36cc0401bd', 'DUMMY_VENDOR_003', 2.390, now() - interval '8 hours'),
  (gen_random_uuid(), 'b964bd86-11c4-290a-3c3c-9d36cc0401bd', 'DUMMY_VENDOR_004', 2.653, now() - interval '6 hours'),
  (gen_random_uuid(), 'b964bd86-11c4-290a-3c3c-9d36cc0401bd', 'DUMMY_VENDOR_005', 2.786, now() - interval '4 hours'),
  (gen_random_uuid(), 'b964bd86-11c4-290a-3c3c-9d36cc0401bd', 'DUMMY_VENDOR_006', 3.009, now() - interval '2 hours'),
  (gen_random_uuid(), '06f66cfb-5362-2d2f-48d8-8a6a70cce4e8', 'DUMMY_VENDOR_003', 2.316, now() - interval '18 hours'),
  (gen_random_uuid(), '06f66cfb-5362-2d2f-48d8-8a6a70cce4e8', 'DUMMY_VENDOR_004', 2.501, now() - interval '15 hours'),
  (gen_random_uuid(), '06f66cfb-5362-2d2f-48d8-8a6a70cce4e8', 'DUMMY_VENDOR_005', 2.776, now() - interval '12 hours'),
  (gen_random_uuid(), '06f66cfb-5362-2d2f-48d8-8a6a70cce4e8', 'DUMMY_VENDOR_006', 2.915, now() - interval '9 hours'),
  (gen_random_uuid(), '06f66cfb-5362-2d2f-48d8-8a6a70cce4e8', 'DUMMY_VENDOR_007', 3.148, now() - interval '6 hours'),
  (gen_random_uuid(), '06f66cfb-5362-2d2f-48d8-8a6a70cce4e8', 'DUMMY_VENDOR_008', 3.494, now() - interval '3 hours'),
  (gen_random_uuid(), 'b25eef23-4680-afab-3b27-2f5bf3969d7a', 'DUMMY_VENDOR_004', 2.419, now() - interval '28 hours'),
  (gen_random_uuid(), 'b25eef23-4680-afab-3b27-2f5bf3969d7a', 'DUMMY_VENDOR_005', 2.613, now() - interval '24 hours'),
  (gen_random_uuid(), 'b25eef23-4680-afab-3b27-2f5bf3969d7a', 'DUMMY_VENDOR_006', 2.900, now() - interval '20 hours'),
  (gen_random_uuid(), 'b25eef23-4680-afab-3b27-2f5bf3969d7a', 'DUMMY_VENDOR_007', 3.045, now() - interval '16 hours'),
  (gen_random_uuid(), 'b25eef23-4680-afab-3b27-2f5bf3969d7a', 'DUMMY_VENDOR_008', 3.289, now() - interval '12 hours'),
  (gen_random_uuid(), 'b25eef23-4680-afab-3b27-2f5bf3969d7a', 'DUMMY_VENDOR_009', 3.651, now() - interval '8 hours'),
  (gen_random_uuid(), 'b25eef23-4680-afab-3b27-2f5bf3969d7a', 'CVqvsLBSQ3Q8ZiZDB6pvavYQZ4aKchrJ2g7Eh2BLKXyT', 3.834, now() - interval '4 hours'),
  (gen_random_uuid(), '5785365d-4cba-4d7e-5a6e-4b4829eac8e6', 'DUMMY_VENDOR_005', 2.522, now() - interval '40 hours'),
  (gen_random_uuid(), '5785365d-4cba-4d7e-5a6e-4b4829eac8e6', 'DUMMY_VENDOR_006', 2.724, now() - interval '35 hours'),
  (gen_random_uuid(), '5785365d-4cba-4d7e-5a6e-4b4829eac8e6', 'DUMMY_VENDOR_007', 3.024, now() - interval '30 hours'),
  (gen_random_uuid(), '5785365d-4cba-4d7e-5a6e-4b4829eac8e6', 'DUMMY_VENDOR_008', 3.175, now() - interval '25 hours'),
  (gen_random_uuid(), '5785365d-4cba-4d7e-5a6e-4b4829eac8e6', 'DUMMY_VENDOR_009', 3.429, now() - interval '20 hours'),
  (gen_random_uuid(), '5785365d-4cba-4d7e-5a6e-4b4829eac8e6', 'DUMMY_VENDOR_010', 3.806, now() - interval '15 hours'),
  (gen_random_uuid(), '5785365d-4cba-4d7e-5a6e-4b4829eac8e6', 'DUMMY_VENDOR_001', 3.996, now() - interval '10 hours'),
  (gen_random_uuid(), '5785365d-4cba-4d7e-5a6e-4b4829eac8e6', 'DUMMY_VENDOR_002', 4.316, now() - interval '5 hours'),
  (gen_random_uuid(), '5232aa4f-8bc1-9e23-f3cb-24ea94060174', 'DUMMY_VENDOR_007', 2.728, now() - interval '8 hours'),
  (gen_random_uuid(), '5232aa4f-8bc1-9e23-f3cb-24ea94060174', 'DUMMY_VENDOR_008', 2.946, now() - interval '6 hours'),
  (gen_random_uuid(), '5232aa4f-8bc1-9e23-f3cb-24ea94060174', 'DUMMY_VENDOR_009', 3.270, now() - interval '4 hours'),
  (gen_random_uuid(), '5232aa4f-8bc1-9e23-f3cb-24ea94060174', 'DUMMY_VENDOR_010', 3.434, now() - interval '2 hours'),
  (gen_random_uuid(), '2274dd4c-03aa-1a47-e393-92666b3bdc9f', 'DUMMY_VENDOR_008', 2.831, now() - interval '15 hours'),
  (gen_random_uuid(), '2274dd4c-03aa-1a47-e393-92666b3bdc9f', 'DUMMY_VENDOR_009', 3.057, now() - interval '12 hours'),
  (gen_random_uuid(), '2274dd4c-03aa-1a47-e393-92666b3bdc9f', 'DUMMY_VENDOR_010', 3.393, now() - interval '9 hours'),
  (gen_random_uuid(), '2274dd4c-03aa-1a47-e393-92666b3bdc9f', 'DUMMY_VENDOR_001', 3.563, now() - interval '6 hours'),
  (gen_random_uuid(), '2274dd4c-03aa-1a47-e393-92666b3bdc9f', 'DUMMY_VENDOR_002', 3.848, now() - interval '3 hours'),
  (gen_random_uuid(), 'e4947053-e360-62e8-aa1e-bbf0649ee5e4', 'DUMMY_VENDOR_009', 2.934, now() - interval '24 hours'),
  (gen_random_uuid(), 'e4947053-e360-62e8-aa1e-bbf0649ee5e4', 'DUMMY_VENDOR_010', 3.169, now() - interval '20 hours'),
  (gen_random_uuid(), 'e4947053-e360-62e8-aa1e-bbf0649ee5e4', 'DUMMY_VENDOR_001', 3.518, now() - interval '16 hours'),
  (gen_random_uuid(), 'e4947053-e360-62e8-aa1e-bbf0649ee5e4', 'DUMMY_VENDOR_002', 3.694, now() - interval '12 hours'),
  (gen_random_uuid(), 'e4947053-e360-62e8-aa1e-bbf0649ee5e4', 'DUMMY_VENDOR_003', 3.990, now() - interval '8 hours'),
  (gen_random_uuid(), 'e4947053-e360-62e8-aa1e-bbf0649ee5e4', 'DUMMY_VENDOR_004', 4.429, now() - interval '4 hours'),
  (gen_random_uuid(), '807801e6-2663-2c65-428d-2d504cebecb7', 'DUMMY_VENDOR_010', 3.037, now() - interval '35 hours'),
  (gen_random_uuid(), '807801e6-2663-2c65-428d-2d504cebecb7', 'DUMMY_VENDOR_001', 3.280, now() - interval '30 hours'),
  (gen_random_uuid(), '807801e6-2663-2c65-428d-2d504cebecb7', 'DUMMY_VENDOR_002', 3.641, now() - interval '25 hours'),
  (gen_random_uuid(), '807801e6-2663-2c65-428d-2d504cebecb7', 'DUMMY_VENDOR_003', 3.823, now() - interval '20 hours'),
  (gen_random_uuid(), '807801e6-2663-2c65-428d-2d504cebecb7', 'DUMMY_VENDOR_004', 4.129, now() - interval '15 hours'),
  (gen_random_uuid(), '807801e6-2663-2c65-428d-2d504cebecb7', 'DUMMY_VENDOR_005', 4.583, now() - interval '10 hours'),
  (gen_random_uuid(), '807801e6-2663-2c65-428d-2d504cebecb7', 'DUMMY_VENDOR_006', 4.812, now() - interval '5 hours'),
  (gen_random_uuid(), 'f39ff2d4-d426-3a74-010a-0399b3d11d97', 'DUMMY_VENDOR_002', 3.242, now() - interval '6 hours'),
  (gen_random_uuid(), 'f39ff2d4-d426-3a74-010a-0399b3d11d97', 'DUMMY_VENDOR_003', 3.501, now() - interval '4 hours'),
  (gen_random_uuid(), 'f39ff2d4-d426-3a74-010a-0399b3d11d97', 'DUMMY_VENDOR_004', 3.886, now() - interval '2 hours'),
  (gen_random_uuid(), 'dea3dddd-f5fe-06e4-f7c6-e18de5f6496f', 'DUMMY_VENDOR_003', 3.345, now() - interval '12 hours'),
  (gen_random_uuid(), 'dea3dddd-f5fe-06e4-f7c6-e18de5f6496f', 'DUMMY_VENDOR_004', 3.613, now() - interval '9 hours'),
  (gen_random_uuid(), 'dea3dddd-f5fe-06e4-f7c6-e18de5f6496f', 'DUMMY_VENDOR_005', 4.010, now() - interval '6 hours'),
  (gen_random_uuid(), 'dea3dddd-f5fe-06e4-f7c6-e18de5f6496f', 'DUMMY_VENDOR_006', 4.211, now() - interval '3 hours'),
  (gen_random_uuid(), '9ee8f4b6-4685-3b91-b04f-c5de925cffad', 'DUMMY_VENDOR_004', 3.448, now() - interval '20 hours'),
  (gen_random_uuid(), '9ee8f4b6-4685-3b91-b04f-c5de925cffad', 'DUMMY_VENDOR_005', 3.724, now() - interval '16 hours'),
  (gen_random_uuid(), '9ee8f4b6-4685-3b91-b04f-c5de925cffad', 'DUMMY_VENDOR_006', 4.134, now() - interval '12 hours'),
  (gen_random_uuid(), '9ee8f4b6-4685-3b91-b04f-c5de925cffad', 'DUMMY_VENDOR_007', 4.341, now() - interval '8 hours'),
  (gen_random_uuid(), '9ee8f4b6-4685-3b91-b04f-c5de925cffad', 'DUMMY_VENDOR_008', 4.688, now() - interval '4 hours'),
  (gen_random_uuid(), 'c732abf2-6ae2-d34c-179c-8a2365fc45dc', 'DUMMY_VENDOR_005', 3.551, now() - interval '30 hours'),
  (gen_random_uuid(), 'c732abf2-6ae2-d34c-179c-8a2365fc45dc', 'DUMMY_VENDOR_006', 3.835, now() - interval '25 hours'),
  (gen_random_uuid(), 'c732abf2-6ae2-d34c-179c-8a2365fc45dc', 'DUMMY_VENDOR_007', 4.257, now() - interval '20 hours'),
  (gen_random_uuid(), 'c732abf2-6ae2-d34c-179c-8a2365fc45dc', 'DUMMY_VENDOR_008', 4.470, now() - interval '15 hours'),
  (gen_random_uuid(), 'c732abf2-6ae2-d34c-179c-8a2365fc45dc', 'DUMMY_VENDOR_009', 4.828, now() - interval '10 hours'),
  (gen_random_uuid(), 'c732abf2-6ae2-d34c-179c-8a2365fc45dc', 'DUMMY_VENDOR_010', 5.359, now() - interval '5 hours'),
  (gen_random_uuid(), '66d71966-c7ef-865e-72d3-8cb6d9c815ff', 'DUMMY_VENDOR_007', 3.757, now() - interval '16 hours'),
  (gen_random_uuid(), '66d71966-c7ef-865e-72d3-8cb6d9c815ff', 'DUMMY_VENDOR_008', 4.058, now() - interval '14 hours'),
  (gen_random_uuid(), '66d71966-c7ef-865e-72d3-8cb6d9c815ff', 'DUMMY_VENDOR_009', 4.504, now() - interval '12 hours'),
  (gen_random_uuid(), '66d71966-c7ef-865e-72d3-8cb6d9c815ff', 'DUMMY_VENDOR_010', 4.729, now() - interval '10 hours'),
  (gen_random_uuid(), '66d71966-c7ef-865e-72d3-8cb6d9c815ff', 'DUMMY_VENDOR_001', 5.107, now() - interval '8 hours'),
  (gen_random_uuid(), '66d71966-c7ef-865e-72d3-8cb6d9c815ff', 'DUMMY_VENDOR_002', 5.669, now() - interval '6 hours'),
  (gen_random_uuid(), '66d71966-c7ef-865e-72d3-8cb6d9c815ff', 'DUMMY_VENDOR_003', 5.952, now() - interval '4 hours'),
  (gen_random_uuid(), '66d71966-c7ef-865e-72d3-8cb6d9c815ff', 'DUMMY_VENDOR_004', 6.428, now() - interval '2 hours'),
  (gen_random_uuid(), 'a1aa68dd-050a-88d7-91b8-bfe6d1ab6397', 'DUMMY_VENDOR_008', 3.860, now() - interval '9 hours'),
  (gen_random_uuid(), 'a1aa68dd-050a-88d7-91b8-bfe6d1ab6397', 'DUMMY_VENDOR_009', 4.169, now() - interval '6 hours'),
  (gen_random_uuid(), 'a1aa68dd-050a-88d7-91b8-bfe6d1ab6397', 'DUMMY_VENDOR_010', 4.628, now() - interval '3 hours'),
  (gen_random_uuid(), '0f225290-c409-2292-c54a-80a15d4afb62', 'DUMMY_VENDOR_009', 3.963, now() - interval '16 hours'),
  (gen_random_uuid(), '0f225290-c409-2292-c54a-80a15d4afb62', 'DUMMY_VENDOR_010', 4.280, now() - interval '12 hours'),
  (gen_random_uuid(), '0f225290-c409-2292-c54a-80a15d4afb62', 'DUMMY_VENDOR_001', 4.751, now() - interval '8 hours'),
  (gen_random_uuid(), '0f225290-c409-2292-c54a-80a15d4afb62', 'DUMMY_VENDOR_002', 4.989, now() - interval '4 hours'),
  (gen_random_uuid(), 'a3ab95c2-a8b7-8a02-4e5e-a05581b8f327', 'DUMMY_VENDOR_010', 4.066, now() - interval '25 hours'),
  (gen_random_uuid(), 'a3ab95c2-a8b7-8a02-4e5e-a05581b8f327', 'DUMMY_VENDOR_001', 4.391, now() - interval '20 hours'),
  (gen_random_uuid(), 'a3ab95c2-a8b7-8a02-4e5e-a05581b8f327', 'DUMMY_VENDOR_002', 4.874, now() - interval '15 hours'),
  (gen_random_uuid(), 'a3ab95c2-a8b7-8a02-4e5e-a05581b8f327', 'DUMMY_VENDOR_003', 5.118, now() - interval '10 hours'),
  (gen_random_uuid(), 'a3ab95c2-a8b7-8a02-4e5e-a05581b8f327', 'DUMMY_VENDOR_004', 5.527, now() - interval '5 hours'),
  (gen_random_uuid(), 'd655251e-0c27-26d2-5d2b-b4b87563d211', 'DUMMY_VENDOR_002', 4.271, now() - interval '14 hours'),
  (gen_random_uuid(), 'd655251e-0c27-26d2-5d2b-b4b87563d211', 'DUMMY_VENDOR_003', 4.613, now() - interval '12 hours'),
  (gen_random_uuid(), 'd655251e-0c27-26d2-5d2b-b4b87563d211', 'DUMMY_VENDOR_004', 5.120, now() - interval '10 hours'),
  (gen_random_uuid(), 'd655251e-0c27-26d2-5d2b-b4b87563d211', 'DUMMY_VENDOR_005', 5.376, now() - interval '8 hours'),
  (gen_random_uuid(), 'd655251e-0c27-26d2-5d2b-b4b87563d211', 'DUMMY_VENDOR_006', 5.806, now() - interval '6 hours'),
  (gen_random_uuid(), 'd655251e-0c27-26d2-5d2b-b4b87563d211', 'DUMMY_VENDOR_007', 6.445, now() - interval '4 hours'),
  (gen_random_uuid(), 'd655251e-0c27-26d2-5d2b-b4b87563d211', 'DUMMY_VENDOR_008', 6.767, now() - interval '2 hours'),
  (gen_random_uuid(), 'd331ae2a-dcbe-06ba-5afa-e3c405bc9655', 'DUMMY_VENDOR_003', 4.374, now() - interval '24 hours'),
  (gen_random_uuid(), 'd331ae2a-dcbe-06ba-5afa-e3c405bc9655', 'DUMMY_VENDOR_004', 4.724, now() - interval '21 hours'),
  (gen_random_uuid(), 'd331ae2a-dcbe-06ba-5afa-e3c405bc9655', 'DUMMY_VENDOR_005', 5.244, now() - interval '18 hours'),
  (gen_random_uuid(), 'd331ae2a-dcbe-06ba-5afa-e3c405bc9655', 'DUMMY_VENDOR_006', 5.506, now() - interval '15 hours'),
  (gen_random_uuid(), 'd331ae2a-dcbe-06ba-5afa-e3c405bc9655', 'DUMMY_VENDOR_007', 5.946, now() - interval '12 hours'),
  (gen_random_uuid(), 'd331ae2a-dcbe-06ba-5afa-e3c405bc9655', 'DUMMY_VENDOR_008', 6.600, now() - interval '9 hours'),
  (gen_random_uuid(), 'd331ae2a-dcbe-06ba-5afa-e3c405bc9655', 'DUMMY_VENDOR_009', 6.930, now() - interval '6 hours'),
  (gen_random_uuid(), 'd331ae2a-dcbe-06ba-5afa-e3c405bc9655', 'DUMMY_VENDOR_010', 7.484, now() - interval '3 hours'),
  (gen_random_uuid(), '7e8d8a67-f952-d1b6-6615-9e5ef980cc76', 'DUMMY_VENDOR_004', 4.477, now() - interval '12 hours'),
  (gen_random_uuid(), '7e8d8a67-f952-d1b6-6615-9e5ef980cc76', 'DUMMY_VENDOR_005', 4.835, now() - interval '8 hours'),
  (gen_random_uuid(), '7e8d8a67-f952-d1b6-6615-9e5ef980cc76', 'DUMMY_VENDOR_006', 5.367, now() - interval '4 hours'),
  (gen_random_uuid(), 'ce2e0bd9-5d59-bb4e-e448-10cc848f3830', 'DUMMY_VENDOR_005', 4.580, now() - interval '20 hours'),
  (gen_random_uuid(), 'ce2e0bd9-5d59-bb4e-e448-10cc848f3830', 'DUMMY_VENDOR_006', 4.946, now() - interval '15 hours'),
  (gen_random_uuid(), 'ce2e0bd9-5d59-bb4e-e448-10cc848f3830', 'DUMMY_VENDOR_007', 5.490, now() - interval '10 hours'),
  (gen_random_uuid(), 'ce2e0bd9-5d59-bb4e-e448-10cc848f3830', 'DUMMY_VENDOR_008', 5.765, now() - interval '5 hours'),
  (gen_random_uuid(), 'a816e744-b8e1-5173-8831-c2777366125f', 'DUMMY_VENDOR_007', 4.786, now() - interval '12 hours'),
  (gen_random_uuid(), 'a816e744-b8e1-5173-8831-c2777366125f', 'DUMMY_VENDOR_008', 5.169, now() - interval '10 hours'),
  (gen_random_uuid(), 'a816e744-b8e1-5173-8831-c2777366125f', 'DUMMY_VENDOR_009', 5.738, now() - interval '8 hours'),
  (gen_random_uuid(), 'a816e744-b8e1-5173-8831-c2777366125f', 'DUMMY_VENDOR_010', 6.025, now() - interval '6 hours'),
  (gen_random_uuid(), 'a816e744-b8e1-5173-8831-c2777366125f', 'DUMMY_VENDOR_001', 6.507, now() - interval '4 hours'),
  (gen_random_uuid(), 'a816e744-b8e1-5173-8831-c2777366125f', 'DUMMY_VENDOR_002', 7.223, now() - interval '2 hours'),
  (gen_random_uuid(), 'e8c62efb-6513-990d-8c0b-8088f2ca1162', 'DUMMY_VENDOR_008', 4.889, now() - interval '21 hours'),
  (gen_random_uuid(), 'e8c62efb-6513-990d-8c0b-8088f2ca1162', 'DUMMY_VENDOR_009', 5.280, now() - interval '18 hours'),
  (gen_random_uuid(), 'e8c62efb-6513-990d-8c0b-8088f2ca1162', 'DUMMY_VENDOR_010', 5.861, now() - interval '15 hours'),
  (gen_random_uuid(), 'e8c62efb-6513-990d-8c0b-8088f2ca1162', 'DUMMY_VENDOR_001', 6.154, now() - interval '12 hours'),
  (gen_random_uuid(), 'e8c62efb-6513-990d-8c0b-8088f2ca1162', 'DUMMY_VENDOR_002', 6.646, now() - interval '9 hours'),
  (gen_random_uuid(), 'e8c62efb-6513-990d-8c0b-8088f2ca1162', 'DUMMY_VENDOR_003', 7.377, now() - interval '6 hours'),
  (gen_random_uuid(), 'e8c62efb-6513-990d-8c0b-8088f2ca1162', 'DUMMY_VENDOR_004', 7.746, now() - interval '3 hours'),
  (gen_random_uuid(), '7d708273-18aa-f701-1926-4e1897c42fe2', 'DUMMY_VENDOR_009', 4.992, now() - interval '32 hours'),
  (gen_random_uuid(), '7d708273-18aa-f701-1926-4e1897c42fe2', 'DUMMY_VENDOR_010', 5.391, now() - interval '28 hours'),
  (gen_random_uuid(), '7d708273-18aa-f701-1926-4e1897c42fe2', 'DUMMY_VENDOR_001', 5.984, now() - interval '24 hours'),
  (gen_random_uuid(), '7d708273-18aa-f701-1926-4e1897c42fe2', 'DUMMY_VENDOR_002', 6.283, now() - interval '20 hours'),
  (gen_random_uuid(), '7d708273-18aa-f701-1926-4e1897c42fe2', 'DUMMY_VENDOR_003', 6.786, now() - interval '16 hours'),
  (gen_random_uuid(), '7d708273-18aa-f701-1926-4e1897c42fe2', 'DUMMY_VENDOR_004', 7.532, now() - interval '12 hours'),
  (gen_random_uuid(), '7d708273-18aa-f701-1926-4e1897c42fe2', 'DUMMY_VENDOR_005', 7.909, now() - interval '8 hours'),
  (gen_random_uuid(), '7d708273-18aa-f701-1926-4e1897c42fe2', 'DUMMY_VENDOR_006', 8.542, now() - interval '4 hours'),
  (gen_random_uuid(), '88e53e4e-27a2-134c-b02e-3bf050a5ba5c', 'DUMMY_VENDOR_010', 5.095, now() - interval '15 hours'),
  (gen_random_uuid(), '88e53e4e-27a2-134c-b02e-3bf050a5ba5c', 'DUMMY_VENDOR_001', 5.503, now() - interval '10 hours'),
  (gen_random_uuid(), '88e53e4e-27a2-134c-b02e-3bf050a5ba5c', 'DUMMY_VENDOR_002', 6.108, now() - interval '5 hours');

-- =============================================================================
-- PART 5 — ENDED AUCTION FOR ESCROW TESTING
-- =============================================================================
INSERT INTO public.auctions (
  id, title, description, category, seller_wallet, start_price, current_bid,
  end_time, status, image_url, condition, item_details, is_dummy, escrow_state, created_at
) VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'PSA 10 1999 Pokémon Pikachu Holo #58 — ESCROW TEST',
  'Test auction for escrow payment flow. PSA 10 gem mint 1999 Pokémon Base Set Pikachu Holo.',
  'Trading Cards',
  'DUMMY_VENDOR_001',
  0.15,
  0.20,
  now() - interval '1 hour',
  'ended',
  'https://picsum.photos/seed/pikachu58/400/400',
  'mint',
  '{"set": "Base Set", "year": "1999", "card_number": "58", "grade": "PSA 10", "grade_score": "10", "grading_company": "PSA", "language": "English", "first_edition": false}'::jsonb,
  false,
  'none',
  now() - interval '3 days'
);

INSERT INTO public.bids (id, auction_id, bidder_wallet, amount, created_at)
VALUES (gen_random_uuid(), 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'CVqvsLBSQ3Q8ZiZDB6pvavYQZ4aKchrJ2g7Eh2BLKXyT', 0.20, now() - interval '2 hours');

INSERT INTO public.message_threads (id, auction_id, buyer_wallet, seller_wallet, status, created_at)
VALUES (gen_random_uuid(), 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'CVqvsLBSQ3Q8ZiZDB6pvavYQZ4aKchrJ2g7Eh2BLKXyT', 'DUMMY_VENDOR_001', 'active', now());

-- =============================================================================
-- PART 6 — REVIEWS FOR ALL 10 VENDORS
-- =============================================================================
INSERT INTO public.reviews (id, vendor_wallet, reviewer_wallet, auction_id, rating, comment, tags, created_at, is_dummy) VALUES
  (gen_random_uuid(), 'DUMMY_VENDOR_001', 'CVqvsLBSQ3Q8ZiZDB6pvavYQZ4aKchrJ2g7Eh2BLKXyT', NULL, 5, 'Outstanding seller. Item matched photos exactly and arrived faster than expected.', '{"fast_shipping","as_described","great_packaging"}'::text[], now() - interval '10 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_001', 'DUMMY_VENDOR_003', NULL, 5, 'Packaging was premium and communication was excellent throughout the transaction.', '{"great_packaging","good_communication","would_buy_again"}'::text[], now() - interval '17 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_001', 'DUMMY_VENDOR_004', NULL, 4, 'Great experience overall. Item was authentic and well described.', '{"authentic","as_described","responsive"}'::text[], now() - interval '24 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_002', 'DUMMY_VENDOR_003', NULL, 5, 'Packaging was premium and communication was excellent throughout the transaction.', '{"great_packaging","good_communication","would_buy_again"}'::text[], now() - interval '31 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_002', 'DUMMY_VENDOR_004', NULL, 4, 'Great experience overall. Item was authentic and well described.', '{"authentic","as_described","responsive"}'::text[], now() - interval '38 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_002', 'DUMMY_VENDOR_005', NULL, 4, 'Smooth purchase from start to finish. Would happily bid again.', '{"would_buy_again","as_described","fast_shipping"}'::text[], now() - interval '45 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_002', 'DUMMY_VENDOR_006', NULL, 5, 'Exactly as listed and shipped with care. One of the best vendors on Hype.', '{"as_described","well_packaged","fast_shipping"}'::text[], now() - interval '52 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_003', 'CVqvsLBSQ3Q8ZiZDB6pvavYQZ4aKchrJ2g7Eh2BLKXyT', NULL, 4, 'Great experience overall. Item was authentic and well described.', '{"authentic","as_described","responsive"}'::text[], now() - interval '59 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_003', 'DUMMY_VENDOR_005', NULL, 4, 'Smooth purchase from start to finish. Would happily bid again.', '{"would_buy_again","as_described","fast_shipping"}'::text[], now() - interval '66 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_003', 'DUMMY_VENDOR_006', NULL, 5, 'Exactly as listed and shipped with care. One of the best vendors on Hype.', '{"as_described","well_packaged","fast_shipping"}'::text[], now() - interval '73 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_003', 'DUMMY_VENDOR_007', NULL, 3, 'Item was good but shipping took longer than expected. Seller was responsive though.', '{"as_described","responsive","good_communication"}'::text[], now() - interval '80 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_003', 'DUMMY_VENDOR_008', NULL, 4, 'Solid transaction. Condition was even better than I expected in person.', '{"great_condition","as_described","authentic"}'::text[], now() - interval '87 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_004', 'DUMMY_VENDOR_005', NULL, 4, 'Smooth purchase from start to finish. Would happily bid again.', '{"would_buy_again","as_described","fast_shipping"}'::text[], now() - interval '7 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_004', 'DUMMY_VENDOR_006', NULL, 5, 'Exactly as listed and shipped with care. One of the best vendors on Hype.', '{"as_described","well_packaged","fast_shipping"}'::text[], now() - interval '14 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_004', 'DUMMY_VENDOR_007', NULL, 3, 'Item was good but shipping took longer than expected. Seller was responsive though.', '{"as_described","responsive","good_communication"}'::text[], now() - interval '21 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_004', 'DUMMY_VENDOR_008', NULL, 4, 'Solid transaction. Condition was even better than I expected in person.', '{"great_condition","as_described","authentic"}'::text[], now() - interval '28 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_004', 'DUMMY_VENDOR_009', NULL, 5, 'Top-tier seller. Fast replies and secure packaging every time.', '{"responsive","great_packaging","would_buy_again"}'::text[], now() - interval '35 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_004', 'DUMMY_VENDOR_010', NULL, 4, 'Happy with the purchase. Clear photos and honest description.', '{"as_described","authentic","good_communication"}'::text[], now() - interval '42 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_005', 'CVqvsLBSQ3Q8ZiZDB6pvavYQZ4aKchrJ2g7Eh2BLKXyT', NULL, 5, 'Exactly as listed and shipped with care. One of the best vendors on Hype.', '{"as_described","well_packaged","fast_shipping"}'::text[], now() - interval '49 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_005', 'DUMMY_VENDOR_007', NULL, 3, 'Item was good but shipping took longer than expected. Seller was responsive though.', '{"as_described","responsive","good_communication"}'::text[], now() - interval '56 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_005', 'DUMMY_VENDOR_008', NULL, 4, 'Solid transaction. Condition was even better than I expected in person.', '{"great_condition","as_described","authentic"}'::text[], now() - interval '63 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_005', 'DUMMY_VENDOR_009', NULL, 5, 'Top-tier seller. Fast replies and secure packaging every time.', '{"responsive","great_packaging","would_buy_again"}'::text[], now() - interval '70 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_005', 'DUMMY_VENDOR_010', NULL, 4, 'Happy with the purchase. Clear photos and honest description.', '{"as_described","authentic","good_communication"}'::text[], now() - interval '77 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_005', 'DUMMY_VENDOR_001', NULL, 3, 'Product was fine with minor wear not shown in photos, but seller resolved it quickly.', '{"as_described","responsive","good_communication"}'::text[], now() - interval '84 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_005', 'DUMMY_VENDOR_002', NULL, 5, 'Outstanding seller. Item matched photos exactly and arrived faster than expected.', '{"fast_shipping","as_described","great_packaging"}'::text[], now() - interval '4 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_006', 'DUMMY_VENDOR_007', NULL, 3, 'Item was good but shipping took longer than expected. Seller was responsive though.', '{"as_described","responsive","good_communication"}'::text[], now() - interval '11 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_006', 'DUMMY_VENDOR_008', NULL, 4, 'Solid transaction. Condition was even better than I expected in person.', '{"great_condition","as_described","authentic"}'::text[], now() - interval '18 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_006', 'DUMMY_VENDOR_009', NULL, 5, 'Top-tier seller. Fast replies and secure packaging every time.', '{"responsive","great_packaging","would_buy_again"}'::text[], now() - interval '25 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_007', 'CVqvsLBSQ3Q8ZiZDB6pvavYQZ4aKchrJ2g7Eh2BLKXyT', NULL, 4, 'Solid transaction. Condition was even better than I expected in person.', '{"great_condition","as_described","authentic"}'::text[], now() - interval '32 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_007', 'DUMMY_VENDOR_009', NULL, 5, 'Top-tier seller. Fast replies and secure packaging every time.', '{"responsive","great_packaging","would_buy_again"}'::text[], now() - interval '39 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_007', 'DUMMY_VENDOR_010', NULL, 4, 'Happy with the purchase. Clear photos and honest description.', '{"as_described","authentic","good_communication"}'::text[], now() - interval '46 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_007', 'DUMMY_VENDOR_001', NULL, 3, 'Product was fine with minor wear not shown in photos, but seller resolved it quickly.', '{"as_described","responsive","good_communication"}'::text[], now() - interval '53 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_008', 'DUMMY_VENDOR_009', NULL, 5, 'Top-tier seller. Fast replies and secure packaging every time.', '{"responsive","great_packaging","would_buy_again"}'::text[], now() - interval '60 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_008', 'DUMMY_VENDOR_010', NULL, 4, 'Happy with the purchase. Clear photos and honest description.', '{"as_described","authentic","good_communication"}'::text[], now() - interval '67 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_008', 'DUMMY_VENDOR_001', NULL, 3, 'Product was fine with minor wear not shown in photos, but seller resolved it quickly.', '{"as_described","responsive","good_communication"}'::text[], now() - interval '74 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_008', 'DUMMY_VENDOR_002', NULL, 5, 'Outstanding seller. Item matched photos exactly and arrived faster than expected.', '{"fast_shipping","as_described","great_packaging"}'::text[], now() - interval '81 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_008', 'DUMMY_VENDOR_003', NULL, 5, 'Packaging was premium and communication was excellent throughout the transaction.', '{"great_packaging","good_communication","would_buy_again"}'::text[], now() - interval '88 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_009', 'CVqvsLBSQ3Q8ZiZDB6pvavYQZ4aKchrJ2g7Eh2BLKXyT', NULL, 4, 'Happy with the purchase. Clear photos and honest description.', '{"as_described","authentic","good_communication"}'::text[], now() - interval '8 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_009', 'DUMMY_VENDOR_001', NULL, 3, 'Product was fine with minor wear not shown in photos, but seller resolved it quickly.', '{"as_described","responsive","good_communication"}'::text[], now() - interval '15 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_009', 'DUMMY_VENDOR_002', NULL, 5, 'Outstanding seller. Item matched photos exactly and arrived faster than expected.', '{"fast_shipping","as_described","great_packaging"}'::text[], now() - interval '22 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_009', 'DUMMY_VENDOR_003', NULL, 5, 'Packaging was premium and communication was excellent throughout the transaction.', '{"great_packaging","good_communication","would_buy_again"}'::text[], now() - interval '29 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_009', 'DUMMY_VENDOR_004', NULL, 4, 'Great experience overall. Item was authentic and well described.', '{"authentic","as_described","responsive"}'::text[], now() - interval '36 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_009', 'DUMMY_VENDOR_005', NULL, 4, 'Smooth purchase from start to finish. Would happily bid again.', '{"would_buy_again","as_described","fast_shipping"}'::text[], now() - interval '43 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_010', 'DUMMY_VENDOR_001', NULL, 3, 'Product was fine with minor wear not shown in photos, but seller resolved it quickly.', '{"as_described","responsive","good_communication"}'::text[], now() - interval '50 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_010', 'DUMMY_VENDOR_002', NULL, 5, 'Outstanding seller. Item matched photos exactly and arrived faster than expected.', '{"fast_shipping","as_described","great_packaging"}'::text[], now() - interval '57 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_010', 'DUMMY_VENDOR_003', NULL, 5, 'Packaging was premium and communication was excellent throughout the transaction.', '{"great_packaging","good_communication","would_buy_again"}'::text[], now() - interval '64 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_010', 'DUMMY_VENDOR_004', NULL, 4, 'Great experience overall. Item was authentic and well described.', '{"authentic","as_described","responsive"}'::text[], now() - interval '71 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_010', 'DUMMY_VENDOR_005', NULL, 4, 'Smooth purchase from start to finish. Would happily bid again.', '{"would_buy_again","as_described","fast_shipping"}'::text[], now() - interval '78 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_010', 'DUMMY_VENDOR_006', NULL, 5, 'Exactly as listed and shipped with care. One of the best vendors on Hype.', '{"as_described","well_packaged","fast_shipping"}'::text[], now() - interval '85 days', true),
  (gen_random_uuid(), 'DUMMY_VENDOR_010', 'DUMMY_VENDOR_007', NULL, 3, 'Item was good but shipping took longer than expected. Seller was responsive though.', '{"as_described","responsive","good_communication"}'::text[], now() - interval '5 days', true);

-- Refresh vendor stats after seeding reviews
SELECT public.refresh_vendor_stats(wallet_address) FROM public.users WHERE wallet_address LIKE 'DUMMY_VENDOR_%';
