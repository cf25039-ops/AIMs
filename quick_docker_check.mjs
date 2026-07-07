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

  console.log('\n--- DOCKER SERVICE STATUS ---');
  const status = await ssh.execCommand('systemctl is-active docker');
  console.log('Docker active:', status.stdout.trim());

  console.log('\n--- DOCKER DAEMON LOGS ---');
  const logs = await ssh.execCommand('journalctl -n 30 -u docker --no-pager');
  console.log(logs.stdout || logs.stderr);

  console.log('\n--- CONTAINERD SERVICE STATUS ---');
  const ctdStatus = await ssh.execCommand('systemctl is-active containerd');
  console.log('Containerd active:', ctdStatus.stdout.trim());

  console.log('\n--- DAEMON.JSON ---');
  const dj = await ssh.execCommand('cat /etc/docker/daemon.json');
  console.log(dj.stdout);

  ssh.dispose();
}

run().catch(err => {
  console.error('Failed:', err);
  if (ssh) ssh.dispose();
});
