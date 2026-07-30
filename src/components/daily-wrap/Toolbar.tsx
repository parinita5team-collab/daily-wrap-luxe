import { ChevronLeft, ChevronRight } from "lucide-react";

export function Toolbar({
  dateLabel,
  onPrev,
  onNext,
  onToday,
}: {
  dateLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  return (
    <div className="flex justify-center">
      <div className="flex items-center gap-1.5 rounded-full border border-border bg-card p-1.5 shadow-card">
        <button
          type="button"
          onClick={onPrev}
          aria-label="Previous day"
          className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-surface-raised hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="mono-label min-w-[190px] px-2 text-center text-foreground">
          {dateLabel}
        </span>
        <button
          type="button"
          onClick={onNext}
          aria-label="Next day"
          className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-surface-raised hover:text-foreground"
        >
          <ChevronRight className="size-4" />
        </button>
        <button
          type="button"
          onClick={onToday}
          className="mono-label ml-1 rounded-full bg-surface-raised px-3.5 py-2 text-muted-foreground transition-colors duration-200 hover:text-primary"
        >
          Today
        </button>
      </div>
    </div>
  );
}