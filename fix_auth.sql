-- 1. Reset RLS on Profiles to be safe
alter table public.profiles enable row level security;

drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);

drop policy if exists "Users can insert their own profile." on public.profiles;
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile." on public.profiles;
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- 2. Fix the Trigger Function (ensure it is SECURITY DEFINER)
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role, wallet_address)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    'user',
    new.raw_user_meta_data->>'wallet_address' -- Capture wallet if passed
  )
  on conflict (id) do nothing; -- Prevent errors if profile exists
  return new;
end;
$$ language plpgsql security definer;

-- 3. Recreate the trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. BACKFILL: Create profiles for any existing users who don't have one
insert into public.profiles (id, email)
select id, email from auth.users
where id not in (select id from public.profiles)
on conflict do nothing;

-- 5. Grant permissions to ensure the anon key can read/write necessary tables
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant all on all routines in schema public to anon, authenticated;
