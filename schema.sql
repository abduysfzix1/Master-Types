-- MASTER TYPING database schema
-- Run this in Supabase SQL Editor after creating a project.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.typing_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  duration_seconds integer not null check (duration_seconds in (15, 30, 60, 120)),
  wpm numeric(6,2) not null check (wpm >= 0 and wpm <= 300),
  accuracy numeric(5,2) not null check (accuracy >= 0 and accuracy <= 100),
  errors integer not null check (errors >= 0),
  created_at timestamptz not null default now()
);

create index if not exists typing_results_user_created_idx
  on public.typing_results(user_id, created_at desc);
create index if not exists typing_results_wpm_idx
  on public.typing_results(wpm desc);

alter table public.profiles enable row level security;
alter table public.typing_results enable row level security;

create policy "Profiles are publicly readable"
  on public.profiles for select using (true);
create policy "Users can create their own profile"
  on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users can read their own results"
  on public.typing_results for select using (auth.uid() = user_id);
create policy "Users can insert their own results"
  on public.typing_results for insert with check (auth.uid() = user_id);

-- Create a profile automatically for each new auth user.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
