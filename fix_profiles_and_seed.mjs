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

  // First, check what profiles exist and what auth users exist
  console.log('\n=== AUTH USERS ===');
  const authUsers = await ssh.execCommand(`docker exec -i supabase-db psql -U postgres -d postgres`, {
    stdin: `SELECT id, email, raw_user_meta_data FROM auth.users;`
  });
  console.log(authUsers.stdout || authUsers.stderr);

  console.log('\n=== EXISTING PROFILES ===');
  const profiles = await ssh.execCommand(`docker exec -i supabase-db psql -U postgres -d postgres`, {
    stdin: `SELECT * FROM public.profiles;`
  });
  console.log(profiles.stdout || profiles.stderr);

  // Check if the profile creation trigger exists
  console.log('\n=== PROFILE CREATION TRIGGER ===');
  const trigger = await ssh.execCommand(`docker exec -i supabase-db psql -U postgres -d postgres`, {
    stdin: `SELECT trigger_name, event_manipulation, action_statement FROM information_schema.triggers WHERE event_object_schema = 'auth' AND event_object_table = 'users';`
  });
  console.log(trigger.stdout || trigger.stderr);

  // Insert profiles manually based on auth users
  console.log('\n=== CREATING PROFILES MANUALLY ===');
  const createProfiles = `
    INSERT INTO public.profiles (id, email, full_name, role)
    SELECT 
      id,
      email,
      COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
      COALESCE(raw_user_meta_data->>'role', 'viewer')::public.user_role
    FROM auth.users
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role;
    
    SELECT id, email, role, full_name FROM public.profiles;
  `;
  const result = await ssh.execCommand(`docker exec -i supabase-db psql -U postgres -d postgres`, {
    stdin: createProfiles
  });
  console.log(result.stdout || result.stderr);

  // Now re-run seed_tickets and demo_accounts
  console.log('\n=== RE-RUNNING DEMO_ACCOUNTS.SQL ===');
  const fs = await import('fs');
  const path = await import('path');
  const demoSql = fs.readFileSync(path.join(process.cwd(), 'demo_accounts.sql'), 'utf8');
  const demoResult = await ssh.execCommand(`docker exec -i supabase-db psql -U postgres -d postgres`, { stdin: demoSql });
  console.log(demoResult.stdout ? demoResult.stdout.substring(0, 500) : '');
  if (demoResult.stderr) console.log('Notices:', demoResult.stderr.substring(0, 500));

  console.log('\n=== RE-RUNNING SEED_TICKETS.SQL ===');
  const ticketSql = fs.readFileSync(path.join(process.cwd(), 'seed_tickets.sql'), 'utf8');
  const ticketResult = await ssh.execCommand(`docker exec -i supabase-db psql -U postgres -d postgres`, { stdin: ticketSql });
  console.log(ticketResult.stdout ? ticketResult.stdout.substring(0, 500) : '');
  if (ticketResult.stderr) console.log('Notices:', ticketResult.stderr.substring(0, 500));

  console.log('\n=== FINAL PROFILE CHECK ===');
  const finalProfiles = await ssh.execCommand(`docker exec -i supabase-db psql -U postgres -d postgres`, {
    stdin: `SELECT id, email, role, full_name, region_id FROM public.profiles;`
  });
  console.log(finalProfiles.stdout || finalProfiles.stderr);

  ssh.dispose();
}

run().catch(err => {
  console.error('Failed:', err.message || err);
  if (ssh) ssh.dispose();
});
