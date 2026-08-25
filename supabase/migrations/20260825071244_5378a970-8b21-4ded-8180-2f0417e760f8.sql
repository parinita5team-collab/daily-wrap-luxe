CREATE OR REPLACE FUNCTION public.is_super_owner()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(auth.jwt() ->> 'email') IN ('pranita@5team.me', 'pranita@supremeuae.me')
$$;

REVOKE EXECUTE ON FUNCTION public.is_super_owner() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_super_owner() TO authenticated, service_role;

GRANT SELECT, INSERT, DELETE ON public.app_admins TO authenticated;
GRANT ALL ON public.app_admins TO service_role;

CREATE POLICY "Owners add admins" ON public.app_admins
  FOR INSERT TO authenticated WITH CHECK (public.is_super_owner());

CREATE POLICY "Owners remove admins" ON public.app_admins
  FOR DELETE TO authenticated USING (public.is_super_owner());

CREATE TABLE public.email_reminder_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kind text NOT NULL,
  ref_id text NOT NULL,
  slot text NOT NULL DEFAULT '',
  recipient text NOT NULL,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (kind, ref_id, slot, recipient)
);

GRANT ALL ON public.email_reminder_log TO service_role;
ALTER TABLE public.email_reminder_log ENABLE ROW LEVEL SECURITY;