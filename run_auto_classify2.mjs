import { NodeSSH } from 'node-ssh';
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({ host: '192.168.0.115', username: 'root', password: '281198' });

  const sql = `
-- Auto-classify ALL hardware with hardware_type_id set
-- For hardware WITH specs: match against rules
-- For hardware WITHOUT specs: assign "Low Spec" (default)

DO $$
DECLARE
  _hw RECORD;
  _cat RECORD;
  _rule RECORD;
  _matches_all BOOLEAN;
  _ram_num NUMERIC;
  _default_cat_id UUID;
BEGIN
  FOR _hw IN SELECT id, type_hardware::text, cpu, ram, storage, hardware_type_id
  FROM public.hardware WHERE hardware_type_id IS NOT NULL
  LOOP
    -- If CPU/RAM all empty, assign "Low Spec" by default
    IF (_hw.cpu IS NULL OR _hw.cpu = '') AND (_hw.ram IS NULL OR _hw.ram = '') THEN
      SELECT id INTO _default_cat_id FROM public.spec_categories
      WHERE hardware_type_id = _hw.hardware_type_id AND name = 'Low Spec'
      LIMIT 1;

      IF _default_cat_id IS NOT NULL THEN
        UPDATE public.hardware SET spec_category_id = _default_cat_id WHERE id = _hw.id;
      END IF;
      CONTINUE;
    END IF;

    -- Parse RAM to numeric
    _ram_num := NULL;
    IF _hw.ram IS NOT NULL AND _hw.ram != '' THEN
      BEGIN
        _ram_num := regexp_replace(_hw.ram, '^(\d+).*$', '\1')::NUMERIC;
      EXCEPTION WHEN OTHERS THEN
        _ram_num := NULL;
      END;
    END IF;

    -- Try each category, assign first match
    FOR _cat IN SELECT id FROM public.spec_categories
      WHERE hardware_type_id = _hw.hardware_type_id ORDER BY sort_order
    LOOP
      _matches_all := TRUE;

      FOR _rule IN SELECT rule_type, rule_operator, rule_value
        FROM public.spec_rules WHERE spec_category_id = _cat.id
      LOOP
        IF NOT match_spec_rule(_hw, _ram_num, _rule.rule_type, _rule.rule_operator, _rule.rule_value) THEN
          _matches_all := FALSE;
          EXIT;
        END IF;
      END LOOP;

      IF _matches_all THEN
        UPDATE public.hardware SET spec_category_id = _cat.id WHERE id = _hw.id;
        EXIT;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- Show results
SELECT h.asset_tag, h.type_hardware::text, h.cpu, h.ram,
  COALESCE(sc.name, 'UNCLASSIFIED') as spec_category
FROM public.hardware h
LEFT JOIN public.spec_categories sc ON sc.id = h.spec_category_id
ORDER BY h.asset_tag;
`;

  console.log('Running auto-classify migration...');
  const result = await ssh.execCommand('docker exec -i supabase-db psql -U postgres -d postgres', { stdin: sql });

  console.log(result.stdout);
  if (result.stderr) console.log('Warnings:', result.stderr.slice(0, 500));

  if (result.code === 0) console.log('\nAuto-classify complete!');
  else console.error('Failed:', result.stderr);

  ssh.dispose();
}

run().catch(err => { console.error(err); ssh.dispose(); process.exit(1); });