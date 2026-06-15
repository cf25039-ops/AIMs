import { NodeSSH } from 'node-ssh';
import fs from 'fs';
import path from 'path';

const ssh = new NodeSSH();

async function run() {
  await ssh.connect({ host: '192.168.0.115', username: 'root', password: '281198' });
  
  const migrationPath = path.join(process.cwd(), 'src/db/migrations/002_seed_spec_categories.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('Seeding spec categories...');
  const result = await ssh.execCommand('docker exec -i supabase-db psql -U postgres -d postgres', { stdin: sql });
  
  console.log(result.stdout);
  if (result.stderr) console.log('Warnings:', result.stderr.slice(0, 500));
  
  if (result.code === 0) console.log('\nSeed complete!');
  else console.error('Failed:', result.stderr);
  
  ssh.dispose();
}

run().catch(err => { console.error(err); ssh.dispose(); process.exit(1); });