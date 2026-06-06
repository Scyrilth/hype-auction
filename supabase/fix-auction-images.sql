-- Replace broken Unsplash auction images with working placeholder URLs.
-- Run in Supabase SQL Editor if images still show broken in the dashboard.

UPDATE public.auctions
SET image_url = 'https://psacard.com/assets/img/pop-report/pokemon.png'
WHERE image_url LIKE '%unsplash%photo-1606503908835%'
   OR (image_url LIKE '%unsplash%' AND title ILIKE '%pokemon%');

UPDATE public.auctions
SET image_url = 'https://static.nike.com/a/images/t_PDP_1280_v1/f_auto/b7d9211c-26e7-431a-ac24-b0540fb3c00f/air-jordan-1-retro-high-og-shoes-kQRqvz.png'
WHERE image_url LIKE '%unsplash%photo-1542291026%'
   OR image_url LIKE '%images.stockx.com%'
   OR image_url LIKE '%sneakernews.com%'
   OR (image_url LIKE '%unsplash%' AND title ILIKE '%jordan%')
   OR category = 'Sneakers';

UPDATE public.auctions
SET image_url = 'https://placehold.co/800x600/1a1a2e/white?text=Live+Auction'
WHERE image_url LIKE '%unsplash%'
  AND title NOT ILIKE '%pokemon%'
  AND title NOT ILIKE '%jordan%';
