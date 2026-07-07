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

  console.log('\n--- SYSTEM INFO ---');
  const uptime = await ssh.execCommand('uptime');
  console.log('Uptime:', uptime.stdout.trim());

  const os = await ssh.execCommand('cat /etc/os-release | head -5');
  console.log(os.stdout);

  console.log('\n--- DISK SPACE ---');
  const df = await ssh.execCommand('df -h /');
  console.log(df.stdout);

  console.log('\n--- MEMORY ---');
  const mem = await ssh.execCommand('free -h');
  console.log(mem.stdout);

  console.log('\n--- FILE-NR ---');
  const fnr = await ssh.execCommand('cat /proc/sys/fs/file-nr');
  console.log('file-nr:', fnr.stdout.trim());

  console.log('\n--- DOCKER INSTALLED? ---');
  const docker = await ssh.execCommand('which docker 2>/dev/null && docker --version || echo "Docker NOT installed"');
  console.log(docker.stdout || docker.stderr);

  console.log('\n--- DOCKER SERVICE STATUS ---');
  const ds = await ssh.execCommand('systemctl is-active docker 2>/dev/null || echo "not running"');
  console.log('Docker:', ds.stdout.trim());

  console.log('\n--- DOCKER INFO ---');
  const info = await ssh.execCommand('timeout 10 docker info 2>&1 | head -30');
  console.log(info.stdout || info.stderr);

  console.log('\n--- DOCKER IMAGES ---');
  const imgs = await ssh.execCommand('docker images 2>/dev/null');
  console.log(imgs.stdout || imgs.stderr);

  console.log('\n--- RUNNING CONTAINERS ---');
  const ps = await ssh.execCommand('docker ps -a 2>/dev/null');
  console.log(ps.stdout || ps.stderr);

  console.log('\n--- CHECK SUPABASE DIR ---');
  const sup = await ssh.execCommand('ls -la /root/supabase/docker/ 2>/dev/null || echo "Supabase dir NOT found"');
  console.log(sup.stdout || sup.stderr);

  console.log('\n--- DAEMON.JSON ---');
  const dj = await ssh.execCommand('cat /etc/docker/daemon.json 2>/dev/null || echo "No daemon.json"');
  console.log(dj.stdout);

  ssh.dispose();
}

run().catch(err => {
  console.error('Failed:', err.message || err);
  if (ssh) ssh.dispose();
});
