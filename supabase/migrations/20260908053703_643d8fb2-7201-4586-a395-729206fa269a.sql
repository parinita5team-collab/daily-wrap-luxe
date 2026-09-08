CREATE TABLE public.task_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id),
  department text NOT NULL DEFAULT 'creative',
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL DEFAULT '',
  size_bytes bigint NOT NULL DEFAULT 0,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_attachments TO authenticated;
GRANT ALL ON public.task_attachments TO service_role;

ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Department can read task attachments"
ON public.task_attachments FOR SELECT TO authenticated
USING (private.can_view_department(company_id, department));

CREATE POLICY "Editors insert task attachments"
ON public.task_attachments FOR INSERT TO authenticated
WITH CHECK (private.can_edit_department(company_id, department) AND uploaded_by = auth.uid());

CREATE POLICY "Uploaders or admins delete task attachments"
ON public.task_attachments FOR DELETE TO authenticated
USING (
  (uploaded_by = auth.uid() AND private.can_view_department(company_id, department))
  OR private.is_company_admin(company_id)
);

CREATE INDEX task_attachments_task_id_idx ON public.task_attachments(task_id);

CREATE TRIGGER update_task_attachments_updated_at
BEFORE UPDATE ON public.task_attachments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Members read task attachment files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'task-attachments'
  AND EXISTS (
    SELECT 1 FROM public.task_attachments a
    WHERE a.storage_path = storage.objects.name
      AND private.can_view_department(a.company_id, a.department)
  )
);

CREATE POLICY "Members upload task attachment files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'task-attachments' AND owner = auth.uid());

CREATE POLICY "Owners delete task attachment files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'task-attachments' AND owner = auth.uid());