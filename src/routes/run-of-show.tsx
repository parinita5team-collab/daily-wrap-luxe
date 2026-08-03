import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { AppShell } from "@/components/shell/AppShell";
import { useCompanies } from "@/lib/companies/context";
import {
  PLATFORMS,
  STAGE_STATUS_COLOR,
  STAGE_STATUS_LABEL,
  todayKey,
  useStageEntries,
  type StageStatus,
} from "@/lib/run-of-show/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/run-of-show")({
  head: () => ({
    meta: [
      { title: "Run of Show — Daily Channel Call Sheet" },
      {
        name: "description",
        content:
          "One board, six stages: the daily read on the website and every social channel, per company.",
      },
      { property: "og:title", content: "Run of Show — Daily Channel Call Sheet" },
      {
        property: "og:description",
        content: "Daily status, metrics and blockers for every marketing channel.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <RunOfShow />
    </AppShell>
  ),
});

function RunOfShow() {
  const { company } = useCompanies();
  const { current, history, logUpdate } = useStageEntries(company?.id ?? null);
  const [date] = useState(() => todayKey());
  const [open, setOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const counts = useMemo(() => {
    const c: Record<StageStatus, number> = { green: 0, amber: 0, red: 0 };
    for (const p of PLATFORMS) c[current(p.id, date).status] += 1;
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, date]);

  const copyBriefing = async () => {
    const lines = [`Run of Show — ${company?.name ?? ""} — ${date}`, ""];
    for (const p of PLATFORMS) {
      const e = current(p.id, date);
      lines.push(
        `[${STAGE_STATUS_LABEL[e.status].toUpperCase()}] ${p.name}${
          e.metric_value != null ? ` — ${p.metricLabel}: ${e.metric_value}` : ""
        }${e.content_today ? `\n  ${e.content_today}` : ""}${e.notes ? `\n  Blocker: ${e.notes}` : ""}`,
      );
    }
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
    } catch {
      /* clipboard unavailable */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="mx-auto w-full max-w-[1180px] px-5 pt-7 pb-[60px]">
      <header className="relative overflow-hidden rounded-[14px] border border-border bg-card p-7 shadow-card">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-primary/8 blur-3xl"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="mono-label text-primary">Daily Call Sheet</span>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-[40px]">
              Run of Show — {company?.name}
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
              One board, six stages. The creative &amp; marketing team's daily read on the website
              and every social channel — built for a two-minute morning check.
            </p>
          </div>
          <button
            onClick={() => void copyBriefing()}
            className={cn(
              "rounded-xl px-4 py-2.5 text-sm font-medium transition-all hover:brightness-110",
              copied ? "bg-success text-background" : "bg-primary text-primary-foreground",
            )}
          >
            {copied ? "Copied ✓" : "Copy today's briefing"}
          </button>
        </div>

        <div className="relative mt-6 flex flex-wrap gap-5 rounded-xl border border-border bg-surface-raised px-5 py-4">
          {PLATFORMS.map((p) => {
            const st = current(p.id, date).status;
            return (
              <button
                key={p.id}
                onClick={() => setOpen(open === p.id ? null : p.id)}
                className="flex flex-col items-center gap-2"
              >
                <span
                  className="size-3.5 rounded-full"
                  style={{
                    background: STAGE_STATUS_COLOR[st],
                    boxShadow: `0 0 12px ${STAGE_STATUS_COLOR[st]}`,
                  }}
                />
                <span className="mono-label text-muted-foreground">{p.name}</span>
              </button>
            );
          })}
        </div>
      </header>

      <section className="mt-6 grid grid-cols-3 gap-4">
        {(
          [
            ["green", "On Cue stages"],
            ["amber", "Standby stages"],
            ["red", "Hold stages"],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="rounded-[14px] border border-border bg-card px-5 py-5 shadow-card">
            <div
              className="font-display text-4xl leading-none"
              style={{ color: STAGE_STATUS_COLOR[key] }}
            >
              {counts[key]}
            </div>
            <div className="mono-label mt-3 text-muted-foreground">{label}</div>
          </div>
        ))}
      </section>

      <section className="mt-6 grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
        {PLATFORMS.map((p) => (
          <StageCard
            key={p.id}
            platform={p}
            date={date}
            entry={current(p.id, date)}
            history={history(p.id, date)}
            open={open === p.id}
            onToggle={() => setOpen(open === p.id ? null : p.id)}
            onSave={logUpdate}
            canEdit={canEdit}
          />
        ))}
      </section>

      <p className="mono-label mt-8 text-center leading-relaxed text-muted-foreground">
        On cue — running to plan · Standby — needs a look · Hold — blocked, needs the boss
      </p>
    </main>
  );
}

const field =
  "w-full rounded-xl border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/60";

function StageCard({
  platform,
  date,
  entry,
  history,
  open,
  onToggle,
  onSave,
  canEdit,
}: {
  platform: (typeof PLATFORMS)[number];
  date: string;
  entry: ReturnType<ReturnType<typeof useStageEntries>["current"]>;
  history: ReturnType<ReturnType<typeof useStageEntries>["history"]>;
  open: boolean;
  onToggle: () => void;
  onSave: (e: {
    platform: string;
    entry_date: string;
    status: StageStatus;
    metric_value: number | null;
    content_today: string;
    notes: string;
    next_steps: string;
    owner: string;
  }) => Promise<void>;
  canEdit: boolean;
}) {
  const [form, setForm] = useState(entry);
  const [dirty, setDirty] = useState(false);
  const view = dirty ? form : entry;

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm({ ...view, [key]: value });
    setDirty(true);
  };

  const prev = history[0];
  const delta =
    view.metric_value != null && prev?.metric_value != null
      ? view.metric_value - prev.metric_value
      : null;

  return (
    <motion.div
      layout
      className="rounded-[14px] border border-border bg-card p-5 shadow-card transition-colors hover:border-primary/25"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mono-label text-muted-foreground">{platform.stage}</div>
          <div className="mt-1 font-display text-lg text-foreground">{platform.name}</div>
        </div>
        <span
          className="mono-label rounded-full px-2.5 py-1"
          style={{
            background: `color-mix(in oklab, ${STAGE_STATUS_COLOR[view.status]} 18%, transparent)`,
            color: STAGE_STATUS_COLOR[view.status],
          }}
        >
          {STAGE_STATUS_LABEL[view.status]}
        </span>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="font-display text-3xl text-foreground">
          {view.metric_value != null ? view.metric_value.toLocaleString() : "—"}
        </span>
        <span className="mono-label text-muted-foreground">{platform.metricLabel}</span>
        {delta != null ? (
          <span
            className={cn(
              "mono-label ml-auto",
              delta > 0 ? "text-success" : delta < 0 ? "text-danger" : "text-muted-foreground",
            )}
          >
            {delta > 0 ? "▲" : delta < 0 ? "▼" : ""} {Math.abs(delta).toLocaleString()}
          </span>
        ) : null}
      </div>

      <p className="mt-3 min-h-10 text-sm leading-relaxed text-muted-foreground">
        {view.content_today || "No update logged yet today."}
      </p>

      <button
        onClick={onToggle}
        className="mono-label mt-4 w-full rounded-xl border border-border bg-surface-raised py-2.5 text-muted-foreground transition-colors hover:text-primary"
      >
        {open ? "Close cue sheet" : "Open cue sheet"}
      </button>

      {open ? (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          {!canEdit ? (
            <p className="mono-label text-muted-foreground">
              View only — ask an admin for edit access.
            </p>
          ) : null}
          <div className="flex gap-2">
            {(["green", "amber", "red"] as StageStatus[]).map((s) => (
              <button
                key={s}
                disabled={!canEdit}
                onClick={() => set("status", s)}
                className="mono-label flex-1 rounded-lg border border-border py-2 transition-colors disabled:opacity-50"
                style={
                  view.status === s
                    ? { background: STAGE_STATUS_COLOR[s], color: "#14140f" }
                    : { color: "var(--color-muted-foreground)" }
                }
              >
                {STAGE_STATUS_LABEL[s]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              className={field}
              disabled={!canEdit}
              placeholder={platform.metricLabel}
              value={view.metric_value ?? ""}
              onChange={(e) => set("metric_value", e.target.value === "" ? null : +e.target.value)}
            />
            <input
              className={field}
              disabled={!canEdit}
              placeholder="Update by (initials)"
              value={view.owner}
              onChange={(e) => set("owner", e.target.value)}
            />
          </div>
          <textarea
            className={field}
            disabled={!canEdit}
            rows={2}
            placeholder={platform.contentLabel}
            value={view.content_today}
            onChange={(e) => set("content_today", e.target.value)}
          />
          <textarea
            className={field}
            disabled={!canEdit}
            rows={2}
            placeholder="Blockers / notes for the boss"
            value={view.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
          <textarea
            className={field}
            disabled={!canEdit}
            rows={2}
            placeholder="Next steps"
            value={view.next_steps}
            onChange={(e) => set("next_steps", e.target.value)}
          />
          {canEdit ? (
          <button
            onClick={() => {
              void onSave({
                platform: platform.id,
                entry_date: date,
                status: view.status,
                metric_value: view.metric_value,
                content_today: view.content_today,
                notes: view.notes,
                next_steps: view.next_steps,
                owner: view.owner,
              });
              setDirty(false);
            }}
            className="w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-all hover:brightness-110"
          >
            Log today's update
          </button>
          ) : null}

          <div className="pt-2">
            <div className="mono-label text-muted-foreground">Recent cues</div>
            {history.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground/70">No entries logged yet.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {history.map((h) => (
                  <li key={h.id} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="mono-label shrink-0">{h.entry_date}</span>
                    <span
                      className="mt-1.5 size-2 shrink-0 rounded-full"
                      style={{ background: STAGE_STATUS_COLOR[h.status] }}
                    />
                    <span className="min-w-0">{h.content_today || "Status set, no note."}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}