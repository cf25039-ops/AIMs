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

  console.log('\n--- TESTING DOCKER HUB REGISTRY API CONNECTIVITY ---');
  const curl = await ssh.execCommand('curl -i https://registry-1.docker.io/v2/');
  console.log(curl.stdout || curl.stderr);

  ssh.dispose();
}

run().catch(err => {
  console.error('Registry test failed:', err);
  if (ssh) ssh.dispose();
});
