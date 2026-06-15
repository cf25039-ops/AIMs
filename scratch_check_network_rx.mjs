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

  console.log('\n--- MEASURING NETWORK TRAFFIC (3 SECOND INTERVAL) ---');
  const dev1 = await ssh.execCommand('cat /proc/net/dev');
  await new Promise(r => setTimeout(r, 3000));
  const dev2 = await ssh.execCommand('cat /proc/net/dev');

  console.log('--- SAMPLE 1 ---');
  console.log(dev1.stdout);
  console.log('--- SAMPLE 2 ---');
  console.log(dev2.stdout);

  ssh.dispose();
}

run().catch(err => {
  console.error('Check failed:', err);
  if (ssh) ssh.dispose();
});
