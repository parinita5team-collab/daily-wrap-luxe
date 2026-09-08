import { cn } from "@/lib/utils";
import { MEMBER_AVATAR } from "@/lib/daily-wrap/types";

const FALLBACK = [
  "bg-[oklch(0.62_0.15_20)]",
  "bg-[oklch(0.60_0.11_250)]",
  "bg-[oklch(0.62_0.12_160)]",
  "bg-[oklch(0.64_0.13_60)]",
  "bg-[oklch(0.60_0.12_310)]",
  "bg-[oklch(0.62_0.10_200)]",
];

function fallbackFor(name: string) {
  let sum = 0;
  for (const ch of name) sum += ch.charCodeAt(0);
  return FALLBACK[sum % FALLBACK.length];
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <div
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-xl font-mono text-sm font-semibold text-background shadow-card",
        MEMBER_AVATAR[name] ?? fallbackFor(name),
        className,
      )}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}