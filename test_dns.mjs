import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '192.168.0.115',
    username: 'root',
    password: '281198',
    readyTimeout: 30000
  });

  console.log("Testing DNS resolution inside aims-web container...");
  const cmd = await ssh.execCommand('docker exec aims-web node -e "require(\'dns\').lookup(\'api-aims.cipher-node.org\', (err, address, family) => console.log(err ? err : address))"');
  console.log(cmd.stdout);
  console.log(cmd.stderr);
  
  ssh.dispose();
}

run();
