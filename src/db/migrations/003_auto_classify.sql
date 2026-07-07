-- Auto-classify existing hardware into spec categories
-- Matches hardware CPU/RAM/storage against spec_rules

-- Helper function
CREATE OR REPLACE FUNCTION public.match_spec_rule(
  hw RECORD,
  ram_num NUMERIC,
  rule_type TEXT,
  rule_operator TEXT,
  rule_value TEXT
) RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE
  cpu_lower TEXT;
  val NUMERIC;
BEGIN
  CASE rule_type
    WHEN 'cpu' THEN
      cpu_lower := lower(hw.cpu);
      CASE rule_operator
        WHEN 'contains' THEN RETURN cpu_lower LIKE '%' || lower(rule_value) || '%';
        WHEN 'eq' THEN RETURN cpu_lower = lower(rule_value);
        ELSE RETURN FALSE;
      END CASE;
    WHEN 'ram' THEN
      IF ram_num IS NULL THEN RETURN FALSE; END IF;
      CASE rule_operator
        WHEN 'lte' THEN RETURN ram_num <= rule_value::NUMERIC;
        WHEN 'gte' THEN RETURN ram_num >= rule_value::NUMERIC;
        WHEN 'eq' THEN RETURN ram_num = rule_value::NUMERIC;
        ELSE RETURN FALSE;
      END CASE;
    WHEN 'storage' THEN
      val := NULL;
      BEGIN
        val := regexp_replace(hw.storage, '^(\d+).*$', '\1')::NUMERIC;
      EXCEPTION WHEN OTHERS THEN
        RETURN FALSE;
      END;
      CASE rule_operator
        WHEN 'lte' THEN RETURN val <= rule_value::NUMERIC;
        WHEN 'gte' THEN RETURN val >= rule_value::NUMERIC;
        ELSE RETURN FALSE;
      END CASE;
    ELSE RETURN FALSE;
  END CASE;
END; $$;

DO $$
DECLARE
  _hw RECORD;
  _cat RECORD;
  _rule RECORD;
  _matches_all BOOLEAN;
  _ram_num NUMERIC;
BEGIN
  FOR _hw IN SELECT id, type_hardware::text, cpu, ram, storage, hardware_type_id
  FROM public.hardware WHERE hardware_type_id IS NOT NULL
  LOOP
    -- Parse RAM to numeric (e.g. "8GB DDR4 3200 MHz" -> 8)
    _ram_num := NULL;
    IF _hw.ram IS NOT NULL AND _hw.ram != '' THEN
      BEGIN
        _ram_num := regexp_replace(_hw.ram, '^(\d+).*$', '\1')::NUMERIC;
      EXCEPTION WHEN OTHERS THEN
        _ram_num := NULL;
      END;
    END IF;

    FOR _cat IN SELECT id FROM public.spec_categories WHERE hardware_type_id = _hw.hardware_type_id
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
        EXIT; -- Assign first matching category and move on
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- Show results
SELECT h.asset_tag, h.type_hardware::text, h.cpu, h.ram, sc.name as spec_category
FROM public.hardware h
LEFT JOIN public.spec_categories sc ON sc.id = h.spec_category_id
ORDER BY h.asset_tag;