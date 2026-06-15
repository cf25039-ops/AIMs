import { NodeSSH } from 'node-ssh';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ssh = new NodeSSH();

const sql = `
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
`;

async function runMigration() {
  await ssh.connect({ host: '192.168.0.115', username: 'root', password: '281198' });
  
  console.log('Running RLS policies migration...');
  const { stdout, stderr } = await ssh.execCommand(
    'docker exec -i supabase-db psql -U postgres -d postgres',
    { stdin: sql }
  );
  
  console.log(stdout);
  if (stderr) console.log('Stderr:', stderr);

  // Verify
  const { stdout: verify } = await ssh.execCommand(
    `docker exec supabase-db psql -U postgres -d postgres -c "SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public';"`
  );
  console.log('\n=== Verified policies on profiles ===');
  console.log(verify);

  ssh.dispose();
}
runMigration().catch(e => { console.error(e); ssh.dispose(); process.exit(1); });