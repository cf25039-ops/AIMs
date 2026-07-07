-- =============================================================================
-- Migration: 001_drilldown_tables.sql
-- Purpose: Create hardware_types, spec_categories, spec_rules tables
--          Add FK columns to hardware for drill-down hierarchy
--          Convert hardware_type from enum to FK, link brand/model to tables
-- =============================================================================

-- =============================================================================
-- 1. Create hardware_types table (admin-manageable per contract)
-- =============================================================================
create table if not exists public.hardware_types (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  name varchar(80) not null,
  description text,
  icon varchar(40),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hardware_types_contract_idx on public.hardware_types(contract_id);
create unique index if not exists hardware_types_contract_name_unique on public.hardware_types(contract_id, name);

-- =============================================================================
-- 2. Create spec_categories table (admin-manageable per hardware_type)
-- =============================================================================
create table if not exists public.spec_categories (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  hardware_type_id uuid not null references public.hardware_types(id) on delete cascade,
  name varchar(80) not null,
  description text,
  color varchar(20),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists spec_categories_contract_idx on public.spec_categories(contract_id);
create index if not exists spec_categories_type_idx on public.spec_categories(hardware_type_id);
create unique index if not exists spec_categories_type_name_unique on public.spec_categories(hardware_type_id, name);

-- =============================================================================
-- 3. Create spec_rules table (auto-classification rules per spec_category)
-- =============================================================================
create table if not exists public.spec_rules (
  id uuid primary key default gen_random_uuid(),
  spec_category_id uuid not null references public.spec_categories(id) on delete cascade,
  rule_type varchar(40) not null,
  rule_operator varchar(10) not null default 'eq',
  rule_value varchar(120) not null,
  created_at timestamptz not null default now()
);

create index if not exists spec_rules_category_idx on public.spec_rules(spec_category_id);

-- =============================================================================
-- 4. Add new FK columns to hardware table
-- =============================================================================
alter table public.hardware add column if not exists hardware_type_id uuid references public.hardware_types(id) on delete set null;
alter table public.hardware add column if not exists spec_category_id uuid references public.spec_categories(id) on delete set null;
alter table public.hardware add column if not exists brand_id uuid references public.brands(id) on delete set null;
alter table public.hardware add column if not exists model_id uuid references public.models(id) on delete set null;

create index if not exists hardware_type_idx on public.hardware(hardware_type_id);
create index if not exists hardware_spec_category_idx on public.hardware(spec_category_id);
create index if not exists hardware_brand_idx on public.hardware(brand_id);
create index if not exists hardware_model_idx on public.hardware(model_id);

-- =============================================================================
-- 5. Seed default hardware_types from existing enum values per contract
-- =============================================================================
do $$
declare
  _contract record;
begin
  for _contract in select id from public.contracts loop
    insert into public.hardware_types (contract_id, name, description, sort_order)
    values
      (_contract.id, 'Laptop', 'Laptop / Notebook devices', 1),
      (_contract.id, 'PC', 'Desktop computers', 2),
      (_contract.id, 'Printer', 'Printer devices', 3),
      (_contract.id, 'Server', 'Server hardware', 4),
      (_contract.id, 'Projector', 'Projector devices', 5)
    on conflict do nothing;
  end loop;
end $$;

-- =============================================================================
-- 6. Backfill hardware_type_id from existing enum column
-- =============================================================================
do $$
declare
  _hw record;
  _contract_id uuid;
  _type_id uuid;
begin
  for _hw in select id, type_hardware, department_id from public.hardware loop
    -- resolve contract_id from department chain
    select c.id into _contract_id
    from public.departments d
    join public.facilities f on f.id = d.facility_id
    join public.states s on s.id = f.state_id
    join public.regions r on r.id = s.region_id
    join public.contracts c on c.id = r.contract_id
    where d.id = _hw.department_id;

    if _contract_id is not null then
      select id into _type_id
      from public.hardware_types
      where contract_id = _contract_id
        and lower(name) = lower(_hw.type_hardware::text);

      if _type_id is not null then
        update public.hardware set hardware_type_id = _type_id where id = _hw.id;
      end if;
    end if;
  end loop;
end $$;

-- =============================================================================
-- 7. Backfill brand_id and model_id from existing text columns
-- =============================================================================
do $$
declare
  _hw record;
  _contract_id uuid;
  _brand_id uuid;
  _model_id uuid;
begin
  for _hw in select id, brand, model, department_id from public.hardware loop
    -- resolve contract -> project chain
    select c.project_id into _contract_id
    from public.departments d
    join public.facilities f on f.id = d.facility_id
    join public.states s on s.id = f.state_id
    join public.regions r on r.id = s.region_id
    join public.contracts c on c.id = r.contract_id
    where d.id = _hw.department_id;

    if _contract_id is not null then
      -- upsert brand
      insert into public.brands (project_id, name)
      values (_contract_id, _hw.brand)
      on conflict (project_id, name) do nothing;

      select id into _brand_id
      from public.brands
      where project_id = _contract_id and name = _hw.brand;

      if _brand_id is not null then
        update public.hardware set brand_id = _brand_id where id = _hw.id;
      end if;

      -- upsert model (needs brand_id + asset_type_id)
      -- for now skip model FK since it requires asset_type_id which isn't linked yet
    end if;
  end loop;
end $$;

-- =============================================================================
-- 8. Helper functions for RLS
-- =============================================================================
create or replace function public.project_id_for_hardware_type(p_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select c.project_id
  from public.hardware_types ht
  join public.contracts c on c.id = ht.contract_id
  where ht.id = p_id;
$$;

create or replace function public.project_id_for_spec_category(p_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select c.project_id
  from public.spec_categories sc
  join public.contracts c on c.id = sc.contract_id
  where sc.id = p_id;
$$;

-- =============================================================================
-- 9. Enable RLS and create policies
-- =============================================================================
alter table public.hardware_types enable row level security;
alter table public.spec_categories enable row level security;
alter table public.spec_rules enable row level security;

-- hardware_types policies
create policy hardware_types_select on public.hardware_types
  for select
  using (public.has_project_access(public.project_id_for_hardware_type(id)));

create policy hardware_types_insert on public.hardware_types
  for insert
  with check (public.has_project_role(public.project_id_for_hardware_type(id), array['project_manager', 'project_admin', 'admin', 'super_admin']::public.user_role[]));

create policy hardware_types_update on public.hardware_types
  for update
  using (public.has_project_role(public.project_id_for_hardware_type(id), array['project_manager', 'project_admin', 'admin', 'super_admin']::public.user_role[]))
  with check (public.has_project_role(public.project_id_for_hardware_type(id), array['project_manager', 'project_admin', 'admin', 'super_admin']::public.user_role[]));

create policy hardware_types_delete on public.hardware_types
  for delete
  using (public.has_project_role(public.project_id_for_hardware_type(id), array['project_manager', 'project_admin', 'admin', 'super_admin']::public.user_role[]));

-- spec_categories policies
create policy spec_categories_select on public.spec_categories
  for select
  using (public.has_project_access(public.project_id_for_spec_category(id)));

create policy spec_categories_insert on public.spec_categories
  for insert
  with check (public.has_project_role(public.project_id_for_spec_category(id), array['project_manager', 'project_admin', 'admin', 'super_admin']::public.user_role[]));

create policy spec_categories_update on public.spec_categories
  for update
  using (public.has_project_role(public.project_id_for_spec_category(id), array['project_manager', 'project_admin', 'admin', 'super_admin']::public.user_role[]))
  with check (public.has_project_role(public.project_id_for_spec_category(id), array['project_manager', 'project_admin', 'admin', 'super_admin']::public.user_role[]));

create policy spec_categories_delete on public.spec_categories
  for delete
  using (public.has_project_role(public.project_id_for_spec_category(id), array['project_manager', 'project_admin', 'admin', 'super_admin']::public.user_role[]));

-- spec_rules policies (cascade from spec_categories)
create policy spec_rules_select on public.spec_rules
  for select
  using (public.has_project_access(public.project_id_for_spec_category(spec_category_id)));

create policy spec_rules_insert on public.spec_rules
  for insert
  with check (public.has_project_role(public.project_id_for_spec_category(spec_category_id), array['project_manager', 'project_admin', 'admin', 'super_admin']::public.user_role[]));

create policy spec_rules_update on public.spec_rules
  for update
  using (public.has_project_role(public.project_id_for_spec_category(spec_category_id), array['project_manager', 'project_admin', 'admin', 'super_admin']::public.user_role[]))
  with check (public.has_project_role(public.project_id_for_spec_category(spec_category_id), array['project_manager', 'project_admin', 'admin', 'super_admin']::public.user_role[]));

create policy spec_rules_delete on public.spec_rules
  for delete
  using (public.has_project_role(public.project_id_for_spec_category(spec_category_id), array['project_manager', 'project_admin', 'admin', 'super_admin']::public.user_role[]));
