import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();

async function check() {
  await ssh.connect({ host: '192.168.0.115', username: 'root', password: '281198' });

  const r = await ssh.execCommand('ls /root/aims-web/src/app/\\(app\\)/settings/');
  console.log('=== (app)/settings/ ===');
  console.log(r.stdout);

  const r2 = await ssh.execCommand('ls /root/aims-web/src/app/\\(app\\)/settings/users/ 2>&1');
  console.log('=== (app)/settings/users/ ===');
  console.log(r2.stdout);

  const r3 = await ssh.execCommand('ls /root/aims-web/src/app/\\(app\\)/settings/catalog/ 2>&1');
  console.log('=== (app)/settings/catalog/ ===');
  console.log(r3.stdout);

  ssh.dispose();
}
check().catch(e => { console.error(e.message); ssh.dispose(); process.exit(1); });