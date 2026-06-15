-- AIMS V5 Seed Dataset
-- Execute this in the Supabase SQL Editor to populate dummy data for testing.
-- Schema-verified against aims_init.sql
-- Enums: hardware_status = active|standby|in_repair|in_store|retired|disposed|lost|transferred|reserved|pending_deployment
-- Enums: hardware_type = pc|laptop|printer|server

-- 1. Create a dummy project
INSERT INTO public.projects (id, name, code, description) 
VALUES ('11111111-1111-1111-1111-111111111111', 'Enterprise AIMS Rollout', 'AIMS-01', 'Main enterprise project')
ON CONFLICT (id) DO NOTHING;

-- 2. Create a dummy vendor
INSERT INTO public.vendors (id, project_id, name, email, phone, status) 
VALUES ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Tech Corp Malaysia', 'support@techcorp.my', '03-12345678', 'active')
ON CONFLICT (id) DO NOTHING;

-- 3. Create a dummy contract
INSERT INTO public.contracts (id, project_id, vendor_id, contract_number, start_date, end_date, value) 
VALUES ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'CTR-2026-001', '2026-01-01', '2028-12-31', 500000.00)
ON CONFLICT (id) DO NOTHING;

-- 4. Create Regions
INSERT INTO public.regions (id, contract_id, name, code) VALUES 
('44444444-4444-4444-4444-444444444441', '33333333-3333-3333-3333-333333333333', 'Peninsular Malaysia', 'PM'),
('44444444-4444-4444-4444-444444444442', '33333333-3333-3333-3333-333333333333', 'East Malaysia', 'EM')
ON CONFLICT (id) DO NOTHING;

-- 5. Create States
INSERT INTO public.states (id, region_id, name, code) VALUES 
('55555555-5555-5555-5555-555555555551', '44444444-4444-4444-4444-444444444441', 'Kuala Lumpur', 'KL'),
('55555555-5555-5555-5555-555555555552', '44444444-4444-4444-4444-444444444441', 'Selangor', 'SEL')
ON CONFLICT (id) DO NOTHING;

-- 6. Create Facilities
INSERT INTO public.facilities (id, state_id, name, code, address) VALUES 
('66666666-6666-6666-6666-666666666661', '55555555-5555-5555-5555-555555555551', 'HQ Menara 1', 'HQ1', 'Jalan Sultan Ismail, 50250 KL'),
('66666666-6666-6666-6666-666666666662', '55555555-5555-5555-5555-555555555552', 'Cyberjaya Branch', 'CYB1', 'Persiaran Apec, 63000 Cyberjaya')
ON CONFLICT (id) DO NOTHING;

-- 7. Create Departments
INSERT INTO public.departments (id, facility_id, name, code) VALUES 
('77777777-7777-7777-7777-777777777771', '66666666-6666-6666-6666-666666666661', 'IT Support', 'IT'),
('77777777-7777-7777-7777-777777777772', '66666666-6666-6666-6666-666666666661', 'Finance', 'FIN'),
('77777777-7777-7777-7777-777777777773', '66666666-6666-6666-6666-666666666662', 'Operations', 'OPS')
ON CONFLICT (id) DO NOTHING;

-- 8. Seed Dummy Hardware Assets
INSERT INTO public.hardware (
  id, department_id, asset_tag, serial_number, status, 
  pic_name, contact_number, running_number, type_hardware,
  brand, model, assigned_department, custodian_team, physical_room, health_score
) VALUES 
(
  gen_random_uuid(), '77777777-7777-7777-7777-777777777771',
  'AIMS-PC-001', 'SNDELL001X', 'active', 
  'Ahmad Ali', '0123456789', 'PC-001', 'pc',
  'Dell', 'OptiPlex 7090', 'IT Support', 'IT Tier 1', 'Level 3, Room B', 100
),
(
  gen_random_uuid(), '77777777-7777-7777-7777-777777777772',
  'AIMS-PRT-001', 'SNHP001Y', 'in_repair', 
  'Siti Nurhaliza', '0198765432', 'PRT-001', 'printer',
  'HP', 'LaserJet Pro M404n', 'Finance', 'Admin Team', 'Level 2, Printing Room', 60
),
(
  gen_random_uuid(), '77777777-7777-7777-7777-777777777771',
  'AIMS-PC-002', 'SNDELL002Z', 'active', 
  'Razak Ibrahim', '0112233445', 'PC-002', 'laptop',
  'Dell', 'Latitude 5530', 'IT Support', 'IT Tier 2', 'Level 3, Room A', 85
),
(
  gen_random_uuid(), '77777777-7777-7777-7777-777777777773',
  'AIMS-SVR-001', 'SNHPE001W', 'active', 
  'Tan Wei Ming', '0134567890', 'SVR-001', 'server',
  'HPE', 'ProLiant DL380', 'Operations', 'Infra Team', 'Server Room 1', 95
),
(
  gen_random_uuid(), '77777777-7777-7777-7777-777777777771',
  'AIMS-PC-003', 'SNLG001V', 'standby', 
  'Ahmad Ali', '0123456789', 'PC-003', 'pc',
  'Lenovo', 'ThinkCentre M90q', 'IT Support', 'IT Tier 1', 'Level 3, Room B', 90
),
(
  gen_random_uuid(), '77777777-7777-7777-7777-777777777773',
  'AIMS-SVR-002', 'SNCISCO001U', 'disposed', 
  'Lee Chong Wei', '0145678901', 'SVR-002', 'server',
  'Cisco', 'UCS C220 M6', 'Operations', 'Network Team', 'Comms Room', 0
);
