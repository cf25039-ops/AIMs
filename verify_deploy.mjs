import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function run() {
  await ssh.connect({ host: '192.168.0.115', username: 'root', password: '281198' });

  // Check source files exist
  const srcCheck = await ssh.execCommand('ls -la /root/aims-web/src/hooks/use-session-timeout.ts /root/aims-web/src/lib/ratelimit.ts /root/aims-web/src/lib/password-policy.ts');
  console.log('=== Source files ===');
  console.log(srcCheck.stdout || srcCheck.stderr);

  // Check client-side chunks for session timeout
  const clientChunks = await ssh.execCommand('docker exec aims-web sh -c "ls /app/.next/static/chunks/*.js 2>/dev/null | wc -l"');
  console.log('\n=== Client-side chunk count ===');
  console.log(clientChunks.stdout || clientChunks.stderr);

  // Search for timeout-related code in client chunks
  const sessionGrep = await ssh.execCommand('docker exec aims-web sh -c "grep -l timeout.*session /app/.next/static/chunks/*.js 2>/dev/null | head -5"');
  console.log('\n=== Chunks with timeout+session ===');
  console.log(sessionGrep.stdout || sessionGrep.stderr);

  // Also check for sessionTimeout or useSessionTimeout
  const useSession = await ssh.execCommand('docker exec aims-web sh -c "grep -l useSessionTimeout /app/.next/static/chunks/*.js 2>/dev/null | head -5"');
  console.log('\n=== Chunks with useSessionTimeout ===');
  console.log(useSession.stdout || useSession.stderr);

  // Check middleware for public path checks
  const mwPaths = await ssh.execCommand('docker exec aims-web sh -c "grep -c api.auth.login /app/.next/server/src/middleware.js 2>/dev/null || echo NOT_FOUND"');
  console.log('\n=== api.auth.login in middleware ===');
  console.log(mwPaths.stdout || mwPaths.stderr);

  // Check middleware size and search for "/privacy"
  const mwPrivacy = await ssh.execCommand('docker exec aims-web sh -c "grep -c /privacy /app/.next/server/src/middleware.js 2>/dev/null || echo NOT_FOUND"');
  console.log('\n=== /privacy in middleware ===');
  console.log(mwPrivacy.stdout || mwPrivacy.stderr);

  // Check the middleware for auth callback
  const mwCallback = await ssh.execCommand('docker exec aims-web sh -c "grep -c auth/callback /app/.next/server/src/middleware.js 2>/dev/null || echo NOT_FOUND"');
  console.log('\n=== auth/callback in middleware ===');
  console.log(mwCallback.stdout || mwCallback.stderr);

  // Check middleware file exists
  const mwFile = await ssh.execCommand('docker exec aims-web sh -c "ls -la /app/.next/server/src/middleware.js 2>/dev/null"');
  console.log('\n=== Middleware file ===');
  console.log(mwFile.stdout || mwFile.stderr);

  // Check middleware content for PUBLIC_PATHS
  const mwContent = await ssh.execCommand('docker exec aims-web sh -c "grep -c PUBLIC_PATHS /app/.next/server/src/middleware.js 2>/dev/null || echo NOT_FOUND"');
  console.log('\n=== PUBLIC_PATHS in middleware ===');
  console.log(mwContent.stdout || mwContent.stderr);

  ssh.dispose();
}

run().catch(e => { console.error(e); ssh.dispose(); });
