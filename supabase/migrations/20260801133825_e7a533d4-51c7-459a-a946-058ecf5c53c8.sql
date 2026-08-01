-- ROLES ---------------------------------------------------------------
CREATE TYPE public.company_role AS ENUM ('admin','editor','viewer');

CREATE TABLE public.company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  role public.company_role NOT NULL DEFAULT 'viewer',
  invited_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_email)
);
CREATE INDEX company_members_company_idx ON public.company_members(company_id);
CREATE INDEX company_members_email_idx ON public.company_members(lower(user_email));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_members TO authenticated;
GRANT ALL ON public.company_members TO service_role;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.company_role_of(_company_id uuid)
RETURNS public.company_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.company_members
  WHERE company_id = _company_id
    AND lower(user_email) = lower(auth.jwt() ->> 'email')
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.company_has_members(_company_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.company_members WHERE company_id = _company_id)
$$;

-- open while a company has no members yet (bootstrap), then role-gated
CREATE OR REPLACE FUNCTION public.can_edit_company(_company_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _company_id IS NULL
     OR NOT public.company_has_members(_company_id)
     OR public.company_role_of(_company_id) IN ('admin','editor')
$$;

CREATE OR REPLACE FUNCTION public.is_company_admin(_company_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT NOT public.company_has_members(_company_id)
     OR public.company_role_of(_company_id) = 'admin'
$$;

REVOKE ALL ON FUNCTION public.company_role_of(uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.company_has_members(uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.can_edit_company(uuid) FROM public, anon;
REVOKE ALL ON FUNCTION public.is_company_admin(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.company_role_of(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.company_has_members(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_edit_company(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_company_admin(uuid) TO authenticated;

CREATE POLICY "Team can read members" ON public.company_members
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage members" ON public.company_members
  FOR INSERT TO authenticated WITH CHECK (public.is_company_admin(company_id));
CREATE POLICY "Admins update members" ON public.company_members
  FOR UPDATE TO authenticated USING (public.is_company_admin(company_id))
  WITH CHECK (public.is_company_admin(company_id));
CREATE POLICY "Admins delete members" ON public.company_members
  FOR DELETE TO authenticated USING (public.is_company_admin(company_id));

CREATE TRIGGER update_company_members_updated_at BEFORE UPDATE ON public.company_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- role gate existing tracker tables ------------------------------------
DROP POLICY IF EXISTS "Team can insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Team can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Team can delete tasks" ON public.tasks;
CREATE POLICY "Editors insert tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (public.can_edit_company(company_id));
CREATE POLICY "Editors update tasks" ON public.tasks FOR UPDATE TO authenticated USING (public.can_edit_company(company_id)) WITH CHECK (public.can_edit_company(company_id));
CREATE POLICY "Editors delete tasks" ON public.tasks FOR DELETE TO authenticated USING (public.can_edit_company(company_id));

DROP POLICY IF EXISTS "Team can insert stage entries" ON public.stage_entries;
DROP POLICY IF EXISTS "Team can update stage entries" ON public.stage_entries;
DROP POLICY IF EXISTS "Team can delete stage entries" ON public.stage_entries;
CREATE POLICY "Editors insert stage entries" ON public.stage_entries FOR INSERT TO authenticated WITH CHECK (public.can_edit_company(company_id));
CREATE POLICY "Editors update stage entries" ON public.stage_entries FOR UPDATE TO authenticated USING (public.can_edit_company(company_id)) WITH CHECK (public.can_edit_company(company_id));
CREATE POLICY "Editors delete stage entries" ON public.stage_entries FOR DELETE TO authenticated USING (public.can_edit_company(company_id));

DROP POLICY IF EXISTS "Team can insert calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Team can update calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Team can delete calendar events" ON public.calendar_events;
CREATE POLICY "Editors insert calendar events" ON public.calendar_events FOR INSERT TO authenticated WITH CHECK (public.can_edit_company(company_id));
CREATE POLICY "Editors update calendar events" ON public.calendar_events FOR UPDATE TO authenticated USING (public.can_edit_company(company_id)) WITH CHECK (public.can_edit_company(company_id));
CREATE POLICY "Editors delete calendar events" ON public.calendar_events FOR DELETE TO authenticated USING (public.can_edit_company(company_id));

-- BRAIN WAVE ----------------------------------------------------------
CREATE TABLE public.ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Process',
  impact text NOT NULL DEFAULT 'time',
  estimated_saving text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'new',
  author_name text NOT NULL DEFAULT '',
  author_email text NOT NULL DEFAULT '',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ideas_company_idx ON public.ideas(company_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ideas TO authenticated;
GRANT ALL ON public.ideas TO service_role;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can read ideas" ON public.ideas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Team can add ideas" ON public.ideas FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Authors or editors update ideas" ON public.ideas FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.can_edit_company(company_id))
  WITH CHECK (created_by = auth.uid() OR public.can_edit_company(company_id));
CREATE POLICY "Authors or admins delete ideas" ON public.ideas FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.is_company_admin(company_id));

CREATE TRIGGER update_ideas_updated_at BEFORE UPDATE ON public.ideas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.idea_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (idea_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.idea_votes TO authenticated;
GRANT ALL ON public.idea_votes TO service_role;
ALTER TABLE public.idea_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can read votes" ON public.idea_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users vote as themselves" ON public.idea_votes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users remove own vote" ON public.idea_votes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- SAVED SEARCHES ------------------------------------------------------
CREATE TABLE public.saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  query text NOT NULL DEFAULT '',
  trackers text[] NOT NULL DEFAULT '{}',
  statuses text[] NOT NULL DEFAULT '{}',
  date_from text NOT NULL DEFAULT '',
  date_to text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_searches TO authenticated;
GRANT ALL ON public.saved_searches TO service_role;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own saved searches" ON public.saved_searches FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER update_saved_searches_updated_at BEFORE UPDATE ON public.saved_searches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- REMINDERS -----------------------------------------------------------
CREATE TABLE public.reminder_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  wrap_time text NOT NULL DEFAULT '17:30',
  timeline_time text NOT NULL DEFAULT '18:30',
  weekdays_only boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, company_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reminder_settings TO authenticated;
GRANT ALL ON public.reminder_settings TO service_role;
ALTER TABLE public.reminder_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own reminder settings" ON public.reminder_settings FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER update_reminder_settings_updated_at BEFORE UPDATE ON public.reminder_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();