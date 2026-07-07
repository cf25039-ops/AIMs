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

  console.log('\n=== DIAGNOSTIC: MOUNT COUNTS AND LIMITS ===');
  
  // Check mount count
  const mountCount = await ssh.execCommand('cat /proc/self/mountinfo | wc -l');
  console.log('Current mount count:', mountCount.stdout.trim());

  // Check mount-max
  const mountMax = await ssh.execCommand('cat /proc/sys/kernel/mount-max 2>/dev/null || echo "not available"');
  console.log('kernel.mount-max:', mountMax.stdout.trim());

  // Check nr_open
  const nrOpen = await ssh.execCommand('cat /proc/sys/fs/nr_open');
  console.log('fs.nr_open:', nrOpen.stdout.trim());

  // Count containerd overlay mounts specifically
  const overlayMounts = await ssh.execCommand('cat /proc/self/mountinfo | grep -c containerd');
  console.log('Containerd overlay mounts:', overlayMounts.stdout.trim());

  // List all containerd mounts
  const overlayList = await ssh.execCommand('cat /proc/self/mountinfo | grep containerd | head -20');
  console.log('First 20 containerd mounts:');
  console.log(overlayList.stdout);

  // Check if we're in LXC
  const lxc = await ssh.execCommand('cat /proc/1/environ 2>/dev/null | tr "\\0" "\\n" | grep -i container || echo "Not in container"');
  console.log('Container environment:', lxc.stdout.trim());

  // Check virtualization type
  const virt = await ssh.execCommand('systemd-detect-virt 2>/dev/null || echo "unknown"');
  console.log('Virtualization:', virt.stdout.trim());

  // Check total mount count in system
  const totalMounts = await ssh.execCommand('cat /proc/self/mountinfo | wc -l');
  console.log('Total system mounts:', totalMounts.stdout.trim());

  // Check containerd snapshotter mount leaks
  const snapMounts = await ssh.execCommand('mount | grep "containerd.*overlay" | wc -l');
  console.log('Leaked containerd overlay mounts:', snapMounts.stdout.trim());

  ssh.dispose();
}

run().catch(err => {
  console.error('Diagnostic failed:', err);
  if (ssh) ssh.dispose();
});
