CREATE OR REPLACE FUNCTION public.is_company_member(_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = _company_id
      AND lower(user_email) = lower(auth.jwt() ->> 'email')
  )
$$;

REVOKE ALL ON FUNCTION public.is_company_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_company_member(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Team can read companies" ON public.companies;
CREATE POLICY "Members and admins can read companies"
ON public.companies
FOR SELECT
TO authenticated
USING (public.is_app_admin() OR public.is_company_member(id));

DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());