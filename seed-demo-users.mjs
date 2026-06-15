import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://api-aims.cipher-node.org',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3Nzg4MDg4NzAsImV4cCI6MTkzNjQ4ODg3MH0.V0gaMYY_DWSP4dyMY6KaZZFuxMrCzzdJCR0CsUjuk_Y',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const demoUsers = [
  { email: 'kkm.admin@aims.com', password: 'Admin123!', role: 'project_admin', name: 'KKM Admin' },
  { email: 'tech.kuantan@aims.com', password: 'Admin123!', role: 'technician', name: 'Tech Kuantan' },
  { email: 'user.emergency@aims.com', password: 'Admin123!', role: 'department_user', name: 'Emergency User' },
];

async function seed() {
  // First check existing users
  const { data: { users: existing } } = await supabase.auth.admin.listUsers();
  console.log(`Existing users: ${existing.length}`);
  for (const u of existing) {
    console.log(`  ${u.email} (${u.id.slice(0, 8)}...)`);
  }

  for (const u of demoUsers) {
    // Skip if already exists
    if (existing.some(e => e.email === u.email)) {
      console.log(`⏭️ ${u.email} already exists, skipping`);
      continue;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.name },
    });

    if (error) {
      console.log(`❌ ${u.email}: ${error.message}`);
      continue;
    }

    if (data?.user) {
      console.log(`✅ ${u.email} created (id: ${data.user.id.slice(0, 8)}...)`);

      // Insert/update profile with role
      const { error: profileErr } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          email: u.email,
          full_name: u.name,
          role: u.role,
        }, { onConflict: 'id' });

      if (profileErr) {
        console.log(`  ⚠️ Profile update failed: ${profileErr.message}`);
      } else {
        console.log(`  ✅ Profile set to role: ${u.role}`);
      }
    }
  }

  // Verify all 4 accounts now exist
  console.log('\n=== Verification ===');
  const { data: { users: all } } = await supabase.auth.admin.listUsers();
  for (const u of all) {
    const { data: p } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', u.id)
      .single();
    console.log(`  ${u.email} — role: ${p?.role || '?'}, name: ${p?.full_name || '?'}`);
  }
}

seed().catch(e => console.error(e));