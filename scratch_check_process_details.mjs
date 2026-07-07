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

  console.log('\n--- DETAILED PROCESS STATUS FOR PID 19356 ---');
  const status = await ssh.execCommand('cat /proc/19356/status');
  console.log(status.stdout || status.stderr);

  console.log('\n--- BLOCKING CHANNEL (WCHAN) FOR PID 19356 ---');
  const wchan = await ssh.execCommand('cat /proc/19356/wchan');
  console.log(wchan.stdout || wchan.stderr);

  console.log('\n--- STACK FOR PID 19356 ---');
  const stack = await ssh.execCommand('cat /proc/19356/stack');
  console.log(stack.stdout || stack.stderr);

  console.log('\n--- DOCKER CLI PARENT PROCESS ---');
  const pstree = await ssh.execCommand('pstree -p -a 19356');
  console.log(pstree.stdout || pstree.stderr);

  ssh.dispose();
}

run().catch(err => {
  console.error('Check failed:', err);
  if (ssh) ssh.dispose();
});
