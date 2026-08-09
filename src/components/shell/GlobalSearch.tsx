import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Bookmark, CalendarClock, CheckSquare, Radio, Search, SlidersHorizontal, Trash2, X } from "lucide-react";
import { useCompanies } from "@/lib/companies/context";
import { prettyDate, useCompanyData } from "@/lib/reports/data";
import { useDepartment } from "@/lib/departments/context";
import { PLATFORMS, STAGE_STATUS_LABEL, type StageStatus } from "@/lib/run-of-show/data";
import { typeInfo } from "@/lib/calendar/data";
import { useSavedSearches } from "@/lib/search/saved";
import { cn } from "@/lib/utils";

type Kind = "task" | "stage" | "event";

interface Hit {
  id: string;
  kind: Kind;
  title: string;
  detail: string;
  meta: string;
  status: string;
  haystack: string;
  to: string;
  color?: string;
}

const LABEL: Record<Kind, string> = {
  task: "Daily Wrap",
  stage: "Run of Show",
  event: "Calendar",
};

const ICON = { task: CheckSquare, stage: Radio, event: CalendarClock } as const;

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { company } = useCompanies();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [trackers, setTrackers] = useState<Kind[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [saveName, setSaveName] = useState("");
  const { department } = useDepartment();
  const { data, loading } = useCompanyData(
    open ? (company?.id ?? null) : null,
    department,
    from || undefined,
    to || undefined,
  );
  const { searches, save, remove } = useSavedSearches(open ? (company?.id ?? null) : null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const all = useMemo<Hit[]>(() => {
    const out: Hit[] = [];
    for (const t of data.tasks)
      out.push({
        id: `t-${t.id}`,
        kind: "task",
        title: t.task || "Untitled task",
        detail: [t.project, t.timeline, t.company].filter(Boolean).join(" · "),
        meta: `${t.team_member} · ${t.status} · ${prettyDate(t.date)}`,
        status: t.status,
        haystack: [t.task, t.project, t.company, t.timeline, t.team_member, t.status, t.date]
          .join(" ")
          .toLowerCase(),
        to: "/",
      });

    for (const e of data.entries) {
      const p = PLATFORMS.find((x) => x.id === e.platform);
      const label = STAGE_STATUS_LABEL[e.status as StageStatus] ?? e.status;
      out.push({
        id: `s-${e.id}`,
        kind: "stage",
        title: `${p?.name ?? e.platform} check-in`,
        detail: e.content_today || e.next_steps || e.notes || "",
        meta: `${label} · ${prettyDate(e.entry_date)}${e.owner ? ` · ${e.owner}` : ""}`,
        status: label,
        haystack: [p?.name, e.platform, e.content_today, e.notes, e.next_steps, e.owner, e.entry_date]
          .join(" ")
          .toLowerCase(),
        to: "/run-of-show",
      });
    }

    for (const e of data.events)
      out.push({
        id: `e-${e.id}`,
        kind: "event",
        title: e.title || "Untitled event",
        detail: [e.venue, e.location, e.requirements].filter(Boolean).join(" · "),
        meta: `${typeInfo(e.event_type).label} · ${e.status} · ${prettyDate(e.event_date)}`,
        status: e.status,
        haystack: [
          e.title,
          e.venue,
          e.location,
          e.owner,
          e.requirements,
          e.notes,
          e.status,
          e.event_date,
          typeInfo(e.event_type).label,
        ]
          .join(" ")
          .toLowerCase(),
        to: "/calendar",
        color: typeInfo(e.event_type).color,
      });

    return out;
  }, [data]);

  const statusOptions = useMemo(
    () => [...new Set(all.map((h) => h.status).filter(Boolean))].sort(),
    [all],
  );

  const hits = useMemo<Hit[]>(() => {
    let out = all;
    if (trackers.length) out = out.filter((h) => trackers.includes(h.kind));
    if (statuses.length) out = out.filter((h) => statuses.includes(h.status));
    const term = q.trim().toLowerCase();
    if (!term) return out.slice(0, trackers.length || statuses.length || from || to ? 40 : 8);
    const words = term.split(/\s+/);
    return out.filter((h) => words.every((w) => h.haystack.includes(w))).slice(0, 60);
  }, [all, from, q, statuses, to, trackers]);

  const toggle = <T,>(list: T[], value: T, set: (v: T[]) => void) =>
    set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);

  const activeFilters = trackers.length + statuses.length + (from ? 1 : 0) + (to ? 1 : 0);

  const grouped = useMemo(() => {
    const order: Kind[] = ["task", "stage", "event"];
    return order
      .map((k) => [k, hits.filter((h) => h.kind === k)] as const)
      .filter(([, rows]) => rows.length > 0);
  }, [hits]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-[10vh] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-lift"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Search className="size-4 text-muted-foreground" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={`Search ${company?.name ?? "company"} tasks, stages, events…`}
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
              <button
                onClick={() => setShowFilters((v) => !v)}
                className={cn(
                  "mono-label flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 transition-colors",
                  activeFilters
                    ? "border-primary/60 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                <SlidersHorizontal className="size-3" /> Filters
                {activeFilters ? ` · ${activeFilters}` : ""}
              </button>
              {searches.map((s) => (
                <span
                  key={s.id}
                  className="mono-label flex items-center gap-1.5 rounded-full border border-border bg-surface-raised pl-2.5 text-muted-foreground"
                >
                  <button
                    onClick={() => {
                      setQ(s.query);
                      setTrackers(s.trackers as Kind[]);
                      setStatuses(s.statuses);
                      setFrom(s.date_from);
                      setTo(s.date_to);
                    }}
                    className="py-1.5 hover:text-foreground"
                  >
                    {s.name}
                  </button>
                  <button
                    onClick={() => void remove(s.id)}
                    aria-label={`Delete saved search ${s.name}`}
                    className="pr-2 hover:text-danger"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </span>
              ))}
              {activeFilters || q.trim() ? (
                <button
                  onClick={() => {
                    setQ("");
                    setTrackers([]);
                    setStatuses([]);
                    setFrom("");
                    setTo("");
                  }}
                  className="mono-label ml-auto text-muted-foreground hover:text-foreground"
                >
                  Reset
                </button>
              ) : null}
            </div>

            {showFilters ? (
              <div className="space-y-3 border-b border-border bg-surface-raised/40 px-4 py-3">
                <div>
                  <p className="mono-label mb-1.5 text-muted-foreground">Tracker</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(["task", "stage", "event"] as Kind[]).map((k) => (
                      <button
                        key={k}
                        onClick={() => toggle(trackers, k, setTrackers)}
                        className={cn(
                          "mono-label rounded-full border px-2.5 py-1.5 transition-colors",
                          trackers.includes(k)
                            ? "border-primary/60 bg-card text-primary"
                            : "border-border text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {LABEL[k]}
                      </button>
                    ))}
                  </div>
                </div>

                {statusOptions.length ? (
                  <div>
                    <p className="mono-label mb-1.5 text-muted-foreground">Status</p>
                    <div className="flex flex-wrap gap-1.5">
                      {statusOptions.map((s) => (
                        <button
                          key={s}
                          onClick={() => toggle(statuses, s, setStatuses)}
                          className={cn(
                            "mono-label rounded-full border px-2.5 py-1.5 transition-colors",
                            statuses.includes(s)
                              ? "border-primary/60 bg-card text-primary"
                              : "border-border text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-end gap-2">
                  <label className="flex-1">
                    <span className="mono-label text-muted-foreground">From</span>
                    <input
                      type="date"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary/60"
                    />
                  </label>
                  <label className="flex-1">
                    <span className="mono-label text-muted-foreground">To</span>
                    <input
                      type="date"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary/60"
                    />
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                  <input
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="Name this search"
                    className="flex-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary/60"
                  />
                  <button
                    onClick={async () => {
                      if (!saveName.trim()) return;
                      await save({
                        name: saveName.trim(),
                        query: q,
                        trackers,
                        statuses,
                        date_from: from,
                        date_to: to,
                      });
                      setSaveName("");
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                  >
                    <Bookmark className="size-3" /> Save search
                  </button>
                </div>
              </div>
            ) : null}

            <div className="max-h-[55vh] overflow-auto p-2">
              {loading ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">Loading…</p>
              ) : grouped.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                  {q ? `No matches for “${q}”.` : "Nothing logged yet."}
                </p>
              ) : (
                grouped.map(([kind, rows]) => (
                  <div key={kind} className="mb-2">
                    <p className="mono-label px-3 py-1.5 text-muted-foreground/70">
                      {LABEL[kind]} · {rows.length}
                    </p>
                    {rows.map((h) => {
                      const Icon = ICON[h.kind];
                      return (
                        <button
                          key={h.id}
                          onClick={() => {
                            onClose();
                            void navigate({ to: h.to });
                          }}
                          className={cn(
                            "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-surface-raised",
                          )}
                        >
                          <Icon
                            className="mt-0.5 size-4 shrink-0"
                            style={{ color: h.color ?? "var(--color-primary)" }}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-foreground">
                              {h.title}
                            </span>
                            {h.detail ? (
                              <span className="block truncate text-xs text-muted-foreground">
                                {h.detail}
                              </span>
                            ) : null}
                            <span className="mono-label mt-0.5 block text-muted-foreground/70">
                              {h.meta}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
