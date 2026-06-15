import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();

async function check() {
  await ssh.connect({ host: '192.168.0.115', username: 'root', password: '281198' });

  const r = await ssh.execCommand(`docker exec supabase-db psql -U postgres -d postgres -c "SELECT id, asset_tag, department_id FROM hardware;"`);
  console.log('=== Hardware department_id ===');
  console.log(r.stdout);

  const r2 = await ssh.execCommand(`docker exec supabase-db psql -U postgres -d postgres -c "SELECT id, name, facility_id FROM departments;"`);
  console.log('\n=== Departments ===');
  console.log(r2.stdout);

  ssh.dispose();
}
check().catch(e => { console.error(e.message); ssh.dispose(); process.exit(1); });