-- AIMS V5 Phase 2 Migration Script
-- Execute this in the Supabase SQL Editor

-- 1. Add Asset Custodianship Columns to Hardware
ALTER TABLE public.hardware
ADD COLUMN IF NOT EXISTS assigned_user varchar(120),
ADD COLUMN IF NOT EXISTS assigned_department varchar(120),
ADD COLUMN IF NOT EXISTS custodian_team varchar(120),
ADD COLUMN IF NOT EXISTS physical_room varchar(120);

-- 2. Add 'triaged' to ticket_status enum
ALTER TYPE public.ticket_status ADD VALUE IF NOT EXISTS 'triaged' AFTER 'open';

-- 3. Enhance Audit Logs (If missing session_id)
ALTER TABLE public.audit_logs
ADD COLUMN IF NOT EXISTS session_id varchar(120),
ADD COLUMN IF NOT EXISTS browser varchar(120);

-- 4. Granular RBAC Permissions
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS can_transfer_asset boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS can_export_reports boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS can_manage_contracts boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS can_view_financial_data boolean DEFAULT false;
