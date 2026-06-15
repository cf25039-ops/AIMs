import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();

async function check() {
  await ssh.connect({ host: '192.168.0.115', username: 'root', password: '281198' });

  // Check .env.local on server
  const r1 = await ssh.execCommand('cat /root/aims-web/.env.local');
  console.log('=== .env.local ===');
  console.log(r1.stdout);

  // Check supabase auth service logs
  const r2 = await ssh.execCommand('docker logs supabase-auth 2>&1 | tail -20');
  console.log('\n=== supabase-auth logs ===');
  console.log(r2.stdout);

  // Test login API directly
  const r3 = await ssh.execCommand(`curl -s -X POST 'http://localhost:8000/auth/v1/token?grant_type=password' -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc4ODA4ODcwLCJleHAiOjE5MzY0ODg4NzB9.j07_TV5a3HfEkV3CgUA4TCFhHVhBhd5qQ5X23O5MacY' -H 'Content-Type: application/json' -d '{"email":"superadmin@aims.com","password":"Admin123!"}'`);
  console.log('\n=== Login test (superadmin@aims.com) ===');
  console.log(r3.stdout);

  // Check if Supabase URL is accessible
  const r4 = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/auth/v1/health');
  console.log('\n=== Auth health ===');
  console.log(r4.stdout);

  ssh.dispose();
}
check().catch(e => { console.error(e.message); ssh.dispose(); process.exit(1); });