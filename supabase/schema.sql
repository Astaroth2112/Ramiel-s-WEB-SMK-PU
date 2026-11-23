-- =============================================================================
-- SMK Prima Unggul — Supabase PostgreSQL Schema & Auth Synchronization
-- =============================================================================
-- Jalankan skrip ini di SQL Editor Supabase Anda untuk mengaktifkan tabel,
-- Row Level Security (RLS), serta trigger otomatis yang memastikan user
-- pertama yang terdaftar di Supabase Authentication otomatis mendapat role 'admin'.

-- 1. Enum & Tables
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  nip text,
  position_title text,
  role text not null check (role in ('admin', 'guru', 'tenaga_kependidikan')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  nis text not null unique,
  name text not null,
  class_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employee_attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  attendance_date date not null default current_date,
  status text not null check (status in ('Hadir', 'Izin', 'Sakit')),
  check_in_time timestamptz not null default now(),
  check_out_time timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, attendance_date)
);

create table if not exists public.student_attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  recorded_by uuid references public.profiles(id) on delete set null,
  attendance_date date not null default current_date,
  status text not null check (status in ('Hadir', 'Izin', 'Sakit', 'Alpha')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, attendance_date)
);

-- 2. Trigger: User pertama di Supabase Auth otomatis menjadi 'admin'
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_count integer;
  assigned_role text;
begin
  select count(*) into user_count from public.profiles;

  if user_count = 0 then
    assigned_role := 'admin';
  else
    assigned_role := coalesce(
      new.raw_user_meta_data ->> 'role',
      'tenaga_kependidikan'
    );
  end if;

  if assigned_role not in ('admin', 'guru', 'tenaga_kependidikan') then
    assigned_role := 'tenaga_kependidikan';
  end if;

  insert into public.profiles (id, email, full_name, nip, position_title, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'nip',
    new.raw_user_meta_data ->> 'position_title',
    assigned_role
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.employee_attendance enable row level security;
alter table public.student_attendance enable row level security;

-- Helper function checking current user role
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Profiles policies
create policy "Users can view own profile or admin views all"
  on public.profiles for select
  using (id = auth.uid() or public.current_user_role() = 'admin');

create policy "Admin manages all profiles"
  on public.profiles for all
  using (public.current_user_role() = 'admin');

-- Students policies
create policy "Authenticated staff can view students"
  on public.students for select
  using (auth.role() = 'authenticated');

create policy "Admin manages students"
  on public.students for all
  using (public.current_user_role() = 'admin');

-- Employee attendance policies (semua role adalah karyawan)
create policy "Employees view own attendance or admin views all"
  on public.employee_attendance for select
  using (user_id = auth.uid() or public.current_user_role() = 'admin');

create policy "Employees insert own attendance"
  on public.employee_attendance for insert
  with check (user_id = auth.uid());

create policy "Employees update own attendance"
  on public.employee_attendance for update
  using (user_id = auth.uid() or public.current_user_role() = 'admin');

-- Student attendance policies (guru & admin)
create policy "Admin and guru view student attendance"
  on public.student_attendance for select
  using (public.current_user_role() in ('admin', 'guru'));

create policy "Admin and guru manage student attendance"
  on public.student_attendance for all
  using (public.current_user_role() in ('admin', 'guru'));
