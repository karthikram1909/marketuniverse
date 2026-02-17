-- Create Pool Settings table
CREATE TABLE IF NOT EXISTS public.pool_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    pool_type TEXT NOT NULL, -- 'traditional', 'scalping', etc.
    pool_address TEXT,
    profit_share_rate NUMERIC DEFAULT 0.20,
    usdt_contract TEXT,
    deposits_locked BOOLEAN DEFAULT false,
    withdrawals_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Pool Trade table
CREATE TABLE IF NOT EXISTS public.pool_trades (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    pool_type TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    pair TEXT NOT NULL,
    direction TEXT NOT NULL, -- 'long' or 'short'
    margin NUMERIC NOT NULL,
    leverage NUMERIC NOT NULL,
    size NUMERIC NOT NULL,
    fee NUMERIC DEFAULT 0,
    pnl NUMERIC DEFAULT 0,
    result TEXT NOT NULL, -- 'win' or 'loss'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Pool Investor table
CREATE TABLE IF NOT EXISTS public.pool_investors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    pool_type TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    investor_name TEXT,
    invested_amount NUMERIC DEFAULT 0,
    duration_months INTEGER,
    investment_end_date TIMESTAMP WITH TIME ZONE,
    deposit_transactions JSONB DEFAULT '[]'::jsonb, -- Array of deposit objects
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Withdrawal Request table (if not exists)
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    email TEXT,
    payment_address TEXT NOT NULL,
    name_surname TEXT,
    amount NUMERIC NOT NULL,
    pool_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'rejected'
    user_balance_at_request NUMERIC,
    admin_notes TEXT,
    paid_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.pool_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Create policies

-- Pool Settings: readable by everyone, writable by admin only (assuming admin logic handled via app or specific admin role, simple policy for now)
CREATE POLICY "Pool Settings are viewable by everyone" ON public.pool_settings FOR SELECT USING (true);
CREATE POLICY "Pool Settings are insertable by authenticated users" ON public.pool_settings FOR INSERT WITH CHECK (auth.role() = 'authenticated'); -- Should be admin restricted ideally
CREATE POLICY "Pool Settings are updatable by authenticated users" ON public.pool_settings FOR UPDATE USING (auth.role() = 'authenticated');

-- Pool Trades: readable by everyone
CREATE POLICY "Pool Trades are viewable by everyone" ON public.pool_trades FOR SELECT USING (true);
CREATE POLICY "Pool Trades are insertable by authenticated users" ON public.pool_trades FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Pool Trades are updatable by authenticated users" ON public.pool_trades FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Pool Trades are deletable by authenticated users" ON public.pool_trades FOR DELETE USING (auth.role() = 'authenticated');

-- Pool Investors: viewable by everyone (or just owner? Frontend fetches all investors for ownership calc)
-- The frontend calculates ownership based on ALL investors, so detailed info needs to be public?
-- Or at least aggregate. For now, let's make it viewable by authenticated users to support the frontend logic.
CREATE POLICY "Pool Investors are viewable by everyone" ON public.pool_investors FOR SELECT USING (true);
CREATE POLICY "Pool Investors are insertable by authenticated users" ON public.pool_investors FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Pool Investors are updatable by authenticated users" ON public.pool_investors FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Pool Investors are deletable by authenticated users" ON public.pool_investors FOR DELETE USING (auth.role() = 'authenticated');

-- Withdrawal Requests: users can view their own, admins can view all.
-- Frontend `TraditionalPool.jsx` fetches ALL withdrawals to calculate pool perf?
-- Yes: `const { data: allWithdrawals = [] } = useQuery(...)`.
-- So it needs to be readable by everyone or authenticated users.
CREATE POLICY "Withdrawal Requests are viewable by everyone" ON public.withdrawal_requests FOR SELECT USING (true);
CREATE POLICY "Withdrawal Requests are insertable by authenticated users" ON public.withdrawal_requests FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Withdrawal Requests are updatable by authenticated users" ON public.withdrawal_requests FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Withdrawal Requests are deletable by authenticated users" ON public.withdrawal_requests FOR DELETE USING (auth.role() = 'authenticated');

-- Update Notifications table to support pool notifications
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS amount NUMERIC;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS wallet_address TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS email TEXT;

