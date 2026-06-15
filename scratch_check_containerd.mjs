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

  console.log('\n--- CONTAINERD SYSTEMCTL STATUS ---');
  const status = await ssh.execCommand('systemctl status containerd --no-pager');
  console.log(status.stdout || status.stderr);

  console.log('\n--- CONTAINERD RECENT LOGS (TAIL 40) ---');
  const logs = await ssh.execCommand('journalctl -n 40 -u containerd --no-pager');
  console.log(logs.stdout || logs.stderr);

  ssh.dispose();
}

run().catch(err => {
  console.error('Check failed:', err);
  if (ssh) ssh.dispose();
});
