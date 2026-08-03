-- Permanent admin allowlist
CREATE TABLE public.app_admins (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_admins TO authenticated;
GRANT ALL ON public.app_admins TO service_role;
ALTER TABLE public.app_admins ENABLE ROW LEVEL SECURITY;

INSERT INTO public.app_admins (email) VALUES
  ('saif@supremeuae.me'),
  ('saif@5team.me'),
  ('pranita@5team.me'),
  ('pranita@supremeuae.me');

CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_admins
    WHERE lower(email) = lower(auth.jwt() ->> 'email')
  )
$$;
REVOKE ALL ON FUNCTION public.is_app_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_app_admin() TO authenticated, service_role;

CREATE POLICY "Admins read admin list" ON public.app_admins
  FOR SELECT TO authenticated USING (public.is_app_admin());

-- Role checks no longer fall back to open access
CREATE OR REPLACE FUNCTION public.is_company_admin(_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_app_admin() OR public.company_role_of(_company_id) = 'admin'
$$;

CREATE OR REPLACE FUNCTION public.can_edit_company(_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_app_admin()
     OR public.company_role_of(_company_id) IN ('admin','editor')
$$;

-- Drop legacy wide-open task policies so role gating actually applies
DROP POLICY IF EXISTS tasks_insert_authenticated ON public.tasks;
DROP POLICY IF EXISTS tasks_update_authenticated ON public.tasks;
DROP POLICY IF EXISTS tasks_delete_authenticated ON public.tasks;

-- Companies: admins only for writes
DROP POLICY IF EXISTS "Team can insert companies" ON public.companies;
DROP POLICY IF EXISTS "Team can update companies" ON public.companies;
DROP POLICY IF EXISTS "Team can delete companies" ON public.companies;

CREATE POLICY "Admins insert companies" ON public.companies
  FOR INSERT TO authenticated WITH CHECK (public.is_app_admin());
CREATE POLICY "Admins update companies" ON public.companies
  FOR UPDATE TO authenticated USING (public.is_company_admin(id)) WITH CHECK (public.is_company_admin(id));
CREATE POLICY "Admins delete companies" ON public.companies
  FOR DELETE TO authenticated USING (public.is_company_admin(id));