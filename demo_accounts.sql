-- AIMS Demo Accounts Setup
-- ==========================
-- STEP 1: Create these 4 users MANUALLY in Supabase Dashboard
--         Go to: Authentication > Add User > Email
--
--   1. superadmin@aims.com    / Admin123!
--   2. kkm.admin@aims.com     / Admin123!
--   3. tech.kuantan@aims.com   / Admin123!
--   4. user.emergency@aims.com / Admin123!
--
-- STEP 2: After creating all 4 users, run this SQL script below.
-- It will configure their profiles, roles, and project memberships.

-- IMPORTANT: Replace the UUIDs below with the ACTUAL auth.users UUIDs
-- that Supabase generated when you created the users.
-- You can find them in: Authentication > Users > click on each user

-- ============================================================
-- PLACEHOLDER UUIDs — REPLACE WITH REAL ONES FROM SUPABASE AUTH
-- ============================================================

-- After you create users in Supabase Auth, copy each user's UUID and
-- paste it here. Then run this script.

DO $$
DECLARE
  -- REPLACE THESE with real auth.users IDs from Supabase Dashboard
  v_superadmin_id uuid;
  v_project_admin_id uuid;
  v_technician_id uuid;
  v_dept_user_id uuid;
BEGIN
  -- Look up real user IDs by email
  SELECT id INTO v_superadmin_id FROM auth.users WHERE email = 'superadmin@aims.com';
  SELECT id INTO v_project_admin_id FROM auth.users WHERE email = 'kkm.admin@aims.com';
  SELECT id INTO v_technician_id FROM auth.users WHERE email = 'tech.kuantan@aims.com';
  SELECT id INTO v_dept_user_id FROM auth.users WHERE email = 'user.emergency@aims.com';

  -- Guard: skip if users don't exist yet
  IF v_superadmin_id IS NULL THEN
    RAISE NOTICE 'superadmin@aims.com not found. Create users in Auth first!';
    RETURN;
  END IF;

  -- =====================
  -- 1. SUPER ADMIN
  -- =====================
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (v_superadmin_id, 'superadmin@aims.com', 'Super Administrator', 'super_admin')
  ON CONFLICT (id) DO UPDATE SET role = 'super_admin', full_name = 'Super Administrator';

  -- =====================
  -- 2. PROJECT ADMIN (KKM)
  -- =====================
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (v_project_admin_id, 'kkm.admin@aims.com', 'KKM Project Admin', 'project_admin')
  ON CONFLICT (id) DO UPDATE SET role = 'project_admin', full_name = 'KKM Project Admin';

  -- Create KKM project if not exists
  INSERT INTO public.projects (id, name, code, description)
  VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Kementerian Kesihatan Malaysia', 'KKM', 'Ministry of Health IT asset management')
  ON CONFLICT (id) DO NOTHING;

  -- Add project membership
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', v_project_admin_id, 'project_admin')
  ON CONFLICT (project_id, user_id) DO UPDATE SET role = 'project_admin';

  -- Also add superadmin to KKM project
  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', v_superadmin_id, 'super_admin')
  ON CONFLICT (project_id, user_id) DO NOTHING;

  -- =====================
  -- 3. TECHNICIAN (KKM > Kuantan)
  -- =====================
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (v_technician_id, 'tech.kuantan@aims.com', 'Ahmad Razak', 'technician')
  ON CONFLICT (id) DO UPDATE SET role = 'technician', full_name = 'Ahmad Razak';

  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', v_technician_id, 'technician')
  ON CONFLICT (project_id, user_id) DO UPDATE SET role = 'technician';

  -- =====================
  -- 4. DEPARTMENT USER (Emergency, Hospital Kuantan)
  -- =====================

  -- Create KKM vendor + contract + region + state + facility + department chain
  INSERT INTO public.vendors (id, project_id, name, email, status)
  VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Medic IT Solutions', 'info@medicit.my', 'active')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.contracts (id, project_id, vendor_id, contract_number, start_date, end_date, value)
  VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'KKM-CTR-001', '2026-01-01', '2029-12-31', 1500000.00)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.regions (id, contract_id, name, code)
  VALUES ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'East Coast', 'EC')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.states (id, region_id, name, code)
  VALUES ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Pahang', 'PHG')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.facilities (id, state_id, name, code, address)
  VALUES ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Hospital Kuantan', 'HKTN', 'Jalan Tanah Putih, 25100 Kuantan')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.departments (id, facility_id, name, code)
  VALUES ('11111111-2222-3333-4444-555555555555', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'Emergency', 'EMRG')
  ON CONFLICT (id) DO NOTHING;

  -- Set department user profile with assigned department
  INSERT INTO public.profiles (id, email, full_name, role, assigned_department_id, assigned_facility_id)
  VALUES (
    v_dept_user_id,
    'user.emergency@aims.com',
    'Nur Aisyah',
    'department_user',
    '11111111-2222-3333-4444-555555555555',
    'ffffffff-ffff-ffff-ffff-ffffffffffff'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'department_user',
    full_name = 'Nur Aisyah',
    assigned_department_id = '11111111-2222-3333-4444-555555555555',
    assigned_facility_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', v_dept_user_id, 'department_user')
  ON CONFLICT (project_id, user_id) DO UPDATE SET role = 'department_user';

  -- =====================
  -- 5. SEED DEMO ASSETS (for Emergency Dept)
  -- =====================
  INSERT INTO public.hardware (id, department_id, asset_tag, serial_number, status, pic_name, contact_number, running_number, type_hardware, brand, model, health_score)
  VALUES
    (gen_random_uuid(), '11111111-2222-3333-4444-555555555555', 'KKM-PC-001', 'SNDELL101', 'active', 'Nur Aisyah', '0131234567', 'PC-101', 'pc', 'Dell', 'OptiPlex 7090', 95),
    (gen_random_uuid(), '11111111-2222-3333-4444-555555555555', 'KKM-LPT-001', 'SNHP201', 'active', 'Nur Aisyah', '0131234567', 'LPT-201', 'laptop', 'HP', 'EliteBook 840 G8', 88),
    (gen_random_uuid(), '11111111-2222-3333-4444-555555555555', 'KKM-PRT-001', 'SNBR301', 'in_repair', 'Nur Aisyah', '0131234567', 'PRT-301', 'printer', 'Brother', 'MFC-L8900CDW', 45),
    (gen_random_uuid(), '11111111-2222-3333-4444-555555555555', 'KKM-SVR-001', 'SNHPE401', 'active', 'Dr. Azlan', '0139876543', 'SVR-401', 'server', 'HPE', 'ProLiant DL380 Gen10', 92);

  RAISE NOTICE 'Demo accounts setup complete!';
END $$;
