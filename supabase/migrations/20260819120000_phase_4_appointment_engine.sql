create extension if not exists btree_gist;

do $$
begin
  create type public.appointment_status as enum (
    'pending',
    'confirmed',
    'waiting',
    'cancelled',
    'no_show',
    'completed',
    'rescheduled'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.appointment_source as enum ('internal', 'public_booking', 'imported');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  patient_id uuid not null,
  professional_id uuid not null,
  service_id uuid not null,
  status public.appointment_status not null default 'pending',
  source public.appointment_source not null default 'internal',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  title text,
  cancellation_reason text,
  cancelled_at timestamptz,
  rescheduled_from_id uuid references public.appointments(id) on delete set null,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  updated_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_time_range_check check (
    starts_at < ends_at
    and ends_at <= starts_at + interval '1 day'
  ),
  constraint appointments_id_clinic_unique unique (id, clinic_id),
  constraint appointments_patient_fk
    foreign key (patient_id, clinic_id)
    references public.patients(id, clinic_id)
    on delete restrict,
  constraint appointments_professional_fk
    foreign key (professional_id, clinic_id)
    references public.professionals(id, clinic_id)
    on delete restrict,
  constraint appointments_service_fk
    foreign key (service_id, clinic_id)
    references public.services(id, clinic_id)
    on delete restrict
);

comment on column public.appointments.starts_at is
  'Store appointment timestamps as timestamptz. Display them in the clinic timezone.';
comment on column public.appointments.cancellation_reason is
  'Operational cancellation reason only. Do not store sensitive clinical information.';

create table if not exists public.appointment_resources (
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  appointment_id uuid not null,
  resource_id uuid not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.appointment_status not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (clinic_id, appointment_id, resource_id),
  constraint appointment_resources_time_range_check check (starts_at < ends_at),
  constraint appointment_resources_appointment_fk
    foreign key (appointment_id, clinic_id)
    references public.appointments(id, clinic_id)
    on delete cascade,
  constraint appointment_resources_resource_fk
    foreign key (resource_id, clinic_id)
    references public.resources(id, clinic_id)
    on delete restrict
);

create table if not exists public.appointment_status_history (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  appointment_id uuid not null,
  previous_status public.appointment_status,
  new_status public.appointment_status not null,
  changed_by uuid references auth.users(id) on delete set null,
  reason text,
  created_at timestamptz not null default now(),
  constraint appointment_status_history_appointment_fk
    foreign key (appointment_id, clinic_id)
    references public.appointments(id, clinic_id)
    on delete cascade
);

create table if not exists public.appointment_notes (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  appointment_id uuid not null,
  author_user_id uuid default auth.uid() references auth.users(id) on delete set null,
  body text not null check (length(trim(body)) > 0),
  is_internal boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointment_notes_appointment_fk
    foreign key (appointment_id, clinic_id)
    references public.appointments(id, clinic_id)
    on delete cascade
);

comment on column public.appointment_notes.body is
  'Operational appointment notes only. Do not store sensitive clinical history in the MVP.';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'appointments_no_professional_overlap'
      and conrelid = 'public.appointments'::regclass
  ) then
    alter table public.appointments
      add constraint appointments_no_professional_overlap
      exclude using gist (
        clinic_id with =,
        professional_id with =,
        tstzrange(starts_at, ends_at, '[)') with &&
      )
      where (status in ('pending', 'confirmed', 'waiting'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'appointment_resources_no_resource_overlap'
      and conrelid = 'public.appointment_resources'::regclass
  ) then
    alter table public.appointment_resources
      add constraint appointment_resources_no_resource_overlap
      exclude using gist (
        clinic_id with =,
        resource_id with =,
        tstzrange(starts_at, ends_at, '[)') with &&
      )
      where (status in ('pending', 'confirmed', 'waiting'));
  end if;
end $$;

create index if not exists appointments_clinic_starts_at_idx on public.appointments (clinic_id, starts_at);
create index if not exists appointments_clinic_status_idx on public.appointments (clinic_id, status);
create index if not exists appointments_professional_range_idx
  on public.appointments (clinic_id, professional_id, starts_at, ends_at);
create index if not exists appointments_patient_starts_at_idx
  on public.appointments (clinic_id, patient_id, starts_at desc);
create index if not exists appointment_resources_resource_range_idx
  on public.appointment_resources (clinic_id, resource_id, starts_at, ends_at);
create index if not exists appointment_status_history_appointment_created_idx
  on public.appointment_status_history (clinic_id, appointment_id, created_at desc);
create index if not exists appointment_notes_appointment_created_idx
  on public.appointment_notes (clinic_id, appointment_id, created_at desc);

create or replace function public.set_appointment_status_metadata()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by = coalesce(new.created_by, auth.uid());
    new.updated_by = coalesce(new.updated_by, new.created_by, auth.uid());
  else
    new.updated_by = coalesce(auth.uid(), new.updated_by);
  end if;

  if new.status = 'cancelled' then
    new.cancelled_at = coalesce(new.cancelled_at, now());
  else
    new.cancelled_at = null;
  end if;

  return new;
end;
$$;

drop trigger if exists appointments_set_status_metadata on public.appointments;
create trigger appointments_set_status_metadata
  before insert or update on public.appointments
  for each row
  execute function public.set_appointment_status_metadata();

drop trigger if exists appointments_touch_updated_at on public.appointments;
create trigger appointments_touch_updated_at
  before update on public.appointments
  for each row
  execute function public.touch_updated_at();

drop trigger if exists appointment_resources_touch_updated_at on public.appointment_resources;
create trigger appointment_resources_touch_updated_at
  before update on public.appointment_resources
  for each row
  execute function public.touch_updated_at();

drop trigger if exists appointment_notes_touch_updated_at on public.appointment_notes;
create trigger appointment_notes_touch_updated_at
  before update on public.appointment_notes
  for each row
  execute function public.touch_updated_at();

create or replace function public.sync_appointment_resource_schedule()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  appointment_record record;
begin
  select clinic_id, starts_at, ends_at, status
  into appointment_record
  from public.appointments
  where id = new.appointment_id;

  if not found then
    raise exception 'Appointment % does not exist', new.appointment_id;
  end if;

  if appointment_record.clinic_id <> new.clinic_id then
    raise exception 'Appointment resource clinic mismatch';
  end if;

  new.starts_at = appointment_record.starts_at;
  new.ends_at = appointment_record.ends_at;
  new.status = appointment_record.status;

  return new;
end;
$$;

drop trigger if exists appointment_resources_sync_schedule on public.appointment_resources;
create trigger appointment_resources_sync_schedule
  before insert or update of appointment_id, clinic_id, resource_id on public.appointment_resources
  for each row
  execute function public.sync_appointment_resource_schedule();

create or replace function public.propagate_appointment_resource_schedule()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.appointment_resources
  set
    starts_at = new.starts_at,
    ends_at = new.ends_at,
    status = new.status,
    updated_at = now()
  where appointment_id = new.id;

  return new;
end;
$$;

drop trigger if exists appointments_propagate_resource_schedule on public.appointments;
create trigger appointments_propagate_resource_schedule
  after update of starts_at, ends_at, status on public.appointments
  for each row
  execute function public.propagate_appointment_resource_schedule();

create or replace function public.record_appointment_status_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.appointment_status_history (
      clinic_id,
      appointment_id,
      previous_status,
      new_status,
      changed_by,
      reason
    )
    values (
      new.clinic_id,
      new.id,
      null,
      new.status,
      coalesce(new.updated_by, new.created_by, auth.uid()),
      null
    );

    return new;
  end if;

  if old.status is distinct from new.status then
    insert into public.appointment_status_history (
      clinic_id,
      appointment_id,
      previous_status,
      new_status,
      changed_by,
      reason
    )
    values (
      new.clinic_id,
      new.id,
      old.status,
      new.status,
      coalesce(new.updated_by, auth.uid()),
      case when new.status = 'cancelled' then new.cancellation_reason else null end
    );
  end if;

  return new;
end;
$$;

drop trigger if exists appointments_record_status_history_insert on public.appointments;
create trigger appointments_record_status_history_insert
  after insert on public.appointments
  for each row
  execute function public.record_appointment_status_history();

drop trigger if exists appointments_record_status_history_update on public.appointments;
create trigger appointments_record_status_history_update
  after update of status on public.appointments
  for each row
  execute function public.record_appointment_status_history();

create or replace function public.log_appointment_audit_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  audit_action text;
begin
  if tg_op = 'INSERT' then
    audit_action = 'appointment.created';
  elsif tg_op = 'UPDATE' then
    if old.status is distinct from new.status and new.status = 'cancelled' then
      audit_action = 'appointment.cancelled';
    elsif old.status is distinct from new.status then
      audit_action = 'appointment.status_changed';
    elsif old.starts_at is distinct from new.starts_at
      or old.ends_at is distinct from new.ends_at
      or old.patient_id is distinct from new.patient_id
      or old.professional_id is distinct from new.professional_id
      or old.service_id is distinct from new.service_id then
      audit_action = 'appointment.updated';
    else
      return new;
    end if;
  end if;

  insert into public.audit_logs (
    clinic_id,
    actor_user_id,
    action,
    target_table,
    target_id,
    metadata
  )
  values (
    new.clinic_id,
    coalesce(new.updated_by, new.created_by, auth.uid()),
    audit_action,
    'appointments',
    new.id,
    jsonb_build_object(
      'previous_status', case when tg_op = 'UPDATE' then old.status else null end,
      'new_status', new.status,
      'starts_at', new.starts_at,
      'ends_at', new.ends_at
    )
  );

  return new;
end;
$$;

drop trigger if exists appointments_log_audit_insert on public.appointments;
create trigger appointments_log_audit_insert
  after insert on public.appointments
  for each row
  execute function public.log_appointment_audit_event();

drop trigger if exists appointments_log_audit_update on public.appointments;
create trigger appointments_log_audit_update
  after update of status, starts_at, ends_at, patient_id, professional_id, service_id on public.appointments
  for each row
  execute function public.log_appointment_audit_event();

alter table public.appointments enable row level security;
alter table public.appointment_resources enable row level security;
alter table public.appointment_status_history enable row level security;
alter table public.appointment_notes enable row level security;

drop policy if exists appointments_select_member on public.appointments;
create policy appointments_select_member
  on public.appointments
  for select
  to authenticated
  using (
    public.current_user_is_superadmin()
    or public.current_user_has_clinic_role(clinic_id)
  );

drop policy if exists appointments_insert_scheduler on public.appointments;
create policy appointments_insert_scheduler
  on public.appointments
  for insert
  to authenticated
  with check (
    public.current_user_is_superadmin()
    or public.current_user_has_clinic_role(
      clinic_id,
      array['clinic_admin', 'reception']::public.clinic_role[]
    )
  );

drop policy if exists appointments_update_scheduler on public.appointments;
create policy appointments_update_scheduler
  on public.appointments
  for update
  to authenticated
  using (
    public.current_user_is_superadmin()
    or public.current_user_has_clinic_role(
      clinic_id,
      array['clinic_admin', 'reception']::public.clinic_role[]
    )
  )
  with check (
    public.current_user_is_superadmin()
    or public.current_user_has_clinic_role(
      clinic_id,
      array['clinic_admin', 'reception']::public.clinic_role[]
    )
  );

drop policy if exists appointment_resources_select_member on public.appointment_resources;
create policy appointment_resources_select_member
  on public.appointment_resources
  for select
  to authenticated
  using (
    public.current_user_is_superadmin()
    or public.current_user_has_clinic_role(clinic_id)
  );

drop policy if exists appointment_resources_manage_scheduler on public.appointment_resources;
create policy appointment_resources_manage_scheduler
  on public.appointment_resources
  for all
  to authenticated
  using (
    public.current_user_is_superadmin()
    or public.current_user_has_clinic_role(
      clinic_id,
      array['clinic_admin', 'reception']::public.clinic_role[]
    )
  )
  with check (
    public.current_user_is_superadmin()
    or public.current_user_has_clinic_role(
      clinic_id,
      array['clinic_admin', 'reception']::public.clinic_role[]
    )
  );

drop policy if exists appointment_status_history_select_member on public.appointment_status_history;
create policy appointment_status_history_select_member
  on public.appointment_status_history
  for select
  to authenticated
  using (
    public.current_user_is_superadmin()
    or public.current_user_has_clinic_role(clinic_id)
  );

drop policy if exists appointment_notes_select_member on public.appointment_notes;
create policy appointment_notes_select_member
  on public.appointment_notes
  for select
  to authenticated
  using (
    public.current_user_is_superadmin()
    or public.current_user_has_clinic_role(clinic_id)
  );

drop policy if exists appointment_notes_insert_staff on public.appointment_notes;
create policy appointment_notes_insert_staff
  on public.appointment_notes
  for insert
  to authenticated
  with check (
    public.current_user_is_superadmin()
    or public.current_user_has_clinic_role(
      clinic_id,
      array['clinic_admin', 'reception', 'professional']::public.clinic_role[]
    )
  );

drop policy if exists appointment_notes_update_staff on public.appointment_notes;
create policy appointment_notes_update_staff
  on public.appointment_notes
  for update
  to authenticated
  using (
    public.current_user_is_superadmin()
    or public.current_user_has_clinic_role(
      clinic_id,
      array['clinic_admin', 'reception', 'professional']::public.clinic_role[]
    )
  )
  with check (
    public.current_user_is_superadmin()
    or public.current_user_has_clinic_role(
      clinic_id,
      array['clinic_admin', 'reception', 'professional']::public.clinic_role[]
    )
  );

drop policy if exists appointment_notes_delete_admin on public.appointment_notes;
create policy appointment_notes_delete_admin
  on public.appointment_notes
  for delete
  to authenticated
  using (
    public.current_user_is_superadmin()
    or public.current_user_has_clinic_role(clinic_id, array['clinic_admin']::public.clinic_role[])
  );

revoke all on table public.appointments from anon, authenticated;
revoke all on table public.appointment_resources from anon, authenticated;
revoke all on table public.appointment_status_history from anon, authenticated;
revoke all on table public.appointment_notes from anon, authenticated;

grant usage on type public.appointment_status to authenticated, service_role;
grant usage on type public.appointment_source to authenticated, service_role;

grant select, insert, update on public.appointments to authenticated;
grant select, insert, update, delete on public.appointment_resources to authenticated;
grant select on public.appointment_status_history to authenticated;
grant select, insert, update, delete on public.appointment_notes to authenticated;

grant all on public.appointments to service_role;
grant all on public.appointment_resources to service_role;
grant all on public.appointment_status_history to service_role;
grant all on public.appointment_notes to service_role;

revoke all on function public.set_appointment_status_metadata() from public, anon, authenticated;
revoke all on function public.sync_appointment_resource_schedule() from public, anon, authenticated;
revoke all on function public.propagate_appointment_resource_schedule() from public, anon, authenticated;
revoke all on function public.record_appointment_status_history() from public, anon, authenticated;
revoke all on function public.log_appointment_audit_event() from public, anon, authenticated;

grant execute on function public.set_appointment_status_metadata() to service_role;
grant execute on function public.sync_appointment_resource_schedule() to service_role;
grant execute on function public.propagate_appointment_resource_schedule() to service_role;
grant execute on function public.record_appointment_status_history() to service_role;
grant execute on function public.log_appointment_audit_event() to service_role;
