create extension if not exists pgcrypto;

do $$
begin
  create type public.platform_role as enum ('superadmin');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.clinic_role as enum ('clinic_admin', 'reception', 'professional', 'readonly');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.clinic_status as enum ('active', 'inactive', 'trialing', 'suspended');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.clinic_member_status as enum ('active', 'invited', 'suspended');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  platform_role public.platform_role,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  legal_name text,
  timezone text not null default 'Europe/Madrid' check (length(trim(timezone)) > 0),
  phone text,
  email text,
  address text,
  status public.clinic_status not null default 'trialing',
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clinic_members (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  invited_email text,
  role public.clinic_role not null default 'readonly',
  status public.clinic_member_status not null default 'active',
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clinic_members_identity_check check (
    (status = 'invited' and user_id is null and invited_email is not null)
    or
    (status <> 'invited' and user_id is not null)
  )
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references public.clinics(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null check (length(trim(action)) > 0),
  target_table text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles (lower(email));
create index if not exists clinics_slug_idx on public.clinics (slug);
create index if not exists clinic_members_clinic_id_idx on public.clinic_members (clinic_id);
create index if not exists clinic_members_user_id_idx on public.clinic_members (user_id);
create index if not exists clinic_members_status_idx on public.clinic_members (status);
create unique index if not exists clinic_members_unique_user
  on public.clinic_members (clinic_id, user_id)
  where user_id is not null;
create unique index if not exists clinic_members_unique_invited_email
  on public.clinic_members (clinic_id, lower(invited_email))
  where invited_email is not null;
create index if not exists audit_logs_clinic_created_idx on public.audit_logs (clinic_id, created_at desc);
create index if not exists audit_logs_actor_created_idx on public.audit_logs (actor_user_id, created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row
  execute function public.touch_updated_at();

drop trigger if exists clinics_touch_updated_at on public.clinics;
create trigger clinics_touch_updated_at
  before update on public.clinics
  for each row
  execute function public.touch_updated_at();

drop trigger if exists clinic_members_touch_updated_at on public.clinic_members;
create trigger clinic_members_touch_updated_at
  before update on public.clinic_members
  for each row
  execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_profile_sync on auth.users;
create trigger on_auth_user_profile_sync
  after insert or update of email, raw_user_meta_data on auth.users
  for each row
  execute function public.handle_new_user();

create or replace function public.current_user_is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.platform_role = 'superadmin'
  );
$$;

create or replace function public.current_user_has_clinic_role(
  target_clinic_id uuid,
  allowed_roles public.clinic_role[] default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.clinic_members cm
    where cm.clinic_id = target_clinic_id
      and cm.user_id = auth.uid()
      and cm.status = 'active'
      and (allowed_roles is null or cm.role = any(allowed_roles))
  );
$$;

create or replace function public.current_user_shares_clinic(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(target_user_id = auth.uid(), false)
    or exists (
      select 1
      from public.clinic_members self_member
      join public.clinic_members target_member
        on target_member.clinic_id = self_member.clinic_id
      where self_member.user_id = auth.uid()
        and target_member.user_id = target_user_id
        and self_member.status = 'active'
        and target_member.status = 'active'
    );
$$;

create or replace function public.create_clinic_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.created_by is not null then
    insert into public.clinic_members (clinic_id, user_id, role, status)
    values (new.id, new.created_by, 'clinic_admin', 'active')
    on conflict (clinic_id, user_id) where user_id is not null do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists clinics_create_owner_membership on public.clinics;
create trigger clinics_create_owner_membership
  after insert on public.clinics
  for each row
  execute function public.create_clinic_owner_membership();

alter table public.profiles enable row level security;
alter table public.clinics enable row level security;
alter table public.clinic_members enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists profiles_select_member_visible on public.profiles;
create policy profiles_select_member_visible
  on public.profiles
  for select
  to authenticated
  using (
    id = auth.uid()
    or public.current_user_is_superadmin()
    or public.current_user_shares_clinic(id)
  );

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid() and platform_role is null);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid() and platform_role is null)
  with check (id = auth.uid() and platform_role is null);

drop policy if exists profiles_update_superadmin on public.profiles;
create policy profiles_update_superadmin
  on public.profiles
  for update
  to authenticated
  using (public.current_user_is_superadmin())
  with check (public.current_user_is_superadmin());

drop policy if exists clinics_select_member on public.clinics;
create policy clinics_select_member
  on public.clinics
  for select
  to authenticated
  using (
    public.current_user_is_superadmin()
    or public.current_user_has_clinic_role(id)
  );

drop policy if exists clinics_insert_authenticated_owner on public.clinics;
create policy clinics_insert_authenticated_owner
  on public.clinics
  for insert
  to authenticated
  with check (created_by = auth.uid());

drop policy if exists clinics_update_admin on public.clinics;
create policy clinics_update_admin
  on public.clinics
  for update
  to authenticated
  using (
    public.current_user_is_superadmin()
    or public.current_user_has_clinic_role(id, array['clinic_admin']::public.clinic_role[])
  )
  with check (
    public.current_user_is_superadmin()
    or public.current_user_has_clinic_role(id, array['clinic_admin']::public.clinic_role[])
  );

drop policy if exists clinics_delete_superadmin on public.clinics;
create policy clinics_delete_superadmin
  on public.clinics
  for delete
  to authenticated
  using (public.current_user_is_superadmin());

drop policy if exists clinic_members_select_visible on public.clinic_members;
create policy clinic_members_select_visible
  on public.clinic_members
  for select
  to authenticated
  using (
    public.current_user_is_superadmin()
    or public.current_user_has_clinic_role(clinic_id)
  );

drop policy if exists clinic_members_insert_admin on public.clinic_members;
create policy clinic_members_insert_admin
  on public.clinic_members
  for insert
  to authenticated
  with check (
    public.current_user_is_superadmin()
    or public.current_user_has_clinic_role(clinic_id, array['clinic_admin']::public.clinic_role[])
  );

drop policy if exists clinic_members_update_admin on public.clinic_members;
create policy clinic_members_update_admin
  on public.clinic_members
  for update
  to authenticated
  using (
    public.current_user_is_superadmin()
    or public.current_user_has_clinic_role(clinic_id, array['clinic_admin']::public.clinic_role[])
  )
  with check (
    public.current_user_is_superadmin()
    or public.current_user_has_clinic_role(clinic_id, array['clinic_admin']::public.clinic_role[])
  );

drop policy if exists clinic_members_delete_admin on public.clinic_members;
create policy clinic_members_delete_admin
  on public.clinic_members
  for delete
  to authenticated
  using (
    public.current_user_is_superadmin()
    or public.current_user_has_clinic_role(clinic_id, array['clinic_admin']::public.clinic_role[])
  );

drop policy if exists audit_logs_select_admin on public.audit_logs;
create policy audit_logs_select_admin
  on public.audit_logs
  for select
  to authenticated
  using (
    public.current_user_is_superadmin()
    or public.current_user_has_clinic_role(clinic_id, array['clinic_admin']::public.clinic_role[])
  );

drop policy if exists audit_logs_insert_member on public.audit_logs;
create policy audit_logs_insert_member
  on public.audit_logs
  for insert
  to authenticated
  with check (
    actor_user_id = auth.uid()
    and (
      public.current_user_is_superadmin()
      or public.current_user_has_clinic_role(clinic_id)
    )
  );

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.clinics from anon, authenticated;
revoke all on table public.clinic_members from anon, authenticated;
revoke all on table public.audit_logs from anon, authenticated;

grant usage on schema public to authenticated, service_role;
grant usage on type public.platform_role to authenticated, service_role;
grant usage on type public.clinic_role to authenticated, service_role;
grant usage on type public.clinic_status to authenticated, service_role;
grant usage on type public.clinic_member_status to authenticated, service_role;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.clinics to authenticated;
grant select, insert, update, delete on public.clinic_members to authenticated;
grant select, insert on public.audit_logs to authenticated;

grant all on public.profiles to service_role;
grant all on public.clinics to service_role;
grant all on public.clinic_members to service_role;
grant all on public.audit_logs to service_role;

revoke all on function public.current_user_is_superadmin() from public, anon;
revoke all on function public.current_user_has_clinic_role(uuid, public.clinic_role[]) from public, anon;
revoke all on function public.current_user_shares_clinic(uuid) from public, anon;
revoke all on function public.touch_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.create_clinic_owner_membership() from public, anon, authenticated;

grant execute on function public.current_user_is_superadmin() to authenticated, service_role;
grant execute on function public.current_user_has_clinic_role(uuid, public.clinic_role[]) to authenticated, service_role;
grant execute on function public.current_user_shares_clinic(uuid) to authenticated, service_role;
grant execute on function public.touch_updated_at() to service_role;
grant execute on function public.handle_new_user() to service_role;
grant execute on function public.create_clinic_owner_membership() to service_role;
