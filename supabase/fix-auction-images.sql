-- Replace broken Unsplash auction images with working placeholder URLs.
-- Run in Supabase SQL Editor if images still show broken in the dashboard.

UPDATE public.auctions
SET image_url = 'https://psacard.com/assets/img/pop-report/pokemon.png'
WHERE image_url LIKE '%unsplash%photo-1606503908835%'
   OR (image_url LIKE '%unsplash%' AND title ILIKE '%pokemon%');

UPDATE public.auctions
SET image_url = 'https://images.stockx.com/images/Air-Jordan-1-Retro-High-OG-Bred-2019.jpg'
WHERE image_url LIKE '%unsplash%photo-1542291026%'
   OR (image_url LIKE '%unsplash%' AND title ILIKE '%jordan%');

UPDATE public.auctions
SET image_url = 'https://placehold.co/800x600/1a1a2e/white?text=Live+Auction'
WHERE image_url LIKE '%unsplash%'
  AND title NOT ILIKE '%pokemon%'
  AND title NOT ILIKE '%jordan%';
