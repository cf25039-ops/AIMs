import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import http from 'http';
import WebSocket from 'ws';

const chromePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe')
];

let chromePath = null;
for (const p of chromePaths) {
  if (fs.existsSync(p)) {
    chromePath = p;
    break;
  }
}

if (!chromePath) {
  console.error('Could not find chrome.exe');
  process.exit(1);
}

console.log('Using Chrome:', chromePath);

// Start Chrome headlessly with remote debugging
const chromeProcess = spawn(chromePath, [
  '--headless',
  '--disable-gpu',
  '--remote-debugging-port=9222',
  '--user-data-dir=' + path.resolve('chrome-profile')
]);

// Wait 1.5 seconds for Chrome to start
setTimeout(() => {
  console.log('Fetching targets from http://127.0.0.1:9222/json ...');
  http.get('http://127.0.0.1:9222/json', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      try {
        const targets = JSON.parse(data);
        const pageTarget = targets.find(t => t.type === 'page');
        if (!pageTarget) {
          console.error('No page target found.');
          cleanup();
          return;
        }

        const wsUrl = pageTarget.webSocketDebuggerUrl;
        console.log('Connecting to WebSocket:', wsUrl);
        connectToChrome(wsUrl);
      } catch (err) {
        console.error('Failed to parse target JSON:', err.message);
        cleanup();
      }
    });
  }).on('error', (err) => {
    console.error('Failed to query Chrome targets:', err.message);
    cleanup();
  });
}, 1500);

function connectToChrome(wsUrl) {
  const ws = new WebSocket(wsUrl);

  ws.on('open', () => {
    console.log('Connected to Chrome DevTools Protocol!');

    // Enable Console and Runtime domains
    sendCmd(ws, 1, 'Console.enable');
    sendCmd(ws, 2, 'Runtime.enable');
    sendCmd(ws, 3, 'Log.enable');

    // Navigate to page
    console.log('Navigating to http://192.168.0.115:3000/login ...');
    sendCmd(ws, 4, 'Page.navigate', { url: 'http://192.168.0.115:3000/login' });
  });

  ws.on('message', (message) => {
    const msg = JSON.parse(message);
    
    // Log console messages
    if (msg.method === 'Console.messageAdded') {
      const { level, text, url, line } = msg.params.message;
      console.log(`[Browser Console - ${level.toUpperCase()}] ${text} (${url}:${line})`);
    }

    if (msg.method === 'Log.entryAdded') {
      const { level, text, url, lineNumber } = msg.params.entry;
      console.log(`[Browser Log - ${level.toUpperCase()}] ${text} (${url}:${lineNumber})`);
    }

    // Log JS exceptions
    if (msg.method === 'Runtime.exceptionThrown') {
      const { exceptionDetails } = msg.params;
      const { text, exception, stackTrace } = exceptionDetails;
      const description = exception ? exception.description : 'No description';
      console.error(`\n🔥 BROWSER JS EXCEPTION THROWN:`);
      console.error(`Message: ${text}`);
      console.error(`Description: ${description}`);
      if (stackTrace) {
        console.error(`Stack trace:`);
        stackTrace.callFrames.forEach(f => {
          console.error(`  at ${f.functionName} (${f.url}:${f.lineNumber}:${f.columnNumber})`);
        });
      }
      console.error('\n');
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err.message);
  });

  // Run for 6 seconds, then clean up
  setTimeout(() => {
    console.log('Closing WebSocket connection...');
    ws.close();
    cleanup();
  }, 6000);
}

function sendCmd(ws, id, method, params = {}) {
  ws.send(JSON.stringify({ id, method, params }));
}

function cleanup() {
  console.log('Killing Chrome process...');
  chromeProcess.kill();
  try {
    fs.rmSync(path.resolve('chrome-profile'), { recursive: true, force: true });
  } catch {}
  process.exit(0);
}
