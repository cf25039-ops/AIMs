import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function run() {
  console.log('Connecting to VPS...');
  await ssh.connect({ host: '192.168.0.115', username: 'root', password: '281198' });

  console.log('\n--- DOCKER CONTAINERS STATUS ---');
  const ps = await ssh.execCommand('docker ps --format "table {{.Names}}\t{{.Status}}"');
  console.log(ps.stdout || ps.stderr);

  console.log('\n--- AIMS-WEB DOCKER LOGS (LAST 30 LINES) ---');
  const logs = await ssh.execCommand('docker logs aims-web --tail 30 2>&1');
  console.log(logs.stdout || logs.stderr);

  ssh.dispose();
}

run().catch(console.error);
