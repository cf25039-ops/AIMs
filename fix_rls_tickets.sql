-- Fix RLS policies for repair tickets.
-- Admins and end users can report issues; technicians work tickets but do not open new reports.
-- Run this in Supabase SQL Editor when you are ready to apply DB permissions.

CREATE OR REPLACE FUNCTION public.has_profile_role(p_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role::text = ANY (p_roles)
  );
$$;

CREATE OR REPLACE FUNCTION public.has_project_role_text(
  p_project_id uuid,
  p_roles text[]
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_project_id IS NULL THEN false
    WHEN public.has_profile_role(ARRAY['super_admin']) THEN true
    ELSE EXISTS (
      SELECT 1
      FROM public.project_members pm
      WHERE pm.project_id = p_project_id
        AND pm.user_id = auth.uid()
        AND pm.role::text = ANY (p_roles)
    )
  END;
$$;

DROP POLICY IF EXISTS repair_tickets_select ON public.repair_tickets;
DROP POLICY IF EXISTS repair_tickets_insert ON public.repair_tickets;
DROP POLICY IF EXISTS repair_tickets_update ON public.repair_tickets;
DROP POLICY IF EXISTS repair_tickets_delete ON public.repair_tickets;

CREATE POLICY repair_tickets_select ON public.repair_tickets
FOR SELECT
USING (
  public.has_profile_role(ARRAY['super_admin', 'admin', 'project_manager'])
  OR public.has_project_access(public.project_id_for_hardware(hardware_id))
);

CREATE POLICY repair_tickets_insert ON public.repair_tickets
FOR INSERT
WITH CHECK (
  public.has_profile_role(ARRAY['super_admin', 'admin', 'project_manager'])
  OR public.has_project_role_text(
    public.project_id_for_hardware(hardware_id),
    ARRAY['project_manager', 'project_admin', 'department_user', 'staff', 'viewer']
  )
);

CREATE POLICY repair_tickets_update ON public.repair_tickets
FOR UPDATE
USING (
  public.has_profile_role(ARRAY['super_admin', 'admin', 'project_manager'])
  OR public.has_project_role_text(
    public.project_id_for_hardware(hardware_id),
    ARRAY['project_manager', 'project_admin', 'technician']
  )
)
WITH CHECK (
  public.has_profile_role(ARRAY['super_admin', 'admin', 'project_manager'])
  OR public.has_project_role_text(
    public.project_id_for_hardware(hardware_id),
    ARRAY['project_manager', 'project_admin', 'technician']
  )
);

CREATE POLICY repair_tickets_delete ON public.repair_tickets
FOR DELETE
USING (
  public.has_profile_role(ARRAY['super_admin', 'admin', 'project_manager'])
  OR public.has_project_role_text(
    public.project_id_for_hardware(hardware_id),
    ARRAY['project_manager', 'project_admin']
  )
);
