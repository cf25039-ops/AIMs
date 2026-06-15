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

  console.log('\n--- ATTACHING TO DOCKER PULL (STREAMING OUTPUT) ---');
  await ssh.execCommand('docker pull supabase/postgres:15.8.1.085', {
    onStdout(chunk) {
      process.stdout.write(chunk.toString());
    },
    onStderr(chunk) {
      process.stderr.write(chunk.toString());
    }
  });

  ssh.dispose();
}

run().catch(err => {
  console.error('Direct pull failed:', err);
  if (ssh) ssh.dispose();
});
