import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function run() {
  console.log('Connecting to VPS...');
  await ssh.connect({ host: '192.168.0.115', username: 'root', password: '281198' });

  console.log('\n--- REGIONS ---');
  const regions = await ssh.execCommand(`docker exec -i supabase-db psql -U postgres -d postgres`, {
    stdin: `SELECT id, name, code FROM regions;`
  });
  console.log(regions.stdout || regions.stderr);

  console.log('\n--- STATES ---');
  const states = await ssh.execCommand(`docker exec -i supabase-db psql -U postgres -d postgres`, {
    stdin: `SELECT id, region_id, name, code FROM states;`
  });
  console.log(states.stdout || states.stderr);

  console.log('\n--- FACILITIES ---');
  const facilities = await ssh.execCommand(`docker exec -i supabase-db psql -U postgres -d postgres`, {
    stdin: `SELECT id, state_id, name, code FROM facilities;`
  });
  console.log(facilities.stdout || facilities.stderr);

  console.log('\n--- DEPARTMENTS ---');
  const departments = await ssh.execCommand(`docker exec -i supabase-db psql -U postgres -d postgres`, {
    stdin: `SELECT id, facility_id, name, code FROM departments;`
  });
  console.log(departments.stdout || departments.stderr);

  console.log('\n--- PROFILES ASSIGNED ---');
  const profiles = await ssh.execCommand(`docker exec -i supabase-db psql -U postgres -d postgres`, {
    stdin: `SELECT id, email, role, assigned_facility_id, assigned_department_id FROM profiles;`
  });
  console.log(profiles.stdout || profiles.stderr);

  ssh.dispose();
}

run().catch(console.error);
