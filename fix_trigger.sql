-- Fix broken trigger: asset_id → hardware_id
-- Run this BEFORE seed_tickets.sql

CREATE OR REPLACE FUNCTION public.auto_reduce_health_score()
RETURNS TRIGGER AS $$
BEGIN
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
