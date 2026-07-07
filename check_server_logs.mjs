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
  const webLogs = await ssh.execCommand('docker logs aims-web --tail 50');
  console.log(webLogs.stdout);
  console.log(webLogs.stderr);

  console.log("\n=== SUPABASE AUTH LOGS ===");
  const authLogs = await ssh.execCommand('cd /root/supabase/docker && docker compose logs auth --tail 20');
  console.log(authLogs.stdout);

  console.log("\n=== SUPABASE KONG LOGS ===");
  const kongLogs = await ssh.execCommand('cd /root/supabase/docker && docker compose logs kong --tail 20');
  console.log(kongLogs.stdout);

  ssh.dispose();
}

run();
