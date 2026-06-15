const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load env vars manually
const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) envVars[key.trim()] = val.join('=').trim();
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

// Use Service Role Key to bypass RLS and create Auth Users
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function seed() {
  console.log("🌱 Starting Massive Dataset Seeding...");

  try {
    // 1. Create Users
    console.log("1. Creating Users...");
    const usersData = [
      { email: 'admin.aims@test.com', name: 'Ahmad Admin', role: 'super_admin' },
      { email: 'tech.aims@test.com', name: 'Muthu Tech', role: 'technician' },
      { email: 'user.aims@test.com', name: 'Siti User', role: 'asset_owner' }
    ];

    const createdUsers = [];
    for (const u of usersData) {
      // Create in Auth (ignore if exists)
      const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
        email: u.email,
        password: 'Password123!',
        email_confirm: true,
      });
      
      if (authErr && !authErr.message.includes("already registered")) {
        console.error("Auth Error:", authErr);
      }
      
      // Fetch profile (created by DB trigger)
      let { data: profile } = await supabase.from('profiles').select('*').eq('email', u.email).single();
      if (profile) {
        // Update profile role
        await supabase.from('profiles').update({ full_name: u.name, role: u.role }).eq('id', profile.id);
        createdUsers.push(profile);
      }
    }
    
    if (createdUsers.length === 0) {
      const { data: existing } = await supabase.from('profiles').select('*').limit(3);
      createdUsers.push(...existing);
    }

    const adminId = createdUsers.find(u => u.role === 'super_admin')?.id || createdUsers[0].id;
    const techId = createdUsers.find(u => u.role === 'technician')?.id || createdUsers[0].id;

    // 2. Create Projects
    console.log("2. Creating Projects...");
    const projects = [];
    const projNames = ["KPM Digitalization", "PDRM Network Upgrade", "KKM Hospital IT"];
    for (let i = 0; i < projNames.length; i++) {
      const { data, error } = await supabase.from('projects').insert({
        name: projNames[i],
        code: `PRJ-00${i+1}`,
        description: `National level project for ${projNames[i]}`
      }).select().single();
      if (!error) projects.push(data);
    }
    // If they exist already, fetch them
    if (projects.length === 0) {
      const { data: extProj } = await supabase.from('projects').select('*').limit(3);
      projects.push(...extProj);
    }

    // 3. Create Vendors & SLA
    console.log("3. Creating Vendors & SLA...");
    let { data: vendor } = await supabase.from('vendors').insert({
      name: 'Mega IT Solutions Sdn Bhd',
      registration_number: '123456-M',
      contact_person: 'Mr. Wong',
      email: 'vendor@mega.com.my',
      phone: '03-12345678',
      status: 'active'
    }).select().single();

    if (!vendor) {
      const { data: extVen } = await supabase.from('vendors').select('*').limit(1);
      vendor = extVen[0];
    }

    let { data: sla } = await supabase.from('sla_policies').insert({
      name: 'Gold Enterprise SLA',
      response_time_hours: 4,
      resolution_time_hours: 24,
      penalty_rate: 0.50
    }).select().single();

    if (!sla) {
      const { data: extSla } = await supabase.from('sla_policies').select('*').limit(1);
      sla = extSla[0];
    }

    // 4. Create Contracts
    console.log("4. Creating Contracts...");
    const contracts = [];
    for (const proj of projects) {
      const { data, error } = await supabase.from('contracts').insert({
        project_id: proj.id,
        vendor_id: vendor?.id || null,
        sla_policy_id: sla?.id || null,
        contract_number: `CONT-${proj.code}-2026`,
        value: randomInt(100000, 500000)
      }).select().single();
      if (!error) contracts.push(data);
    }
    if (contracts.length === 0) {
       const { data: extCont } = await supabase.from('contracts').select('*').limit(3);
       contracts.push(...extCont);
    }

    // 5. Generate Hardware
    console.log("5. Generating 30 Hardware Assets...");
    const hardwareTypes = ['pc', 'laptop', 'printer', 'server'];
    const regions = ["Peninsular Malaysia (West Malaysia)", "East Malaysia"];
    const statesPeninsular = ["Selangor", "Kuala Lumpur", "Johor", "Penang"];
    const statesEast = ["Sabah", "Sarawak"];
    
    for (let i = 1; i <= 30; i++) {
      const hwType = getRandom(hardwareTypes);
      const isPeninsular = Math.random() > 0.3;
      const region = isPeninsular ? regions[0] : regions[1];
      const state = isPeninsular ? getRandom(statesPeninsular) : getRandom(statesEast);
      const district = "City Center"; // Dummy district

      const contract = getRandom(contracts);
      
      const payload = {
        asset_tag: `AIMS-${2000 + i}`,
        serial_number: `SNX${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        pic_name: `PIC ${Math.random().toString(36).substring(2, 7)}`,
        contact_number: `+6012${randomInt(1000000, 9999999)}`,
        running_number: `RN-${i}`,
        type_hardware: hwType,
        brand: hwType === 'printer' ? 'HP' : (hwType === 'server' ? 'Dell' : 'Lenovo'),
        model: hwType === 'printer' ? 'LaserJet Pro' : 'ThinkPad / PowerEdge',
        status: Math.random() > 0.8 ? 'in_repair' : 'active',
        region: region,
        state: state,
        district: district,
        vendor_id: vendor?.id || null,
        purchase_date: '2025-01-15',
        warranty_expiry: '2028-01-15',
      };

      if (hwType === 'pc' || hwType === 'laptop') {
        payload.cpu = 'Intel Core i7-12700';
        payload.ram = '16GB DDR4';
        payload.storage = '512GB NVMe SSD';
        payload.mac_address = `00:1B:44:11:3A:${randomInt(10, 99)}`;
        payload.ip_address = `192.168.1.${randomInt(10, 250)}`;
      } else if (hwType === 'printer') {
        payload.printer_toner = 'HP 85A Black';
        payload.printer_type = 'LaserJet Monochrome';
        payload.ip_address = `192.168.1.${randomInt(10, 250)}`;
      } else if (hwType === 'server') {
        payload.cpu = 'Dual Xeon Silver 4210R';
        payload.ram = '128GB ECC';
        payload.storage = '4TB RAID 5';
        payload.server_os = 'Windows Server 2022';
        payload.server_rack = '2U';
        payload.ip_address = `10.0.0.${randomInt(10, 250)}`;
      }

      await supabase.from('hardware').insert(payload);
    }

    // 6. Maintenance Tickets
    console.log("6. Generating Maintenance Tickets...");
    const { data: hardwareList } = await supabase.from('hardware').select('id').limit(5);
    
    if (hardwareList && hardwareList.length > 0) {
      for (let i = 0; i < hardwareList.length; i++) {
        await supabase.from('maintenance_tickets').insert({
          ticket_number: `TKT-2026-${i+1}`,
          hardware_id: hardwareList[i].id,
          reported_by: techId,
          assigned_to: techId,
          issue_type: 'hardware_failure',
          priority: i % 2 === 0 ? 'high' : 'medium',
          status: i === 0 ? 'resolved' : 'open',
          description: 'System won\'t boot up. Emitting 3 continuous beeps.',
        });
      }
    }

    console.log("✅ Database seeding completed successfully!");
    
  } catch (err) {
    console.error("Seeding Error:", err);
  }
}

seed();
