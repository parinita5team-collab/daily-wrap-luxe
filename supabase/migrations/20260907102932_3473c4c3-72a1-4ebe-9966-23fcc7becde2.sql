CREATE OR REPLACE FUNCTION private.is_portal_member()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
  SELECT private.is_app_admin() OR EXISTS (
    SELECT 1 FROM public.company_members m
    WHERE lower(m.user_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
$$;

REVOKE ALL ON FUNCTION private.is_portal_member() FROM PUBLIC;

DROP POLICY IF EXISTS "Department can read calendar events" ON public.calendar_events;

CREATE POLICY "Group members read all calendar events"
ON public.calendar_events
FOR SELECT
TO authenticated
USING (private.is_portal_member());