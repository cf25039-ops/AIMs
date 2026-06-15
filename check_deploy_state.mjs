import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function check() {
  console.log('Connecting to 192.168.0.115...');
  await ssh.connect({
    host: '192.168.0.115',
    username: 'root',
    password: '281198'
  });
  console.log('Connected!\n');

  // 1. Docker containers
  console.log('=== DOCKER CONTAINERS ===');
  const dockerPs = await ssh.execCommand('docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"');
  console.log(dockerPs.stdout || 'No containers running');
  console.log();

  // 2. Docker disk usage
  console.log('=== DISK USAGE ===');
  const disk = await ssh.execCommand('df -h /root');
  console.log(disk.stdout);

  // 3. Supabase DB check
  console.log('=== SUPABASE DB CHECK ===');
  const dbCheck = await ssh.execCommand('docker exec supabase-db psql -U postgres -d postgres -c "\\dt public.*"');
  console.log(dbCheck.stdout.slice(0, 2000));
  console.log();

  // 4. Check if hardware_types table exists
  console.log('=== CHECK HARDWARE_TYPES TABLE ===');
  const hwTypes = await ssh.execCommand(`docker exec supabase-db psql -U postgres -d postgres -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'hardware_types');"`);
  console.log(hwTypes.stdout);

  // 5. Check if spec_categories table exists
  console.log('=== CHECK SPEC_CATEGORIES TABLE ===');
  const specCat = await ssh.execCommand(`docker exec supabase-db psql -U postgres -d postgres -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'spec_categories');"`);
  console.log(specCat.stdout);

  // 6. Check hardware table columns
  console.log('=== HARDWARE TABLE COLUMNS ===');
  const hwCols = await ssh.execCommand(`docker exec supabase-db psql -U postgres -d postgres -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'hardware' ORDER BY ordinal_position;"`);
  console.log(hwCols.stdout);

  // 7. Check existing hardware count
  console.log('=== HARDWARE COUNT ===');
  const hwCount = await ssh.execCommand(`docker exec supabase-db psql -U postgres -d postgres -c "SELECT count(*) FROM public.hardware;"`);
  console.log(hwCount.stdout);

  // 8. Check existing contracts
  console.log('=== CONTRACTS ===');
  const contracts = await ssh.execCommand(`docker exec supabase-db psql -U postgres -d postgres -c "SELECT id, contract_number FROM public.contracts;"`);
  console.log(contracts.stdout);

  // 9. Check existing hardware types (enum values)
  console.log('=== HARDWARE TYPES ENUM ===');
  const hwEnum = await ssh.execCommand(`docker exec supabase-db psql -U postgres -d postgres -c "SELECT unnest(enum_range(NULL::public.hardware_type));"`);
  console.log(hwEnum.stdout);

  // 10. Check web container
  console.log('=== WEB CONTAINER ===');
  const webCheck = await ssh.execCommand('docker ps --filter "name=web" --format "{{.Names}} {{.Status}}"');
  console.log(webCheck.stdout || 'No web container found');

  // 11. Check aims-web directory
  console.log('=== AIMS-WEB DIRECTORY ===');
  const dirCheck = await ssh.execCommand('ls -la /root/aims-web/ 2>&1 | head -20');
  console.log(dirCheck.stdout);

  ssh.dispose();
}

check().catch(err => {
  console.error('Check failed:', err.message);
  if (ssh) ssh.dispose();
  process.exit(1);
});