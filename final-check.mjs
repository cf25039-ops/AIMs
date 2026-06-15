import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();

async function check() {
  await ssh.connect({ host: '192.168.0.115', username: 'root', password: '281198' });

  const r = await ssh.execCommand('ls -l /root/aims-web/src/hooks/use-session-timeout.ts /root/aims-web/src/lib/ratelimit.ts /root/aims-web/src/lib/supabase/middleware.ts /root/aims-web/src/lib/supabase/server.ts');
  console.log(r.stdout);

  const r2 = await ssh.execCommand('docker exec aims-web sh -c "grep -c httpOnly /app/.next/server/src/middleware.js"');
  console.log('httpOnly in middleware.js:', r2.stdout.trim());

  const r3 = await ssh.execCommand('curl -s -o /dev/null -w \"%%{http_code}\" http://localhost:3000/privacy');
  console.log('Privacy status:', r3.stdout.trim());

  const r4 = await ssh.execCommand('curl -s -o /dev/null -w \"%%{http_code}\" http://localhost:3000/api/auth/login -X POST -H \"Content-Type: application/json\" -d \"{\\\"email\\\":\\\"x\\\",\\\"password\\\":\\\"x\\\"}\"');
  console.log('Login API status:', r4.stdout.trim());

  ssh.dispose();
}
check().catch(e => { console.error(e); ssh.dispose(); process.exit(1); });