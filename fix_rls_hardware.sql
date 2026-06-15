-- Fix RLS policies for hardware asset management.
-- Hardware registration/edit/delete is admin-only.
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

DROP POLICY IF EXISTS hardware_select ON public.hardware;
DROP POLICY IF EXISTS hardware_insert ON public.hardware;
DROP POLICY IF EXISTS hardware_update ON public.hardware;
DROP POLICY IF EXISTS hardware_delete ON public.hardware;

CREATE POLICY hardware_select ON public.hardware
FOR SELECT
USING (
  public.has_profile_role(ARRAY['super_admin', 'admin', 'project_manager'])
  OR public.has_project_access(public.project_id_for_department(department_id))
);

CREATE POLICY hardware_insert ON public.hardware
FOR INSERT
WITH CHECK (
  public.has_profile_role(ARRAY['super_admin', 'admin', 'project_manager'])
  OR public.has_project_role_text(
    public.project_id_for_department(department_id),
    ARRAY['project_manager', 'project_admin']
  )
);

CREATE POLICY hardware_update ON public.hardware
FOR UPDATE
USING (
  public.has_profile_role(ARRAY['super_admin', 'admin', 'project_manager'])
  OR public.has_project_role_text(
    public.project_id_for_department(department_id),
    ARRAY['project_manager', 'project_admin']
  )
)
WITH CHECK (
  public.has_profile_role(ARRAY['super_admin', 'admin', 'project_manager'])
  OR public.has_project_role_text(
    public.project_id_for_department(department_id),
    ARRAY['project_manager', 'project_admin']
  )
);

CREATE POLICY hardware_delete ON public.hardware
FOR DELETE
USING (
  public.has_profile_role(ARRAY['super_admin', 'admin', 'project_manager'])
  OR public.has_project_role_text(
    public.project_id_for_department(department_id),
    ARRAY['project_manager', 'project_admin']
  )
);
