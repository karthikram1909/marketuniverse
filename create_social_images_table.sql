-- Create social_media_images table if it doesn't exist
create table if not exists public.social_media_images (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  image_url text not null,
  is_active boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.social_media_images enable row level security;

-- Create policy for public read access
create policy "Social media images are viewable by everyone." on social_media_images for select using ( true );

-- Insert a default image if none exists
insert into public.social_media_images (title, description, image_url, is_active)
select 'MarketUniverse', 'The ultimate crypto tracking and trading platform', 'https://oskinzqcifpyfwnczwbw.supabase.co/storage/v1/object/public/assets/og-image.png', true
where not exists (select 1 from public.social_media_images);
