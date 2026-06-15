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

  console.log('\n--- TESTING NETWORK SPEED FROM REMOTE VPS ---');
  // Download 10MB file from standard speedtest server to measure speed
  const speed = await ssh.execCommand('curl -o /dev/null -s -w "Speed: %{speed_download} B/s (%{time_total} seconds)\n" http://ipv4.download.thinkbroadband.com/10MB.zip');
  console.log(speed.stdout || speed.stderr);

  ssh.dispose();
}

run().catch(err => {
  console.error('Speed test failed:', err);
  if (ssh) ssh.dispose();
});
