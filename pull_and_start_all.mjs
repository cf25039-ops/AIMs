import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function run() {
  console.log('Connecting to remote VPS 192.168.0.115...');
  await ssh.connect({
    host: '192.168.0.115',
    username: 'root',
    password: '281198',
    readyTimeout: 30000
  });
  console.log('Connected!');

  // Step 1: Test Docker works
  console.log('\n=== STEP 1: TEST DOCKER ===');
  const test = await ssh.execCommand('docker run --rm alpine echo "Docker OK"');
  console.log('Test:', test.stdout || test.stderr);
  
  if (!test.stdout || !test.stdout.includes('Docker OK')) {
    console.error('Docker test failed! Aborting.');
    ssh.dispose();
    return;
  }

  // Step 2: Pull all Supabase images
  console.log('\n=== STEP 2: PULLING SUPABASE IMAGES ===');
  const images = [
    'supabase/postgres:15.8.1.085',
    'supabase/gotrue:v2.186.0',
    'postgrest/postgrest:v14.8',
    'supabase/realtime:v2.76.5',
    'supabase/storage-api:v1.48.26',
    'supabase/postgres-meta:v0.96.3',
    'supabase/studio:2026.04.27-sha-5f60601',
    'supabase/edge-runtime:v1.71.2',
    'supabase/logflare:1.36.1',
    'supabase/supavisor:2.7.4',
    'kong/kong:3.9.1',
    'darthsim/imgproxy:v3.30.1',
    'timberio/vector:0.53.0-alpine'
  ];

  for (const img of images) {
    const shortName = img.split('/').pop();
    process.stdout.write(`Pulling ${shortName}... `);
    const pull = await ssh.execCommand(`docker pull ${img}`);
    if (pull.stderr && pull.stderr.includes('Error')) {
      console.log('FAILED');
      console.log(pull.stderr);
    } else {
      console.log('OK');
    }
  }

  // Step 3: Verify all images
  console.log('\n=== STEP 3: VERIFY IMAGES ===');
  const imgList = await ssh.execCommand('docker images --format "{{.Repository}}:{{.Tag}}" | sort');
  console.log(imgList.stdout);

  // Step 4: Start Supabase
  console.log('\n=== STEP 4: DOCKER COMPOSE UP ===');
  const up = await ssh.execCommand('docker compose up -d', {
    cwd: '/root/supabase/docker',
    onStdout(chunk) { process.stdout.write(chunk.toString()); },
    onStderr(chunk) { process.stderr.write(chunk.toString()); }
  });
  console.log('\nCompose finished.');

  // Step 5: Wait and check
  console.log('\n=== STEP 5: WAITING 30 SECONDS FOR INITIALIZATION ===');
  await new Promise(r => setTimeout(r, 30000));

  console.log('\n=== STEP 6: CONTAINER STATUS ===');
  const ps = await ssh.execCommand('docker compose ps', { cwd: '/root/supabase/docker' });
  console.log(ps.stdout || ps.stderr);

  ssh.dispose();
}

run().catch(err => {
  console.error('Failed:', err.message || err);
  if (ssh) ssh.dispose();
  process.exit(1);
});
