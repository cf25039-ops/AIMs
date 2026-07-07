import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function run() {
  console.log('Connecting to VPS...');
  await ssh.connect({ host: '192.168.0.115', username: 'root', password: '281198' });

  console.log('\n--- WEBB APP LOGS (LAST 200 LINES) ---');
  const logs = await ssh.execCommand('docker logs aims-web --tail 200 2>&1');
  console.log(logs.stdout || logs.stderr);

  ssh.dispose();
}

run().catch(console.error);
