import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://api-aims.cipher-node.org',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3Nzg4MDg4NzAsImV4cCI6MTkzNjQ4ODg3MH0.V0gaMYY_DWSP4dyMY6KaZZFuxMrCzzdJCR0CsUjuk_Y',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const PASSWORD = 'Admin123!';

async function resetPasswords() {
  // List all users
  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) { console.error('List error:', listErr); return; }

  console.log(`Found ${users.length} users. Resetting passwords to '${PASSWORD}'...\n`);

  for (const user of users) {
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      password: PASSWORD,
      email_confirm: true,
    });
    
    if (error) {
      console.log(`  ❌ ${user.email} — ${error.message}`);
    } else {
      console.log(`  ✅ ${user.email} — password reset`);
    }
  }

  // Verify login
  console.log('\n=== Verification Login ===');
  const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
    email: 'superadmin@aims.com',
    password: PASSWORD,
  });

  if (loginErr) {
    console.log(`  ❌ Login failed: ${loginErr.message}`);
  } else {
    console.log(`  ✅ Login SUCCESS — user: ${loginData.user?.email}`);
    await supabase.auth.signOut();
  }
}

resetPasswords().catch(e => console.error(e));