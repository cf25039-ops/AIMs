import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

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
  console.error('Could not find chrome.exe in standard paths.');
  process.exit(1);
}

console.log('Using Chrome path:', chromePath);

const screenshotPath = path.resolve('chrome-screenshot.png');
if (fs.existsSync(screenshotPath)) {
  fs.unlinkSync(screenshotPath);
}

// Enable logging and take screenshot
const cmd = `"${chromePath}" --headless --disable-gpu --enable-logging --screenshot="${screenshotPath}" --window-size=1280,800 http://192.168.0.115:3000/login`;

console.log('Running command:', cmd);
console.log('Waiting 5 seconds for page load...');

const child = exec(cmd, (error, stdout, stderr) => {
  console.log('\n--- STDOUT ---');
  console.log(stdout);
  console.log('\n--- STDERR ---');
  console.log(stderr);

  if (fs.existsSync(screenshotPath)) {
    console.log(`\nScreenshot saved to ${screenshotPath}`);
  } else {
    console.log('\nNo screenshot was generated.');
  }

  // Check Chrome log file
  const appData = process.env.LOCALAPPDATA || '';
  const logPath1 = path.join(appData, 'Google\\Chrome\\User Data\\chrome_debug.log');
  const logPath2 = path.resolve('chrome_debug.log');
  
  console.log('\nChecking for chrome_debug.log...');
  [logPath1, logPath2].forEach(lp => {
    if (fs.existsSync(lp)) {
      console.log(`Found log at: ${lp}`);
      const logLines = fs.readFileSync(lp, 'utf8').split('\n').slice(-50).join('\n');
      console.log('--- LAST 50 LINES ---');
      console.log(logLines);
    }
  });
});

setTimeout(() => {
  console.log('Killing Chrome...');
  child.kill();
}, 6000);
