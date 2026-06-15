import { NodeSSH } from 'node-ssh';
import fs from 'fs';
import path from 'path';

const ssh = new NodeSSH();

async function migrate() {
  console.log('Connecting to 192.168.0.115...');
  await ssh.connect({
    host: '192.168.0.115',
    username: 'root',
    password: '281198'
  });
  console.log('Connected!\n');

  const migrationPath = path.join(process.cwd(), 'src/db/migrations/001_drilldown_tables.sql');
  if (!fs.existsSync(migrationPath)) {
    console.error('Migration file not found:', migrationPath);
    ssh.dispose();
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');
  console.log(`Running migration: 001_drilldown_tables.sql (${sql.length} bytes)...\n`);

  const result = await ssh.execCommand('docker exec -i supabase-db psql -U postgres -d postgres', {
    stdin: sql,
  });

  if (result.stdout) {
    const lines = result.stdout.split('\n');
    console.log('=== STDOUT ===');
    console.log(lines.slice(0, 3).join('\n'));
    if (lines.length > 6) {
      console.log('  ...');
      console.log(lines.slice(-3).join('\n'));
    }
    console.log(`  Total output lines: ${lines.length}`);
  }

  if (result.stderr) {
    console.log('\n=== STDERR ===');
    console.log(result.stderr.slice(0, 2000));
  }

  if (result.code !== 0) {
    console.error(`\nMigration FAILED with exit code ${result.code}`);
  } else {
    console.log('\nMigration COMPLETED successfully.');
  }

  // Verify
  console.log('\n=== VERIFY NEW TABLES ===');
  const verify = await ssh.execCommand(`docker exec supabase-db psql -U postgres -d postgres -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('hardware_types', 'spec_categories', 'spec_rules');"`);
  console.log(verify.stdout);

  console.log('=== VERIFY HARDWARE COLUMNS ===');
  const cols = await ssh.execCommand(`docker exec supabase-db psql -U postgres -d postgres -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'hardware' AND column_name IN ('hardware_type_id', 'spec_category_id', 'brand_id', 'model_id');"`);
  console.log(cols.stdout);

  console.log('=== HARDWARE TYPES SEEDED ===');
  const types = await ssh.execCommand(`docker exec supabase-db psql -U postgres -d postgres -c "SELECT name FROM public.hardware_types ORDER BY sort_order;"`);
  console.log(types.stdout);

  console.log('=== HARDWARE BACKFILL CHECK ===');
  const backfill = await ssh.execCommand(`docker exec supabase-db psql -U postgres -d postgres -c "SELECT count(*) as total, count(hardware_type_id) as with_type FROM public.hardware;"`);
  console.log(backfill.stdout);

  ssh.dispose();
}

migrate().catch(err => {
  console.error('Migration failed:', err.message);
  if (ssh) ssh.dispose();
  process.exit(1);
});