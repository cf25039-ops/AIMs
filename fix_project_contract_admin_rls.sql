-- AIMS fix: allow admin/project_admin project creation and project-scoped contract numbers.
-- Run this in Supabase SQL Editor after the base schema + RBAC migration.

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'project_admin';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'technician';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'department_user';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'viewer';

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

DROP POLICY IF EXISTS projects_select ON public.projects;
DROP POLICY IF EXISTS projects_insert ON public.projects;
DROP POLICY IF EXISTS projects_update ON public.projects;
DROP POLICY IF EXISTS projects_delete ON public.projects;

CREATE POLICY projects_select ON public.projects
FOR SELECT
USING (
  public.has_project_access(id)
  OR public.has_profile_role(ARRAY['super_admin', 'admin', 'project_manager'])
);

CREATE POLICY projects_insert ON public.projects
FOR INSERT
WITH CHECK (
  public.has_profile_role(ARRAY['super_admin', 'admin', 'project_manager', 'project_admin'])
);

CREATE POLICY projects_update ON public.projects
FOR UPDATE
USING (
  public.has_profile_role(ARRAY['super_admin', 'admin', 'project_manager'])
  OR public.has_project_role_text(id, ARRAY['project_manager', 'project_admin'])
)
WITH CHECK (
  public.has_profile_role(ARRAY['super_admin', 'admin', 'project_manager'])
  OR public.has_project_role_text(id, ARRAY['project_manager', 'project_admin'])
);

CREATE POLICY projects_delete ON public.projects
FOR DELETE
USING (
  public.has_profile_role(ARRAY['super_admin', 'admin', 'project_manager'])
);

DROP POLICY IF EXISTS project_members_select ON public.project_members;
DROP POLICY IF EXISTS project_members_insert ON public.project_members;
DROP POLICY IF EXISTS project_members_update ON public.project_members;
DROP POLICY IF EXISTS project_members_delete ON public.project_members;

CREATE POLICY project_members_select ON public.project_members
FOR SELECT
USING (
  public.has_project_access(project_id)
  OR public.has_profile_role(ARRAY['super_admin', 'admin', 'project_manager'])
);

CREATE POLICY project_members_insert ON public.project_members
FOR INSERT
WITH CHECK (
  public.has_profile_role(ARRAY['super_admin', 'admin', 'project_manager'])
  OR public.has_project_role_text(project_id, ARRAY['project_manager', 'project_admin'])
  OR (
    user_id = auth.uid()
    AND public.has_profile_role(ARRAY['project_admin'])
  )
);

CREATE POLICY project_members_update ON public.project_members
FOR UPDATE
USING (
  public.has_profile_role(ARRAY['super_admin', 'admin', 'project_manager'])
  OR public.has_project_role_text(project_id, ARRAY['project_manager', 'project_admin'])
)
WITH CHECK (
  public.has_profile_role(ARRAY['super_admin', 'admin', 'project_manager'])
  OR public.has_project_role_text(project_id, ARRAY['project_manager', 'project_admin'])
);

CREATE POLICY project_members_delete ON public.project_members
FOR DELETE
USING (
  public.has_profile_role(ARRAY['super_admin', 'admin', 'project_manager'])
  OR public.has_project_role_text(project_id, ARRAY['project_manager'])
);

DROP POLICY IF EXISTS contracts_insert ON public.contracts;
DROP POLICY IF EXISTS contracts_update ON public.contracts;
DROP POLICY IF EXISTS contracts_delete ON public.contracts;

CREATE POLICY contracts_insert ON public.contracts
FOR INSERT
WITH CHECK (
  public.has_profile_role(ARRAY['super_admin', 'admin', 'project_manager'])
  OR public.has_project_role_text(project_id, ARRAY['project_manager', 'project_admin'])
);

CREATE POLICY contracts_update ON public.contracts
FOR UPDATE
USING (
  public.has_profile_role(ARRAY['super_admin', 'admin', 'project_manager'])
  OR public.has_project_role_text(project_id, ARRAY['project_manager', 'project_admin'])
)
WITH CHECK (
  public.has_profile_role(ARRAY['super_admin', 'admin', 'project_manager'])
  OR public.has_project_role_text(project_id, ARRAY['project_manager', 'project_admin'])
);

CREATE POLICY contracts_delete ON public.contracts
FOR DELETE
USING (
  public.has_profile_role(ARRAY['super_admin', 'admin', 'project_manager'])
  OR public.has_project_role_text(project_id, ARRAY['project_manager'])
);
