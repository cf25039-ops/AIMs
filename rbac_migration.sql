-- AIMS RBAC Migration
-- Run this in the Supabase SQL Editor BEFORE creating demo accounts.
-- This extends the existing user_role enum and adds scoping columns to profiles.

BEGIN;

-- 1. Extend user_role enum with new values
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'project_admin';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'technician';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'department_user';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'viewer';

COMMIT;

-- NOTE: ALTER TYPE ADD VALUE cannot run inside a transaction block on some PG versions.
-- If the above fails, run each ALTER TYPE statement individually outside BEGIN/COMMIT.

-- 2. Add scoping columns to profiles (for department/facility assignment)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS assigned_department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_facility_id uuid REFERENCES public.facilities(id) ON DELETE SET NULL;
