import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function run() {
  console.log('Connecting to remote VPS 192.168.0.115...');
  await ssh.connect({
    host: '192.168.0.115',
    username: 'root',
    password: '281198',
    readyTimeout: 30000
  });
  console.log('Connected!');

  console.log('\n=== STEP 1: RESTART ALL CONTAINERS ===');
  const restart = await ssh.execCommand('docker compose up -d', {
    cwd: '/root/supabase/docker',
    onStdout(chunk) { process.stdout.write(chunk.toString()); },
    onStderr(chunk) { process.stderr.write(chunk.toString()); }
  });
  console.log('\nRestart done.');

  console.log('\n=== STEP 2: WAITING 45 SECONDS ===');
  await new Promise(r => setTimeout(r, 45000));

  console.log('\n=== STEP 3: CONTAINER STATUS ===');
  const ps = await ssh.execCommand('docker compose ps', { cwd: '/root/supabase/docker' });
  console.log(ps.stdout || ps.stderr);

  // Check for any unhealthy containers
  const unhealthy = await ssh.execCommand('docker compose ps --filter "health=unhealthy" --format "{{.Name}}"', { cwd: '/root/supabase/docker' });
  if (unhealthy.stdout && unhealthy.stdout.trim()) {
    console.log('\n=== UNHEALTHY CONTAINER LOGS ===');
    for (const name of unhealthy.stdout.trim().split('\n')) {
      console.log(`\n--- ${name} logs ---`);
      const logs = await ssh.execCommand(`docker logs ${name} --tail 20 2>&1`);
      console.log(logs.stdout || logs.stderr);
    }
  }

  ssh.dispose();
}

run().catch(err => {
  console.error('Failed:', err.message || err);
  if (ssh) ssh.dispose();
});
