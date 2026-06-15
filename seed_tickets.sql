-- AIMS Dummy Tickets Seed
-- Run this in Supabase SQL Editor after demo_accounts.sql

DO $$
DECLARE
  v_tech_id uuid;
  v_hw1 uuid; -- Dell PC
  v_hw2 uuid; -- HP Laptop
  v_hw3 uuid; -- Brother Printer (in_repair)
  v_hw4 uuid; -- HPE Server
BEGIN
  -- Get technician user id
  SELECT id INTO v_tech_id FROM auth.users WHERE email = 'tech.kuantan@aims.com';

  -- Get hardware IDs from Emergency department
  SELECT id INTO v_hw1 FROM public.hardware WHERE asset_tag = 'KKM-PC-001' LIMIT 1;
  SELECT id INTO v_hw2 FROM public.hardware WHERE asset_tag = 'KKM-LPT-001' LIMIT 1;
  SELECT id INTO v_hw3 FROM public.hardware WHERE asset_tag = 'KKM-PRT-001' LIMIT 1;
  SELECT id INTO v_hw4 FROM public.hardware WHERE asset_tag = 'KKM-SVR-001' LIMIT 1;

  IF v_hw1 IS NULL THEN
    RAISE NOTICE 'Hardware not found. Run demo_accounts.sql first!';
    RETURN;
  END IF;

  -- =====================
  -- TICKET 1: Critical — Server overheating
  -- =====================
  INSERT INTO public.repair_tickets (hardware_id, severity, status, title, description, assigned_to, opened_at, created_at)
  VALUES (
    v_hw4,
    'critical',
    'investigation',
    'Server Room Temperature Critical Alert',
    'ProLiant DL380 Gen10 reporting CPU temperatures exceeding 85°C. Fans running at maximum RPM. Ambient temperature in server room measured at 32°C. HVAC system may have malfunctioned. Risk of thermal shutdown if unresolved within 2 hours.',
    v_tech_id,
    now() - interval '2 hours',
    now() - interval '2 hours'
  ) ON CONFLICT DO NOTHING;

  -- =====================
  -- TICKET 2: High — Printer jam + paper feed
  -- =====================
  INSERT INTO public.repair_tickets (hardware_id, severity, status, title, description, assigned_to, opened_at, created_at)
  VALUES (
    v_hw3,
    'high',
    'in_repair',
    'Printer Recurring Paper Jam — Feed Roller Issue',
    'Brother MFC-L8900CDW experiencing persistent paper jams on tray 2. Paper feed roller appears worn. Multiple users in Emergency dept affected. Toner replacement attempted — issue persists. Recommend roller kit replacement.',
    v_tech_id,
    now() - interval '1 day',
    now() - interval '1 day'
  ) ON CONFLICT DO NOTHING;

  -- =====================
  -- TICKET 3: Medium — Laptop battery degradation
  -- =====================
  INSERT INTO public.repair_tickets (hardware_id, severity, status, title, description, opened_at, created_at)
  VALUES (
    v_hw2,
    'medium',
    'open',
    'Laptop Battery Only Holds 45min Charge',
    'HP EliteBook 840 G8 battery health dropped to 38%. User reports the laptop shuts down unexpectedly during ward rounds. Battery cycle count: 847. Request battery replacement under warranty (expiry: Dec 2026).',
    now() - interval '3 days',
    now() - interval '3 days'
  ) ON CONFLICT DO NOTHING;

  -- =====================
  -- TICKET 4: Low — Desktop slow performance
  -- =====================
  INSERT INTO public.repair_tickets (hardware_id, severity, status, title, description, assigned_to, opened_at, created_at)
  VALUES (
    v_hw1,
    'low',
    'assigned',
    'Desktop Slow Boot & Application Lag',
    'Dell OptiPlex 7090 takes 4+ minutes to reach login screen. Applications (HIS, email) freeze intermittently. Disk utilization at 100% in Task Manager. Suspect failing HDD or excessive startup programs. Scheduled for diagnostic.',
    v_tech_id,
    now() - interval '5 days',
    now() - interval '5 days'
  ) ON CONFLICT DO NOTHING;

  -- =====================
  -- TICKET 5: High — Network connectivity loss
  -- =====================
  INSERT INTO public.repair_tickets (hardware_id, severity, status, title, description, opened_at, created_at)
  VALUES (
    v_hw1,
    'high',
    'open',
    'Intermittent Network Disconnection During Peak Hours',
    'Dell OptiPlex 7090 loses ethernet connectivity between 10am-12pm daily. NIC link light flickers. Tested with different cable — issue persists. Possible NIC hardware fault or switch port issue. Critical for HIS access.',
    now() - interval '6 hours',
    now() - interval '6 hours'
  ) ON CONFLICT DO NOTHING;

  -- =====================
  -- TICKET 6: Medium — Resolved ticket (for history)
  -- =====================
  INSERT INTO public.repair_tickets (hardware_id, severity, status, title, description, assigned_to, opened_at, created_at, updated_at)
  VALUES (
    v_hw2,
    'medium',
    'resolved',
    'Laptop Screen Flickering at Low Brightness',
    'HP EliteBook screen flickers when brightness is set below 30%. Issue confirmed as display driver bug. Resolved by updating Intel UHD Graphics driver to version 31.0.101.4575.',
    v_tech_id,
    now() - interval '10 days',
    now() - interval '10 days',
    now() - interval '8 days'
  ) ON CONFLICT DO NOTHING;

  -- =====================
  -- TICKET 7: Informational — Routine check
  -- =====================
  INSERT INTO public.repair_tickets (hardware_id, severity, status, title, description, opened_at, created_at)
  VALUES (
    v_hw4,
    'informational',
    'resolved',
    'Quarterly Server Health Check Completed',
    'Routine quarterly health check on ProLiant DL380 Gen10. RAID status: optimal. Memory test: passed. PSU redundancy: active. Firmware version current. No issues found. Next check scheduled Q3 2026.',
    now() - interval '15 days',
    now() - interval '15 days'
  ) ON CONFLICT DO NOTHING;

  -- =====================
  -- ADD REPAIR LOGS for realistic activity
  -- =====================
  
  -- Log for printer ticket
  INSERT INTO public.repair_logs (ticket_id, note, created_by, created_at)
  SELECT t.id, 'Inspected feed roller mechanism. Roller surface is glazed and no longer gripping paper. Ordering replacement roller kit (Part: LU9244001).', v_tech_id, now() - interval '20 hours'
  FROM public.repair_tickets t WHERE t.title = 'Printer Recurring Paper Jam — Feed Roller Issue' LIMIT 1;

  INSERT INTO public.repair_logs (ticket_id, note, created_by, created_at)
  SELECT t.id, 'Roller kit ordered from Brother authorised distributor. ETA: 2 working days. Temporary workaround: use tray 1 only.', v_tech_id, now() - interval '18 hours'
  FROM public.repair_tickets t WHERE t.title = 'Printer Recurring Paper Jam — Feed Roller Issue' LIMIT 1;

  -- Log for server ticket
  INSERT INTO public.repair_logs (ticket_id, note, created_by, created_at)
  SELECT t.id, 'Initial assessment: CRAC unit in Server Room B is showing E04 compressor fault. Contacted HVAC vendor (CoolTech Solutions). Temporary portable cooling unit deployed.', v_tech_id, now() - interval '1 hour'
  FROM public.repair_tickets t WHERE t.title = 'Server Room Temperature Critical Alert' LIMIT 1;

  RAISE NOTICE 'Dummy tickets created successfully! 7 tickets + repair logs.';
END $$;
