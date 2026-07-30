import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  STATUSES,
  STATUS_TOKENS,
  TEAM_MEMBERS,
  type Task,
  type TaskStatus,
} from "@/lib/daily-wrap/types";

export interface TaskDraft extends Omit<Task, "id"> {
  id?: string;
}

const field =
  "w-full rounded-xl border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground/60 focus:border-primary/60";

export function TaskModal({
  open,
  draft,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  draft: TaskDraft | null;
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete: (id: string) => void;
}) {
  const [form, setForm] = useState<TaskDraft | null>(draft);

  useEffect(() => setForm(draft), [draft]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = <K extends keyof TaskDraft>(key: K, value: TaskDraft[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  return (
    <AnimatePresence>
      {open && form ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/70 p-4 py-10 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-[14px] border border-border bg-card p-6 shadow-lift"
          >
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <span className="mono-label text-primary">
                  {form.id ? "Edit entry" : "New entry"}
                </span>
                <h2 className="mt-1.5 text-2xl font-medium text-foreground">Log a Task</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-surface-raised hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <form
              className="mt-6 space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                if (!form.task.trim()) return;
                onSave({ ...form, id: form.id ?? crypto.randomUUID() } as Task);
              }}
            >
              <div>
                <label className="mono-label text-muted-foreground">Team Member</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {TEAM_MEMBERS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => set("teamMember", m)}
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 text-sm transition-all duration-200",
                        form.teamMember === m
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border bg-surface-raised text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mono-label text-muted-foreground">Task</label>
                <input
                  className={cn(field, "mt-2")}
                  value={form.task}
                  onChange={(e) => set("task", e.target.value)}
                  placeholder="Created social media password sheet"
                  autoFocus
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mono-label text-muted-foreground">Project Name</label>
                  <input
                    className={cn(field, "mt-2")}
                    value={form.project}
                    onChange={(e) => set("project", e.target.value)}
                    placeholder="Internal"
                  />
                </div>
                <div>
                  <label className="mono-label text-muted-foreground">Company Name</label>
                  <input
                    className={cn(field, "mt-2")}
                    value={form.company}
                    onChange={(e) => set("company", e.target.value)}
                    placeholder="Supreme Events"
                  />
                </div>
                <div>
                  <label className="mono-label text-muted-foreground">Timeline</label>
                  <input
                    className={cn(field, "mt-2")}
                    value={form.timeline}
                    onChange={(e) => set("timeline", e.target.value)}
                    placeholder="10:00 — 12:30"
                  />
                </div>
                <div>
                  <label className="mono-label text-muted-foreground">Date</label>
                  <input
                    type="date"
                    className={cn(field, "mt-2")}
                    value={form.date}
                    onChange={(e) => set("date", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="mono-label text-muted-foreground">Status</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => set("status", s as TaskStatus)}
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 text-sm transition-all duration-200",
                        form.status === s
                          ? cn("border-transparent", STATUS_TOKENS[s].pill, STATUS_TOKENS[s].text)
                          : "border-border bg-surface-raised text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-border pt-5">
                <div>
                  {form.id ? (
                    <button
                      type="button"
                      onClick={() => onDelete(form.id!)}
                      className="rounded-xl border border-danger/40 px-3.5 py-2.5 text-sm font-medium text-danger transition-colors duration-200 hover:bg-danger/10"
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}