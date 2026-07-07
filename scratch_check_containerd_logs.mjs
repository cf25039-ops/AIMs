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

  console.log('\n--- CONTAINERD RECENT LOGS (LAST 50 LINES) ---');
  const containerdLogs = await ssh.execCommand('journalctl -n 50 -u containerd --no-pager');
  console.log(containerdLogs.stdout || containerdLogs.stderr);

  console.log('\n--- DOCKER DAEMON RECENT LOGS (LAST 50 LINES) ---');
  const dockerLogs = await ssh.execCommand('journalctl -n 50 -u docker --no-pager');
  console.log(dockerLogs.stdout || dockerLogs.stderr);

  ssh.dispose();
}

run().catch(err => {
  console.error('Check failed:', err);
  if (ssh) ssh.dispose();
});
