import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { STATUS_TOKENS, type Task } from "@/lib/daily-wrap/types";
import { StatusBadge } from "./StatusBadge";

export function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      whileHover={{ y: -2 }}
      className="group relative w-full overflow-hidden rounded-xl border border-border bg-surface-raised p-3.5 pl-4 text-left shadow-card transition-[box-shadow,border-color] duration-200 hover:border-primary/30 hover:shadow-lift"
    >
      <span
        className={cn("absolute inset-y-0 left-0 w-[3px]", STATUS_TOKENS[task.status].bar)}
      />
      <div className="flex items-start justify-between gap-3">
        <h4 className="min-w-0 flex-1 text-[15px] leading-snug font-medium text-foreground">
          {task.task}
        </h4>
        <StatusBadge status={task.status} className="shrink-0" />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {task.project}
        {task.company ? <span className="text-muted-foreground/60"> · {task.company}</span> : null}
      </p>
      {task.timeline ? (
        <p className="mono-label mt-2.5 text-muted-foreground/80">{task.timeline}</p>
      ) : null}
    </motion.button>
  );
}