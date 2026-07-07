import { NodeSSH } from 'node-ssh';
import fs from 'fs';
import path from 'path';

const ssh = new NodeSSH();

async function run() {
  await ssh.connect({ host: '192.168.0.115', username: 'root', password: '281198' });

  const migrationPath = path.join(process.cwd(), 'supabase/migrations/003_add_missing_columns.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('Running migration 003_add_missing_columns...');
  const result = await ssh.execCommand('docker exec -i supabase-db psql -U postgres -d postgres', { stdin: sql });

  console.log(result.stdout);
  if (result.stderr) console.log('Warnings:', result.stderr.slice(0, 500));

  // Verify
  const verify = await ssh.execCommand(`docker exec supabase-db psql -U postgres -d postgres -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'hardware' AND column_name IN ('assigned_user', 'assigned_department', 'custodian_team', 'physical_room');"`)
  console.log('\n=== Hardware columns ===');
  console.log(verify.stdout);

  const verify2 = await ssh.execCommand(`docker exec supabase-db psql -U postgres -d postgres -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name IN ('browser', 'session_id');"`)
  console.log('\n=== Audit columns ===');
  console.log(verify2.stdout);

  if (result.code === 0) console.log('\nMigration complete!');
  else console.error('Failed:', result.stderr);

  ssh.dispose();
}

run().catch(err => { console.error(err); ssh.dispose(); process.exit(1); });