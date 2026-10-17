-- FitFlow schema
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  role text not null default 'staff' check (role in ('admin','staff')),
  created_at timestamptz not null default now()
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  interval text not null check (interval in ('monthly','quarterly','annual')),
  price numeric(10,2) not null check (price >= 0),
  duration_days int not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  code text unique not null default ('GF-' || upper(substr(md5(random()::text), 1, 6))),
  full_name text not null,
  email text,
  phone text,
  photo_url text,
  plan_id uuid references public.plans(id) on delete set null,
  status text not null default 'active' check (status in ('active','expired','paused','cancelled')),
  archived boolean not null default false,
  join_date date not null default current_date,
  renewal_date date,
  created_at timestamptz not null default now()
);

create table public.member_notes (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  staff_id uuid references public.profiles(id) on delete set null,
  staff_name text,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  amount numeric(10,2) not null,
  method text not null default 'cash' check (method in ('cash','card','bank_transfer','stripe_sim','other')),
  status text not null default 'paid' check (status in ('paid','pending','failed')),
  due_date date not null default current_date,
  paid_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  method text not null default 'manual' check (method in ('manual','qr'))
);

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references public.profiles(id) on delete set null,
  staff_name text,
  action text not null,
  entity text not null,
  entity_id text,
  detail text,
  created_at timestamptz not null default now()
);

create index on public.attendance (member_id, checked_in_at desc);
create index on public.attendance (checked_in_at desc);
create index on public.payments (member_id, created_at desc);
create index on public.members (renewal_date);

-- helper + new-user trigger (first user becomes admin)
create or replace function public.is_admin() returns boolean
language sql security definer stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    case when exists (select 1 from public.profiles) then 'staff' else 'admin' end
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- Row level security: signed-in staff can work with gym data; admin-only writes where noted
alter table public.profiles enable row level security;
alter table public.plans enable row level security;
alter table public.members enable row level security;
alter table public.member_notes enable row level security;
alter table public.payments enable row level security;
alter table public.attendance enable row level security;
alter table public.activity_log enable row level security;

create policy "read profiles" on public.profiles for select to authenticated using (true);
create policy "admin updates profiles" on public.profiles for update to authenticated using (public.is_admin());
create policy "read plans" on public.plans for select to authenticated using (true);
create policy "admin writes plans" on public.plans for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "staff members" on public.members for all to authenticated using (true) with check (true);
create policy "staff notes" on public.member_notes for all to authenticated using (true) with check (true);
create policy "staff payments" on public.payments for all to authenticated using (true) with check (true);
create policy "staff attendance" on public.attendance for all to authenticated using (true) with check (true);
create policy "staff add log" on public.activity_log for insert to authenticated with check (true);
create policy "admin reads log" on public.activity_log for select to authenticated using (public.is_admin());
