-- AIMS fix: project-admin project visibility and super-admin role assignment.
-- Apply after the base schema and previous RLS fixes.

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

DROP POLICY IF EXISTS profiles_select ON public.profiles;
DROP POLICY IF EXISTS profiles_update ON public.profiles;

CREATE POLICY profiles_select ON public.profiles
FOR SELECT
USING (
  id = auth.uid()
  OR public.has_profile_role(ARRAY['super_admin'])
);

CREATE POLICY profiles_update ON public.profiles
FOR UPDATE
USING (
  public.has_profile_role(ARRAY['super_admin'])
)
WITH CHECK (
  public.has_profile_role(ARRAY['super_admin'])
);

DROP POLICY IF EXISTS projects_select ON public.projects;
CREATE POLICY projects_select ON public.projects
FOR SELECT
USING (
  public.has_project_access(id)
  OR public.has_profile_role(ARRAY['super_admin', 'admin', 'project_manager', 'project_admin'])
);

DROP POLICY IF EXISTS contracts_select ON public.contracts;
CREATE POLICY contracts_select ON public.contracts
FOR SELECT
USING (
  public.has_project_access(project_id)
  OR public.has_profile_role(ARRAY['super_admin', 'admin', 'project_manager', 'project_admin'])
);

DROP POLICY IF EXISTS hardware_select ON public.hardware;
DROP POLICY IF EXISTS hardware_insert ON public.hardware;
DROP POLICY IF EXISTS hardware_update ON public.hardware;
DROP POLICY IF EXISTS hardware_delete ON public.hardware;

CREATE POLICY hardware_select ON public.hardware
FOR SELECT
USING (
  public.has_profile_role(ARRAY['super_admin', 'admin', 'project_manager', 'project_admin'])
  OR public.has_project_access(public.project_id_for_department(department_id))
);

CREATE POLICY hardware_insert ON public.hardware
FOR INSERT
WITH CHECK (
  public.has_profile_role(ARRAY['super_admin', 'admin', 'project_manager', 'project_admin'])
  OR public.has_project_role_text(
    public.project_id_for_department(department_id),
    ARRAY['project_manager', 'project_admin']
  )
);

CREATE POLICY hardware_update ON public.hardware
FOR UPDATE
USING (
  public.has_profile_role(ARRAY['super_admin', 'admin', 'project_manager', 'project_admin'])
  OR public.has_project_role_text(
    public.project_id_for_department(department_id),
    ARRAY['project_manager', 'project_admin']
  )
)
WITH CHECK (
  public.has_profile_role(ARRAY['super_admin', 'admin', 'project_manager', 'project_admin'])
  OR public.has_project_role_text(
    public.project_id_for_department(department_id),
    ARRAY['project_manager', 'project_admin']
  )
);

CREATE POLICY hardware_delete ON public.hardware
FOR DELETE
USING (
  public.has_profile_role(ARRAY['super_admin', 'admin', 'project_manager', 'project_admin'])
  OR public.has_project_role_text(
    public.project_id_for_department(department_id),
    ARRAY['project_manager', 'project_admin']
  )
);
