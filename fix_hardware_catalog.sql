-- AIMS hardware catalog support.
-- Run this before using the Projector option in Add Hardware on Supabase.

ALTER TYPE public.hardware_type ADD VALUE IF NOT EXISTS 'projector';
