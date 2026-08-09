-- 1. Department column on membership
ALTER TABLE public.company_members ADD COLUMN IF NOT EXISTS department text;

-- 2. Department column on data tables
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS department text NOT NULL DEFAULT 'creative';
ALTER TABLE public.stage_entries ADD COLUMN IF NOT EXISTS department text NOT NULL DEFAULT 'creative';
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS department text NOT NULL DEFAULT 'creative';
ALTER TABLE public.ideas ADD COLUMN IF NOT EXISTS department text NOT NULL DEFAULT 'creative';

-- 3. Run of Show uniqueness now per department
ALTER TABLE public.stage_entries DROP CONSTRAINT IF EXISTS stage_entries_company_id_platform_entry_date_key;
DROP INDEX IF EXISTS public.stage_entries_company_platform_date_key;
CREATE UNIQUE INDEX IF NOT EXISTS stage_entries_company_dept_platform_date_key
  ON public.stage_entries (company_id, department, platform, entry_date);

-- 4. Helper functions
CREATE OR REPLACE FUNCTION public.my_department(_company_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT department FROM public.company_members
  WHERE company_id = _company_id
    AND lower(user_email) = lower(auth.jwt() ->> 'email')
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.can_view_department(_company_id uuid, _department text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.is_app_admin()
     OR public.my_department(_company_id) = _department
$$;

CREATE OR REPLACE FUNCTION public.can_edit_department(_company_id uuid, _department text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.can_edit_company(_company_id)
     AND public.can_view_department(_company_id, _department)
$$;

REVOKE ALL ON FUNCTION public.my_department(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_view_department(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_edit_department(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_department(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_department(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_edit_department(uuid, text) TO authenticated;

-- 5. Tasks policies
DROP POLICY IF EXISTS "tasks_select_authenticated" ON public.tasks;
DROP POLICY IF EXISTS "Editors insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Editors update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Editors delete tasks" ON public.tasks;
CREATE POLICY "Department can read tasks" ON public.tasks FOR SELECT TO authenticated
  USING (public.can_view_department(company_id, department));
CREATE POLICY "Editors insert dept tasks" ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_department(company_id, department));
CREATE POLICY "Editors update dept tasks" ON public.tasks FOR UPDATE TO authenticated
  USING (public.can_edit_department(company_id, department))
  WITH CHECK (public.can_edit_department(company_id, department));
CREATE POLICY "Editors delete dept tasks" ON public.tasks FOR DELETE TO authenticated
  USING (public.can_edit_department(company_id, department));

-- 6. Stage entries policies
DROP POLICY IF EXISTS "Team can read stage entries" ON public.stage_entries;
DROP POLICY IF EXISTS "Editors insert stage entries" ON public.stage_entries;
DROP POLICY IF EXISTS "Editors update stage entries" ON public.stage_entries;
DROP POLICY IF EXISTS "Editors delete stage entries" ON public.stage_entries;
CREATE POLICY "Department can read stage entries" ON public.stage_entries FOR SELECT TO authenticated
  USING (public.can_view_department(company_id, department));
CREATE POLICY "Editors insert dept stage entries" ON public.stage_entries FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_department(company_id, department));
CREATE POLICY "Editors update dept stage entries" ON public.stage_entries FOR UPDATE TO authenticated
  USING (public.can_edit_department(company_id, department))
  WITH CHECK (public.can_edit_department(company_id, department));
CREATE POLICY "Editors delete dept stage entries" ON public.stage_entries FOR DELETE TO authenticated
  USING (public.can_edit_department(company_id, department));

-- 7. Calendar policies
DROP POLICY IF EXISTS "Team can read calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Editors insert calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Editors update calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Editors delete calendar events" ON public.calendar_events;
CREATE POLICY "Department can read calendar events" ON public.calendar_events FOR SELECT TO authenticated
  USING (public.can_view_department(company_id, department));
CREATE POLICY "Editors insert dept calendar events" ON public.calendar_events FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_department(company_id, department));
CREATE POLICY "Editors update dept calendar events" ON public.calendar_events FOR UPDATE TO authenticated
  USING (public.can_edit_department(company_id, department))
  WITH CHECK (public.can_edit_department(company_id, department));
CREATE POLICY "Editors delete dept calendar events" ON public.calendar_events FOR DELETE TO authenticated
  USING (public.can_edit_department(company_id, department));

-- 8. Ideas policies
DROP POLICY IF EXISTS "Team can read ideas" ON public.ideas;
DROP POLICY IF EXISTS "Team can add ideas" ON public.ideas;
DROP POLICY IF EXISTS "Authors or editors update ideas" ON public.ideas;
DROP POLICY IF EXISTS "Authors or admins delete ideas" ON public.ideas;
CREATE POLICY "Department can read ideas" ON public.ideas FOR SELECT TO authenticated
  USING (public.can_view_department(company_id, department));
CREATE POLICY "Department can add ideas" ON public.ideas FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND public.can_view_department(company_id, department));
CREATE POLICY "Authors or editors update dept ideas" ON public.ideas FOR UPDATE TO authenticated
  USING (
    (created_by = auth.uid() AND public.can_view_department(company_id, department))
    OR public.is_company_admin(company_id)
    OR public.can_edit_department(company_id, department)
  )
  WITH CHECK (
    (created_by = auth.uid() AND public.can_view_department(company_id, department))
    OR public.is_company_admin(company_id)
    OR public.can_edit_department(company_id, department)
  );
CREATE POLICY "Authors or admins delete dept ideas" ON public.ideas FOR DELETE TO authenticated
  USING (
    (created_by = auth.uid() AND public.can_view_department(company_id, department))
    OR public.is_company_admin(company_id)
  );