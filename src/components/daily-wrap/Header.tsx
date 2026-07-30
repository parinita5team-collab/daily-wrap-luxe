import { motion } from "motion/react";
import { Check, Copy, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function Header({
  onLogTask,
  onCopy,
  copied,
}: {
  onLogTask: () => void;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative overflow-hidden rounded-[14px] border border-border bg-card p-7 shadow-card sm:p-9"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-primary/8 blur-3xl"
      />
      <div className="relative grid gap-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="min-w-0">
          <span className="mono-label text-primary">End of Day</span>
          <h1 className="mt-3 text-3xl leading-[1.1] font-semibold tracking-tight text-foreground sm:text-[42px]">
            Daily Wrap — Team Report
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            What the team worked on today — task, project, client and status, logged throughout the
            day for a clean end-of-day report.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 lg:justify-end">
          <button
            type="button"
            onClick={onLogTask}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0"
          >
            <Plus className="size-4" /> Log a Task
          </button>
          <button
            type="button"
            onClick={onCopy}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0",
              copied
                ? "bg-success text-background"
                : "bg-primary text-primary-foreground",
            )}
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copied ✓" : "Copy EOD Report"}
          </button>
        </div>
      </div>
    </motion.header>
  );
}