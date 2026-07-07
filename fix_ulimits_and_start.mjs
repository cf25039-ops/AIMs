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

  console.log('\n=== STEP 1: CHECK CURRENT LIMITS ===');
  const ulimit = await ssh.execCommand('ulimit -n');
  console.log('Current ulimit -n:', ulimit.stdout.trim());
  const sysMax = await ssh.execCommand('cat /proc/sys/fs/file-max');
  console.log('System file-max:', sysMax.stdout.trim());
  const sysNr = await ssh.execCommand('cat /proc/sys/fs/file-nr');
  console.log('System file-nr:', sysNr.stdout.trim());

  console.log('\n=== STEP 2: INCREASE SYSTEM-WIDE FILE LIMITS ===');
  // Set kernel max
  await ssh.execCommand('sysctl -w fs.file-max=1048576');
  // Set inotify limits
  await ssh.execCommand('sysctl -w fs.inotify.max_user_watches=524288');
  await ssh.execCommand('sysctl -w fs.inotify.max_user_instances=512');
  console.log('Kernel limits increased.');

  // Update limits.conf
  await ssh.execCommand('echo "* soft nofile 65536" >> /etc/security/limits.conf');
  await ssh.execCommand('echo "* hard nofile 65536" >> /etc/security/limits.conf');
  await ssh.execCommand('echo "root soft nofile 65536" >> /etc/security/limits.conf');
  await ssh.execCommand('echo "root hard nofile 65536" >> /etc/security/limits.conf');
  console.log('limits.conf updated.');

  console.log('\n=== STEP 3: CONFIGURE DOCKER & CONTAINERD SERVICE LIMITS ===');
  // Create override for docker
  await ssh.execCommand('mkdir -p /etc/systemd/system/docker.service.d');
  await ssh.execCommand(`cat > /etc/systemd/system/docker.service.d/override.conf << 'EOF'
[Service]
LimitNOFILE=65536
LimitNPROC=65536
EOF`);

  // Create override for containerd
  await ssh.execCommand('mkdir -p /etc/systemd/system/containerd.service.d');
  await ssh.execCommand(`cat > /etc/systemd/system/containerd.service.d/override.conf << 'EOF'
[Service]
LimitNOFILE=65536
LimitNPROC=65536
EOF`);
  console.log('Service overrides created.');

  console.log('\n=== STEP 4: RELOAD SYSTEMD AND RESTART SERVICES ===');
  await ssh.execCommand('systemctl daemon-reload');
  await ssh.execCommand('systemctl stop docker');
  await ssh.execCommand('systemctl stop containerd');
  await ssh.execCommand('systemctl start containerd');
  await ssh.execCommand('systemctl start docker');
  console.log('Services restarted with new limits.');

  console.log('\n=== STEP 5: VERIFY NEW LIMITS ===');
  const dockerPid = await ssh.execCommand('pgrep -x dockerd');
  const pid = dockerPid.stdout.trim();
  if (pid) {
    const limits = await ssh.execCommand(`cat /proc/${pid}/limits | grep "Max open files"`);
    console.log('Docker daemon limits:', limits.stdout.trim());
  }

  console.log('\n=== STEP 6: DOCKER COMPOSE DOWN (CLEANUP) ===');
  await ssh.execCommand('docker compose down --remove-orphans', {
    cwd: '/root/supabase/docker'
  });
  console.log('Cleaned up previous compose state.');

  console.log('\n=== STEP 7: DOCKER COMPOSE UP ===');
  const up = await ssh.execCommand('docker compose up -d', {
    cwd: '/root/supabase/docker',
    onStdout(chunk) { process.stdout.write(chunk.toString()); },
    onStderr(chunk) { process.stderr.write(chunk.toString()); }
  });
  console.log('\nCompose up finished.');

  console.log('\n=== STEP 8: WAITING 20 SECONDS FOR CONTAINERS TO INITIALIZE ===');
  await new Promise(r => setTimeout(r, 20000));

  console.log('\n=== STEP 9: CONTAINER STATUS ===');
  const ps = await ssh.execCommand('docker compose ps', {
    cwd: '/root/supabase/docker'
  });
  console.log(ps.stdout || ps.stderr);

  ssh.dispose();
}

run().catch(err => {
  console.error('Failed:', err);
  if (ssh) ssh.dispose();
  process.exit(1);
});
