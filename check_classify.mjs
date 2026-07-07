import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();

async function check() {
  await ssh.connect({ host: '192.168.0.115', username: 'root', password: '281198' });

  const r = await ssh.execCommand(`docker exec supabase-db psql -U postgres -d postgres -c "SELECT h.asset_tag, sc.name as spec_category FROM public.hardware h LEFT JOIN public.spec_categories sc ON sc.id = h.spec_category_id ORDER BY h.asset_tag;"`);
  console.log(r.stdout);

  ssh.dispose();
}
check().catch(e => { console.error(e.message); ssh.dispose(); process.exit(1); });