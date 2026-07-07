import { NodeSSH } from 'node-ssh';
import fs from 'fs';
import path from 'path';

const ssh = new NodeSSH();

const migrationFiles = [
  { name: 'aims_init.sql', path: 'supabase/aims_init.sql' },
  { name: 'rbac_migration.sql', path: 'rbac_migration.sql' },
  { name: 'phase_2_migration.sql', path: 'phase_2_migration.sql' },
  { name: 'phase_3_migration.sql', path: 'phase_3_migration.sql' },
  { name: 'fix_trigger.sql', path: 'fix_trigger.sql' },
  { name: 'fix_rls_tickets.sql', path: 'fix_rls_tickets.sql' },
  { name: 'fix_rls_hardware.sql', path: 'fix_rls_hardware.sql' },
  { name: 'seed_dataset.sql', path: 'seed_dataset.sql' },
  { name: 'demo_accounts.sql', path: 'demo_accounts.sql' },
  { name: 'seed_tickets.sql', path: 'seed_tickets.sql' }
];

async function run() {
  console.log('Connecting to remote VPS 192.168.0.115...');
  await ssh.connect({
    host: '192.168.0.115',
    username: 'root',
    password: '281198'
  });
  console.log('Connected!');

  // Check if supabase-db container is running
  const checkDb = await ssh.execCommand('docker ps --filter "name=supabase-db" --format "{{.Status}}"');
  console.log('supabase-db status:', checkDb.stdout.trim() || 'Not running');

  if (!checkDb.stdout.trim().includes('Up')) {
    console.log('Database container is not running yet. Please wait for Supabase to start up fully.');
    ssh.dispose();
    process.exit(1);
  }

  console.log('\n=== STARTING DATABASE MIGRATIONS AND SEEDING ===');

  for (const file of migrationFiles) {
    const localPath = path.join(process.cwd(), file.path);
    if (!fs.existsSync(localPath)) {
      console.error(`Error: Local file not found: ${localPath}`);
      continue;
    }

    console.log(`\nRunning: ${file.name} (${file.path})...`);
    const sqlContent = fs.readFileSync(localPath, 'utf8');

    // Run using docker exec -i supabase-db psql
    const result = await ssh.execCommand('docker exec -i supabase-db psql -U postgres -d postgres', {
      stdin: sqlContent
    });

    if (result.stdout) {
      // Print first 5 and last 5 lines of stdout to avoid cluttering but show success
      const lines = result.stdout.split('\n');
      if (lines.length <= 10) {
        console.log(result.stdout);
      } else {
        console.log(lines.slice(0, 5).join('\n'));
        console.log('...');
        console.log(lines.slice(-5).join('\n'));
      }
    }

    if (result.stderr) {
      console.error('Errors/Warnings:');
      console.error(result.stderr);
    }

    if (result.code !== 0) {
      console.error(`Migration ${file.name} failed with exit code ${result.code}`);
      // Don't stop unless it's a fatal error, but let's report it
    } else {
      console.log(`Finished: ${file.name} successfully.`);
    }
  }

  console.log('\n=== MIGRATIONS COMPLETE! ===');
  ssh.dispose();
}

run().catch(err => {
  console.error('Migration execution failed:', err);
  if (ssh) ssh.dispose();
  process.exit(1);
});
