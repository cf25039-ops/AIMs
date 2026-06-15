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

  console.log('\n--- STOPPING SERVICES AND CLEANING UP ---');
  await ssh.execCommand('systemctl stop docker');
  await ssh.execCommand('systemctl stop containerd');
  await ssh.execCommand('killall -9 docker docker-compose docker-compose-v2 containerd containerd-shim containerd-shim-runc-v2');
  console.log('Cleaned!');

  console.log('\n--- STARTING SERVICES ---');
  await ssh.execCommand('systemctl start containerd');
  await ssh.execCommand('systemctl start docker');
  console.log('Services started.');

  console.log('\n--- STARTING SYNCHRONOUS PULL WITH LIVE STREAM ---');
  await ssh.execCommand('docker pull supabase/postgres:15.8.1.085', {
    onStdout(chunk) {
      process.stdout.write(chunk.toString());
    },
    onStderr(chunk) {
      process.stderr.write(chunk.toString());
    }
  });

  console.log('\nPull finished.');
  ssh.dispose();
}

run().catch(err => {
  console.error('Pull failed:', err);
  if (ssh) ssh.dispose();
});
