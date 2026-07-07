import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();

async function check() {
  await ssh.connect({ host: '192.168.0.115', username: 'root', password: '281198' });

  const r = await ssh.execCommand(`docker exec supabase-db psql -U postgres -d postgres -c "SELECT id, asset_tag, type_hardware::text, cpu, ram, storage, hardware_type_id, spec_category_id FROM public.hardware ORDER BY asset_tag;"`);
  console.log('=== Hardware Specs ===');
  console.log(r.stdout);

  ssh.dispose();
}
check().catch(e => { console.error(e.message); ssh.dispose(); process.exit(1); });