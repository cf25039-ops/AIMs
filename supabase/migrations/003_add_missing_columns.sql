-- Migration: Add missing columns to hardware and audit_logs tables
-- Created: 2026-06-05

-- Add missing columns to hardware table
ALTER TABLE hardware
ADD COLUMN IF NOT EXISTS assigned_user VARCHAR(120),
ADD COLUMN IF NOT EXISTS assigned_department VARCHAR(120),
ADD COLUMN IF NOT EXISTS custodian_team VARCHAR(120),
ADD COLUMN IF NOT EXISTS physical_room VARCHAR(120);

-- Add missing columns to audit_logs table
ALTER TABLE audit_logs
ADD COLUMN IF NOT EXISTS browser VARCHAR(255),
ADD COLUMN IF NOT EXISTS session_id VARCHAR(128);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_hardware_assigned_user ON hardware(assigned_user);
CREATE INDEX IF NOT EXISTS idx_hardware_physical_room ON hardware(physical_room);
CREATE INDEX IF NOT EXISTS idx_audit_logs_session_id ON audit_logs(session_id);
