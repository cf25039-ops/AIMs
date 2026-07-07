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

  console.log('\n--- REMOTE DOCKER CONTAINERS ---');
  const ps = await ssh.execCommand('docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"');
  console.log(ps.stdout || '(No containers running)');

  ssh.dispose();
}

run().catch(err => {
  console.error('Check failed:', err);
  if (ssh) ssh.dispose();
});
