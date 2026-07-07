import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();

async function check() {
  await ssh.connect({ host: '192.168.0.115', username: 'root', password: '281198' });

  const r1 = await ssh.execCommand(`docker exec supabase-db psql -U postgres -d postgres -c "SELECT count(*) as total FROM auth.users;"`);
  console.log('=== auth.users count ===');
  console.log(r1.stdout);

  const r2 = await ssh.execCommand(`docker exec supabase-db psql -U postgres -d postgres -c "SELECT id, email, created_at, email_confirmed_at IS NOT NULL as confirmed FROM auth.users ORDER BY created_at;"`);
  console.log('=== auth.users list ===');
  console.log(r2.stdout);

  const r3 = await ssh.execCommand(`docker exec supabase-db psql -U postgres -d postgres -c "SELECT id, email, full_name, role FROM public.profiles ORDER BY created_at;"`);
  console.log('=== public.profiles ===');
  console.log(r3.stdout);

  // Check if auth has users but they can't sign in
  const r4 = await ssh.execCommand(`docker exec supabase-db psql -U postgres -d postgres -c "SELECT email, encrypted_password IS NOT NULL as has_password FROM auth.users;"`);
  console.log('=== auth.users passwords ===');
  console.log(r4.stdout);

  ssh.dispose();
}
check().catch(e => { console.error(e.message); ssh.dispose(); process.exit(1); });