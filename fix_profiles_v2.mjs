import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function run() {
  console.log('Connecting...');
  await ssh.connect({
    host: '192.168.0.115',
    username: 'root',
    password: '281198',
    readyTimeout: 30000
  });
  console.log('Connected!');

  // Check profiles table schema
  console.log('\n=== PROFILES TABLE SCHEMA ===');
  const schema = await ssh.execCommand(`docker exec -i supabase-db psql -U postgres -d postgres`, {
    stdin: `\\d public.profiles;`
  });
  console.log(schema.stdout || schema.stderr);

  // Check if there's a trigger on auth.users for profile creation
  console.log('\n=== CHECK FUNCTIONS FOR PROFILE CREATION ===');
  const funcs = await ssh.execCommand(`docker exec -i supabase-db psql -U postgres -d postgres`, {
    stdin: `SELECT proname, prosrc FROM pg_proc WHERE prosrc LIKE '%profiles%' AND proname LIKE '%user%' OR proname LIKE '%profile%' LIMIT 5;`
  });
  console.log(funcs.stdout || funcs.stderr);

  // Manually insert profiles with correct columns
  console.log('\n=== INSERT PROFILES DIRECTLY ===');
  const insertSql = `
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES 
      ('724effac-5712-4f75-814f-431adc4c0884', 'superadmin@aims.com', 'Super Admin', 'super_admin'),
      ('04dee92b-7ddd-46c0-a804-78c70cd7af81', 'admin@aims.com', 'Admin User', 'admin'),
      ('f6bf796f-c463-4909-82de-d454fa7edfad', 'technician@aims.com', 'Technician User', 'technician'),
      ('c9f2d78a-fce2-46c2-9eaa-8bf2a51ef295', 'viewer@aims.com', 'Viewer User', 'viewer')
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role;
  `;
  const insert = await ssh.execCommand(`docker exec -i supabase-db psql -U postgres -d postgres`, { stdin: insertSql });
  console.log(insert.stdout || insert.stderr);

  // Verify profiles
  console.log('\n=== VERIFY PROFILES ===');
  const verify = await ssh.execCommand(`docker exec -i supabase-db psql -U postgres -d postgres`, {
    stdin: `SELECT id, email, role, full_name FROM public.profiles;`
  });
  console.log(verify.stdout || verify.stderr);

  // Check data counts
  console.log('\n=== DATA SUMMARY ===');
  const counts = await ssh.execCommand(`docker exec -i supabase-db psql -U postgres -d postgres`, {
    stdin: `
    SELECT 'profiles' as tbl, count(*) FROM profiles
    UNION ALL SELECT 'regions', count(*) FROM regions
    UNION ALL SELECT 'states', count(*) FROM states
    UNION ALL SELECT 'facilities', count(*) FROM facilities
    UNION ALL SELECT 'departments', count(*) FROM departments
    UNION ALL SELECT 'hardware', count(*) FROM hardware
    UNION ALL SELECT 'repair_tickets', count(*) FROM repair_tickets
    UNION ALL SELECT 'projects', count(*) FROM projects
    UNION ALL SELECT 'vendors', count(*) FROM vendors
    UNION ALL SELECT 'contracts', count(*) FROM contracts
    ORDER BY 1;
    `
  });
  console.log(counts.stdout || counts.stderr);

  ssh.dispose();
}

run().catch(err => {
  console.error('Failed:', err.message || err);
  if (ssh) ssh.dispose();
});
