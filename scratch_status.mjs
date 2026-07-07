import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function run() {
  console.log('Connecting to remote VPS 192.168.0.115...');
  await ssh.connect({
    host: '192.168.0.115',
    username: 'root',
    password: '281198'
  });
  console.log('Connected!');

  console.log('\n--- REMOTE DOCKER IMAGES ---');
  const images = await ssh.execCommand('docker images');
  console.log(images.stdout || images.stderr);

  console.log('\n--- REMOTE RUNNING CONTAINERS ---');
  const ps = await ssh.execCommand('docker ps -a');
  console.log(ps.stdout || ps.stderr);

  console.log('\n--- DOCKER COMPOSE PS (SUPABASE) ---');
  const composePs = await ssh.execCommand('docker compose ps', {
    cwd: '/root/supabase/docker'
  });
  console.log(composePs.stdout || composePs.stderr);

  ssh.dispose();
}

run().catch(err => {
  console.error('Scratch status check failed:', err);
  if (ssh) ssh.dispose();
});
