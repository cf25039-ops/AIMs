import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://api-aims.cipher-node.org',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc4ODA4ODcwLCJleHAiOjE5MzY0ODg4NzB9.j07_TV5a3HfEkV3CgUA4TCFhHVhBhd5qQ5X23O5MacY'
);

const PASSWORD = 'Admin123!';
const EMAILS = [
  'superadmin@aims.com',
  'admin@aims.com',
  'technician@aims.com',
  'viewer@aims.com',
  'test-verify@aims.com',
];

async function test() {
  console.log(`Testing login with password: ${PASSWORD}\n`);
  
  for (const email of EMAILS) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: PASSWORD });
    
    if (error) {
      console.log(`  ❌ ${email} — ${error.message}`);
    } else {
      console.log(`  ✅ ${email} — LOGIN OK`);
      await supabase.auth.signOut();
    }
  }
}

test().catch(e => console.error(e));