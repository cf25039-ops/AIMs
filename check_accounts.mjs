import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();

async function check() {
  await ssh.connect({ host: '192.168.0.115', username: 'root', password: '281198' });

  const r1 = await ssh.execCommand(`docker exec supabase-db psql -U postgres -d postgres -c "SELECT u.id, u.email, u.created_at, p.full_name, p.role FROM auth.users u LEFT JOIN public.profiles p ON p.id = u.id ORDER BY u.created_at;"`);
  console.log(r1.stdout);

  ssh.dispose();
}
check().catch(e => { console.error(e.message); ssh.dispose(); process.exit(1); });