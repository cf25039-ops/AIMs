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

  console.log('\n--- TESTING DNS RESOLUTION FOR DOCKER REGISTRY ---');
  const ns1 = await ssh.execCommand('nslookup registry-1.docker.io');
  console.log(ns1.stdout || ns1.stderr);

  console.log('\n--- TESTING DNS RESOLUTION FOR CLOUDFLARE BLOB SERVERS ---');
  const ns2 = await ssh.execCommand('nslookup production.cloudflare.docker.com');
  console.log(ns2.stdout || ns2.stderr);

  console.log('\n--- TESTING PING TO REGISTRY ---');
  const ping1 = await ssh.execCommand('ping -c 3 registry-1.docker.io');
  console.log(ping1.stdout || ping1.stderr);

  console.log('\n--- TESTING PING TO CLOUDFLARE BLOB SERVERS ---');
  const ping2 = await ssh.execCommand('ping -c 3 production.cloudflare.docker.com');
  console.log(ping2.stdout || ping2.stderr);

  console.log('\n--- TESTING CURL TO CLOUDFLARE BLOB SERVERS ---');
  const curl = await ssh.execCommand('curl -I -s --connect-timeout 5 https://production.cloudflare.docker.com/');
  console.log(curl.stdout || curl.stderr);

  ssh.dispose();
}

run().catch(err => {
  console.error('DNS test failed:', err);
  if (ssh) ssh.dispose();
});
