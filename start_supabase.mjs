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

  console.log('\n=== STEP 1: VERIFY ALL DOCKER IMAGES ===');
  const images = await ssh.execCommand('docker images --format "{{.Repository}}:{{.Tag}}"');
  console.log(images.stdout || images.stderr);

  console.log('\n=== STEP 2: STARTING SUPABASE CONTAINERS ===');
  const up = await ssh.execCommand('docker compose up -d', {
    cwd: '/root/supabase/docker',
    onStdout(chunk) { process.stdout.write(chunk.toString()); },
    onStderr(chunk) { process.stderr.write(chunk.toString()); }
  });
  console.log('\nCompose up finished.');

  console.log('\n=== STEP 3: WAITING 15 SECONDS FOR CONTAINERS TO INITIALIZE ===');
  await new Promise(r => setTimeout(r, 15000));

  console.log('\n=== STEP 4: CHECKING CONTAINER STATUS ===');
  const ps = await ssh.execCommand('docker compose ps', {
    cwd: '/root/supabase/docker'
  });
  console.log(ps.stdout || ps.stderr);

  ssh.dispose();
}

run().catch(err => {
  console.error('Start containers failed:', err);
  if (ssh) ssh.dispose();
  process.exit(1);
});
