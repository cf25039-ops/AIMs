import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Delete old deploy.zip
if (fs.existsSync('deploy.zip')) {
  fs.unlinkSync('deploy.zip');
  console.log('Old deploy.zip deleted.');
}

// Use PowerShell Compress-Archive to create zip
// Include: src/, package.json, package-lock.json, next.config.ts, tsconfig.json, 
// tailwind.config.ts, components.json, postcss.config.js, Dockerfile, docker-compose.yml, .env.local
console.log('Creating deploy.zip...');

// First, create a temp staging directory
const staging = path.join(process.cwd(), '_deploy_staging');
if (fs.existsSync(staging)) {
  fs.rmSync(staging, { recursive: true });
}
fs.mkdirSync(staging);

// Copy files
const filesToCopy = [
  'package.json',
  'package-lock.json',
  'next.config.ts',
  'tsconfig.json',
  'tailwind.config.ts',
  'components.json',
  'postcss.config.js',
  'Dockerfile',
  'docker-compose.yml',
  '.env.local',
  '.dockerignore'
];

for (const file of filesToCopy) {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, path.join(staging, file));
    console.log(`  Copied: ${file}`);
  } else {
    console.warn(`  Skipped (not found): ${file}`);
  }
}

// Copy src directory recursively
function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('  Copying src/ directory...');
copyDirSync('src', path.join(staging, 'src'));
console.log('  Copied: src/');

// Create zip using PowerShell
console.log('Compressing to deploy.zip...');
execSync(`powershell -Command "Compress-Archive -Path '${staging}\\*' -DestinationPath '${path.join(process.cwd(), 'deploy.zip')}' -Force"`, { stdio: 'inherit' });

// Cleanup staging
fs.rmSync(staging, { recursive: true });

const stats = fs.statSync('deploy.zip');
console.log(`\ndeploy.zip created: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
