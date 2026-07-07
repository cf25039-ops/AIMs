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

  console.log('\n--- CONTAINERD DISK USAGE ---');
  const du = await ssh.execCommand('du -s /var/lib/containerd');
  console.log(du.stdout || du.stderr);

  console.log('\n--- CHECKING DOCKER PULL STATUS (ATTACHING / DRY RUN) ---');
  // We run docker pull with a timeout or just print the first few lines of output
  const pull = await ssh.execCommand('docker pull supabase/postgres:15.8.1.085', {
    // We will let it print for up to 10 seconds and then we can terminate if needed
  });
  console.log(pull.stdout || pull.stderr);

  ssh.dispose();
}

run().catch(err => {
  console.error('Check failed:', err);
  if (ssh) ssh.dispose();
});
