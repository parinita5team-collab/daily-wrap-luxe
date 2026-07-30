import { cn } from "@/lib/utils";
import { MEMBER_AVATAR } from "@/lib/daily-wrap/types";

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <div
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-xl font-mono text-sm font-semibold text-background shadow-card",
        MEMBER_AVATAR[name] ?? "bg-primary",
        className,
      )}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}