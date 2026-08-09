import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { CalendarClock, CheckSquare, Radio } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { useCompanies } from "@/lib/companies/context";
import { prettyDate, useCompanyData } from "@/lib/reports/data";
import { useDepartment } from "@/lib/departments/context";
import { PLATFORMS, STAGE_STATUS_LABEL, type StageStatus } from "@/lib/run-of-show/data";
import { typeInfo } from "@/lib/calendar/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/timeline")({
  head: () => ({
    meta: [
      { title: "Activity Timeline — Tracker History by Date" },
      {
        name: "description",
        content:
          "Chronological history of every task, stage check-in and calendar event change for the selected company.",
      },
      { property: "og:title", content: "Activity Timeline" },
      {
        property: "og:description",
        content: "Review updates across Daily Wrap, Run of Show and Calendar day by day.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <Timeline />
    </AppShell>
  ),
});

type Kind = "task" | "stage" | "event";

interface Entry {
  id: string;
  kind: Kind;
  at: string;
  action: "Created" | "Updated";
  title: string;
  detail: string;
  meta: string;
  color?: string;
}

const FILTERS: { id: Kind | "all"; label: string }[] = [
  { id: "all", label: "Everything" },
  { id: "task", label: "Daily Wrap" },
  { id: "stage", label: "Run of Show" },
  { id: "event", label: "Calendar" },
];

const ICON: Record<Kind, typeof CheckSquare> = {
  task: CheckSquare,
  stage: Radio,
  event: CalendarClock,
};

function dayOf(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function Timeline() {
  const { company } = useCompanies();
  const { data, loading } = useCompanyData(company?.id ?? null, useDepartment().department);
  const [filter, setFilter] = useState<Kind | "all">("all");

  const entries = useMemo(() => {
    const out: Entry[] = [];
    const push = (base: Omit<Entry, "at" | "action" | "id">, id: string, created: string, updated: string) => {
      out.push({ ...base, id: `${id}-c`, at: created, action: "Created" });
      if (updated && updated !== created)
        out.push({ ...base, id: `${id}-u`, at: updated, action: "Updated" });
    };

    for (const t of data.tasks)
      push(
        {
          kind: "task",
          title: t.task || "Untitled task",
          detail: [t.project, t.timeline].filter(Boolean).join(" · "),
          meta: `${t.team_member} · ${t.status} · for ${prettyDate(t.date)}`,
        },
        t.id,
        t.created_at,
        t.updated_at,
      );

    for (const e of data.entries) {
      const p = PLATFORMS.find((x) => x.id === e.platform);
      push(
        {
          kind: "stage",
          title: `${p?.name ?? e.platform} check-in`,
          detail: e.content_today || e.next_steps || e.notes || "",
          meta: `${STAGE_STATUS_LABEL[e.status as StageStatus] ?? e.status}${e.metric_value != null ? ` · ${e.metric_value}` : ""} · for ${prettyDate(e.entry_date)}`,
        },
        e.id,
        e.created_at,
        e.updated_at,
      );
    }

    for (const e of data.events)
      push(
        {
          kind: "event",
          title: e.title || "Untitled event",
          detail: [e.venue, e.location].filter(Boolean).join(", "),
          meta: `${typeInfo(e.event_type).label} · ${e.status} · for ${prettyDate(e.event_date)}`,
          color: typeInfo(e.event_type).color,
        },
        e.id,
        e.created_at,
        e.updated_at,
      );

    return out
      .filter((e) => e.at && (filter === "all" || e.kind === filter))
      .sort((a, b) => b.at.localeCompare(a.at));
  }, [data, filter]);

  const days = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const e of entries) {
      const d = dayOf(e.at);
      map.set(d, [...(map.get(d) ?? []), e]);
    }
    return [...map.entries()];
  }, [entries]);

  return (
    <main className="bg-background">
      <div className="mx-auto w-full max-w-[900px] px-5 pt-7 pb-[60px]">
        <p className="mono-label text-primary">Activity Timeline</p>
        <h1 className="mt-1.5 font-display text-3xl tracking-wide text-foreground uppercase">
          {company?.name ?? "—"} history
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every change across all trackers, newest first.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-1 rounded-full border border-border bg-card p-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "mono-label rounded-full px-3.5 py-2 transition-colors",
                filter === f.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="mt-8 text-sm text-muted-foreground">Loading history…</p>
        ) : days.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
            No activity recorded yet for this company.
          </p>
        ) : (
          <div className="mt-6 flex flex-col gap-7">
            {days.map(([day, rows]) => (
              <section key={day}>
                <div className="sticky top-[68px] z-10 -mx-1 bg-background/90 px-1 py-1.5 backdrop-blur">
                  <h2 className="mono-label text-foreground">{prettyDate(day)}</h2>
                </div>
                <ol className="mt-2 border-l border-border pl-5">
                  {rows.map((e, i) => {
                    const Icon = ICON[e.kind];
                    return (
                      <motion.li
                        key={e.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: Math.min(i * 0.02, 0.2) }}
                        className="relative mb-3 rounded-xl border border-border bg-card p-3.5"
                      >
                        <span
                          className="absolute top-5 -left-[26px] size-2.5 rounded-full ring-4 ring-background"
                          style={{ background: e.color ?? "var(--color-primary)" }}
                        />
                        <div className="flex items-start gap-3">
                          <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-medium text-foreground">{e.title}</p>
                              <span className="mono-label rounded-full bg-surface-raised px-2 py-0.5 text-muted-foreground">
                                {e.action}
                              </span>
                            </div>
                            {e.detail ? (
                              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                {e.detail}
                              </p>
                            ) : null}
                            <p className="mono-label mt-1 text-muted-foreground/70">{e.meta}</p>
                          </div>
                          <span className="mono-label shrink-0 text-muted-foreground/70">
                            {timeOf(e.at)}
                          </span>
                        </div>
                      </motion.li>
                    );
                  })}
                </ol>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
