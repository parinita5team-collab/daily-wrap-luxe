import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { useCompanies } from "@/lib/companies/context";
import { useCanEdit } from "@/lib/access/roles";
import {
  EVENT_STATUSES,
  EVENT_TYPES,
  typeInfo,
  useCalendarEvents,
  type CalendarEvent,
  type EventStatus,
} from "@/lib/calendar/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Production Calendar — Shoots, Events & Deadlines" },
      {
        name: "description",
        content:
          "Month-at-a-glance production calendar for site visits, shoots, events, meetings and deadlines.",
      },
      { property: "og:title", content: "Production Calendar" },
      {
        property: "og:description",
        content: "Every shoot, site visit, event and deadline for the company in one calendar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <CalendarPage />
    </AppShell>
  ),
});

function key(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

type Draft = Omit<CalendarEvent, "id"> & { id?: string };

function emptyDraft(date: string): Draft {
  return {
    title: "",
    event_type: "shoot",
    status: "Planned",
    event_date: date,
    start_time: "",
    end_time: "",
    venue: "",
    location: "",
    owner: "",
    requirements: "",
    notes: "",
  };
}

function CalendarPage() {
  const { company } = useCompanies();
  const { canEdit } = useCanEdit();
  const { events, saveEvent, deleteEvent } = useCalendarEvents(company?.id ?? null);
  const today = new Date();
  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [filter, setFilter] = useState<string>("all");
  const [draft, setDraft] = useState<Draft | null>(null);

  const shown = useMemo(
    () => (filter === "all" ? events : events.filter((e) => e.event_type === filter)),
    [events, filter],
  );

  const grid = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const start = first.getDay();
    const days = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const cells: (number | null)[] = Array.from({ length: start }, () => null);
    for (let d = 1; d <= days; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  const monthLabel = new Date(cursor.y, cursor.m, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const upcoming = useMemo(() => {
    const t = key(today.getFullYear(), today.getMonth(), today.getDate());
    return shown.filter((e) => e.event_date >= t).slice(0, 6);
  }, [shown, today]);

  return (
    <main className="mx-auto w-full max-w-[1180px] px-5 pt-7 pb-[60px]">
      <header className="relative overflow-hidden rounded-[14px] border border-border bg-card p-7 shadow-card">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-primary/8 blur-3xl"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="mono-label text-primary">Production Schedule</span>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-[40px]">
              Calendar — {company?.name}
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
              Site visits, shoots, events, meetings and deadlines in one month-at-a-glance view.
            </p>
          </div>
          {canEdit ? (
            <button
              onClick={() =>
                setDraft(emptyDraft(key(today.getFullYear(), today.getMonth(), today.getDate())))
              }
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:brightness-110"
            >
              <Plus className="size-4" /> Add event
            </button>
          ) : null}
        </div>
      </header>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-[14px] border border-border bg-card px-4 py-3 shadow-card">
        <button
          onClick={() =>
            setCursor(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }))
          }
          aria-label="Previous month"
          className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="font-display text-lg text-foreground">{monthLabel}</span>
        <button
          onClick={() =>
            setCursor(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }))
          }
          aria-label="Next month"
          className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="size-4" />
        </button>
        <button
          onClick={() => setCursor({ y: today.getFullYear(), m: today.getMonth() })}
          className="mono-label rounded-lg border border-border px-3 py-2 text-muted-foreground hover:text-foreground"
        >
          Today
        </button>

        <div className="ml-auto flex flex-wrap gap-1.5">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")} label="All" />
          {EVENT_TYPES.map((t) => (
            <FilterChip
              key={t.id}
              active={filter === t.id}
              onClick={() => setFilter(t.id)}
              label={t.label}
              color={t.color}
            />
          ))}
        </div>
      </div>

      <section className="mt-6 overflow-hidden rounded-[14px] border border-border bg-card shadow-card">
        <div className="grid grid-cols-7 border-b border-border">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="mono-label px-3 py-3 text-center text-muted-foreground">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {grid.map((d, i) => {
            const dk = d ? key(cursor.y, cursor.m, d) : "";
            const dayEvents = d ? shown.filter((e) => e.event_date === dk) : [];
            const isToday =
              dk === key(today.getFullYear(), today.getMonth(), today.getDate()) && !!d;
            return (
              <button
                key={i}
                disabled={!d}
                onClick={() => d && setDraft(emptyDraft(dk))}
                className={cn(
                  "min-h-[104px] border-r border-b border-border p-2 text-left align-top transition-colors last:border-r-0",
                  d ? "hover:bg-surface-raised" : "bg-background/40",
                )}
              >
                {d ? (
                  <>
                    <span
                      className={cn(
                        "mono-label inline-grid size-6 place-items-center rounded-full",
                        isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                      )}
                    >
                      {d}
                    </span>
                    <div className="mt-1.5 space-y-1">
                      {dayEvents.slice(0, 3).map((e) => (
                        <div
                          key={e.id}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setDraft(e);
                          }}
                          className="truncate rounded-md px-1.5 py-1 text-[11px] text-foreground"
                          style={{
                            background: `color-mix(in oklab, ${typeInfo(e.event_type).color} 22%, transparent)`,
                            borderLeft: `2px solid ${typeInfo(e.event_type).color}`,
                          }}
                        >
                          {e.start_time ? `${e.start_time} ` : ""}
                          {e.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 ? (
                        <div className="mono-label text-muted-foreground">
                          +{dayEvents.length - 3} more
                        </div>
                      ) : null}
                    </div>
                  </>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mono-label text-muted-foreground">Upcoming</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing scheduled ahead.</p>
          ) : (
            upcoming.map((e) => (
              <button
                key={e.id}
                onClick={() => setDraft(e)}
                className="rounded-[14px] border border-border bg-card p-4 text-left shadow-card transition-colors hover:border-primary/30"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: typeInfo(e.event_type).color }}
                  />
                  <span className="mono-label text-muted-foreground">
                    {e.event_date}
                    {e.start_time ? ` · ${e.start_time}` : ""}
                  </span>
                  <span className="mono-label ml-auto text-primary">{e.status}</span>
                </div>
                <div className="mt-2 font-medium text-foreground">{e.title}</div>
                {e.venue || e.location ? (
                  <div className="mt-1 text-sm text-muted-foreground">
                    {[e.venue, e.location].filter(Boolean).join(" · ")}
                  </div>
                ) : null}
              </button>
            ))
          )}
        </div>
      </section>

      <EventModal
        draft={draft}
        onClose={() => setDraft(null)}
        onSave={(e) => {
          void saveEvent(e);
          setDraft(null);
        }}
        onDelete={(id) => {
          void deleteEvent(id);
          setDraft(null);
        }}
      />
    </main>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "mono-label flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 transition-colors",
        active
          ? "border-primary/50 bg-primary/12 text-primary"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {color ? <span className="size-2 rounded-full" style={{ background: color }} /> : null}
      {label}
    </button>
  );
}

const field =
  "w-full rounded-xl border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/60";

function EventModal({
  draft,
  onClose,
  onSave,
  onDelete,
}: {
  draft: Draft | null;
  onClose: () => void;
  onSave: (e: Draft) => void;
  onDelete: (id: string) => void;
}) {
  const [form, setForm] = useState<Draft | null>(draft);
  const [seed, setSeed] = useState<Draft | null>(draft);
  if (draft !== seed) {
    setSeed(draft);
    setForm(draft);
  }

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  return (
    <AnimatePresence>
      {form ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/70 p-4 py-10 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-[16px] border border-border bg-card p-6 shadow-lift"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="mono-label text-primary">
                  {form.id ? "Edit event" : "New event"}
                </span>
                <h2 className="mt-2 text-xl font-semibold text-foreground">Production entry</h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-surface-raised hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <input
                className={field}
                placeholder="Event title"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  className={field}
                  value={form.event_type}
                  onChange={(e) => set("event_type", e.target.value)}
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <select
                  className={field}
                  value={form.status}
                  onChange={(e) => set("status", e.target.value as EventStatus)}
                >
                  {EVENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="date"
                  className={field}
                  value={form.event_date}
                  onChange={(e) => set("event_date", e.target.value)}
                />
                <input
                  type="time"
                  className={field}
                  value={form.start_time}
                  onChange={(e) => set("start_time", e.target.value)}
                />
                <input
                  type="time"
                  className={field}
                  value={form.end_time}
                  onChange={(e) => set("end_time", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  className={field}
                  placeholder="Venue"
                  value={form.venue}
                  onChange={(e) => set("venue", e.target.value)}
                />
                <input
                  className={field}
                  placeholder="Location"
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                />
              </div>
              <input
                className={field}
                placeholder="Owner / lead"
                value={form.owner}
                onChange={(e) => set("owner", e.target.value)}
              />
              <textarea
                className={field}
                rows={2}
                placeholder="Requirements (crew, gear, permits)"
                value={form.requirements}
                onChange={(e) => set("requirements", e.target.value)}
              />
              <textarea
                className={field}
                rows={2}
                placeholder="Notes"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
            </div>

            <div className="mt-6 flex items-center gap-3">
              {form.id ? (
                <button
                  onClick={() => onDelete(form.id!)}
                  className="flex items-center gap-2 rounded-xl border border-border px-3.5 py-2.5 text-sm text-muted-foreground transition-colors hover:text-danger"
                >
                  <Trash2 className="size-4" /> Delete
                </button>
              ) : null}
              <button
                onClick={() => form.title.trim() && onSave(form)}
                className="ml-auto rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:brightness-110"
              >
                Save event
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}