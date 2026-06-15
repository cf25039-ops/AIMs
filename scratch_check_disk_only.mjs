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

  console.log('\n--- VPS DISK SPACE ---');
  const df = await ssh.execCommand('df -h');
  console.log(df.stdout || df.stderr);

  console.log('\n--- DOCKER DAEMON RECENT LOGS (TAIL 40) ---');
  const logs = await ssh.execCommand('journalctl -n 40 -u docker --no-pager');
  console.log(logs.stdout || logs.stderr);

  ssh.dispose();
}

run().catch(err => {
  console.error('Check failed:', err);
  if (ssh) ssh.dispose();
});
