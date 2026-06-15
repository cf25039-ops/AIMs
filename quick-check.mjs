#!/usr/bin/env node
import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();
async function check() {
  try {
    await ssh.connect({
      host: '192.168.0.115',
      username: 'root',
      password: '281198'
    });

    // Check middleware content directly
    const mw = await ssh.execCommand('docker exec aims-web cat /app/.next/server/src/middleware.js | grep -o PUBLIC_PATHS | head -1');
    console.log('PUBLIC_PATHS in middleware:', mw.stdout.trim() || '(not found)');
    
    // Check for /privacy in middleware
    const priv = await ssh.execCommand('docker exec aims-web grep -c "/privacy" /app/.next/server/src/middleware.js');
    console.log('/privacy count:', priv.stdout.trim());
    
    // Check static chunks folder exists and count files
    const chunks = await ssh.execCommand('docker exec aims-web ls -la /app/.next/static/ 2>&1');
    console.log('Static directory contents:');
    console.log(chunks.stdout);
    
    const chunksSub = await ssh.execCommand('docker exec aims-web ls -la /app/.next/static/chunks/ 2>/dev/null | head -20');
    console.log('\nChunks directory contents:');
    console.log(chunksSub.stdout);
    
    // Check for session timeout string in any chunk
    const sess = await ssh.execCommand('docker exec aims-web sh -c "grep -l useSessionTimeout /app/.next/static/chunks/*.js 2>/dev/null"');
    console.log('Files with useSessionTimeout:', sess.stdout || 'none');
    
    const sessStr = await ssh.execCommand('docker exec aims-web sh -c "grep -l timeout /app/.next/static/chunks/*.js 2>/dev/null | head -5"');
    console.log('Files with timeout:', sessStr.stdout || 'none');

    // Also check the pages chunks directory
    const pageChunks = await ssh.execCommand('docker exec aims-web ls /app/.next/static/chunks/pages/ 2>/dev/null | head -10');
    console.log('Page chunks:', pageChunks.stdout || 'none');
    
    // Check the app directory chunks
    const appChunks = await ssh.execCommand('docker exec aims-web ls /app/.next/static/chunks/app/ 2>/dev/null | head -20');
    console.log('App chunks:', appChunks.stdout || 'none');

    await ssh.dispose();
  } catch (e) {
    console.error(e);
  }
}
check();
