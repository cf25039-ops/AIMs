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

  console.log('\n--- ACTIVE DOCKER PULL PROCESSES ---');
  const ps = await ssh.execCommand('ps -ef | grep -E "docker pull|docker compose" | grep -v grep');
  console.log(ps.stdout || '(None active)');

  console.log('\n--- POSTGRES IMAGE IN DOCKER ---');
  const img = await ssh.execCommand('docker images | grep postgres');
  console.log(img.stdout || '(None found)');

  ssh.dispose();
}

run().catch(err => {
  console.error('Quick check failed:', err);
  if (ssh) ssh.dispose();
});
