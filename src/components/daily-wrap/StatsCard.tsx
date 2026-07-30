import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function StatsCard({
  value,
  label,
  tone = "default",
}: {
  value: number;
  label: string;
  tone?: "default" | "gold" | "green" | "red";
}) {
  const toneClass = {
    default: "text-foreground",
    gold: "text-primary",
    green: "text-success",
    red: "text-danger",
  }[tone];

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="rounded-[14px] border border-border bg-card px-5 py-5 shadow-card transition-[border-color,box-shadow] duration-200 hover:border-primary/25 hover:shadow-lift"
    >
      <div className={cn("font-display text-4xl leading-none tracking-tight", toneClass)}>
        {value}
      </div>
      <div className="mono-label mt-3 text-muted-foreground">{label}</div>
    </motion.div>
  );
}