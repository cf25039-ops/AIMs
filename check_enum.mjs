import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function run() {
  console.log('Connecting...');
  await ssh.connect({ host: '192.168.0.115', username: 'root', password: '281198', readyTimeout: 30000 });

  // Check enum values
  console.log('\n=== USER_ROLE ENUM VALUES ===');
  const enums = await ssh.execCommand(`docker exec -i supabase-db psql -U postgres -d postgres`, {
    stdin: `SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role') ORDER BY enumsortorder;`
  });
  console.log(enums.stdout || enums.stderr);

  ssh.dispose();
}

run().catch(err => { console.error(err.message); });
