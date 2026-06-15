import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function run() {
  console.log('Connecting to remote VPS 192.168.0.115...');
  await ssh.connect({
    host: '192.168.0.115',
    username: 'root',
    password: '281198',
    readyTimeout: 30000
  });
  console.log('Connected!');

  console.log('\n=== WEB APP STATUS ===');
  const webPs = await ssh.execCommand('docker ps --filter "name=aims-web" --format "{{.Names}}: {{.Status}} | Ports: {{.Ports}}"');
  console.log(webPs.stdout || 'Not running');

  console.log('\n=== WEB APP LOGS ===');
  const webLogs = await ssh.execCommand('docker logs aims-web --tail 10 2>&1');
  console.log(webLogs.stdout || webLogs.stderr);

  console.log('\n=== TEST WEB APP HTTP ===');
  const curl = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login 2>&1');
  console.log('HTTP Status for /login:', curl.stdout.trim());

  console.log('\n=== TEST SUPABASE API ===');
  const apiTest = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/rest/v1/ 2>&1');
  console.log('HTTP Status for Supabase REST:', apiTest.stdout.trim());

  console.log('\n=== ALL RUNNING CONTAINERS ===');
  const allPs = await ssh.execCommand('docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>&1');
  console.log(allPs.stdout);

  console.log('\n=== CREATE DEMO AUTH USERS ===');
  // Create demo users in Supabase Auth using the REST API
  const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc4ODA4ODcwLCJleHAiOjE5MzY0ODg4NzB9.j07_TV5a3HfEkV3CgUA4TCFhHVhBhd5qQ5X23O5MacY';
  const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3Nzg4MDg4NzAsImV4cCI6MTkzNjQ4ODg3MH0.V0gaMYY_DWSP4dyMY6KaZZFuxMrCzzdJCR0CsUjuk_Y';
  
  const users = [
    { email: 'superadmin@aims.com', password: 'Admin@123', role: 'super_admin', full_name: 'Super Admin' },
    { email: 'admin@aims.com', password: 'Admin@123', role: 'admin', full_name: 'Admin User' },
    { email: 'technician@aims.com', password: 'Tech@123', role: 'technician', full_name: 'Technician User' },
    { email: 'viewer@aims.com', password: 'View@123', role: 'viewer', full_name: 'Viewer User' }
  ];

  for (const user of users) {
    console.log(`\nCreating user: ${user.email}...`);
    const createCmd = `curl -s -X POST 'http://localhost:8000/auth/v1/admin/users' \
      -H 'Authorization: Bearer ${SERVICE_KEY}' \
      -H 'apikey: ${ANON_KEY}' \
      -H 'Content-Type: application/json' \
      -d '{"email":"${user.email}","password":"${user.password}","email_confirm":true,"user_metadata":{"full_name":"${user.full_name}","role":"${user.role}"}}'`;
    
    const result = await ssh.execCommand(createCmd);
    const response = result.stdout || result.stderr;
    try {
      const parsed = JSON.parse(response);
      if (parsed.id) {
        console.log(`  ✅ Created: ${user.email} (ID: ${parsed.id.substring(0,8)}...)`);
      } else if (parsed.msg) {
        console.log(`  ⚠️ ${parsed.msg}`);
      } else {
        console.log(`  Response: ${response.substring(0, 200)}`);
      }
    } catch {
      console.log(`  Response: ${response.substring(0, 200)}`);
    }
  }

  // Now run demo_accounts.sql again to update profiles
  console.log('\n=== RE-RUN DEMO ACCOUNTS SQL ===');
  const demoSql = `
    -- Update profiles with correct roles for demo accounts
    UPDATE public.profiles SET role = 'super_admin', full_name = 'Super Admin' 
    WHERE email = 'superadmin@aims.com';
    UPDATE public.profiles SET role = 'admin', full_name = 'Admin User' 
    WHERE email = 'admin@aims.com';
    UPDATE public.profiles SET role = 'technician', full_name = 'Technician User' 
    WHERE email = 'technician@aims.com';
    UPDATE public.profiles SET role = 'viewer', full_name = 'Viewer User' 
    WHERE email = 'viewer@aims.com';
    
    SELECT id, email, role, full_name FROM public.profiles;
  `;
  const updateProfiles = await ssh.execCommand(`docker exec -i supabase-db psql -U postgres -d postgres`, { stdin: demoSql });
  console.log(updateProfiles.stdout || updateProfiles.stderr);

  ssh.dispose();
}

run().catch(err => {
  console.error('Failed:', err.message || err);
  if (ssh) ssh.dispose();
});
