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

  console.log('\n--- CLEANING ACTIVE PULL PROCESSES ---');
  await ssh.execCommand('killall -9 docker docker-compose docker-compose-v2');
  await ssh.execCommand('systemctl restart docker');
  console.log('Docker service restarted.');

  console.log('\n--- RUNNING MANUAL PULL WITH DIRECT STREAM ---');
  let lineCount = 0;
  
  // We run the pull and stream output. We will let it run and see if it moves!
  await ssh.execCommand('docker pull supabase/postgres:15.8.1.085', {
    onStdout(chunk) {
      const str = chunk.toString();
      process.stdout.write(str);
      lineCount++;
    },
    onStderr(chunk) {
      process.stderr.write(chunk.toString());
      lineCount++;
    }
  });

  console.log('\nPull finished or terminated.');
  ssh.dispose();
}

run().catch(err => {
  console.error('Manual pull failed:', err);
  if (ssh) ssh.dispose();
});
