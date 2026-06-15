import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();

async function check() {
  await ssh.connect({ host: '192.168.0.115', username: 'root', password: '281198' });

  // Test if users page accessible via curl
  const curl = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/settings/users');
  console.log('settings/users HTTP status:', curl.stdout.trim());

  // Test if settings/catalog accessible
  const curl2 = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/settings/catalog');
  console.log('settings/catalog HTTP status:', curl2.stdout.trim());

  // Test if assets accessible
  const curl3 = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/assets');
  console.log('assets HTTP status:', curl3.stdout.trim());

  // Check files
  const files = await ssh.execCommand('find /root/aims-web/src -name "admin.ts" -o -name "users" -type d 2>/dev/null');
  console.log('\nRelevant files:');
  console.log(files.stdout);

  ssh.dispose();
}
check().catch(e => { console.error(e.message); ssh.dispose(); process.exit(1); });