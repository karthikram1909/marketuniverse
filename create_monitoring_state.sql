
CREATE TABLE IF NOT EXISTS public.monitoring_state (
    service_id TEXT PRIMARY KEY,
    last_processed_block BIGINT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS (allow full access for now for simplicity)
ALTER TABLE public.monitoring_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable full access for all" ON public.monitoring_state FOR ALL USING (true) WITH CHECK (true);
