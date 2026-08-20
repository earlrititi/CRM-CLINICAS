drop policy if exists clinics_select_public_booking on public.clinics;
create policy clinics_select_public_booking
  on public.clinics
  for select
  to anon
  using (status in ('active', 'trialing'));

drop policy if exists services_select_public_booking on public.services;
create policy services_select_public_booking
  on public.services
  for select
  to anon
  using (
    status = 'active'
    and exists (
      select 1
      from public.clinics c
      where c.id = services.clinic_id
        and c.status in ('active', 'trialing')
    )
  );

drop policy if exists professionals_select_public_booking on public.professionals;
create policy professionals_select_public_booking
  on public.professionals
  for select
  to anon
  using (
    status = 'active'
    and exists (
      select 1
      from public.clinics c
      where c.id = professionals.clinic_id
        and c.status in ('active', 'trialing')
    )
  );

drop policy if exists professional_services_select_public_booking on public.professional_services;
create policy professional_services_select_public_booking
  on public.professional_services
  for select
  to anon
  using (
    is_active
    and exists (
      select 1
      from public.clinics c
      where c.id = professional_services.clinic_id
        and c.status in ('active', 'trialing')
    )
  );

grant usage on schema public to anon;
grant usage on type public.clinic_status to anon;
grant usage on type public.core_record_status to anon;

grant select (id, name, slug, timezone, status, phone, email, address)
  on public.clinics to anon;
grant select (id, clinic_id, name, description, duration_minutes, price_cents, currency, category, color, icon, status)
  on public.services to anon;
grant select (id, clinic_id, full_name, specialty, calendar_color, status)
  on public.professionals to anon;
grant select (clinic_id, professional_id, service_id, is_active)
  on public.professional_services to anon;

create or replace function public.get_public_available_slots(
  booking_clinic_slug text,
  target_date date,
  target_service_id uuid,
  target_professional_id uuid default null
)
returns table (
  starts_at timestamptz,
  ends_at timestamptz,
  professional_id uuid,
  professional_name text
)
language sql
stable
security definer
set search_path = public
as $$
  with public_clinic as (
    select id, timezone
    from public.clinics
    where slug = booking_clinic_slug
      and status in ('active', 'trialing')
    limit 1
  ),
  public_service as (
    select
      s.id,
      s.clinic_id,
      s.duration_minutes,
      s.preparation_minutes,
      s.recovery_minutes
    from public.services s
    join public_clinic c on c.id = s.clinic_id
    where s.id = target_service_id
      and s.status = 'active'
    limit 1
  ),
  eligible_professionals as (
    select p.id, p.full_name, p.clinic_id
    from public.professionals p
    join public.professional_services ps
      on ps.professional_id = p.id
      and ps.clinic_id = p.clinic_id
    join public_service s
      on s.id = ps.service_id
      and s.clinic_id = ps.clinic_id
    where p.status = 'active'
      and ps.is_active
      and (target_professional_id is null or p.id = target_professional_id)
  ),
  working_windows as (
    select
      c.id as clinic_id,
      c.timezone,
      s.duration_minutes,
      s.preparation_minutes,
      s.recovery_minutes,
      p.id as professional_id,
      p.full_name as professional_name,
      ((target_date + wh.starts_at) at time zone c.timezone) as window_start,
      ((target_date + wh.ends_at) at time zone c.timezone) as window_end
    from public_clinic c
    join public_service s on s.clinic_id = c.id
    join eligible_professionals p on p.clinic_id = c.id
    join public.working_hours wh
      on wh.clinic_id = c.id
      and wh.professional_id = p.id
      and wh.weekday = extract(isodow from target_date)::smallint
      and wh.is_active
  ),
  candidate_slots as (
    select
      ww.clinic_id,
      ww.professional_id,
      ww.professional_name,
      slot_start,
      slot_start + make_interval(mins => ww.duration_minutes) as slot_end,
      slot_start - make_interval(mins => ww.preparation_minutes) as blocked_start,
      slot_start + make_interval(mins => ww.duration_minutes + ww.recovery_minutes) as blocked_end
    from working_windows ww
    cross join lateral generate_series(
      ww.window_start + make_interval(mins => ww.preparation_minutes),
      ww.window_end - make_interval(mins => ww.duration_minutes + ww.recovery_minutes),
      interval '15 minutes'
    ) as slots(slot_start)
  )
  select
    cs.slot_start,
    cs.slot_end,
    cs.professional_id,
    cs.professional_name
  from candidate_slots cs
  where cs.slot_start > now()
    and not exists (
      select 1
      from public.schedule_exceptions se
      where se.clinic_id = cs.clinic_id
        and (se.professional_id = cs.professional_id or se.professional_id is null)
        and se.type in ('unavailable', 'vacation', 'manual_block')
        and tstzrange(se.starts_at, se.ends_at, '[)') && tstzrange(cs.blocked_start, cs.blocked_end, '[)')
    )
    and not exists (
      select 1
      from public.appointments a
      join public.services existing_service
        on existing_service.id = a.service_id
        and existing_service.clinic_id = a.clinic_id
      where a.clinic_id = cs.clinic_id
        and a.professional_id = cs.professional_id
        and a.status in ('pending', 'confirmed', 'waiting')
        and tstzrange(
          a.starts_at - make_interval(mins => existing_service.preparation_minutes),
          a.ends_at + make_interval(mins => existing_service.recovery_minutes),
          '[)'
        ) && tstzrange(cs.blocked_start, cs.blocked_end, '[)')
    )
  order by cs.slot_start, cs.professional_name
  limit 96;
$$;

create or replace function public.create_public_booking(
  booking_clinic_slug text,
  booking_date date,
  booking_service_id uuid,
  booking_professional_id uuid,
  booking_starts_at timestamptz,
  patient_first_name text,
  patient_last_name text,
  patient_email text default null,
  patient_phone text default null,
  communications_consent boolean default false,
  website text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  available_slot record;
  new_patient_id uuid;
  new_appointment_id uuid;
  clean_email text;
  clean_phone text;
begin
  if length(trim(coalesce(website, ''))) > 0 then
    raise exception 'Invalid booking request';
  end if;

  clean_email = nullif(lower(trim(coalesce(patient_email, ''))), '');
  clean_phone = nullif(trim(coalesce(patient_phone, '')), '');

  if length(trim(coalesce(patient_first_name, ''))) = 0
    or length(trim(coalesce(patient_last_name, ''))) = 0 then
    raise exception 'Patient name is required';
  end if;

  if clean_email is null and clean_phone is null then
    raise exception 'Email or phone is required';
  end if;

  select *
  into available_slot
  from public.get_public_available_slots(
    booking_clinic_slug,
    booking_date,
    booking_service_id,
    booking_professional_id
  ) slot
  where slot.starts_at = booking_starts_at
  order by slot.professional_name
  limit 1;

  if not found then
    raise exception 'Selected slot is not available';
  end if;

  insert into public.patients (
    clinic_id,
    first_name,
    last_name,
    phone,
    email,
    communications_consent,
    contact_preference
  )
  select
    c.id,
    trim(patient_first_name),
    trim(patient_last_name),
    clean_phone,
    clean_email,
    communications_consent,
    case
      when clean_email is not null then 'email'::public.contact_preference
      when clean_phone is not null then 'phone'::public.contact_preference
      else 'none'::public.contact_preference
    end
  from public.clinics c
  where c.slug = booking_clinic_slug
    and c.status in ('active', 'trialing')
  returning id into new_patient_id;

  if new_patient_id is null then
    raise exception 'Clinic is not available for booking';
  end if;

  insert into public.appointments (
    clinic_id,
    patient_id,
    professional_id,
    service_id,
    status,
    source,
    starts_at,
    ends_at
  )
  select
    c.id,
    new_patient_id,
    available_slot.professional_id,
    booking_service_id,
    'pending'::public.appointment_status,
    'public_booking'::public.appointment_source,
    available_slot.starts_at,
    available_slot.ends_at
  from public.clinics c
  where c.slug = booking_clinic_slug
    and c.status in ('active', 'trialing')
  returning id into new_appointment_id;

  return new_appointment_id;
end;
$$;

revoke all on function public.get_public_available_slots(text, date, uuid, uuid) from public;
revoke all on function public.create_public_booking(text, date, uuid, uuid, timestamptz, text, text, text, text, boolean, text) from public;

grant execute on function public.get_public_available_slots(text, date, uuid, uuid) to anon, authenticated, service_role;
grant execute on function public.create_public_booking(text, date, uuid, uuid, timestamptz, text, text, text, text, boolean, text) to anon, authenticated, service_role;
