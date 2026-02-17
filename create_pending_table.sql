-- Create Pending Game Payments table
create table if not exists public.pending_game_payments (
    id uuid default uuid_generate_v4() primary key,
    wallet_address text not null,
    tx_hash text unique not null,
    case_number integer,
    game_fee numeric,
    status text default 'pending', -- pending, confirmed, failed
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.pending_game_payments enable row level security;

-- Policies (with IF NOT EXISTS to avoid duplicates)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'pending_game_payments' 
        AND policyname = 'Users can insert their own pending payments'
    ) THEN
        CREATE POLICY "Users can insert their own pending payments" 
        ON public.pending_game_payments FOR INSERT WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'pending_game_payments' 
        AND policyname = 'Users can view their own pending payments'
    ) THEN
        CREATE POLICY "Users can view their own pending payments" 
        ON public.pending_game_payments FOR SELECT USING (true);
    END IF;
END $$;
