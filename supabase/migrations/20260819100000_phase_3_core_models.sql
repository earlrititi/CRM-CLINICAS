do $$
begin
  create type public.core_record_status as enum ('active', 'inactive');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.contact_preference as enum ('email', 'phone', 'sms', 'whatsapp', 'none');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.schedule_exception_type as enum ('available', 'unavailable', 'vacation', 'manual_block');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.resource_type as enum ('room', 'booth', 'equipment', 'chair', 'machine', 'other');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  first_name text not null check (length(trim(first_name)) > 0),
  last_name text not null check (length(trim(last_name)) > 0),
  phone text,
  email text,
  birth_date date,
  identity_document text,
  internal_notes text,
  tags text[] not null default '{}',
  status public.core_record_status not null default 'active',
  communications_consent boolean not null default false,
  contact_preference public.contact_preference not null default 'none',
  registered_at date not null default current_date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint patients_id_clinic_unique unique (id, clinic_id)
);

comment on column public.patients.internal_notes is
  'Operational notes only. Do not store sensitive clinical history in the MVP.';

create table if not exists public.professionals (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  full_name text not null check (length(trim(full_name)) > 0),
  specialty text,
  email text,
  phone text,
  calendar_color text not null default '#0f766e' check (calendar_color ~ '^#[0-9A-Fa-f]{6}$'),
  status public.core_record_status not null default 'active',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint professionals_id_clinic_unique unique (id, clinic_id)
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  description text,
  duration_minutes integer not null check (duration_minutes > 0 and duration_minutes <= 1440),
  price_cents integer not null default 0 check (price_cents >= 0),
  currency text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  category text,
  preparation_minutes integer not null default 0 check (preparation_minutes >= 0 and preparation_minutes <= 1440),
  recovery_minutes integer not null default 0 check (recovery_minutes >= 0 and recovery_minutes <= 1440),
  color text check (color is null or color ~ '^#[0-9A-Fa-f]{6}$'),
  icon text,
  status public.core_record_status not null default 'active',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint services_id_clinic_unique unique (id, clinic_id)
);

create table if not exists public.professional_services (
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  professional_id uuid not null,
  service_id uuid not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (clinic_id, professional_id, service_id),
  constraint professional_services_professional_fk
    foreign key (professional_id, clinic_id)
    references public.professionals(id, clinic_id)
    on delete cascade,
  constraint professional_services_service_fk
    foreign key (service_id, clinic_id)
    references public.services(id, clinic_id)
    on delete cascade
);

create table if not exists public.working_hours (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  professional_id uuid not null,
  weekday smallint not null check (weekday between 1 and 7),
  starts_at time not null,
  ends_at time not null,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint working_hours_range_check check (starts_at < ends_at),
  constraint working_hours_professional_fk
    foreign key (professional_id, clinic_id)
    references public.professionals(id, clinic_id)
    on delete cascade
);

comment on column public.working_hours.weekday is
  'ISO weekday: 1 Monday through 7 Sunday.';

create table if not exists public.schedule_exceptions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  professional_id uuid,
  type public.schedule_exception_type not null default 'unavailable',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint schedule_exceptions_range_check check (starts_at < ends_at),
  constraint schedule_exceptions_professional_fk
    foreign key (professional_id, clinic_id)
    references public.professionals(id, clinic_id)
    on delete cascade
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  type public.resource_type not null default 'room',
  description text,
  status public.core_record_status not null default 'active',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resources_id_clinic_unique unique (id, clinic_id)
);

create index if not exists patients_clinic_status_idx on public.patients (clinic_id, status);
create index if not exists patients_clinic_name_idx on public.patients (clinic_id, last_name, first_name);
create index if not exists patients_clinic_email_idx on public.patients (clinic_id, lower(email)) where email is not null;
create index if not exists patients_clinic_phone_idx on public.patients (clinic_id, phone) where phone is not null;
create index if not exists professionals_clinic_status_idx on public.professionals (clinic_id, status);
create index if not exists professionals_clinic_name_idx on public.professionals (clinic_id, full_name);
create index if not exists services_clinic_status_idx on public.services (clinic_id, status);
create index if not exists services_clinic_category_idx on public.services (clinic_id, category) where category is not null;
create index if not exists professional_services_professional_idx
  on public.professional_services (clinic_id, professional_id);
create index if not exists professional_services_service_idx
  on public.professional_services (clinic_id, service_id);
create index if not exists working_hours_professional_weekday_idx
  on public.working_hours (clinic_id, professional_id, weekday)
  where is_active;
create index if not exists schedule_exceptions_professional_range_idx
  on public.schedule_exceptions (clinic_id, professional_id, starts_at, ends_at);
create index if not exists schedule_exceptions_clinic_range_idx
  on public.schedule_exceptions (clinic_id, starts_at, ends_at);
create index if not exists resources_clinic_status_idx on public.resources (clinic_id, status);

drop trigger if exists patients_touch_updated_at on public.patients;
create trigger patients_touch_updated_at
  before update on public.patients
  for each row
  execute function public.touch_updated_at();

drop trigger if exists professionals_touch_updated_at on public.professionals;
create trigger professionals_touch_updated_at
  before update on public.professionals
  for each row
  execute function public.touch_updated_at();

drop trigger if exists services_touch_updated_at on public.services;
create trigger services_touch_updated_at
  before update on public.services
  for each row
  execute function public.touch_updated_at();

drop trigger if exists professional_services_touch_updated_at on public.professional_services;
create trigger professional_services_touch_updated_at
  before update on public.professional_services
  for each row
  execute function public.touch_updated_at();

drop trigger if exists working_hours_touch_updated_at on public.working_hours;
create trigger working_hours_touch_updated_at
  before update on public.working_hours
  for each row
  execute function public.touch_updated_at();

drop trigger if exists schedule_exceptions_touch_updated_at on public.schedule_exceptions;
create trigger schedule_exceptions_touch_updated_at
  before update on public.schedule_exceptions
  for each row
  execute function public.touch_updated_at();

drop trigger if exists resources_touch_updated_at on public.resources;
create trigger resources_touch_updated_at
  before update on public.resources
  for each row
  execute function public.touch_updated_at();

alter table public.patients enable row level security;
alter table public.professionals enable row level security;
alter table public.services enable row level security;
alter table public.professional_services enable row level security;
alter table public.working_hours enable row level security;
alter table public.schedule_exceptions enable row level security;
alter table public.resources enable row level security;

drop policy if exists patients_select_member on public.patients;
create policy patients_select_member
  on public.patients
  for select
  to authenticated
  using (
    public.current_user_is_superadmin()
    or public.current_user_has_clinic_role(clinic_id)
  );

drop policy if exists patients_insert_staff on public.patients;
create policy patients_insert_staff
  on public.patients
  for insert
  to authenticated
  with check (
    public.current_user_is_superadmin()
    or public.current_user_has_clinic_role(
      clinic_id,
      array['clinic_admin', 'reception', 'professional']::public.clinic_role[]
    )
  );

drop policy if exists patients_update_staff on public.patients;
create policy patients_update_staff
  on public.patients
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

drop policy if exists patients_delete_admin on public.patients;
create policy patients_delete_admin
  on public.patients
  for delete
  to authenticated
  using (
    public.current_user_is_superadmin()
    or public.current_user_has_clinic_role(clinic_id, array['clinic_admin']::public.clinic_role[])
  );

drop policy if exists professionals_select_member on public.professionals;
create policy professionals_select_member
  on public.professionals
  for select
  to authenticated
  using (
    public.current_user_is_superadmin()
    or public.current_user_has_clinic_role(clinic_id)
  );

drop policy if exists professionals_manage_admin on public.professionals;
create policy professionals_manage_admin
  on public.professionals
  for all
  to authenticated
  using (
    public.current_user_is_superadmin()
    or public.current_user_has_clinic_role(clinic_id, array['clinic_admin']::public.clinic_role[])
  )
  with check (
    public.current_user_is_superadmin()
    or public.current_user_has_clinic_role(clinic_id, array['clinic_admin']::public.clinic_role[])
  );

drop policy if exists services_select_member on public.services;
create policy services_select_member
  on public.services
  for select
  to authenticated
  using (
    public.current_user_is_superadmin()
    or public.current_user_has_clinic_role(clinic_id)
  );

drop policy if exists services_manage_admin on public.services;
create policy services_manage_admin
  on public.services
  for all
  to authenticated
  using (
    public.current_user_is_superadmin()
    or public.current_user_has_clinic_role(clinic_id, array['clinic_admin']::public.clinic_role[])
  )
  with check (
    public.current_user_is_superadmin()
    or public.current_user_has_clinic_role(clinic_id, array['clinic_admin']::public.clinic_role[])
  );

drop policy if exists professional_services_select_member on public.professional_services;
create policy professional_services_select_member
  on public.professional_services
  for select
  to authenticated
  using (
    public.current_user_is_superadmin()
    or public.current_user_has_clinic_role(clinic_id)
  );

drop policy if exists professional_services_manage_admin on public.professional_services;
create policy professional_services_manage_admin
  on public.professional_services
  for all
  to authenticated
  using (
    public.current_user_is_superadmin()
    or public.current_user_has_clinic_role(clinic_id, array['clinic_admin']::public.clinic_role[])
  )
  with check (
    public.current_user_is_superadmin()
    or public.current_user_has_clinic_role(clinic_id, array['clinic_admin']::public.clinic_role[])
  );

drop policy if exists working_hours_select_member on public.working_hours;
create policy working_hours_select_member
  on public.working_hours
  for select
  to authenticated
  using (
    public.current_user_is_superadmin()
    or public.current_user_has_clinic_role(clinic_id)
  );

drop policy if exists working_hours_manage_staff on public.working_hours;
create policy working_hours_manage_staff
  on public.working_hours
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

drop policy if exists schedule_exceptions_select_member on public.schedule_exceptions;
create policy schedule_exceptions_select_member
  on public.schedule_exceptions
  for select
  to authenticated
  using (
    public.current_user_is_superadmin()
    or public.current_user_has_clinic_role(clinic_id)
  );

drop policy if exists schedule_exceptions_manage_staff on public.schedule_exceptions;
create policy schedule_exceptions_manage_staff
  on public.schedule_exceptions
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

drop policy if exists resources_select_member on public.resources;
create policy resources_select_member
  on public.resources
  for select
  to authenticated
  using (
    public.current_user_is_superadmin()
    or public.current_user_has_clinic_role(clinic_id)
  );

drop policy if exists resources_manage_admin on public.resources;
create policy resources_manage_admin
  on public.resources
  for all
  to authenticated
  using (
    public.current_user_is_superadmin()
    or public.current_user_has_clinic_role(clinic_id, array['clinic_admin']::public.clinic_role[])
  )
  with check (
    public.current_user_is_superadmin()
    or public.current_user_has_clinic_role(clinic_id, array['clinic_admin']::public.clinic_role[])
  );

revoke all on table public.patients from anon, authenticated;
revoke all on table public.professionals from anon, authenticated;
revoke all on table public.services from anon, authenticated;
revoke all on table public.professional_services from anon, authenticated;
revoke all on table public.working_hours from anon, authenticated;
revoke all on table public.schedule_exceptions from anon, authenticated;
revoke all on table public.resources from anon, authenticated;

grant usage on type public.core_record_status to authenticated, service_role;
grant usage on type public.contact_preference to authenticated, service_role;
grant usage on type public.schedule_exception_type to authenticated, service_role;
grant usage on type public.resource_type to authenticated, service_role;

grant select, insert, update, delete on public.patients to authenticated;
grant select, insert, update, delete on public.professionals to authenticated;
grant select, insert, update, delete on public.services to authenticated;
grant select, insert, update, delete on public.professional_services to authenticated;
grant select, insert, update, delete on public.working_hours to authenticated;
grant select, insert, update, delete on public.schedule_exceptions to authenticated;
grant select, insert, update, delete on public.resources to authenticated;

grant all on public.patients to service_role;
grant all on public.professionals to service_role;
grant all on public.services to service_role;
grant all on public.professional_services to service_role;
grant all on public.working_hours to service_role;
grant all on public.schedule_exceptions to service_role;
grant all on public.resources to service_role;
