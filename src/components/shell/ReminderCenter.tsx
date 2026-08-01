import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { BellRing, X } from "lucide-react";
import { useCompanies } from "@/lib/companies/context";
import { dateKey } from "@/lib/reports/data";
import { isPastTime, useMinuteTick, useReminderSettings } from "@/lib/reminders/data";

type Kind = "wrap" | "timeline";

const COPY: Record<Kind, { title: string; body: string; to: string; cta: string }> = {
  wrap: {
    title: "Log your Daily Wrap",
    body: "End of day is close — record today's tasks and statuses before you sign off.",
    to: "/",
    cta: "Open Daily Wrap",
  },
  timeline: {
    title: "Review the timeline",
    body: "Take a minute to scan everything that changed across the trackers today.",
    to: "/timeline",
    cta: "Open Timeline",
  },
};

function dismissKey(kind: Kind, companyId: string) {
  return `tracker.reminder.${companyId}.${kind}.${dateKey()}`;
}

export function ReminderCenter({
  settingsOpen,
  onCloseSettings,
}: {
  settingsOpen: boolean;
  onCloseSettings: () => void;
}) {
  const { company } = useCompanies();
  const { settings, save } = useReminderSettings(company?.id ?? null);
  const now = useMinuteTick();
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    setDismissed([]);
  }, [company?.id]);

  const due = useMemo<Kind[]>(() => {
    if (!company || !settings.enabled) return [];
    const day = now.getDay();
    if (settings.weekdays_only && (day === 0 || day === 6)) return [];
    const out: Kind[] = [];
    if (isPastTime(now, settings.wrap_time)) out.push("wrap");
    if (isPastTime(now, settings.timeline_time)) out.push("timeline");
    return out.filter((k) => {
      const key = dismissKey(k, company.id);
      if (dismissed.includes(key)) return false;
      return typeof window === "undefined" ? true : !localStorage.getItem(key);
    });
  }, [company, dismissed, now, settings]);

  const dismiss = (kind: Kind) => {
    if (!company) return;
    const key = dismissKey(kind, company.id);
    localStorage.setItem(key, "1");
    setDismissed((d) => [...d, key]);
  };

  return (
    <>
      <div className="pointer-events-none fixed bottom-5 right-5 z-40 flex w-[min(22rem,calc(100vw-2.5rem))] flex-col gap-3">
        <AnimatePresence>
          {due.map((kind) => (
            <motion.div
              key={kind}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              className="pointer-events-auto rounded-2xl border border-primary/40 bg-card p-4 shadow-lift"
            >
              <div className="flex items-start gap-3">
                <BellRing className="mt-0.5 size-4 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{COPY[kind].title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{COPY[kind].body}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Link
                      to={COPY[kind].to}
                      onClick={() => dismiss(kind)}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                    >
                      {COPY[kind].cta}
                    </Link>
                    <button
                      onClick={() => dismiss(kind)}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Later today
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => dismiss(kind)}
                  aria-label="Dismiss reminder"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {settingsOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/70 p-4 py-10 backdrop-blur-md"
            onClick={onCloseSettings}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-[16px] border border-border bg-card p-6 shadow-lift"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="mono-label text-primary">Reminders</span>
                  <h2 className="mt-2 text-xl font-semibold text-foreground">End of day prompts</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Saved for you on {company?.name ?? "this company"}.
                  </p>
                </div>
                <button
                  onClick={onCloseSettings}
                  aria-label="Close"
                  className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-surface-raised hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <label className="flex items-center justify-between rounded-xl border border-border bg-surface-raised px-3.5 py-3 text-sm text-foreground">
                  Reminders on
                  <input
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={(e) => void save({ enabled: e.target.checked })}
                    className="size-4 accent-[var(--primary)]"
                  />
                </label>
                <label className="block">
                  <span className="mono-label text-muted-foreground">Daily Wrap prompt</span>
                  <input
                    type="time"
                    value={settings.wrap_time}
                    onChange={(e) => void save({ wrap_time: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary/60"
                  />
                </label>
                <label className="block">
                  <span className="mono-label text-muted-foreground">Timeline review prompt</span>
                  <input
                    type="time"
                    value={settings.timeline_time}
                    onChange={(e) => void save({ timeline_time: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary/60"
                  />
                </label>
                <label className="flex items-center justify-between rounded-xl border border-border bg-surface-raised px-3.5 py-3 text-sm text-foreground">
                  Weekdays only
                  <input
                    type="checkbox"
                    checked={settings.weekdays_only}
                    onChange={(e) => void save({ weekdays_only: e.target.checked })}
                    className="size-4 accent-[var(--primary)]"
                  />
                </label>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
