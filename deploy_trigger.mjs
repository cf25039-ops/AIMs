import { NodeSSH } from 'node-ssh';

const ssh = new NodeSSH();

async function run() {
  console.log('Connecting to remote VPS 192.168.0.115...');
  await ssh.connect({
    host: '192.168.0.115',
    username: 'root',
    password: '281198',
    readyTimeout: 30000
  });
  console.log('Connected!');

  const triggerSql = `
    -- Create trigger function to notify technicians and admins of the same facility
    CREATE OR REPLACE FUNCTION public.notify_technician_and_admin_on_ticket()
    RETURNS TRIGGER AS $$
    DECLARE
      v_facility_id uuid;
      v_facility_name varchar;
      v_hardware_serial varchar;
      v_hardware_type varchar;
      r_profile record;
    BEGIN
      -- Get facility ID from the hardware asset
      SELECT d.facility_id INTO v_facility_id
      FROM public.hardware h
      JOIN public.departments d ON h.department_id = d.id
      WHERE h.id = NEW.hardware_id;

      IF v_facility_id IS NOT NULL THEN
        -- Get facility details
        SELECT name INTO v_facility_name
        FROM public.facilities
        WHERE id = v_facility_id;

        -- Get hardware details
        SELECT serial_number, type_hardware::text INTO v_hardware_serial, v_hardware_type
        FROM public.hardware
        WHERE id = NEW.hardware_id;

        -- Loop through all technicians and admins assigned to the same facility
        FOR r_profile IN 
          SELECT id, email, role 
          FROM public.profiles 
          WHERE assigned_facility_id = v_facility_id 
            AND role IN ('technician', 'project_admin')
        LOOP
          -- Insert in-app notification for the user
          INSERT INTO public.notifications (user_id, title, body, channel)
          VALUES (
            r_profile.id,
            'Tiket Baru Ditugaskan: ' || NEW.title,
            'Satu tiket kerosakan baru telah dilaporkan untuk perkakasan ' || COALESCE(v_hardware_type, 'PC') || ' (' || COALESCE(v_hardware_serial, 'N/A') || ') di ' || COALESCE(v_facility_name, 'Fasiliti') || '. Tahap Kepentingan: ' || NEW.severity || '.',
            'in_app'
          );
        END LOOP;
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Drop trigger if exists, then recreate
    DROP TRIGGER IF EXISTS trg_notify_on_new_ticket ON public.repair_tickets;
    CREATE TRIGGER trg_notify_on_new_ticket
    AFTER INSERT ON public.repair_tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_technician_and_admin_on_ticket();
  `;

  console.log('Running SQL trigger migration...');
  const result = await ssh.execCommand(`docker exec -i supabase-db psql -U postgres -d postgres`, { stdin: triggerSql });
  console.log('STDOUT:', result.stdout);
  console.log('STDERR:', result.stderr);

  ssh.dispose();
  console.log('Disconnected!');
}

run().catch(err => {
  console.error('Trigger deployment failed:', err);
  if (ssh) ssh.dispose();
});
