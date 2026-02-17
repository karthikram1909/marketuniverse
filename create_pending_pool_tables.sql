-- Existing Pool Tables
-- (Already created: pool_settings, pool_trades, pool_investors, withdrawal_requests)

-- Deposit Intents Table
create table if not exists public.deposit_intents (
    id uuid default uuid_generate_v4() primary key,
    wallet_address text not null,
    pool_address text not null,
    expected_amount numeric not null,
    pool_type text not null,
    status text default 'initiated',
    start_block bigint,
    duration_months integer,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    expires_at timestamp with time zone
);

alter table public.deposit_intents enable row level security;

create policy "Users can insert their own deposit intents"
    on public.deposit_intents for insert
    with check (true);

create policy "Users can view their own deposit intents"
    on public.deposit_intents for select
    using (true);

-- Pending Transactions Table (for pool deposits)
create table if not exists public.pending_transactions (
    id uuid default uuid_generate_v4() primary key,
    wallet_address text not null,
    tx_hash text unique not null,
    status text default 'pending', -- pending, verifying, processing, completed, failed
    expected_amount numeric,
    pool_type text,
    pool_address text,
    duration_months integer,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.pending_transactions enable row level security;

create policy "Users can insert their own pending transactions"
    on public.pending_transactions for insert
    with check (true);

create policy "Users can view their own pending transactions"
    on public.pending_transactions for select
    using (true);

create policy "Users can update their own pending transactions"
    on public.pending_transactions for update
    using (true);
