import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function run() {
  console.log('Connecting to VPS...');
  await ssh.connect({ host: '192.168.0.115', username: 'root', password: '281198' });

  // 1. Clean existing test notifications
  console.log('\nCleaning existing notifications and old test tickets...');
  await ssh.execCommand(`docker exec -i supabase-db psql -U postgres -d postgres`, {
    stdin: `
      DELETE FROM notifications;
      DELETE FROM repair_tickets WHERE title LIKE 'Test Trigger%';
    `
  });

  // 2. Select hardware IDs for IT Support (HQ Menara 1) and Operations (Cyberjaya Branch)
  console.log('\nFinding hardware in different facilities...');
  const hwListResult = await ssh.execCommand(`docker exec -i supabase-db psql -U postgres -d postgres`, {
    stdin: `
      SELECT h.id, h.serial_number, h.type_hardware, d.name as dept_name, f.name as facility_name
      FROM hardware h
      JOIN departments d ON h.department_id = d.id
      JOIN facilities f ON d.facility_id = f.id;
    `
  });
  console.log(hwListResult.stdout);

  // Let's perform a query in SQL directly to insert tickets and view notifications
  console.log('\n--- EXECUTING TEST 1: Insert ticket for HQ Menara 1 hardware ---');
  const test1Sql = `
    DO $$
    DECLARE
      v_hq_hw_id uuid;
    BEGIN
      -- Select hardware in IT Support (HQ Menara 1)
      SELECT h.id INTO v_hq_hw_id
      FROM hardware h
      JOIN departments d ON h.department_id = d.id
      WHERE d.facility_id = '66666666-6666-6666-6666-666666666661'
      LIMIT 1;

      IF v_hq_hw_id IS NOT NULL THEN
        INSERT INTO repair_tickets (hardware_id, title, description, status, severity)
        VALUES (v_hq_hw_id, 'Test Trigger HQ', 'Ini adalah tiket ujian untuk fasiliti HQ Menara 1', 'open', 'critical');
        RAISE NOTICE 'Test 1 ticket inserted successfully';
      ELSE
        RAISE NOTICE 'No hardware found in HQ Menara 1';
      END IF;
    END
    $$;
  `;
  const test1Result = await ssh.execCommand(`docker exec -i supabase-db psql -U postgres -d postgres`, { stdin: test1Sql });
  console.log(test1Result.stdout || test1Result.stderr);

  console.log('\n--- CHECK NOTIFICATIONS AFTER TEST 1 ---');
  const notif1Result = await ssh.execCommand(`docker exec -i supabase-db psql -U postgres -d postgres`, {
    stdin: `
      SELECT p.email, p.role, n.title, n.body, n.channel 
      FROM notifications n
      JOIN profiles p ON n.user_id = p.id;
    `
  });
  console.log(notif1Result.stdout);

  // Clear notifications for test 2
  await ssh.execCommand(`docker exec -i supabase-db psql -U postgres -d postgres`, { stdin: `DELETE FROM notifications;` });

  console.log('\n--- EXECUTING TEST 2: Insert ticket for Cyberjaya Branch hardware ---');
  const test2Sql = `
    DO $$
    DECLARE
      v_cyb_hw_id uuid;
    BEGIN
      -- Select hardware in Operations (Cyberjaya Branch)
      SELECT h.id INTO v_cyb_hw_id
      FROM hardware h
      JOIN departments d ON h.department_id = d.id
      WHERE d.facility_id = '66666666-6666-6666-6666-666666666662'
      LIMIT 1;

      IF v_cyb_hw_id IS NOT NULL THEN
        INSERT INTO repair_tickets (hardware_id, title, description, status, severity)
        VALUES (v_cyb_hw_id, 'Test Trigger Cyberjaya', 'Ini adalah tiket ujian untuk fasiliti Cyberjaya Branch', 'open', 'medium');
        RAISE NOTICE 'Test 2 ticket inserted successfully';
      ELSE
        RAISE NOTICE 'No hardware found in Cyberjaya Branch';
      END IF;
    END
    $$;
  `;
  const test2Result = await ssh.execCommand(`docker exec -i supabase-db psql -U postgres -d postgres`, { stdin: test2Sql });
  console.log(test2Result.stdout || test2Result.stderr);

  console.log('\n--- CHECK NOTIFICATIONS AFTER TEST 2 (Should be empty since no users assigned to Cyberjaya) ---');
  const notif2Result = await ssh.execCommand(`docker exec -i supabase-db psql -U postgres -d postgres`, {
    stdin: `
      SELECT p.email, p.role, n.title, n.body 
      FROM notifications n
      JOIN profiles p ON n.user_id = p.id;
    `
  });
  console.log(notif2Result.stdout || 'No notifications found!');

  ssh.dispose();
}

run().catch(console.error);
