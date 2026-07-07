import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function run() {
  await ssh.connect({ host: '192.168.0.115', username: 'root', password: '281198' });

  const sql = `
-- Enable RLS on profiles (should already be enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: Super admins can read all profiles
CREATE POLICY "Super admins can read all profiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'super_admin'
  )
);

-- Policy: Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'admin')
  )
);

-- Grant necessary permissions
GRANT SELECT, UPDATE ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;
`;

  console.log('Running RLS migration...');
  const result = await ssh.execCommand(`docker exec -i supabase-db psql -U postgres -d postgres`, { stdin: sql });

  console.log(result.stdout);
  if (result.stderr) console.log('Warnings:', result.stderr);

  // Verify
  const verify = await ssh.execCommand(
    `docker exec supabase-db psql -U postgres -d postgres -c "SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE tablename = 'profiles';"`
  );
  console.log('\n=== Profiles Policies ===');
  console.log(verify.stdout);

  ssh.dispose();
}

run().catch(err => { console.error(err); ssh.dispose(); process.exit(1); });