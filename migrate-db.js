const { Client } = require("pg");
const fs = require("fs");

const envFile = fs.readFileSync(".env.local", "utf8");
const envVars = {};
envFile.split("\n").forEach((line) => {
  const [key, ...val] = line.split("=");
  if (key && val) envVars[key.trim()] = val.join("=").trim();
});

const client = new Client({
  connectionString: envVars.DATABASE_URL,
});

async function runMigration() {
  await client.connect();
  console.log("Connected to database.");

  try {
    await client.query(`
      ALTER TABLE public.hardware 
      ALTER COLUMN department_id DROP NOT NULL;
      
      ALTER TABLE public.hardware
      ADD COLUMN IF NOT EXISTS region varchar(100),
      ADD COLUMN IF NOT EXISTS state varchar(100),
      ADD COLUMN IF NOT EXISTS district varchar(100),
      ADD COLUMN IF NOT EXISTS printer_toner varchar(100),
      ADD COLUMN IF NOT EXISTS printer_type varchar(50),
      ADD COLUMN IF NOT EXISTS server_os varchar(100),
      ADD COLUMN IF NOT EXISTS server_rack varchar(50);
    `);
    console.log("Migration successful: Added new columns and made department_id nullable.");
  } catch (e) {
    console.error("Migration failed:", e);
  } finally {
    await client.end();
  }
}

runMigration();
