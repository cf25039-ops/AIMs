import { NodeSSH } from 'node-ssh';
import fs from 'fs';
import path from 'path';

const ssh = new NodeSSH();

async function run() {
  console.log('Connecting to remote VPS 192.168.0.115...');
  await ssh.connect({
    host: '192.168.0.115',
    username: 'root',
    password: '281198'
  });
  console.log('Connected!');

  async function runCmd(title, cmd, options = {}) {
    console.log(`\n=== ${title} ===`);
    console.log(`Running: ${cmd}`);
    const res = await ssh.execCommand(cmd, options);
    if (res.stdout) console.log(res.stdout);
    if (res.stderr) console.error(res.stderr);
    if (res.code !== 0) {
      throw new Error(`Command failed with code ${res.code}`);
    }
    return res.stdout;
  }

  // 1. Clone Supabase
  console.log('\n=== Checking if Supabase directory already exists... ===');
  const checkDir = await ssh.execCommand('ls -la /root/supabase');
  if (checkDir.code !== 0) {
    await runCmd('Clone Supabase Repo', 'git clone --depth 1 https://github.com/supabase/supabase /root/supabase');
  } else {
    console.log('Supabase repo already cloned.');
  }

  // 2. Fetch the env.example
  console.log('\n=== Generating customized .env file for Supabase... ===');
  const envExample = await runCmd('Fetch .env.example', 'cat /root/supabase/docker/.env.example');

  // Replace config variables
  let envContent = envExample;
  
  // Custom helper to replace or add env values
  const replaceEnv = (key, value) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (envContent.match(regex)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  };

  replaceEnv('JWT_SECRET', 'kXPb4RiIDexqzI0QztZDZyf6semyL18G2k5RGJi2');
  replaceEnv('ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc4ODA4ODcwLCJleHAiOjE5MzY0ODg4NzB9.j07_TV5a3HfEkV3CgUA4TCFhHVhBhd5qQ5X23O5MacY');
  replaceEnv('SERVICE_ROLE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3Nzg4MDg4NzAsImV4cCI6MTkzNjQ4ODg3MH0.V0gaMYY_DWSP4dyMY6KaZZFuxMrCzzdJCR0CsUjuk_Y');
  replaceEnv('POSTGRES_PASSWORD', 'fdee8b256a9d4b74a379a302b4d3fbdc');
  replaceEnv('SITE_URL', 'http://192.168.0.115:3000');
  replaceEnv('API_EXTERNAL_URL', 'http://192.168.0.115:8000');

  // Write temporary env file locally
  const tempEnvPath = path.join(process.cwd(), 'temp_supabase.env');
  fs.writeFileSync(tempEnvPath, envContent, 'utf8');

  // Upload customized env file
  console.log('Uploading customized .env file...');
  await ssh.putFile(tempEnvPath, '/root/supabase/docker/.env');
  console.log('Upload complete!');
  
  // Clean up local temp file
  fs.unlinkSync(tempEnvPath);

  // 3. Start Supabase Docker containers
  await runCmd('Start Supabase Containers', 'docker compose up -d', {
    cwd: '/root/supabase/docker'
  });

  console.log('\n=== SUPABASE ENGINE STARTED SUCCESSFULLY ON 192.168.0.115! ===');
  ssh.dispose();
}

run().catch(err => {
  console.error('Supabase setup failed:', err);
  if (ssh) ssh.dispose();
  process.exit(1);
});
