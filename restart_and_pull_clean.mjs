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

  console.log('\n=== STEP 1: STOPPING DOCKER AND CONTAINERD SERVICES ===');
  await ssh.execCommand('systemctl stop docker');
  await ssh.execCommand('systemctl stop containerd');
  
  console.log('Killing all Docker, Compose, and Containerd processes...');
  await ssh.execCommand('killall -9 docker docker-compose docker-compose-v2 containerd containerd-shim containerd-shim-runc-v2');
  console.log('Services stopped and processes cleaned up.');

  console.log('\n=== STEP 2: RESTARTING CONTAINERD AND DOCKER SERVICES ===');
  await ssh.execCommand('systemctl start containerd');
  await ssh.execCommand('systemctl start docker');
  console.log('Containerd and Docker services successfully restarted.');

  console.log('\n=== STEP 3: VERIFYING SERVICE HEALTH ===');
  const containerdActive = await ssh.execCommand('systemctl is-active containerd');
  const dockerActive = await ssh.execCommand('systemctl is-active docker');
  console.log('Containerd status:', containerdActive.stdout.trim());
  console.log('Docker status:', dockerActive.stdout.trim());

  console.log('\n=== STEP 4: SINGLE SYNCHRONOUS PULL (STREAMING) ===');
  await ssh.execCommand('docker pull supabase/postgres:15.8.1.085', {
    onStdout(chunk) {
      process.stdout.write(chunk.toString());
    },
    onStderr(chunk) {
      process.stderr.write(chunk.toString());
    }
  });
  console.log('\nPostgres image pull completed!');

  console.log('\n=== STEP 5: STARTING SUPABASE CONTAINER STACK ===');
  const up = await ssh.execCommand('docker compose up -d', {
    cwd: '/root/supabase/docker'
  });
  console.log('STDOUT:');
  console.log(up.stdout);
  console.log('STDERR:');
  console.log(up.stderr);

  ssh.dispose();
}

run().catch(err => {
  console.error('Clean pull recovery failed:', err);
  if (ssh) ssh.dispose();
  process.exit(1);
});
