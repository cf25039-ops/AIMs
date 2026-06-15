begin;

create extension if not exists "pgcrypto";

-- Drop existing objects for a clean rebuild

drop table if exists public.analytics_snapshots cascade;
drop table if exists public.asset_health_scores cascade;
drop table if exists public.purchase_requests cascade;
drop table if exists public.stock_movements cascade;
drop table if exists public.warehouse_items cascade;
drop table if exists public.audit_logs cascade;
drop table if exists public.activity_logs cascade;
drop table if exists public.attachments cascade;
drop table if exists public.notification_logs cascade;
drop table if exists public.notifications cascade;
drop table if exists public.sla_events cascade;
drop table if exists public.repair_attachments cascade;
drop table if exists public.repair_logs cascade;
drop table if exists public.repair_tickets cascade;
drop table if exists public.status_history cascade;
drop table if exists public.maintenance_logs cascade;
drop table if exists public.asset_assignments cascade;
drop table if exists public.asset_movements cascade;
drop table if exists public.hardware cascade;
drop table if exists public.models cascade;
drop table if exists public.brands cascade;
drop table if exists public.asset_types cascade;
drop table if exists public.departments cascade;
drop table if exists public.facilities cascade;
drop table if exists public.states cascade;
drop table if exists public.regions cascade;
drop table if exists public.contracts cascade;
drop table if exists public.sla_policies cascade;
drop table if exists public.vendors cascade;
drop table if exists public.project_members cascade;
drop table if exists public.projects cascade;
drop table if exists public.profiles cascade;

drop type if exists public.audit_action cascade;
drop type if exists public.notification_channel cascade;
drop type if exists public.purchase_status cascade;
drop type if exists public.movement_type cascade;
drop type if exists public.ticket_status cascade;
drop type if exists public.ticket_severity cascade;
drop type if exists public.hardware_condition cascade;
drop type if exists public.hardware_type cascade;
drop type if exists public.hardware_status cascade;
drop type if exists public.user_role cascade;

-- Enums

do $$
begin
  create type public.user_role as enum ('super_admin', 'admin', 'project_admin', 'project_manager', 'technician', 'department_user', 'staff', 'viewer');
exception
  when duplicate_object then null;
end $$;

-- If the type already exists with fewer values, add the missing ones.
-- These ALTER TYPE statements are idempotent — they skip values that already exist.
do $$ begin alter type public.user_role add value if not exists 'admin'; exception when duplicate_object then null; end $$;
do $$ begin alter type public.user_role add value if not exists 'project_admin'; exception when duplicate_object then null; end $$;
do $$ begin alter type public.user_role add value if not exists 'technician'; exception when duplicate_object then null; end $$;
do $$ begin alter type public.user_role add value if not exists 'department_user'; exception when duplicate_object then null; end $$;
do $$ begin alter type public.user_role add value if not exists 'viewer'; exception when duplicate_object then null; end $$;

do $$
begin
  create type public.hardware_status as enum (
    'active',
    'standby',
    'in_repair',
    'in_store',
    'retired',
    'disposed',
    'lost',
    'transferred',
    'reserved',
    'pending_deployment'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.hardware_type as enum ('pc', 'laptop', 'printer', 'server');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.hardware_condition as enum ('good', 'fair', 'damaged');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.ticket_severity as enum (
    'critical',
    'high',
    'medium',
    'low',
    'informational'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.ticket_status as enum (
    'open',
    'assigned',
    'investigation',
    'in_repair',
    'vendor_escalation',
    'testing',
    'resolved',
    'closed'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.movement_type as enum ('transfer', 'check_out', 'check_in', 'reassignment');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.purchase_status as enum ('pending', 'approved', 'rejected', 'fulfilled');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.notification_channel as enum ('in_app', 'email', 'sms', 'push', 'whatsapp');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.audit_action as enum ('insert', 'update', 'delete');
exception
  when duplicate_object then null;
end $$;

-- Core tables

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email varchar(255),
  full_name varchar(120),
  role public.user_role not null default 'staff',
  created_at timestamptz not null default now(),
  unique (email)
);

create index profiles_role_idx on public.profiles (role);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name varchar(120) not null,
  code varchar(50) not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (code)
);

create index projects_name_idx on public.projects (name);

create table public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.user_role not null,
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create index project_members_project_idx on public.project_members (project_id);
create index project_members_user_idx on public.project_members (user_id);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name varchar(160) not null,
  email varchar(255),
  phone varchar(40),
  status varchar(40) default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index vendors_project_idx on public.vendors (project_id);
create index vendors_name_idx on public.vendors (name);

create table public.sla_policies (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name varchar(120) not null,
  critical_hours integer not null,
  high_hours integer not null,
  medium_hours integer not null,
  low_hours integer not null,
  created_at timestamptz not null default now()
);

create index sla_policies_project_idx on public.sla_policies (project_id);

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  vendor_id uuid references public.vendors (id) on delete set null,
  sla_policy_id uuid references public.sla_policies (id) on delete set null,
  contract_number varchar(80) not null,
  start_date date,
  end_date date,
  value numeric(12, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, contract_number)
);

create index contracts_project_idx on public.contracts (project_id);

create table public.regions (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts (id) on delete cascade,
  name varchar(120) not null,
  code varchar(50),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (contract_id, name)
);

create index regions_contract_idx on public.regions (contract_id);

create table public.states (
  id uuid primary key default gen_random_uuid(),
  region_id uuid not null references public.regions (id) on delete cascade,
  name varchar(120) not null,
  code varchar(50),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (region_id, name)
);

create index states_region_idx on public.states (region_id);

create table public.facilities (
  id uuid primary key default gen_random_uuid(),
  state_id uuid not null references public.states (id) on delete cascade,
  name varchar(160) not null,
  code varchar(50),
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (state_id, name)
);

create index facilities_state_idx on public.facilities (state_id);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities (id) on delete cascade,
  name varchar(160) not null,
  code varchar(50),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (facility_id, name)
);

create index departments_facility_idx on public.departments (facility_id);

create table public.asset_types (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name varchar(120) not null,
  description text,
  created_at timestamptz not null default now(),
  unique (project_id, name)
);

create index asset_types_project_idx on public.asset_types (project_id);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name varchar(120) not null,
  created_at timestamptz not null default now(),
  unique (project_id, name)
);

create index brands_project_idx on public.brands (project_id);

create table public.models (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  brand_id uuid not null references public.brands (id) on delete cascade,
  asset_type_id uuid not null references public.asset_types (id) on delete cascade,
  name varchar(160) not null,
  created_at timestamptz not null default now(),
  unique (project_id, name)
);

create index models_project_idx on public.models (project_id);
create index models_brand_idx on public.models (brand_id);
create index models_type_idx on public.models (asset_type_id);

create table public.hardware (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments (id) on delete cascade,
  asset_tag varchar(80),
  serial_number varchar(120) not null,
  qr_code varchar(255),
  barcode varchar(255),
  pic_name varchar(120) not null,
  contact_number varchar(40) not null,
  running_number varchar(80) not null,
  type_hardware public.hardware_type not null,
  brand varchar(80) not null,
  model varchar(80) not null,
  cpu varchar(80),
  ram varchar(40),
  storage varchar(80),
  mac_address varchar(32),
  ip_address varchar(48),
  purchase_date date,
  warranty_expiry date,
  status public.hardware_status not null default 'active',
  condition public.hardware_condition not null default 'good',
  vendor_id uuid references public.vendors (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (serial_number),
  unique (asset_tag)
);

create index hardware_department_idx on public.hardware (department_id);
create index hardware_status_idx on public.hardware (status);
create index hardware_warranty_idx on public.hardware (warranty_expiry);

create table public.asset_movements (
  id uuid primary key default gen_random_uuid(),
  hardware_id uuid not null references public.hardware (id) on delete cascade,
  from_department_id uuid references public.departments (id),
  to_department_id uuid references public.departments (id),
  from_pic varchar(120),
  to_pic varchar(120),
  approved_by uuid references public.profiles (id),
  movement_type public.movement_type not null,
  transfer_reason text,
  transfer_date timestamptz not null default now(),
  attachment_url varchar(255),
  created_at timestamptz not null default now()
);

create index asset_movements_hardware_idx on public.asset_movements (hardware_id);
create index asset_movements_to_department_idx on public.asset_movements (to_department_id);

create table public.asset_assignments (
  id uuid primary key default gen_random_uuid(),
  hardware_id uuid not null references public.hardware (id) on delete cascade,
  assigned_to uuid references public.profiles (id),
  assigned_at timestamptz not null default now(),
  returned_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create index asset_assignments_hardware_idx on public.asset_assignments (hardware_id);

create table public.maintenance_logs (
  id uuid primary key default gen_random_uuid(),
  hardware_id uuid not null references public.hardware (id) on delete cascade,
  performed_at timestamptz not null default now(),
  performed_by uuid references public.profiles (id),
  description text not null,
  cost numeric(12, 2),
  created_at timestamptz not null default now()
);

create index maintenance_logs_hardware_idx on public.maintenance_logs (hardware_id);

create table public.status_history (
  id uuid primary key default gen_random_uuid(),
  hardware_id uuid not null references public.hardware (id) on delete cascade,
  from_status public.hardware_status,
  to_status public.hardware_status not null,
  changed_at timestamptz not null default now(),
  changed_by uuid references public.profiles (id),
  note text
);

create index status_history_hardware_idx on public.status_history (hardware_id);

create table public.repair_tickets (
  id uuid primary key default gen_random_uuid(),
  hardware_id uuid not null references public.hardware (id) on delete cascade,
  severity public.ticket_severity not null,
  status public.ticket_status not null default 'open',
  sla_policy_id uuid references public.sla_policies (id) on delete set null,
  opened_at timestamptz not null default now(),
  assigned_to uuid references public.profiles (id),
  title varchar(160) not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index repair_tickets_hardware_idx on public.repair_tickets (hardware_id);
create index repair_tickets_status_idx on public.repair_tickets (status);

create table public.repair_logs (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.repair_tickets (id) on delete cascade,
  note text not null,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index repair_logs_ticket_idx on public.repair_logs (ticket_id);

create table public.repair_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.repair_tickets (id) on delete cascade,
  url varchar(255) not null,
  created_at timestamptz not null default now()
);

create index repair_attachments_ticket_idx on public.repair_attachments (ticket_id);

create table public.sla_events (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.repair_tickets (id) on delete cascade,
  status varchar(40) not null,
  breached_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index sla_events_ticket_idx on public.sla_events (ticket_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title varchar(160) not null,
  body text,
  channel public.notification_channel not null default 'in_app',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id);

create table public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications (id) on delete cascade,
  status varchar(40) not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index notification_logs_notification_idx on public.notification_logs (notification_id);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  table_name varchar(120) not null,
  record_id uuid not null,
  url varchar(255) not null,
  file_type varchar(80),
  created_at timestamptz not null default now()
);

create index attachments_record_idx on public.attachments (record_id);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id),
  action varchar(120) not null,
  entity varchar(120) not null,
  entity_id uuid,
  ip_address varchar(64),
  device varchar(255),
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index activity_logs_action_idx on public.activity_logs (action);
create index activity_logs_entity_idx on public.activity_logs (entity);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  table_name varchar(120) not null,
  record_id uuid,
  action public.audit_action not null,
  actor_id uuid references public.profiles (id),
  old_data jsonb,
  new_data jsonb,
  ip_address varchar(64),
  device varchar(255),
  created_at timestamptz not null default now()
);

create index audit_logs_table_idx on public.audit_logs (table_name);
create index audit_logs_record_idx on public.audit_logs (record_id);

create table public.warehouse_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name varchar(160) not null,
  sku varchar(80),
  quantity integer not null default 0,
  min_quantity integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index warehouse_items_project_idx on public.warehouse_items (project_id);
create index warehouse_items_name_idx on public.warehouse_items (name);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  warehouse_item_id uuid not null references public.warehouse_items (id) on delete cascade,
  movement_type public.movement_type not null,
  quantity integer not null,
  note text,
  performed_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index stock_movements_item_idx on public.stock_movements (warehouse_item_id);
create index stock_movements_project_idx on public.stock_movements (project_id);

create table public.purchase_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  requester_id uuid references public.profiles (id),
  item_name varchar(160) not null,
  quantity integer not null,
  status public.purchase_status not null default 'pending',
  note text,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create index purchase_requests_project_idx on public.purchase_requests (project_id);
create index purchase_requests_status_idx on public.purchase_requests (status);

create table public.asset_health_scores (
  id uuid primary key default gen_random_uuid(),
  hardware_id uuid not null references public.hardware (id) on delete cascade,
  score integer not null,
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index asset_health_scores_hardware_idx on public.asset_health_scores (hardware_id);

create table public.analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  snapshot_date date not null,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create index analytics_snapshots_project_idx on public.analytics_snapshots (project_id);

-- Timestamp helpers

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_projects on public.projects;
create trigger set_updated_at_projects
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_contracts on public.contracts;
create trigger set_updated_at_contracts
before update on public.contracts
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_regions on public.regions;
create trigger set_updated_at_regions
before update on public.regions
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_states on public.states;
create trigger set_updated_at_states
before update on public.states
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_facilities on public.facilities;
create trigger set_updated_at_facilities
before update on public.facilities
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_departments on public.departments;
create trigger set_updated_at_departments
before update on public.departments
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_hardware on public.hardware;
create trigger set_updated_at_hardware
before update on public.hardware
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_vendors on public.vendors;
create trigger set_updated_at_vendors
before update on public.vendors
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_repair_tickets on public.repair_tickets;
create trigger set_updated_at_repair_tickets
before update on public.repair_tickets
for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_warehouse_items on public.warehouse_items;
create trigger set_updated_at_warehouse_items
before update on public.warehouse_items
for each row execute function public.set_updated_at();

-- Audit logging

create or replace function public.audit_log_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid;
  v_record_id uuid;
  v_ip text;
begin
  v_actor := auth.uid();
  v_ip := inet_client_addr()::text;

  if (tg_op = 'DELETE') then
    v_record_id := old.id;
    insert into public.audit_logs (table_name, record_id, action, actor_id, old_data, ip_address)
    values (tg_table_name, v_record_id, 'delete', v_actor, to_jsonb(old), v_ip);
    return old;
  elsif (tg_op = 'UPDATE') then
    v_record_id := new.id;
    insert into public.audit_logs (table_name, record_id, action, actor_id, old_data, new_data, ip_address)
    values (tg_table_name, v_record_id, 'update', v_actor, to_jsonb(old), to_jsonb(new), v_ip);
    return new;
  else
    v_record_id := new.id;
    insert into public.audit_logs (table_name, record_id, action, actor_id, new_data, ip_address)
    values (tg_table_name, v_record_id, 'insert', v_actor, to_jsonb(new), v_ip);
    return new;
  end if;
end;
$$;

-- Audit triggers

drop trigger if exists audit_projects on public.projects;
create trigger audit_projects
after insert or update or delete on public.projects
for each row execute function public.audit_log_trigger();

drop trigger if exists audit_contracts on public.contracts;
create trigger audit_contracts
after insert or update or delete on public.contracts
for each row execute function public.audit_log_trigger();

drop trigger if exists audit_regions on public.regions;
create trigger audit_regions
after insert or update or delete on public.regions
for each row execute function public.audit_log_trigger();

drop trigger if exists audit_states on public.states;
create trigger audit_states
after insert or update or delete on public.states
for each row execute function public.audit_log_trigger();

drop trigger if exists audit_facilities on public.facilities;
create trigger audit_facilities
after insert or update or delete on public.facilities
for each row execute function public.audit_log_trigger();

drop trigger if exists audit_departments on public.departments;
create trigger audit_departments
after insert or update or delete on public.departments
for each row execute function public.audit_log_trigger();

drop trigger if exists audit_hardware on public.hardware;
create trigger audit_hardware
after insert or update or delete on public.hardware
for each row execute function public.audit_log_trigger();

drop trigger if exists audit_project_members on public.project_members;
create trigger audit_project_members
after insert or update or delete on public.project_members
for each row execute function public.audit_log_trigger();

drop trigger if exists audit_vendors on public.vendors;
create trigger audit_vendors
after insert or update or delete on public.vendors
for each row execute function public.audit_log_trigger();

drop trigger if exists audit_sla_policies on public.sla_policies;
create trigger audit_sla_policies
after insert or update or delete on public.sla_policies
for each row execute function public.audit_log_trigger();

drop trigger if exists audit_maintenance_logs on public.maintenance_logs;
create trigger audit_maintenance_logs
after insert or update or delete on public.maintenance_logs
for each row execute function public.audit_log_trigger();

drop trigger if exists audit_status_history on public.status_history;
create trigger audit_status_history
after insert or update or delete on public.status_history
for each row execute function public.audit_log_trigger();

drop trigger if exists audit_repair_tickets on public.repair_tickets;
create trigger audit_repair_tickets
after insert or update or delete on public.repair_tickets
for each row execute function public.audit_log_trigger();

drop trigger if exists audit_repair_logs on public.repair_logs;
create trigger audit_repair_logs
after insert or update or delete on public.repair_logs
for each row execute function public.audit_log_trigger();

drop trigger if exists audit_asset_movements on public.asset_movements;
create trigger audit_asset_movements
after insert or update or delete on public.asset_movements
for each row execute function public.audit_log_trigger();

drop trigger if exists audit_asset_assignments on public.asset_assignments;
create trigger audit_asset_assignments
after insert or update or delete on public.asset_assignments
for each row execute function public.audit_log_trigger();

drop trigger if exists audit_warehouse_items on public.warehouse_items;
create trigger audit_warehouse_items
after insert or update or delete on public.warehouse_items
for each row execute function public.audit_log_trigger();

drop trigger if exists audit_stock_movements on public.stock_movements;
create trigger audit_stock_movements
after insert or update or delete on public.stock_movements
for each row execute function public.audit_log_trigger();

drop trigger if exists audit_purchase_requests on public.purchase_requests;
create trigger audit_purchase_requests
after insert or update or delete on public.purchase_requests
for each row execute function public.audit_log_trigger();

-- RLS helpers

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'super_admin'
  );
$$;

create or replace function public.has_project_access(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_project_id is null then false
    when public.is_super_admin() then true
    else exists (
      select 1 from public.project_members pm
      where pm.project_id = p_project_id
        and pm.user_id = auth.uid()
    )
  end;
$$;

create or replace function public.has_project_role(
  p_project_id uuid,
  p_roles public.user_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_project_id is null then false
    when public.is_super_admin() then true
    else exists (
      select 1 from public.project_members pm
      where pm.project_id = p_project_id
        and pm.user_id = auth.uid()
        and pm.role = any (p_roles)
    )
  end;
$$;

create or replace function public.project_id_for_contract(p_contract_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select project_id from public.contracts where id = p_contract_id;
$$;

create or replace function public.project_id_for_region(p_region_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select c.project_id
  from public.regions r
  join public.contracts c on c.id = r.contract_id
  where r.id = p_region_id;
$$;

create or replace function public.project_id_for_state(p_state_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select c.project_id
  from public.states s
  join public.regions r on r.id = s.region_id
  join public.contracts c on c.id = r.contract_id
  where s.id = p_state_id;
$$;

create or replace function public.project_id_for_facility(p_facility_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select c.project_id
  from public.facilities f
  join public.states s on s.id = f.state_id
  join public.regions r on r.id = s.region_id
  join public.contracts c on c.id = r.contract_id
  where f.id = p_facility_id;
$$;

create or replace function public.project_id_for_department(p_department_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select c.project_id
  from public.departments d
  join public.facilities f on f.id = d.facility_id
  join public.states s on s.id = f.state_id
  join public.regions r on r.id = s.region_id
  join public.contracts c on c.id = r.contract_id
  where d.id = p_department_id;
$$;

create or replace function public.project_id_for_hardware(p_hardware_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select public.project_id_for_department(h.department_id)
  from public.hardware h
  where h.id = p_hardware_id;
$$;

create or replace function public.project_id_for_ticket(p_ticket_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select public.project_id_for_hardware(t.hardware_id)
  from public.repair_tickets t
  where t.id = p_ticket_id;
$$;

-- Enable RLS

alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.profiles enable row level security;
alter table public.vendors enable row level security;
alter table public.sla_policies enable row level security;
alter table public.contracts enable row level security;
alter table public.regions enable row level security;
alter table public.states enable row level security;
alter table public.facilities enable row level security;
alter table public.departments enable row level security;
alter table public.asset_types enable row level security;
alter table public.brands enable row level security;
alter table public.models enable row level security;
alter table public.hardware enable row level security;
alter table public.asset_movements enable row level security;
alter table public.asset_assignments enable row level security;
alter table public.maintenance_logs enable row level security;
alter table public.status_history enable row level security;
alter table public.repair_tickets enable row level security;
alter table public.repair_logs enable row level security;
alter table public.repair_attachments enable row level security;
alter table public.sla_events enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_logs enable row level security;
alter table public.attachments enable row level security;
alter table public.activity_logs enable row level security;
alter table public.audit_logs enable row level security;
alter table public.warehouse_items enable row level security;
alter table public.stock_movements enable row level security;
alter table public.purchase_requests enable row level security;
alter table public.asset_health_scores enable row level security;
alter table public.analytics_snapshots enable row level security;

-- Policies

-- projects
create policy projects_select on public.projects
for select
using (public.has_project_access(id));

create policy projects_insert on public.projects
for insert
with check (public.is_super_admin());

create policy projects_update on public.projects
for update
using (public.is_super_admin())
with check (public.is_super_admin());

create policy projects_delete on public.projects
for delete
using (public.is_super_admin());

-- profiles
create policy profiles_select on public.profiles
for select
using (id = auth.uid() or public.is_super_admin());

create policy profiles_insert on public.profiles
for insert
with check (id = auth.uid());

create policy profiles_update on public.profiles
for update
using (id = auth.uid() or public.is_super_admin())
with check (id = auth.uid() or public.is_super_admin());

create policy profiles_delete on public.profiles
for delete
using (public.is_super_admin());

-- project members
create policy project_members_select on public.project_members
for select
using (public.has_project_access(project_id));

create policy project_members_insert on public.project_members
for insert
with check (public.has_project_role(project_id, array['project_manager']::public.user_role[]));

create policy project_members_update on public.project_members
for update
using (public.has_project_role(project_id, array['project_manager']::public.user_role[]))
with check (public.has_project_role(project_id, array['project_manager']::public.user_role[]));

create policy project_members_delete on public.project_members
for delete
using (public.has_project_role(project_id, array['project_manager']::public.user_role[]));

-- vendors
create policy vendors_select on public.vendors
for select
using (public.has_project_access(project_id));

create policy vendors_insert on public.vendors
for insert
with check (public.has_project_role(project_id, array['project_manager']::public.user_role[]));

create policy vendors_update on public.vendors
for update
using (public.has_project_role(project_id, array['project_manager']::public.user_role[]))
with check (public.has_project_role(project_id, array['project_manager']::public.user_role[]));

create policy vendors_delete on public.vendors
for delete
using (public.has_project_role(project_id, array['project_manager']::public.user_role[]));

-- sla policies
create policy sla_policies_select on public.sla_policies
for select
using (public.has_project_access(project_id));

create policy sla_policies_insert on public.sla_policies
for insert
with check (public.has_project_role(project_id, array['project_manager']::public.user_role[]));

create policy sla_policies_update on public.sla_policies
for update
using (public.has_project_role(project_id, array['project_manager']::public.user_role[]))
with check (public.has_project_role(project_id, array['project_manager']::public.user_role[]));

create policy sla_policies_delete on public.sla_policies
for delete
using (public.has_project_role(project_id, array['project_manager']::public.user_role[]));

-- contracts
create policy contracts_select on public.contracts
for select
using (public.has_project_access(project_id));

create policy contracts_insert on public.contracts
for insert
with check (public.has_project_role(project_id, array['project_manager']::public.user_role[]));

create policy contracts_update on public.contracts
for update
using (public.has_project_role(project_id, array['project_manager']::public.user_role[]))
with check (public.has_project_role(project_id, array['project_manager']::public.user_role[]));

create policy contracts_delete on public.contracts
for delete
using (public.has_project_role(project_id, array['project_manager']::public.user_role[]));

-- regions
create policy regions_select on public.regions
for select
using (public.has_project_access(public.project_id_for_contract(contract_id)));

create policy regions_insert on public.regions
for insert
with check (
  public.has_project_role(public.project_id_for_contract(contract_id), array['project_manager']::public.user_role[])
);

create policy regions_update on public.regions
for update
using (
  public.has_project_role(public.project_id_for_contract(contract_id), array['project_manager']::public.user_role[])
)
with check (
  public.has_project_role(public.project_id_for_contract(contract_id), array['project_manager']::public.user_role[])
);

create policy regions_delete on public.regions
for delete
using (
  public.has_project_role(public.project_id_for_contract(contract_id), array['project_manager']::public.user_role[])
);

-- states
create policy states_select on public.states
for select
using (public.has_project_access(public.project_id_for_region(region_id)));

create policy states_insert on public.states
for insert
with check (
  public.has_project_role(public.project_id_for_region(region_id), array['project_manager']::public.user_role[])
);

create policy states_update on public.states
for update
using (
  public.has_project_role(public.project_id_for_region(region_id), array['project_manager']::public.user_role[])
)
with check (
  public.has_project_role(public.project_id_for_region(region_id), array['project_manager']::public.user_role[])
);

create policy states_delete on public.states
for delete
using (
  public.has_project_role(public.project_id_for_region(region_id), array['project_manager']::public.user_role[])
);

-- facilities
create policy facilities_select on public.facilities
for select
using (public.has_project_access(public.project_id_for_state(state_id)));

create policy facilities_insert on public.facilities
for insert
with check (
  public.has_project_role(public.project_id_for_state(state_id), array['project_manager']::public.user_role[])
);

create policy facilities_update on public.facilities
for update
using (
  public.has_project_role(public.project_id_for_state(state_id), array['project_manager']::public.user_role[])
)
with check (
  public.has_project_role(public.project_id_for_state(state_id), array['project_manager']::public.user_role[])
);

create policy facilities_delete on public.facilities
for delete
using (
  public.has_project_role(public.project_id_for_state(state_id), array['project_manager']::public.user_role[])
);

-- departments
create policy departments_select on public.departments
for select
using (public.has_project_access(public.project_id_for_facility(facility_id)));

create policy departments_insert on public.departments
for insert
with check (
  public.has_project_role(public.project_id_for_facility(facility_id), array['project_manager']::public.user_role[])
);

create policy departments_update on public.departments
for update
using (
  public.has_project_role(public.project_id_for_facility(facility_id), array['project_manager']::public.user_role[])
)
with check (
  public.has_project_role(public.project_id_for_facility(facility_id), array['project_manager']::public.user_role[])
);

create policy departments_delete on public.departments
for delete
using (
  public.has_project_role(public.project_id_for_facility(facility_id), array['project_manager']::public.user_role[])
);

-- asset types / brands / models
create policy asset_types_select on public.asset_types
for select
using (public.has_project_access(project_id));

create policy asset_types_insert on public.asset_types
for insert
with check (public.has_project_role(project_id, array['project_manager']::public.user_role[]));

create policy asset_types_update on public.asset_types
for update
using (public.has_project_role(project_id, array['project_manager']::public.user_role[]))
with check (public.has_project_role(project_id, array['project_manager']::public.user_role[]));

create policy asset_types_delete on public.asset_types
for delete
using (public.has_project_role(project_id, array['project_manager']::public.user_role[]));

create policy brands_select on public.brands
for select
using (public.has_project_access(project_id));

create policy brands_insert on public.brands
for insert
with check (public.has_project_role(project_id, array['project_manager']::public.user_role[]));

create policy brands_update on public.brands
for update
using (public.has_project_role(project_id, array['project_manager']::public.user_role[]))
with check (public.has_project_role(project_id, array['project_manager']::public.user_role[]));

create policy brands_delete on public.brands
for delete
using (public.has_project_role(project_id, array['project_manager']::public.user_role[]));

create policy models_select on public.models
for select
using (public.has_project_access(project_id));

create policy models_insert on public.models
for insert
with check (public.has_project_role(project_id, array['project_manager']::public.user_role[]));

create policy models_update on public.models
for update
using (public.has_project_role(project_id, array['project_manager']::public.user_role[]))
with check (public.has_project_role(project_id, array['project_manager']::public.user_role[]));

create policy models_delete on public.models
for delete
using (public.has_project_role(project_id, array['project_manager']::public.user_role[]));

-- hardware
create policy hardware_select on public.hardware
for select
using (public.has_project_access(public.project_id_for_department(department_id)));

create policy hardware_insert on public.hardware
for insert
with check (
  public.has_project_role(public.project_id_for_department(department_id), array['project_manager']::public.user_role[])
);

create policy hardware_update on public.hardware
for update
using (
  public.has_project_role(public.project_id_for_department(department_id), array['project_manager']::public.user_role[])
)
with check (
  public.has_project_role(public.project_id_for_department(department_id), array['project_manager']::public.user_role[])
);

create policy hardware_delete on public.hardware
for delete
using (
  public.has_project_role(public.project_id_for_department(department_id), array['project_manager']::public.user_role[])
);

-- asset movements
create policy asset_movements_select on public.asset_movements
for select
using (public.has_project_access(public.project_id_for_hardware(hardware_id)));

create policy asset_movements_insert on public.asset_movements
for insert
with check (
  public.has_project_role(public.project_id_for_hardware(hardware_id), array['project_manager', 'staff']::public.user_role[])
);

create policy asset_movements_update on public.asset_movements
for update
using (
  public.has_project_role(public.project_id_for_hardware(hardware_id), array['project_manager', 'staff']::public.user_role[])
)
with check (
  public.has_project_role(public.project_id_for_hardware(hardware_id), array['project_manager', 'staff']::public.user_role[])
);

create policy asset_movements_delete on public.asset_movements
for delete
using (
  public.has_project_role(public.project_id_for_hardware(hardware_id), array['project_manager']::public.user_role[])
);

-- asset assignments
create policy asset_assignments_select on public.asset_assignments
for select
using (public.has_project_access(public.project_id_for_hardware(hardware_id)));

create policy asset_assignments_insert on public.asset_assignments
for insert
with check (
  public.has_project_role(public.project_id_for_hardware(hardware_id), array['project_manager', 'staff']::public.user_role[])
);

create policy asset_assignments_update on public.asset_assignments
for update
using (
  public.has_project_role(public.project_id_for_hardware(hardware_id), array['project_manager', 'staff']::public.user_role[])
)
with check (
  public.has_project_role(public.project_id_for_hardware(hardware_id), array['project_manager', 'staff']::public.user_role[])
);

create policy asset_assignments_delete on public.asset_assignments
for delete
using (
  public.has_project_role(public.project_id_for_hardware(hardware_id), array['project_manager']::public.user_role[])
);

-- maintenance logs
create policy maintenance_logs_select on public.maintenance_logs
for select
using (public.has_project_access(public.project_id_for_hardware(hardware_id)));

create policy maintenance_logs_insert on public.maintenance_logs
for insert
with check (
  public.has_project_role(public.project_id_for_hardware(hardware_id), array['project_manager', 'staff']::public.user_role[])
);

create policy maintenance_logs_update on public.maintenance_logs
for update
using (
  public.has_project_role(public.project_id_for_hardware(hardware_id), array['project_manager', 'staff']::public.user_role[])
)
with check (
  public.has_project_role(public.project_id_for_hardware(hardware_id), array['project_manager', 'staff']::public.user_role[])
);

create policy maintenance_logs_delete on public.maintenance_logs
for delete
using (
  public.has_project_role(public.project_id_for_hardware(hardware_id), array['project_manager']::public.user_role[])
);

-- status history
create policy status_history_select on public.status_history
for select
using (public.has_project_access(public.project_id_for_hardware(hardware_id)));

create policy status_history_insert on public.status_history
for insert
with check (
  public.has_project_role(public.project_id_for_hardware(hardware_id), array['project_manager', 'staff']::public.user_role[])
);

create policy status_history_update on public.status_history
for update
using (
  public.has_project_role(public.project_id_for_hardware(hardware_id), array['project_manager', 'staff']::public.user_role[])
)
with check (
  public.has_project_role(public.project_id_for_hardware(hardware_id), array['project_manager', 'staff']::public.user_role[])
);

create policy status_history_delete on public.status_history
for delete
using (
  public.has_project_role(public.project_id_for_hardware(hardware_id), array['project_manager']::public.user_role[])
);

-- repair tickets and logs
create policy repair_tickets_select on public.repair_tickets
for select
using (public.has_project_access(public.project_id_for_hardware(hardware_id)));

create policy repair_tickets_insert on public.repair_tickets
for insert
with check (
  public.has_project_role(public.project_id_for_hardware(hardware_id), array['project_manager', 'staff']::public.user_role[])
);

create policy repair_tickets_update on public.repair_tickets
for update
using (
  public.has_project_role(public.project_id_for_hardware(hardware_id), array['project_manager', 'staff']::public.user_role[])
)
with check (
  public.has_project_role(public.project_id_for_hardware(hardware_id), array['project_manager', 'staff']::public.user_role[])
);

create policy repair_tickets_delete on public.repair_tickets
for delete
using (
  public.has_project_role(public.project_id_for_hardware(hardware_id), array['project_manager']::public.user_role[])
);

create policy repair_logs_select on public.repair_logs
for select
using (public.has_project_access(public.project_id_for_ticket(ticket_id)));

create policy repair_logs_insert on public.repair_logs
for insert
with check (
  public.has_project_role(public.project_id_for_ticket(ticket_id), array['project_manager', 'staff']::public.user_role[])
);

create policy repair_logs_update on public.repair_logs
for update
using (
  public.has_project_role(public.project_id_for_ticket(ticket_id), array['project_manager', 'staff']::public.user_role[])
)
with check (
  public.has_project_role(public.project_id_for_ticket(ticket_id), array['project_manager', 'staff']::public.user_role[])
);

create policy repair_logs_delete on public.repair_logs
for delete
using (
  public.has_project_role(public.project_id_for_ticket(ticket_id), array['project_manager']::public.user_role[])
);

create policy repair_attachments_select on public.repair_attachments
for select
using (public.has_project_access(public.project_id_for_ticket(ticket_id)));

create policy repair_attachments_insert on public.repair_attachments
for insert
with check (
  public.has_project_role(public.project_id_for_ticket(ticket_id), array['project_manager', 'staff']::public.user_role[])
);

create policy repair_attachments_update on public.repair_attachments
for update
using (
  public.has_project_role(public.project_id_for_ticket(ticket_id), array['project_manager', 'staff']::public.user_role[])
)
with check (
  public.has_project_role(public.project_id_for_ticket(ticket_id), array['project_manager', 'staff']::public.user_role[])
);

create policy repair_attachments_delete on public.repair_attachments
for delete
using (
  public.has_project_role(public.project_id_for_ticket(ticket_id), array['project_manager']::public.user_role[])
);

create policy sla_events_select on public.sla_events
for select
using (public.has_project_access(public.project_id_for_ticket(ticket_id)));

create policy sla_events_insert on public.sla_events
for insert
with check (
  public.has_project_role(public.project_id_for_ticket(ticket_id), array['project_manager', 'staff']::public.user_role[])
);

create policy sla_events_update on public.sla_events
for update
using (
  public.has_project_role(public.project_id_for_ticket(ticket_id), array['project_manager', 'staff']::public.user_role[])
)
with check (
  public.has_project_role(public.project_id_for_ticket(ticket_id), array['project_manager', 'staff']::public.user_role[])
);

create policy sla_events_delete on public.sla_events
for delete
using (
  public.has_project_role(public.project_id_for_ticket(ticket_id), array['project_manager']::public.user_role[])
);

-- notifications
create policy notifications_select on public.notifications
for select
using (user_id = auth.uid());

create policy notifications_insert on public.notifications
for insert
with check (user_id = auth.uid());

create policy notifications_update on public.notifications
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy notifications_delete on public.notifications
for delete
using (user_id = auth.uid());

create policy notification_logs_select on public.notification_logs
for select
using (
  exists (
    select 1 from public.notifications n
    where n.id = notification_id
      and n.user_id = auth.uid()
  )
);

create policy notification_logs_insert on public.notification_logs
for insert
with check (
  exists (
    select 1 from public.notifications n
    where n.id = notification_id
      and n.user_id = auth.uid()
  )
);

create policy notification_logs_update on public.notification_logs
for update
using (
  exists (
    select 1 from public.notifications n
    where n.id = notification_id
      and n.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.notifications n
    where n.id = notification_id
      and n.user_id = auth.uid()
  )
);

create policy notification_logs_delete on public.notification_logs
for delete
using (
  exists (
    select 1 from public.notifications n
    where n.id = notification_id
      and n.user_id = auth.uid()
  )
);

-- attachments and logs (admin only)
create policy attachments_select on public.attachments
for select
using (public.is_super_admin());

create policy attachments_insert on public.attachments
for insert
with check (public.is_super_admin());

create policy attachments_update on public.attachments
for update
using (public.is_super_admin())
with check (public.is_super_admin());

create policy attachments_delete on public.attachments
for delete
using (public.is_super_admin());

create policy activity_logs_select on public.activity_logs
for select
using (public.is_super_admin());

create policy activity_logs_insert on public.activity_logs
for insert
with check (public.is_super_admin());

create policy activity_logs_update on public.activity_logs
for update
using (public.is_super_admin())
with check (public.is_super_admin());

create policy activity_logs_delete on public.activity_logs
for delete
using (public.is_super_admin());

create policy audit_logs_select on public.audit_logs
for select
using (public.is_super_admin());

create policy audit_logs_insert on public.audit_logs
for insert
with check (true);

-- warehouse
create policy warehouse_items_select on public.warehouse_items
for select
using (public.has_project_access(project_id));

create policy warehouse_items_insert on public.warehouse_items
for insert
with check (public.has_project_role(project_id, array['project_manager']::public.user_role[]));

create policy warehouse_items_update on public.warehouse_items
for update
using (public.has_project_role(project_id, array['project_manager']::public.user_role[]))
with check (public.has_project_role(project_id, array['project_manager']::public.user_role[]));

create policy warehouse_items_delete on public.warehouse_items
for delete
using (public.has_project_role(project_id, array['project_manager']::public.user_role[]));

create policy stock_movements_select on public.stock_movements
for select
using (public.has_project_access(project_id));

create policy stock_movements_insert on public.stock_movements
for insert
with check (public.has_project_role(project_id, array['project_manager', 'staff']::public.user_role[]));

create policy stock_movements_update on public.stock_movements
for update
using (public.has_project_role(project_id, array['project_manager', 'staff']::public.user_role[]))
with check (public.has_project_role(project_id, array['project_manager', 'staff']::public.user_role[]));

create policy stock_movements_delete on public.stock_movements
for delete
using (public.has_project_role(project_id, array['project_manager']::public.user_role[]));

create policy purchase_requests_select on public.purchase_requests
for select
using (public.has_project_access(project_id));

create policy purchase_requests_insert on public.purchase_requests
for insert
with check (public.has_project_role(project_id, array['project_manager', 'staff']::public.user_role[]));

create policy purchase_requests_update on public.purchase_requests
for update
using (public.has_project_role(project_id, array['project_manager', 'staff']::public.user_role[]))
with check (public.has_project_role(project_id, array['project_manager', 'staff']::public.user_role[]));

create policy purchase_requests_delete on public.purchase_requests
for delete
using (public.has_project_role(project_id, array['project_manager']::public.user_role[]));

-- asset health + analytics
create policy asset_health_scores_select on public.asset_health_scores
for select
using (public.has_project_access(public.project_id_for_hardware(hardware_id)));

create policy asset_health_scores_insert on public.asset_health_scores
for insert
with check (
  public.has_project_role(public.project_id_for_hardware(hardware_id), array['project_manager', 'staff']::public.user_role[])
);

create policy asset_health_scores_update on public.asset_health_scores
for update
using (
  public.has_project_role(public.project_id_for_hardware(hardware_id), array['project_manager', 'staff']::public.user_role[])
)
with check (
  public.has_project_role(public.project_id_for_hardware(hardware_id), array['project_manager', 'staff']::public.user_role[])
);

create policy asset_health_scores_delete on public.asset_health_scores
for delete
using (
  public.has_project_role(public.project_id_for_hardware(hardware_id), array['project_manager']::public.user_role[])
);

create policy analytics_snapshots_select on public.analytics_snapshots
for select
using (public.has_project_access(proj