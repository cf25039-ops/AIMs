const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const envFile = fs.readFileSync(".env.local", "utf8");
const envVars = {};
envFile.split("\n").forEach((line) => {
  const [key, ...val] = line.split("=");
  if (key && val) envVars[key.trim()] = val.join("=").trim();
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedHierarchy() {
  console.log("Fetching projects...");
  const { data: projects, error: projErr } = await supabase.from("projects").select("*");
  if (projErr) throw projErr;

  if (!projects || projects.length === 0) {
    console.log("No projects found to seed.");
    return;
  }

  for (const project of projects) {
    console.log(`\nSeeding hierarchy for project: ${project.name} (${project.code})`);

    // 1. Contract
    let { data: contracts, error: cErr } = await supabase
      .from("contracts")
      .select("*")
      .eq("project_id", project.id);
    if (cErr) throw cErr;
    let contract = contracts && contracts.length > 0 ? contracts[0] : null;

    if (!contract) {
      console.log("  -> Creating default contract...");
      const { data: newContract, error: insertCErr } = await supabase
        .from("contracts")
        .insert({
          project_id: project.id,
          contract_number: `${project.code}-CONT-001`,
          value: 1000000.0,
        })
        .select()
        .single();
      if (insertCErr) throw insertCErr;
      contract = newContract;
    }

    // 2. Region
    let { data: regions, error: rErr } = await supabase
      .from("regions")
      .select("*")
      .eq("contract_id", contract.id);
    if (rErr) throw rErr;
    let region = regions && regions.length > 0 ? regions[0] : null;

    if (!region) {
      console.log("  -> Creating default region...");
      const { data: newRegion, error: insertRErr } = await supabase
        .from("regions")
        .insert({
          contract_id: contract.id,
          name: `HQ Region (${project.name})`,
        })
        .select()
        .single();
      if (insertRErr) throw insertRErr;
      region = newRegion;
    }

    // 3. State
    let { data: states, error: sErr } = await supabase
      .from("states")
      .select("*")
      .eq("region_id", region.id);
    if (sErr) throw sErr;
    let state = states && states.length > 0 ? states[0] : null;

    if (!state) {
      console.log("  -> Creating default state...");
      const { data: newState, error: insertSErr } = await supabase
        .from("states")
        .insert({
          region_id: region.id,
          name: `Wilayah Persekutuan`,
        })
        .select()
        .single();
      if (insertSErr) throw insertSErr;
      state = newState;
    }

    // 4. Facility
    let { data: facilities, error: fErr } = await supabase
      .from("facilities")
      .select("*")
      .eq("state_id", state.id);
    if (fErr) throw fErr;
    let facility = facilities && facilities.length > 0 ? facilities[0] : null;

    if (!facility) {
      console.log("  -> Creating default facility...");
      const { data: newFacility, error: insertFErr } = await supabase
        .from("facilities")
        .insert({
          state_id: state.id,
          name: `Main Datacenter`,
        })
        .select()
        .single();
      if (insertFErr) throw insertFErr;
      facility = newFacility;
    }

    // 5. Department
    let { data: depts, error: dErr } = await supabase
      .from("departments")
      .select("*")
      .eq("facility_id", facility.id);
    if (dErr) throw dErr;
    let dept = depts && depts.length > 0 ? depts[0] : null;

    if (!dept) {
      console.log("  -> Creating default department...");
      const { data: newDept, error: insertDErr } = await supabase
        .from("departments")
        .insert({
          facility_id: facility.id,
          name: `IT Operations`,
        })
        .select()
        .single();
      if (insertDErr) throw insertDErr;
      dept = newDept;
    }

    console.log(`  ✅ Hierarchy complete for ${project.name}`);
  }

  console.log("\nDone seeding! You can now use the Add Hardware Wizard.");
}

seedHierarchy().catch(console.error);
