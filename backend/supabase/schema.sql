create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.training_weeks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  training_year int not null,
  week_number int not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, training_year, week_number)
);

create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.training_weeks (id) on delete cascade,
  title text not null,
  order_index int not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (week_id, order_index)
);

create table if not exists public.training_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.training_sessions (id) on delete cascade,
  name text not null,
  sets int not null default 0 check (sets >= 0),
  reps int not null default 0 check (reps >= 0),
  load text not null default '',
  order_index int not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (session_id, order_index)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute procedure public.set_updated_at();

drop trigger if exists set_training_weeks_updated_at on public.training_weeks;
create trigger set_training_weeks_updated_at
before update on public.training_weeks
for each row
execute procedure public.set_updated_at();

drop trigger if exists set_training_sessions_updated_at on public.training_sessions;
create trigger set_training_sessions_updated_at
before update on public.training_sessions
for each row
execute procedure public.set_updated_at();

drop trigger if exists set_training_exercises_updated_at on public.training_exercises;
create trigger set_training_exercises_updated_at
before update on public.training_exercises
for each row
execute procedure public.set_updated_at();
