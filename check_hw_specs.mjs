import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();

async function check() {
  await ssh.connect({ host: '192.168.0.115', username: 'root', password: '281198' });

  const r = await ssh.execCommand(`docker exec supabase-db psql -U postgres -d postgres -c "SELECT id, asset_tag, type_hardware, cpu, ram, storage, hardware_type_id, spec_category_id FROM public.hardware;"`);
  console.log(r.stdout);

  const r2 = await ssh.execCommand(`docker exec supabase-db psql -U postgres -d postgres -c "SELECT sc.name as spec_name, sc.hardware_type_id, ht.name as type_name, sr.rule_type, sr.rule_operator, sr.rule_value FROM public.spec_categories sc JOIN public.hardware_types ht ON ht.id = sc.hardware_type_id LEFT JOIN public.spec_rules sr ON sr.spec_category_id = sc.id ORDER BY sc.sort_order, sr.id;"`);
  console.log(r2.stdout);

  ssh.dispose();
}
check().catch(e => { console.error(e.message); ssh.dispose(); process.exit(1); });