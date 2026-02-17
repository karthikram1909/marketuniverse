-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  role text default 'user',
  wallet_address text,
  full_name text,
  display_name text,
  telephone text,
  discord_name text,
  x_profile_link text,
  withdrawal_wallet_address text,
  avatar_url text,
  country text,
  city text,
  address text,
  date_of_birth date,
  occupation text,
  scatter_pending boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone." on profiles for select using ( true );
create policy "Users can insert their own profile." on profiles for insert with check ( auth.uid() = id );
create policy "Users can update own profile." on profiles for update using ( auth.uid() = id );

-- Game Settings table
create table if not exists public.game_settings (
  id uuid default uuid_generate_v4() primary key,
  game_type text not null,
  purchases_locked boolean default false,
  game_wallet_address text,
  entry_fee numeric,
  scatter_consecutive_wins integer,
  allow_admin_during_lock boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Insert default settings
insert into public.game_settings (game_type, entry_fee, scatter_consecutive_wins) 
select 'dealornodeal', 1, 3
where not exists (select 1 from public.game_settings where game_type = 'dealornodeal');

-- Deal or No Deal Games table
create table if not exists public.deal_or_no_deal_games (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  wallet_address text,
  game_status text default 'active',
  my_case integer,
  case_amounts numeric[] not null, -- Array of numbers
  opened_cases integer[] default '{}',
  final_winnings numeric default 0,
  xp_earned numeric default 0,
  game_fee numeric,
  tx_hash text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.deal_or_no_deal_games enable row level security;

create policy "Users can view own games" on deal_or_no_deal_games for select using (auth.uid() = user_id);
create policy "Users can insert own games" on deal_or_no_deal_games for insert with check (auth.uid() = user_id);
create policy "Users can update own games" on deal_or_no_deal_games for update using (auth.uid() = user_id);

-- User Agreements
create table if not exists public.user_agreements (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users,
  wallet_address text,
  terms_accepted boolean default false,
  privacy_accepted boolean default false,
  cookies_accepted boolean default false,
  acceptance_date timestamp with time zone default timezone('utc'::text, now())
);

alter table public.user_agreements enable row level security;
create policy "Users can view own agreements" on user_agreements for select using (auth.uid() = user_id);
create policy "Users can insert own agreements" on user_agreements for insert with check (auth.uid() = user_id);

-- Trophies (simplified)
create table if not exists public.trophies (
  id uuid default uuid_generate_v4() primary key,
  name text,
  description text,
  image_url text
);

-- Notifications
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users,
  message text,
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Function to handle new user signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'user');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
