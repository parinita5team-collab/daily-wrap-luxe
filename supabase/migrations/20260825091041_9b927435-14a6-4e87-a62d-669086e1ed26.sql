-- 1. Move internal permission helpers out of the exposed API schema
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

ALTER FUNCTION public.is_app_admin() SET SCHEMA private;
ALTER FUNCTION public.is_super_owner() SET SCHEMA private;
ALTER FUNCTION public.is_company_member(uuid) SET SCHEMA private;
ALTER FUNCTION public.company_role_of(uuid) SET SCHEMA private;
ALTER FUNCTION public.is_company_admin(uuid) SET SCHEMA private;
ALTER FUNCTION public.can_edit_company(uuid) SET SCHEMA private;
ALTER FUNCTION public.my_department(uuid) SET SCHEMA private;
ALTER FUNCTION public.can_view_department(uuid, text) SET SCHEMA private;
ALTER FUNCTION public.can_edit_department(uuid, text) SET SCHEMA private;

-- Re-point internal cross-references at the new schema (keeps same OIDs, so
-- existing policies continue to work untouched).
CREATE OR REPLACE FUNCTION private.is_app_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_admins WHERE lower(email) = lower(auth.jwt() ->> 'email')
  )
$$;

CREATE OR REPLACE FUNCTION private.is_super_owner()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT lower(auth.jwt() ->> 'email') IN ('pranita@5team.me', 'pranita@supremeuae.me')
$$;

CREATE OR REPLACE FUNCTION private.is_company_member(_company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE company_id = _company_id
      AND lower(user_email) = lower(auth.jwt() ->> 'email')
  )
$$;

CREATE OR REPLACE FUNCTION private.company_role_of(_company_id uuid)
RETURNS public.company_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT role FROM public.company_members
  WHERE company_id = _company_id
    AND lower(user_email) = lower(auth.jwt() ->> 'email')
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION private.is_company_admin(_company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT private.is_app_admin() OR private.company_role_of(_company_id) = 'admin'
$$;

CREATE OR REPLACE FUNCTION private.can_edit_company(_company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT private.is_app_admin()
     OR private.company_role_of(_company_id) IN ('admin','editor')
$$;

CREATE OR REPLACE FUNCTION private.my_department(_company_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT department FROM public.company_members
  WHERE company_id = _company_id
    AND lower(user_email) = lower(auth.jwt() ->> 'email')
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION private.can_view_department(_company_id uuid, _department text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT private.is_app_admin()
     OR private.my_department(_company_id) = _department
$$;

CREATE OR REPLACE FUNCTION private.can_edit_department(_company_id uuid, _department text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT private.can_edit_company(_company_id)
     AND private.can_view_department(_company_id, _department)
$$;

REVOKE ALL ON FUNCTION private.is_app_admin() FROM anon;
REVOKE ALL ON FUNCTION private.is_super_owner() FROM anon;

-- 2. Tenant isolation on company_members
DROP POLICY IF EXISTS "Team can read members" ON public.company_members;
CREATE POLICY "Members read own company team"
ON public.company_members FOR SELECT TO authenticated
USING (private.is_app_admin() OR private.is_company_member(company_id));

-- 3. Tenant isolation on idea_votes
DROP POLICY IF EXISTS "Team can read votes" ON public.idea_votes;
CREATE POLICY "Department can read votes"
ON public.idea_votes FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.ideas i
    WHERE i.id = idea_votes.idea_id
      AND private.can_view_department(i.company_id, i.department)
  )
);