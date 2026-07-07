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

  console.log('\n--- SYSTEMCTL STATUS DOCKER ---');
  const status = await ssh.execCommand('systemctl status docker --no-pager');
  console.log(status.stdout || status.stderr);

  console.log('\n--- FULL DOCKER PROCESS TREE ---');
  const psTree = await ssh.execCommand('ps -ef | grep -i "docker"');
  console.log(psTree.stdout || psTree.stderr);

  ssh.dispose();
}

run().catch(err => {
  console.error('Diagnostics failed:', err);
  if (ssh) ssh.dispose();
});
