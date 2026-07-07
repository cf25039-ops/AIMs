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

  console.log('\n=== STEP 1: STOP ALL SERVICES ===');
  await ssh.execCommand('docker compose down --remove-orphans', { cwd: '/root/supabase/docker' });
  await ssh.execCommand('systemctl stop docker');
  await ssh.execCommand('systemctl stop containerd');
  console.log('Services stopped.');

  console.log('\n=== STEP 2: CHECK FILE-NR BEFORE CLEANUP ===');
  const before = await ssh.execCommand('cat /proc/sys/fs/file-nr');
  console.log('file-nr BEFORE:', before.stdout.trim());

  console.log('\n=== STEP 3: UNMOUNT ALL CONTAINERD TEMP MOUNTS ===');
  const mounts = await ssh.execCommand('mount | grep containerd');
  console.log('Active containerd mounts:', mounts.stdout || '(none)');
  // Unmount all containerd tmpmounts
  await ssh.execCommand('umount -l /var/lib/containerd/tmpmounts/* 2>/dev/null || true');
  // Also unmount any /tmp/containerd-mount* left behind
  await ssh.execCommand('umount -l /tmp/containerd-mount* 2>/dev/null || true');
  // Clean up tmp containerd mount dirs
  await ssh.execCommand('rm -rf /tmp/containerd-mount*');
  // Clean up containerd tmpmounts dir
  await ssh.execCommand('rm -rf /var/lib/containerd/tmpmounts/*');
  console.log('Temp mounts cleaned.');

  console.log('\n=== STEP 4: KILL ANY REMAINING PROCESSES ===');
  await ssh.execCommand('killall -9 containerd containerd-shim containerd-shim-runc-v2 dockerd docker 2>/dev/null || true');
  // Wait a moment for kernel to release FDs
  await new Promise(r => setTimeout(r, 3000));
  console.log('Processes killed.');

  console.log('\n=== STEP 5: CHECK FILE-NR AFTER CLEANUP ===');
  const after = await ssh.execCommand('cat /proc/sys/fs/file-nr');
  console.log('file-nr AFTER:', after.stdout.trim());

  console.log('\n=== STEP 6: START CONTAINERD AND DOCKER WITH HIGH LIMITS ===');
  await ssh.execCommand('systemctl start containerd');
  await new Promise(r => setTimeout(r, 2000));
  await ssh.execCommand('systemctl start docker');
  await new Promise(r => setTimeout(r, 3000));
  console.log('Services started.');

  console.log('\n=== STEP 7: VERIFY NEW CONTAINERD FD LIMITS ===');
  const ctdPid = await ssh.execCommand('pgrep -x containerd');
  const pid = ctdPid.stdout.trim().split('\n')[0];
  if (pid) {
    const limits = await ssh.execCommand(`cat /proc/${pid}/limits | grep "Max open files"`);
    console.log('Containerd limits:', limits.stdout.trim());
    const fdCount = await ssh.execCommand(`ls /proc/${pid}/fd | wc -l`);
    console.log('Containerd open FDs:', fdCount.stdout.trim());
  }

  console.log('\n=== STEP 8: CHECK SYSTEM FILE-NR ===');
  const fileNr = await ssh.execCommand('cat /proc/sys/fs/file-nr');
  console.log('file-nr NOW:', fileNr.stdout.trim());

  console.log('\n=== STEP 9: TRY STARTING SINGLE CONTAINER FIRST ===');
  const testRun = await ssh.execCommand('docker run --rm alpine echo "Container test OK"');
  console.log('Test container:', testRun.stdout || testRun.stderr);

  console.log('\n=== STEP 10: DOCKER COMPOSE UP ===');
  const up = await ssh.execCommand('docker compose up -d', {
    cwd: '/root/supabase/docker',
    onStdout(chunk) { process.stdout.write(chunk.toString()); },
    onStderr(chunk) { process.stderr.write(chunk.toString()); }
  });
  console.log('\nCompose up finished.');

  console.log('\n=== STEP 11: WAIT AND CHECK STATUS ===');
  await new Promise(r => setTimeout(r, 20000));
  const ps = await ssh.execCommand('docker compose ps', { cwd: '/root/supabase/docker' });
  console.log(ps.stdout || ps.stderr);

  ssh.dispose();
}

run().catch(err => {
  console.error('Failed:', err);
  if (ssh) ssh.dispose();
  process.exit(1);
});
