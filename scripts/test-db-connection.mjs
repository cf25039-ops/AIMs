import pg from 'pg';
const { Client } = pg;

const configs = [
  { host: '192.168.0.73', port: 5432, user: 'postgres', password: 'fdee8b256a9d4b74a379a302b4d3fbdc', database: 'postgres' },
  { host: '192.168.0.73', port: 6543, user: 'postgres', password: 'fdee8b256a9d4b74a379a302b4d3fbdc', database: 'postgres' },
  { host: '192.168.0.73', port: 5432, user: 'supabase_admin', password: 'fdee8b256a9d4b74a379a302b4d3fbdc', database: 'postgres' },
  { host: '192.168.0.73', port: 6543, user: 'supabase_admin', password: 'fdee8b256a9d4b74a379a302b4d3fbdc', database: 'postgres' }
];

async function tryConnect() {
  for (const cfg of configs) {
    const client = new Client({ ...cfg, connectionTimeoutMillis: 3000 });
    try {
      await client.connect();
      const res = await client.query('SELECT current_database(), current_user');
      console.log(`✅ CONNECTED! Port:${cfg.port} User:${cfg.user}`);
      
      // Let's also check if aims_init.sql can be run, but for now just test connection.
      await client.end();
      return;
    } catch (err) {
      console.log(`❌ Port:${cfg.port} User:${cfg.user} → ${err.message}`);
      try { await client.end(); } catch(e) {}
    }
  }
}

tryConnect();
