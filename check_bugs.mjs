import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function check() {
  await ssh.connect({ host: '192.168.0.115', username: 'root', password: '281198' });

  // 1. Check hierarchy chain
  const checks = [
    `-- Facilities count`,
    `SELECT count(*) as total FROM public.facilities;`,
    `-- Departments count`,
    `SELECT count(*) as total FROM public.departments;`,
    `-- Hardware with department_id`,
    `SELECT count(*) as total, count(department_id) as with_dept FROM public.hardware;`,
    `-- Hardware department -> facility chain`,
    `SELECT d.id as dept_id, d.name as dept_name, f.id as fac_id, f.name as fac_name, s.id as state_id, s.name as state_name, r.id as region_id, r.name as region_name, c.id as contract_id, c.contract_number FROM public.hardware h JOIN public.departments d ON d.id = h.department_id JOIN public.facilities f ON f.id = d.facility_id JOIN public.states s ON s.id = f.state_id JOIN public.regions r ON r.id = s.region_id JOIN public.contracts c ON c.id = r.contract_id LIMIT 10;`,
    `-- Spec categories count`,
    `SELECT count(*) as total FROM public.spec_categories;`,
    `-- Hardware types per contract`,
    `SELECT ht.contract_id, c.contract_number, ht.name FROM public.hardware_types ht JOIN public.contracts c ON c.id = ht.contract_id ORDER BY c.contract_number, ht.sort_order;`,
    `-- Hardware with hardware_type_id`,
    `SELECT count(*) as total, count(hardware_type_id) as with_type FROM public.hardware;`,
  ];

  for (const sql of checks) {
    console.log(`\n${sql}`);
    const result = await ssh.execCommand(`docker exec supabase-db psql -U postgres -d postgres -c "${sql.replace(/"/g, '\\"')}"`);
    console.log(result.stdout);
    if (result.stderr) console.error(result.stderr);
  }

  ssh.dispose();
}

check().catch(err => { console.error(err.message); ssh.dispose(); process.exit(1); });
