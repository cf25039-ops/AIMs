import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '192.168.0.115',
    username: 'root',
    password: '281198',
    readyTimeout: 30000
  });

  console.log("=== NEXT.JS (aims-web) LOGS ===");
  const webLogs = await ssh.execCommand('docker logs aims-web --tail 500');
  console.log(webLogs.stdout);
  console.log(webLogs.stderr);
  
  ssh.dispose();
}

run();
