create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  dom text := lower(split_part(NEW.email, '@', 2));
begin
  if dom not in ('5team.me','supremeuae.me')
     and not exists (select 1 from public.app_admins a where lower(a.email) = lower(NEW.email)) then
    raise exception 'Only company email addresses (@5team.me or @supremeuae.me) can access this portal';
  end if;

  insert into public.profiles (id, display_name)
  values (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)))
  on conflict (id) do nothing;
  return NEW;
end;
$function$;