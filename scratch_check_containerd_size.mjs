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

  console.log('\n--- CONTAINERD FIRST LEVEL DIRECTORY SIZES ---');
  const duFirst = await ssh.execCommand('du -sh /var/lib/containerd/*');
  console.log(duFirst.stdout || duFirst.stderr);

  ssh.dispose();
}

run().catch(err => {
  console.error('Check failed:', err);
  if (ssh) ssh.dispose();
});
