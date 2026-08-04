INSERT INTO public.app_admins (email) VALUES ('parinita5team@gmail.com') ON CONFLICT DO NOTHING;
UPDATE public.companies SET name = '5 Team' WHERE name = '5';