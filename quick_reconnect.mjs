import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function run() {
  console.log('Connecting to remote VPS 192.168.0.115 (60s timeout)...');
  await ssh.connect({
    host: '192.168.0.115',
    username: 'root',
    password: '281198',
    readyTimeout: 60000,
    keepaliveInterval: 10000
  });
  console.log('Connected!');

  console.log('\n--- UPTIME ---');
  const uptime = await ssh.execCommand('uptime');
  console.log(uptime.stdout);

  console.log('\n--- FILE-NR ---');
  const fnr = await ssh.execCommand('cat /proc/sys/fs/file-nr');
  console.log(fnr.stdout.trim());

  console.log('\n--- DOCKER STATUS ---');
  const ds = await ssh.execCommand('systemctl is-active docker');
  console.log('Docker:', ds.stdout.trim());

  console.log('\n--- CONTAINERD STATUS ---');
  const cs = await ssh.execCommand('systemctl is-active containerd');
  console.log('Containerd:', cs.stdout.trim());

  console.log('\n--- DOCKER DAEMON RECENT LOGS ---');
  const logs = await ssh.execCommand('journalctl -n 20 -u docker --no-pager');
  console.log(logs.stdout || logs.stderr);

  console.log('\n--- DOCKER INFO (storage driver) ---');
  const info = await ssh.execCommand('timeout 10 docker info 2>&1 | head -20');
  console.log(info.stdout || info.stderr);

  ssh.dispose();
}

run().catch(err => {
  console.error('Failed:', err.message || err);
  if (ssh) ssh.dispose();
});
