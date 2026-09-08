import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TaskAttachment {
  id: string;
  taskId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  createdAt: string;
}

const BUCKET = "task-attachments";
const SELECT = "id, task_id, file_name, mime_type, size_bytes, storage_path, created_at";

type Row = {
  id: string;
  task_id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  created_at: string;
};

function toAttachment(r: Row): TaskAttachment {
  return {
    id: r.id,
    taskId: r.task_id,
    fileName: r.file_name,
    mimeType: r.mime_type,
    sizeBytes: Number(r.size_bytes ?? 0),
    storagePath: r.storage_path,
    createdAt: r.created_at,
  };
}

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-120);
}

export function useTaskAttachments(
  taskId: string | null | undefined,
  companyId: string | null,
  department: string | null,
) {
  const [items, setItems] = useState<TaskAttachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!taskId) {
      setItems([]);
      return;
    }
    const { data } = await supabase
      .from("task_attachments")
      .select(SELECT)
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });
    setItems(((data ?? []) as Row[]).map(toAttachment));
  }, [taskId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const upload = useCallback(
    async (files: FileList | File[]) => {
      if (!taskId || !companyId || !department) return;
      setBusy(true);
      setError(null);
      try {
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData.user?.id ?? null;
        for (const file of Array.from(files)) {
          const path = `${companyId}/${taskId}/${crypto.randomUUID()}-${safeName(file.name)}`;
          const up = await supabase.storage.from(BUCKET).upload(path, file, {
            contentType: file.type || "application/octet-stream",
            upsert: false,
          });
          if (up.error) throw up.error;
          const ins = await supabase.from("task_attachments").insert({
            task_id: taskId,
            company_id: companyId,
            department,
            storage_path: path,
            file_name: file.name,
            mime_type: file.type || "application/octet-stream",
            size_bytes: file.size,
            uploaded_by: uid,
          });
          if (ins.error) {
            await supabase.storage.from(BUCKET).remove([path]);
            throw ins.error;
          }
        }
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setBusy(false);
      }
    },
    [taskId, companyId, department, refresh],
  );

  const remove = useCallback(
    async (item: TaskAttachment) => {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      await supabase.from("task_attachments").delete().eq("id", item.id);
      await supabase.storage.from(BUCKET).remove([item.storagePath]);
      await refresh();
    },
    [refresh],
  );

  const open = useCallback(async (item: TaskAttachment) => {
    const { data } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(item.storagePath, 60 * 10);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
  }, []);

  return { items, busy, error, upload, remove, open, refresh };
}
