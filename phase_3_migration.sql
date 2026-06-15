-- AIMS V5 Phase 3 Migration Script
-- Execute this in the Supabase SQL Editor

-- 1. AI Architecture Preparation
ALTER TABLE public.hardware
ADD COLUMN IF NOT EXISTS health_score integer DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100),
ADD COLUMN IF NOT EXISTS anomaly_flag boolean DEFAULT false;

-- 2. Lightweight Automation Triggers

-- Trigger Function: Reduce health score on new repair tickets
CREATE OR REPLACE FUNCTION public.auto_reduce_health_score()
RETURNS TRIGGER AS $$
BEGIN
  -- If a new ticket is opened and it's a repair/issue (not informational)
  IF NEW.status = 'open' AND NEW.severity IN ('critical', 'high', 'medium') THEN
    UPDATE public.hardware 
    SET health_score = GREATEST(health_score - 
      CASE NEW.severity 
        WHEN 'critical' THEN 20 
        WHEN 'high' THEN 10 
        WHEN 'medium' THEN 5 
        ELSE 0 
      END, 0)
    WHERE id = NEW.hardware_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger
DROP TRIGGER IF EXISTS trg_reduce_health_score ON public.repair_tickets;
CREATE TRIGGER trg_reduce_health_score
AFTER INSERT ON public.repair_tickets
FOR EACH ROW
EXECUTE FUNCTION public.auto_reduce_health_score();
