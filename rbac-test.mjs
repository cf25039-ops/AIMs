import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();

async function testRBAC() {
  await ssh.connect({ host: '192.168.0.115', username: 'root', password: '281198' });

  // Create a session for department_user
  const loginCmd = `curl.exe -s -c cookies.txt -X POST http://192.168.0.115:3000/api/auth/login -H "Content-Type: application/json" -d "{\\"email\\":\\"user.emergency@aims.com\\",\\"password\\":\\"Admin123!\\"}"`;
  await ssh.execCommand(loginCmd);

  // Try to access /settings/users with the cookie
  const accessCmd = `curl.exe -s -b cookies.txt -w "\\n%{http_code}" http://192.168.0.115:3000/settings/users`;
  const { stdout } = await ssh.execCommand(accessCmd);
  console.log('/settings/users access:', stdout.trim());

  // Try /audit
  const auditCmd = `curl.exe -s -b cookies.txt -w "\\n%{http_code}" http://192.168.0.115:3000/audit`;
  const { stdout: aud } = await ssh.execCommand(auditCmd);
  console.log('/audit access:', aud.trim());

  // Try /contracts (allowed)
  const contractsCmd = `curl.exe -s -b cookies.txt -w "\\n%{http_code}" http://192.168.0.115:3000/contracts`;
  const { stdout: cont } = await ssh.execCommand(contractsCmd);
  console.log('/contracts access:', cont.trim());

  ssh.dispose();
}
testRBAC().catch(console.error);