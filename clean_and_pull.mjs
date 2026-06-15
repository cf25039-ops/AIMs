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

  console.log('\n=== STEP 1: CLEANING UP STUCK DOCKER LOCKS & SERVICE RESTART ===');
  await ssh.execCommand('systemctl restart docker');
  console.log('Docker daemon restarted.');

  console.log('\n=== STEP 2: VERIFYING DOCKER DAEMON STATUS ===');
  let isActive = false;
  for (let i = 0; i < 5; i++) {
    const check = await ssh.execCommand('systemctl is-active docker');
    if (check.stdout.trim() === 'active') {
      isActive = true;
      break;
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  console.log(`Docker status: ${isActive ? 'ACTIVE' : 'INACTIVE'}`);

  if (!isActive) {
    throw new Error('Docker daemon failed to start');
  }

  console.log('\n=== STEP 3: RUNNING SINGLE DOCKER PULL FOR POSTGRES (STREAMING) ===');
  // We run this pull and stream output
  await ssh.execCommand('docker pull supabase/postgres:15.8.1.085', {
    onStdout(chunk) {
      process.stdout.write(chunk.toString());
    },
    onStderr(chunk) {
      process.stderr.write(chunk.toString());
    }
  });

  console.log('\n=== STEP 4: STARTING SUPABASE CONTAINERS ===');
  const up = await ssh.execCommand('docker compose up -d', {
    cwd: '/root/supabase/docker'
  });
  console.log('STDOUT:');
  console.log(up.stdout);
  console.log('STDERR:');
  console.log(up.stderr);

  ssh.dispose();
}

run().catch(err => {
  console.error('Clean and pull failed:', err);
  if (ssh) ssh.dispose();
  process.exit(1);
});
