DROP FUNCTION IF EXISTS public.company_has_members(uuid);

REVOKE ALL ON FUNCTION public.company_role_of(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.company_role_of(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;