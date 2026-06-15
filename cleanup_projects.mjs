import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function run() {
  await ssh.connect({ host: '192.168.0.115', username: 'root', password: '281198' });

  console.log('Checking for empty project rows...');
  const check = await ssh.execCommand(
    `docker exec supabase-db psql -U postgres -d postgres -c "SELECT id, name, code, created_at FROM projects WHERE name IS NULL OR name = '' OR code IS NULL OR code = '';"`
  );
  console.log(check.stdout);

  console.log('Deleting empty project rows...');
  const result = await ssh.execCommand(
    `docker exec supabase-db psql -U postgres -d postgres -c "DELETE FROM projects WHERE (name IS NULL OR name = '') AND (code IS NULL OR code = '');"`
  );
  console.log(result.stdout);
  if (result.stderr) console.log('Warnings:', result.stderr);

  // Verify
  const verify = await ssh.execCommand(
    `docker exec supabase-db psql -U postgres -d postgres -c "SELECT id, name, code, created_at FROM projects ORDER BY created_at DESC LIMIT 10;"`
  );
  console.log('\n=== Remaining projects ===');
  console.log(verify.stdout);

  if (result.code === 0) console.log('\nCleanup complete!');
  else console.error('Failed:', result.stderr);

  ssh.dispose();
}

run().catch(err => { console.error(err); ssh.dispose(); process.exit(1); });