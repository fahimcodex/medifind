-- MediFind schema. Run once in Supabase Dashboard > SQL Editor.

-- ========== TYPES ==========
create type user_role as enum ('patient', 'pharmacy', 'admin');

-- ========== TABLES ==========
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role user_role not null default 'patient',
  created_at timestamptz not null default now()
);

create table public.medicines (
  id uuid primary key default gen_random_uuid(),
  generic_name text not null,
  brand_name text not null,
  strength text,
  form text,
  category text,
  description text,
  created_at timestamptz not null default now()
);

create table public.pharmacies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade, -- null = seeded demo pharmacy
  name text not null,
  address text,
  phone text,
  opening_hours text,
  latitude double precision,
  longitude double precision,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'suspended')),
  created_at timestamptz not null default now()
);

create table public.inventory (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null references public.pharmacies(id) on delete cascade,
  medicine_id uuid not null references public.medicines(id) on delete cascade,
  quantity int not null default 0 check (quantity >= 0),
  low_stock_threshold int not null default 10 check (low_stock_threshold >= 0),
  batch_no text,
  expiry_date date,
  updated_at timestamptz not null default now(),
  unique (pharmacy_id, medicine_id, batch_no)
);

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  pharmacy_id uuid not null references public.pharmacies(id) on delete cascade,
  medicine_id uuid not null references public.medicines(id) on delete cascade,
  quantity int not null check (quantity > 0),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'rejected', 'completed', 'cancelled', 'expired')),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.medicines (generic_name);
create index on public.medicines (brand_name);
create index on public.inventory (medicine_id);
create index on public.inventory (pharmacy_id);
create index on public.reservations (patient_id);
create index on public.reservations (pharmacy_id);

-- ========== HELPER: current user's role ==========
create or replace function public.get_my_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ========== AUTO-CREATE PROFILE ON SIGNUP ==========
-- Only 'patient' or 'pharmacy' can be chosen at signup. Admins are set manually.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    case when new.raw_user_meta_data->>'role' = 'pharmacy'
         then 'pharmacy'::user_role
         else 'patient'::user_role end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ========== ONLY ADMINS CAN CHANGE PHARMACY STATUS ==========
create or replace function public.protect_pharmacy_status()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status and public.get_my_role() <> 'admin' then
    raise exception 'Only admins can change pharmacy status';
  end if;
  return new;
end;
$$;

create trigger protect_status
  before update on public.pharmacies
  for each row execute function public.protect_pharmacy_status();

-- ========== ROW LEVEL SECURITY ==========
alter table public.profiles enable row level security;
alter table public.medicines enable row level security;
alter table public.pharmacies enable row level security;
alter table public.inventory enable row level security;
alter table public.reservations enable row level security;

-- profiles: read own (or all if admin); users may edit only their name (role is locked)
create policy "profiles_select" on public.profiles for select
  using (id = auth.uid() or public.get_my_role() = 'admin');
create policy "profiles_update_own" on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

-- medicines: anyone can read; only admins manage the catalog
create policy "medicines_read" on public.medicines for select using (true);
create policy "medicines_admin_write" on public.medicines for all
  using (public.get_my_role() = 'admin') with check (public.get_my_role() = 'admin');

-- pharmacies: public sees approved; owners see their own; admins see all
create policy "pharmacies_select" on public.pharmacies for select
  using (status = 'approved' or owner_id = auth.uid() or public.get_my_role() = 'admin');
create policy "pharmacies_insert_owner" on public.pharmacies for insert
  with check (owner_id = auth.uid() and public.get_my_role() = 'pharmacy');
create policy "pharmacies_update" on public.pharmacies for update
  using (owner_id = auth.uid() or public.get_my_role() = 'admin');

-- inventory: public sees stock of approved pharmacies; owners manage their own
create policy "inventory_select" on public.inventory for select
  using (
    exists (select 1 from public.pharmacies p
            where p.id = pharmacy_id
              and (p.status = 'approved' or p.owner_id = auth.uid()))
    or public.get_my_role() = 'admin'
  );
create policy "inventory_owner_write" on public.inventory for all
  using (
    exists (select 1 from public.pharmacies p
            where p.id = pharmacy_id and p.owner_id = auth.uid())
    or public.get_my_role() = 'admin'
  )
  with check (
    exists (select 1 from public.pharmacies p
            where p.id = pharmacy_id and p.owner_id = auth.uid())
    or public.get_my_role() = 'admin'
  );

-- reservations: patient sees own; pharmacy sees its own queue; admin sees all
create policy "reservations_select" on public.reservations for select
  using (
    patient_id = auth.uid()
    or exists (select 1 from public.pharmacies p
               where p.id = pharmacy_id and p.owner_id = auth.uid())
    or public.get_my_role() = 'admin'
  );
create policy "reservations_insert_patient" on public.reservations for insert
  with check (patient_id = auth.uid() and public.get_my_role() = 'patient');
create policy "reservations_update" on public.reservations for update
  using (
    patient_id = auth.uid()
    or exists (select 1 from public.pharmacies p
               where p.id = pharmacy_id and p.owner_id = auth.uid())
    or public.get_my_role() = 'admin'
  );
