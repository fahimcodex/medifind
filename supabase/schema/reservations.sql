-- MediFind reservations logic. Run AFTER schema.sql and seed.sql, in Supabase SQL Editor.
-- Rules:
--   * Patients create reservations through create_reservation() (stock is checked inside).
--   * Available = usable stock (not expired) minus quantity held by pending/confirmed reservations.
--   * Stock is deducted when the pharmacy marks a reservation "completed" (picked up).
--   * Cancelled / rejected / expired reservations need no stock restore.
--   * Reservations expire after 24 hours (expires_at default) via expire_reservations().

-- ========== EXPIRE OLD RESERVATIONS ==========
create or replace function public.expire_reservations()
returns void
language sql
security definer
set search_path = public
as $$
  update public.reservations
     set status = 'expired', updated_at = now()
   where status in ('pending', 'confirmed')
     and expires_at <= now();
$$;

-- ========== CREATE RESERVATION ==========
create or replace function public.create_reservation(
  p_pharmacy_id uuid,
  p_medicine_id uuid,
  p_quantity int
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stock int;
  v_held int;
  v_id uuid;
begin
  if auth.uid() is null or public.get_my_role() is distinct from 'patient' then
    raise exception 'Only patients can create reservations';
  end if;
  if p_quantity is null or p_quantity < 1 then
    raise exception 'Quantity must be at least 1';
  end if;

  perform public.expire_reservations();

  -- lock the pharmacy row so two simultaneous reservations cannot oversell
  perform 1 from public.pharmacies
   where id = p_pharmacy_id and status = 'approved'
   for update;
  if not found then
    raise exception 'Pharmacy is not available';
  end if;

  select coalesce(sum(quantity), 0) into v_stock
    from public.inventory
   where pharmacy_id = p_pharmacy_id
     and medicine_id = p_medicine_id
     and (expiry_date is null or expiry_date >= current_date);

  select coalesce(sum(quantity), 0) into v_held
    from public.reservations
   where pharmacy_id = p_pharmacy_id
     and medicine_id = p_medicine_id
     and status in ('pending', 'confirmed')
     and expires_at > now();

  if v_stock - v_held < p_quantity then
    raise exception 'Not enough stock available';
  end if;

  insert into public.reservations (patient_id, pharmacy_id, medicine_id, quantity)
  values (auth.uid(), p_pharmacy_id, p_medicine_id, p_quantity)
  returning id into v_id;

  return v_id;
end;
$$;

-- ========== CHANGE RESERVATION STATUS ==========
-- pharmacy owner / admin: pending -> confirmed | rejected, confirmed -> completed
-- patient: pending | confirmed -> cancelled
create or replace function public.update_reservation_status(
  p_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.reservations%rowtype;
  v_role user_role;
  v_is_owner boolean;
  v_left int;
  b record;
begin
  perform public.expire_reservations();

  select * into r from public.reservations where id = p_id for update;
  if not found then
    raise exception 'Reservation not found';
  end if;

  v_role := public.get_my_role();
  v_is_owner := exists (
    select 1 from public.pharmacies
     where id = r.pharmacy_id and owner_id = auth.uid()
  );

  if p_status in ('confirmed', 'rejected') and r.status = 'pending'
     and (v_is_owner or v_role = 'admin') then
    null;

  elsif p_status = 'completed' and r.status = 'confirmed'
        and (v_is_owner or v_role = 'admin') then
    v_left := r.quantity;
    for b in
      select id, quantity from public.inventory
       where pharmacy_id = r.pharmacy_id
         and medicine_id = r.medicine_id
         and quantity > 0
         and (expiry_date is null or expiry_date >= current_date)
       order by expiry_date nulls last
       for update
    loop
      exit when v_left <= 0;
      update public.inventory
         set quantity = quantity - least(b.quantity, v_left), updated_at = now()
       where id = b.id;
      v_left := v_left - least(b.quantity, v_left);
    end loop;
    if v_left > 0 then
      raise exception 'Not enough stock to complete this reservation';
    end if;

  elsif p_status = 'cancelled' and r.status in ('pending', 'confirmed')
        and r.patient_id = auth.uid() then
    null;

  else
    raise exception 'This status change is not allowed';
  end if;

  update public.reservations
     set status = p_status, updated_at = now()
   where id = p_id;
end;
$$;

grant execute on function public.expire_reservations() to authenticated;
grant execute on function public.create_reservation(uuid, uuid, int) to authenticated;
grant execute on function public.update_reservation_status(uuid, text) to authenticated;

-- ========== FORCE ALL CHANGES THROUGH THE FUNCTIONS ==========
revoke insert, update on public.reservations from authenticated;

-- ========== PHARMACY OWNERS CAN SEE THE NAMES OF THEIR PATIENTS ==========
create policy "profiles_pharmacy_reads_patients" on public.profiles for select
  using (
    exists (
      select 1
        from public.reservations r
        join public.pharmacies p on p.id = r.pharmacy_id
       where r.patient_id = profiles.id
         and p.owner_id = auth.uid()
    )
  );
