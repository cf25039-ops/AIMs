import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function run() {
  console.log('Connecting...');
  await ssh.connect({ host: '192.168.0.115', username: 'root', password: '281198', readyTimeout: 30000 });

  // Insert profiles with correct enum values
  // Available roles: super_admin, project_manager, project_admin, technician, staff, department_user, viewer
  console.log('\n=== INSERTING PROFILES ===');
  const insertSql = `
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES 
      ('724effac-5712-4f75-814f-431adc4c0884', 'superadmin@aims.com', 'Super Admin', 'super_admin'),
      ('04dee92b-7ddd-46c0-a804-78c70cd7af81', 'admin@aims.com', 'Admin User', 'project_admin'),
      ('f6bf796f-c463-4909-82de-d454fa7edfad', 'technician@aims.com', 'Technician User', 'technician'),
      ('c9f2d78a-fce2-46c2-9eaa-8bf2a51ef295', 'viewer@aims.com', 'Viewer User', 'viewer')
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role;
  `;
  const insert = await ssh.execCommand(`docker exec -i supabase-db psql -U postgres -d postgres`, { stdin: insertSql });
  console.log(insert.stdout || insert.stderr);

  // Verify
  console.log('\n=== PROFILES CREATED ===');
  const verify = await ssh.execCommand(`docker exec -i supabase-db psql -U postgres -d postgres`, {
    stdin: `SELECT id, email, role, full_name FROM public.profiles;`
  });
  console.log(verify.stdout || verify.stderr);

  // Now seed tickets - need hardware and assigned technician
  console.log('\n=== ASSIGNING TECHNICIAN TO FACILITY ===');
  const assignSql = `
    -- Assign technician to first facility
    UPDATE public.profiles 
    SET assigned_facility_id = (SELECT id FROM facilities LIMIT 1)
    WHERE email = 'technician@aims.com';
    
    -- Assign admin to first facility too
    UPDATE public.profiles 
    SET assigned_facility_id = (SELECT id FROM facilities LIMIT 1)
    WHERE email = 'admin@aims.com';
  `;
  const assign = await ssh.execCommand(`docker exec -i supabase-db psql -U postgres -d postgres`, { stdin: assignSql });
  console.log(assign.stdout || assign.stderr);

  // Verify hardware exists
  console.log('\n=== HARDWARE CHECK ===');
  const hw = await ssh.execCommand(`docker exec -i supabase-db psql -U postgres -d postgres`, {
    stdin: `SELECT id, serial_number, type_hardware, status FROM hardware LIMIT 5;`
  });
  console.log(hw.stdout || hw.stderr);

  // Create some repair tickets
  console.log('\n=== CREATING SAMPLE TICKETS ===');
  const ticketSql = `
    DO $$
    DECLARE
      v_hw_id uuid;
      v_tech_id uuid;
    BEGIN
      SELECT id INTO v_hw_id FROM hardware LIMIT 1;
      SELECT id INTO v_tech_id FROM profiles WHERE email = 'technician@aims.com';
      
      IF v_hw_id IS NOT NULL AND v_tech_id IS NOT NULL THEN
        -- Delete any old sample tickets
        DELETE FROM repair_tickets WHERE title IN ('Monitor tidak berfungsi', 'Keyboard rosak', 'Server down');

        INSERT INTO repair_tickets (hardware_id, assigned_to, title, description, status, severity)
        VALUES
          (v_hw_id, v_tech_id, 'Monitor tidak berfungsi', 'Monitor memaparkan garis hitam di bahagian atas skrin', 'open', 'medium'),
          (v_hw_id, v_tech_id, 'Keyboard rosak', 'Beberapa kekunci keyboard tidak responsif', 'in_repair', 'low'),
          (v_hw_id, v_tech_id, 'Server down', 'Server utama tidak dapat diakses', 'open', 'critical');
        RAISE NOTICE 'Created 3 sample tickets';
      ELSE
        RAISE NOTICE 'Missing hw (%) or tech (%)', v_hw_id, v_tech_id;
      END IF;
    END
    $$;
  `;
  const tickets = await ssh.execCommand(`docker exec -i supabase-db psql -U postgres -d postgres`, { stdin: ticketSql });
  console.log(tickets.stdout || tickets.stderr);

  // Final summary
  console.log('\n=== FINAL DATA SUMMARY ===');
  const summary = await ssh.execCommand(`docker exec -i supabase-db psql -U postgres -d postgres`, {
    stdin: `
    SELECT 'profiles' as tbl, count(*) FROM profiles
    UNION ALL SELECT 'hardware', count(*) FROM hardware
    UNION ALL SELECT 'repair_tickets', count(*) FROM repair_tickets
    UNION ALL SELECT 'regions', count(*) FROM regions
    UNION ALL SELECT 'states', count(*) FROM states
    UNION ALL SELECT 'facilities', count(*) FROM facilities
    UNION ALL SELECT 'departments', count(*) FROM departments
    UNION ALL SELECT 'projects', count(*) FROM projects
    UNION ALL SELECT 'vendors', count(*) FROM vendors
    UNION ALL SELECT 'contracts', count(*) FROM contracts
    ORDER BY 1;
    `
  });
  console.log(summary.stdout || summary.stderr);

  ssh.dispose();
}

run().catch(err => { console.error('Failed:', err.message); });
