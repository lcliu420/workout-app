begin;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_training_exercises_updated_at on public.training_exercises;
drop trigger if exists set_training_sessions_updated_at on public.training_sessions;
drop trigger if exists set_training_weeks_updated_at on public.training_weeks;
drop trigger if exists set_profiles_updated_at on public.profiles;

drop table if exists public.training_exercises cascade;
drop table if exists public.training_sessions cascade;
drop table if exists public.training_weeks cascade;
drop table if exists public.profiles cascade;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.training_weeks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  training_year int not null,
  week_number int not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, training_year, week_number)
);

create table public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.training_weeks (id) on delete cascade,
  title text not null,
  order_index int not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (week_id, order_index)
);

create table public.training_exercises (
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

create index training_weeks_user_id_idx on public.training_weeks (user_id);
create index training_sessions_week_id_idx on public.training_sessions (week_id);
create index training_exercises_session_id_idx on public.training_exercises (session_id);

create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute procedure public.set_updated_at();

create trigger set_training_weeks_updated_at
before update on public.training_weeks
for each row
execute procedure public.set_updated_at();

create trigger set_training_sessions_updated_at
before update on public.training_sessions
for each row
execute procedure public.set_updated_at();

create trigger set_training_exercises_updated_at
before update on public.training_exercises
for each row
execute procedure public.set_updated_at();

alter table public.profiles disable row level security;
alter table public.training_weeks disable row level security;
alter table public.training_sessions disable row level security;
alter table public.training_exercises disable row level security;

insert into public.profiles (id, email, display_name, avatar_url)
select
  users.id,
  users.email,
  coalesce(
    nullif(users.raw_user_meta_data ->> 'displayName', ''),
    nullif(users.raw_user_meta_data ->> 'display_name', ''),
    nullif(split_part(users.email, '@', 1), ''),
    '用户'
  ) as display_name,
  nullif(users.raw_user_meta_data ->> 'avatarUrl', '') as avatar_url
from auth.users as users
where users.email is not null
on conflict (id) do update
set
  email = excluded.email,
  display_name = excluded.display_name,
  avatar_url = excluded.avatar_url;

commit;
