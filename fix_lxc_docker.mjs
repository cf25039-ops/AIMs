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

  console.log('\n=== STEP 1: STOP DOCKER AND CONTAINERD ===');
  await ssh.execCommand('systemctl stop docker');
  await ssh.execCommand('systemctl stop containerd');
  console.log('Services stopped.');

  console.log('\n=== STEP 2: CONFIGURE DOCKER TO DISABLE CONTAINERD SNAPSHOTTER ===');
  // Create/update daemon.json to disable containerd snapshotter integration
  await ssh.execCommand(`cat > /etc/docker/daemon.json << 'EOF'
{
  "storage-driver": "overlay2",
  "features": {
    "containerd-snapshotter": false
  },
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF`);
  console.log('daemon.json updated.');

  // Verify the file
  const daemonJson = await ssh.execCommand('cat /etc/docker/daemon.json');
  console.log('daemon.json:', daemonJson.stdout);

  console.log('\n=== STEP 3: RESTART SERVICES ===');
  await ssh.execCommand('systemctl start containerd');
  await new Promise(r => setTimeout(r, 2000));
  await ssh.execCommand('systemctl start docker');
  await new Promise(r => setTimeout(r, 3000));
  console.log('Services started.');

  console.log('\n=== STEP 4: VERIFY DOCKER STORAGE DRIVER ===');
  const info = await ssh.execCommand('docker info 2>/dev/null | grep -E "Storage|Snapshotter|Server Version"');
  console.log(info.stdout);

  console.log('\n=== STEP 5: TEST SIMPLE CONTAINER ===');
  const test = await ssh.execCommand('docker run --rm alpine echo "Container works!"');
  console.log('Test result:', test.stdout || test.stderr);

  if (test.stdout && test.stdout.includes('Container works!')) {
    console.log('\n=== STEP 6: RE-PULL POSTGRES IMAGE (native driver needs re-pull) ===');
    console.log('Checking if postgres image is available...');
    const img = await ssh.execCommand('docker images | grep "supabase/postgres"');
    console.log(img.stdout || '(not found - need to re-pull)');

    if (!img.stdout || !img.stdout.includes('supabase/postgres')) {
      console.log('Re-pulling postgres image with native driver...');
      await ssh.execCommand('docker pull supabase/postgres:15.8.1.085', {
        onStdout(chunk) { process.stdout.write(chunk.toString()); },
        onStderr(chunk) { process.stderr.write(chunk.toString()); }
      });
      console.log('\nPostgres pull done.');
    }

    console.log('\n=== STEP 7: DOCKER COMPOSE UP ===');
    const up = await ssh.execCommand('docker compose up -d', {
      cwd: '/root/supabase/docker',
      onStdout(chunk) { process.stdout.write(chunk.toString()); },
      onStderr(chunk) { process.stderr.write(chunk.toString()); }
    });
    console.log('\nCompose up finished.');

    console.log('\n=== STEP 8: WAIT AND CHECK STATUS ===');
    await new Promise(r => setTimeout(r, 20000));
    const ps = await ssh.execCommand('docker compose ps', { cwd: '/root/supabase/docker' });
    console.log(ps.stdout || ps.stderr);
  } else {
    console.log('\nTest container FAILED. Investigating further...');
    const dockerLog = await ssh.execCommand('journalctl -n 20 -u docker --no-pager');
    console.log(dockerLog.stdout);
  }

  ssh.dispose();
}

run().catch(err => {
  console.error('Failed:', err);
  if (ssh) ssh.dispose();
  process.exit(1);
});
