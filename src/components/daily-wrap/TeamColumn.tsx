import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import type { Task } from "@/lib/daily-wrap/types";
import { Avatar } from "./Avatar";
import { TaskCard } from "./TaskCard";

export function TeamColumn({
  member,
  tasks,
  onAdd,
  onSelect,
}: {
  member: string;
  tasks: Task[];
  onAdd: () => void;
  onSelect: (task: Task) => void;
}) {
  const completed = tasks.filter((t) => t.status === "Completed").length;
  const pct = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col rounded-[14px] border border-border bg-card p-4 shadow-card transition-[border-color] duration-200 hover:border-primary/20"
    >
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={member} />
          <div className="min-w-0">
            <h3 className="truncate text-lg leading-tight font-medium text-foreground">{member}</h3>
            <p className="mono-label mt-1 text-muted-foreground">
              {pct}% · {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="mono-label inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface-raised px-2.5 py-2 text-muted-foreground transition-all duration-200 hover:border-primary/40 hover:text-primary"
        >
          <Plus className="size-3.5" /> Add
        </button>
      </header>

      <div className="mt-4 flex flex-1 flex-col gap-2.5">
        <AnimatePresence initial={false}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onSelect(task)} />
          ))}
        </AnimatePresence>
        {tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            No updates logged yet today.
          </div>
        ) : null}
      </div>
    </motion.section>
  );
}