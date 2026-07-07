import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function run() {
  console.log('Connecting to VPS...');
  await ssh.connect({ host: '192.168.0.115', username: 'root', password: '281198' });

  console.log('\n--- RLS POLICIES ON NOTIFICATIONS ---');
  const policies = await ssh.execCommand(`docker exec -i supabase-db psql -U postgres -d postgres`, {
    stdin: `
      SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
      FROM pg_policies 
      WHERE tablename = 'notifications';
    `
  });
  console.log(policies.stdout || policies.stderr);

  ssh.dispose();
}

run().catch(console.error);
