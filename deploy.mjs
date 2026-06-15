import { NodeSSH } from 'node-ssh';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ssh = new NodeSSH();

async function deploy() {
  console.log('Connecting to server 192.168.0.115...');
  await ssh.connect({
    host: '192.168.0.115',
    username: 'root',
    password: '281198'
  });
  console.log('Connected!');

  const remoteDir = '/root/aims-web';

  console.log(`Setting up remote directory ${remoteDir}...`);
  await ssh.execCommand(`mkdir -p ${remoteDir}`);

  console.log('Uploading deploy.zip to server (this may take a minute)...');
  await ssh.putFile(path.join(__dirname, 'deploy.zip'), `${remoteDir}/deploy.zip`);
  console.log('Upload complete.');

  console.log('Extracting files on server...');
  await ssh.execCommand('apt-get update && apt-get install -y unzip', { cwd: remoteDir }); 
  await ssh.execCommand('unzip -o deploy.zip', { cwd: remoteDir });
  
  console.log('Building and starting Docker container (streaming logs)...');
  await ssh.execCommand('docker compose up -d --build', { 
    cwd: remoteDir,
    onStdout(chunk) {
      process.stdout.write(chunk.toString());
    },
    onStderr(chunk) {
      process.stderr.write(chunk.toString());
    }
  });

  console.log('Cleaning up...');
  await ssh.execCommand('rm deploy.zip', { cwd: remoteDir });
  
  console.log('Deployment completed successfully! The app should be accessible at http://192.168.0.115:3000');
  ssh.dispose();
}

deploy().catch(err => {
  console.error('Deployment failed:', err);
  if (ssh) ssh.dispose();
  process.exit(1);
});
