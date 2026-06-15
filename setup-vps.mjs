import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function run() {
  console.log('Connecting to remote VPS 192.168.0.115...');
  await ssh.connect({
    host: '192.168.0.115',
    username: 'root',
    password: '281198'
  });
  console.log('Connected!');

  // Helper to execute and print command outputs
  async function runCmd(title, cmd, options = {}) {
    console.log(`\n=== ${title} ===`);
    console.log(`Running: ${cmd}`);
    const res = await ssh.execCommand(cmd, options);
    if (res.stdout) console.log(res.stdout);
    if (res.stderr) console.error(res.stderr);
    if (res.code !== 0) {
      throw new Error(`Command failed with code ${res.code}`);
    }
  }

  // 1. Update apt repositories
  await runCmd('Update Apt Repositories', 'apt-get update');

  // 2. Install prerequisites
  await runCmd('Install Prerequisites', 'apt-get install -y ca-certificates curl gnupg lsb-release');

  // 3. Add Docker GPG key
  await runCmd('Add Docker GPG Key', 'mkdir -p /etc/apt/keyrings && curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor --yes -o /etc/apt/keyrings/docker.gpg');

  // 4. Set up Docker stable repository
  await runCmd('Set up Docker Apt Repo', 'echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null');

  // 5. Update repos with Docker list
  await runCmd('Update Apt with Docker Repo', 'apt-get update');

  // 6. Install Docker
  await runCmd('Install Docker Engine & Plugins', 'apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin');

  // 7. Verify docker installation
  await runCmd('Verify Docker Status', 'systemctl enable docker && systemctl start docker && docker --version && docker compose version');

  console.log('\n=== DOCKER INSTALLATION COMPLETE! ===');
  ssh.dispose();
}

run().catch(err => {
  console.error('Docker installation failed:', err);
  if (ssh) ssh.dispose();
  process.exit(1);
});
