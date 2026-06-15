const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) envVars[key.trim()] = val.join('=').trim();
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Updating tech.kuantan@aims.com facility to Hospital Kuantan...");
  const { data, error } = await supabase
    .from('profiles')
    .update({ assigned_facility_id: 'ffffffff-ffff-ffff-ffff-ffffffffffff' })
    .eq('id', '092ae7a6-56d9-4618-9c05-33fd3b5eae25')
    .select();
    
  if (error) {
    console.error(error);
  } else {
    console.log("SUCCESS:", data);
  }

  console.log("\nUpdating kkm.admin@aims.com facility to Hospital Kuantan...");
  const { data: data2, error: error2 } = await supabase
    .from('profiles')
    .update({ assigned_facility_id: 'ffffffff-ffff-ffff-ffff-ffffffffffff' })
    .eq('id', '5460fc2b-9148-48a3-a068-e1dc710b2ed0')
    .select();
    
  if (error2) {
    console.error(error2);
  } else {
    console.log("SUCCESS:", data2);
  }
}

run().catch(console.error);
