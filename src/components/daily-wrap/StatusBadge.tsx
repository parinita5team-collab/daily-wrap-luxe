import { cn } from "@/lib/utils";
import { STATUS_TOKENS, type TaskStatus } from "@/lib/daily-wrap/types";

export function StatusBadge({ status, className }: { status: TaskStatus; className?: string }) {
  return (
    <span
      className={cn(
        "mono-label inline-flex items-center rounded-full px-2.5 py-1 leading-none",
        STATUS_TOKENS[status].pill,
        className,
      )}
    >
      {status}
    </span>
  );
}