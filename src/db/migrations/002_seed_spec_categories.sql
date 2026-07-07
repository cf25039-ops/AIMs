-- Seed default spec categories for each hardware type per contract
-- This creates Low Spec, Mid Spec, High Spec for Laptop and PC

DO $$
DECLARE
  _ht RECORD;
  _category_id UUID;
BEGIN
  FOR _ht IN SELECT id, contract_id, name FROM public.hardware_types
  WHERE name IN ('Laptop', 'PC')
  LOOP
    -- Low Spec
    INSERT INTO public.spec_categories (contract_id, hardware_type_id, name, description, color, sort_order)
    VALUES (_ht.contract_id, _ht.id, 'Low Spec', 'Budget-friendly configuration', 'amber', 1)
    ON CONFLICT (hardware_type_id, name) DO NOTHING;

    SELECT id INTO _category_id FROM public.spec_categories WHERE hardware_type_id = _ht.id AND name = 'Low Spec';
    IF _category_id IS NOT NULL THEN
      INSERT INTO public.spec_rules (spec_category_id, rule_type, rule_operator, rule_value)
      VALUES
        (_category_id, 'ram', 'lte', '8'),
        (_category_id, 'cpu', 'contains', 'i3')
      ON CONFLICT DO NOTHING;
      INSERT INTO public.spec_rules (spec_category_id, rule_type, rule_operator, rule_value)
      VALUES
        (_category_id, 'ram', 'lte', '8'),
        (_category_id, 'cpu', 'contains', 'i5')
      ON CONFLICT DO NOTHING;
    END IF;

    -- Mid Spec
    INSERT INTO public.spec_categories (contract_id, hardware_type_id, name, description, color, sort_order)
    VALUES (_ht.contract_id, _ht.id, 'Mid Spec', 'Standard office configuration', 'blue', 2)
    ON CONFLICT (hardware_type_id, name) DO NOTHING;

    SELECT id INTO _category_id FROM public.spec_categories WHERE hardware_type_id = _ht.id AND name = 'Mid Spec';
    IF _category_id IS NOT NULL THEN
      INSERT INTO public.spec_rules (spec_category_id, rule_type, rule_operator, rule_value)
      VALUES
        (_category_id, 'ram', 'lte', '16'),
        (_category_id, 'cpu', 'contains', 'i5')
      ON CONFLICT DO NOTHING;
    END IF;

    -- High Spec
    INSERT INTO public.spec_categories (contract_id, hardware_type_id, name, description, color, sort_order)
    VALUES (_ht.contract_id, _ht.id, 'High Spec', 'Performance configuration', 'emerald', 3)
    ON CONFLICT (hardware_type_id, name) DO NOTHING;

    SELECT id INTO _category_id FROM public.spec_categories WHERE hardware_type_id = _ht.id AND name = 'High Spec';
    IF _category_id IS NOT NULL THEN
      INSERT INTO public.spec_rules (spec_category_id, rule_type, rule_operator, rule_value)
      VALUES
        (_category_id, 'ram', 'gte', '16'),
        (_category_id, 'cpu', 'contains', 'i7')
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- Verify
SELECT sc.name, ht.name as type, c.contract_number, sc.color
FROM public.spec_categories sc
JOIN public.hardware_types ht ON ht.id = sc.hardware_type_id
JOIN public.contracts c ON c.id = sc.contract_id
ORDER BY c.contract_number, ht.name, sc.sort_order;
