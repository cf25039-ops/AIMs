import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();

async function check() {
  await ssh.connect({ host: '192.168.0.115', username: 'root', password: '281198' });

  const q = `docker exec supabase-db psql -U postgres -d postgres -c "SELECT d.name as department, ht.name as hw_type, sc.name as spec, h.asset_tag FROM hardware h JOIN departments d ON d.id = h.department_id JOIN hardware_types ht ON ht.id = h.hardware_type_id LEFT JOIN spec_categories sc ON sc.id = h.spec_category_id ORDER BY d.name, h.asset_tag;"`;
  const r = await ssh.execCommand(q);
  console.log('=== Full hardware mapping ===');
  console.log(r.stdout);

  ssh.dispose();
}
check().catch(e => { console.error(e.message); ssh.dispose(); process.exit(1); });