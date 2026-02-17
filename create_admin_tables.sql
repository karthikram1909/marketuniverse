-- Manual Deposits
create table if not exists public.manual_deposits (
  id uuid default uuid_generate_v4() primary key,
  wallet_address text,
  amount numeric,
  pool_type text,
  tx_hash text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.manual_deposits enable row level security;
create policy "Admins can view all manual deposits" on public.manual_deposits for select using (true);
create policy "Admins can insert manual deposits" on public.manual_deposits for insert with check (true);
create policy "Admins can update manual deposits" on public.manual_deposits for update using (true);
create policy "Admins can delete manual deposits" on public.manual_deposits for delete using (true);

-- Blocked Wallets
create table if not exists public.blocked_wallets (
  id uuid default uuid_generate_v4() primary key,
  wallet_address text unique,
  reason text,
  blocked_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.blocked_wallets enable row level security;
create policy "Everyone can view blocked wallets" on public.blocked_wallets for select using (true); 
create policy "Admins can manage blocked wallets" on public.blocked_wallets for all using (true);

-- API Settings
create table if not exists public.api_settings (
  id uuid default uuid_generate_v4() primary key,
  bscscan_enabled boolean default true,
  finnhub_enabled boolean default true,
  mexc_enabled boolean default true,
  rate_limit_threshold integer default 50,
  rate_limit_window_hours integer default 24,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.api_settings enable row level security;
create policy "Admins can view api settings" on public.api_settings for select using (true);
create policy "Admins can manage api settings" on public.api_settings for all using (true);

-- API Usage Logs
create table if not exists public.api_usage_logs (
  id uuid default uuid_generate_v4() primary key,
  endpoint text,
  method text,
  status_code integer,
  response_time_ms integer,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.api_usage_logs enable row level security;
create policy "Admins can view api logs" on public.api_usage_logs for select using (true);

-- Lesson Bookings
create table if not exists public.lesson_bookings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users,
  lesson_id text,
  booking_date timestamp with time zone,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.lesson_bookings enable row level security;
create policy "Admins can view bookings" on public.lesson_bookings for select using (true);

-- Visits (Analytics)
create table if not exists public.visits (
  id uuid default uuid_generate_v4() primary key,
  visitor_id text,
  ip_address text,
  user_agent text,
  referer text,
  visited_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.visits enable row level security;
create policy "Admins can view visits" on public.visits for select using (true);

-- Page Views (Analytics)
create table if not exists public.page_views (
  id uuid default uuid_generate_v4() primary key,
  visit_id uuid references public.visits,
  path text,
  viewed_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.page_views enable row level security;
create policy "Admins can view page views" on public.page_views for select using (true);

-- Staking Contracts (if not exists)
create table if not exists public.staking_contracts (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid,
    wallet_address text,
    amount numeric,
    apy numeric,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    status text default 'active',
    total_earned numeric default 0,
    created_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.staking_contracts enable row level security;
create policy "Public read staking" on public.staking_contracts for select using (true);
create policy "Admin manage staking" on public.staking_contracts for all using (true);
