-- Companies
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  accent TEXT NOT NULL DEFAULT '#E8B84B',
  sort_order INT NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can read companies" ON public.companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Team can insert companies" ON public.companies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Team can update companies" ON public.companies FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Team can delete companies" ON public.companies FOR DELETE TO authenticated USING (true);
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Link tasks to companies
ALTER TABLE public.tasks ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
CREATE INDEX tasks_company_id_idx ON public.tasks(company_id);

-- Run of Show daily entries
CREATE TABLE public.stage_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'amber',
  metric_value NUMERIC,
  content_today TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  next_steps TEXT NOT NULL DEFAULT '',
  owner TEXT NOT NULL DEFAULT '',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, platform, entry_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stage_entries TO authenticated;
GRANT ALL ON public.stage_entries TO service_role;
ALTER TABLE public.stage_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can read stage entries" ON public.stage_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Team can insert stage entries" ON public.stage_entries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Team can update stage entries" ON public.stage_entries FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Team can delete stage entries" ON public.stage_entries FOR DELETE TO authenticated USING (true);
CREATE TRIGGER update_stage_entries_updated_at BEFORE UPDATE ON public.stage_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX stage_entries_company_idx ON public.stage_entries(company_id, platform, entry_date DESC);

-- Production calendar
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'event',
  status TEXT NOT NULL DEFAULT 'Planned',
  event_date DATE NOT NULL,
  start_time TEXT NOT NULL DEFAULT '',
  end_time TEXT NOT NULL DEFAULT '',
  venue TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  owner TEXT NOT NULL DEFAULT '',
  requirements TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_events TO authenticated;
GRANT ALL ON public.calendar_events TO service_role;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can read calendar events" ON public.calendar_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Team can insert calendar events" ON public.calendar_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Team can update calendar events" ON public.calendar_events FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Team can delete calendar events" ON public.calendar_events FOR DELETE TO authenticated USING (true);
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON public.calendar_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX calendar_events_company_date_idx ON public.calendar_events(company_id, event_date);

INSERT INTO public.companies (name, accent, sort_order) VALUES
  ('5', '#E8B84B', 1),
  ('110 Events', '#2FEA6A', 2),
  ('Super Team', '#00D4FF', 3),
  ('Supreme JS', '#3B5BDB', 4),
  ('Supreme SHAMS', '#8B7FE8', 5),
  ('Supreme Events', '#E63946', 6);