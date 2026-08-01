import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { CalendarDays, Check, Copy, Download, FileText, Printer, Table2 } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { useCompanies } from "@/lib/companies/context";
import { dateKey, prettyDate, shiftKey, useCompanyData } from "@/lib/reports/data";
import { buildTextReport, downloadText, printReport } from "@/lib/reports/report";
import { combinedCsv, downloadCsv, eventsCsv, stagesCsv, tasksCsv } from "@/lib/reports/csv";
import { PLATFORMS, STAGE_STATUS_LABEL, type StageStatus } from "@/lib/run-of-show/data";
import { typeInfo } from "@/lib/calendar/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/overview")({
  head: () => ({
    meta: [
      { title: "Company Overview — All Trackers in One Place" },
      {
        name: "description",
        content:
          "Daily Wrap, Run of Show and Calendar summaries for the selected company, with a combined PDF or text export.",
      },
      { property: "og:title", content: "Company Overview — All Trackers" },
      {
        property: "og:description",
        content: "One page combining task, stage and calendar activity for the selected company.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <Overview />
    </AppShell>
  ),
});

const RANGES = [
  { label: "Today", days: 0 },
  { label: "7 days", days: 6 },
  { label: "30 days", days: 29 },
  { label: "90 days", days: 89 },
] as const;

function Overview() {
  const { company } = useCompanies();
  const [preset, setPreset] = useState<number | null>(6);
  const [from, setFrom] = useState(() => shiftKey(dateKey(), -6));
  const [to, setTo] = useState(() => dateKey());
  const [copied, setCopied] = useState(false);

  const { data, loading } = useCompanyData(company?.id ?? null, from, to);

  const applyPreset = (days: number) => {
    setPreset(days);
    setFrom(shiftKey(dateKey(), -days));
    setTo(dateKey());
  };

  const stats = useMemo(() => {
    const done = data.tasks.filter((t) => t.status === "Completed").length;
    return {
      tasks: data.tasks.length,
      done,
      blocked: data.tasks.filter((t) => t.status === "Blocked").length,
      rate: data.tasks.length ? Math.round((done / data.tasks.length) * 100) : 0,
      checkins: data.entries.length,
      onCue: data.entries.filter((e) => e.status === "green").length,
      events: data.events.length,
      confirmed: data.events.filter((e) => e.status === "Confirmed").length,
    };
  }, [data]);

  const report = useMemo(
    () => buildTextReport(company?.name ?? "Company", from, to, data),
    [company?.name, from, to, data],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(report);
    } catch {
      /* clipboard unavailable */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filename = `${(company?.name ?? "company").toLowerCase().replace(/\s+/g, "-")}-report-${from}_${to}.txt`;
  const slug = (company?.name ?? "company").toLowerCase().replace(/\s+/g, "-");
  const csvName = (kind: string) => `${slug}-${kind}-${from}_${to}.csv`;
  const CSV_EXPORTS = [
    { label: "Combined CSV", build: () => combinedCsv(company?.name ?? "Company", data), kind: "combined" },
    { label: "Daily Wrap", build: () => tasksCsv(data), kind: "daily-wrap" },
    { label: "Run of Show", build: () => stagesCsv(data), kind: "run-of-show" },
    { label: "Calendar", build: () => eventsCsv(data), kind: "calendar" },
  ];

  const latestByPlatform = useMemo(() => {
    const map = new Map<string, (typeof data.entries)[number]>();
    for (const e of data.entries) map.set(e.platform, e);
    return map;
  }, [data.entries]);

  const upcoming = useMemo(
    () => [...data.events].sort((a, b) => a.event_date.localeCompare(b.event_date)).slice(0, 6),
    [data.events],
  );

  const byMember = useMemo(() => {
    const map = new Map<string, { total: number; done: number }>();
    for (const t of data.tasks) {
      const cur = map.get(t.team_member) ?? { total: 0, done: 0 };
      cur.total += 1;
      if (t.status === "Completed") cur.done += 1;
      map.set(t.team_member, cur);
    }
    return [...map.entries()].sort((a, b) => b[1].total - a[1].total);
  }, [data.tasks]);

  return (
    <main className="bg-background">
      <div className="mx-auto w-full max-w-[1180px] px-5 pt-7 pb-[60px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mono-label text-primary">Company Overview</p>
            <h1 className="mt-1.5 font-display text-3xl tracking-wide text-foreground uppercase">
              {company?.name ?? "—"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {prettyDate(from)} → {prettyDate(to)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={copy}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40"
            >
              {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
              {copied ? "Copied" : "Copy report"}
            </button>
            <button
              onClick={() => downloadText(filename, report)}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40"
            >
              <Download className="size-4" /> .txt
            </button>
            <button
              onClick={() => printReport(`${company?.name ?? "Company"} report`, report)}
              className="flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2.5 text-sm font-medium text-primary-foreground"
            >
              <Printer className="size-4" /> Export PDF
            </button>
          </div>
        </div>

        <section className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3">
          <Table2 className="ml-1 size-4 text-primary" />
          <span className="mono-label text-muted-foreground">CSV export</span>
          {CSV_EXPORTS.map((x) => (
            <button
              key={x.kind}
              onClick={() => downloadCsv(csvName(x.kind), x.build())}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <Download className="size-3" /> {x.label}
            </button>
          ))}
        </section>

        <section className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3">
          <CalendarDays className="ml-1 size-4 text-primary" />
          <div className="flex items-center gap-1 rounded-full border border-border bg-surface-raised p-1">
            {RANGES.map((r) => (
              <button
                key={r.label}
                onClick={() => applyPreset(r.days)}
                className={cn(
                  "mono-label rounded-full px-3 py-1.5 transition-colors",
                  preset === r.days ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setPreset(null);
                setFrom(e.target.value);
              }}
              className="rounded-lg border border-border bg-surface-raised px-2.5 py-1.5 text-foreground"
            />
            <span className="text-muted-foreground">→</span>
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setPreset(null);
                setTo(e.target.value);
              }}
              className="rounded-lg border border-border bg-surface-raised px-2.5 py-1.5 text-foreground"
            />
          </div>
          {loading ? <span className="mono-label text-muted-foreground">Loading…</span> : null}
        </section>

        <section className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat value={stats.tasks} label="Tasks logged" sub={`${stats.done} completed`} />
          <Stat value={`${stats.rate}%`} label="Completion" sub={`${stats.blocked} blocked`} />
          <Stat value={stats.checkins} label="Stage check-ins" sub={`${stats.onCue} on cue`} />
          <Stat value={stats.events} label="Calendar events" sub={`${stats.confirmed} confirmed`} />
        </section>

        <section className="mt-5 grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
          <Panel title="Daily Wrap" to="/">
            {byMember.length === 0 ? (
              <Empty>No tasks in this range.</Empty>
            ) : (
              byMember.map(([member, m]) => (
                <div key={member} className="rounded-xl bg-surface-raised p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{member}</span>
                    <span className="mono-label text-muted-foreground">
                      {m.done}/{m.total}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${m.total ? (m.done / m.total) * 100 : 0}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              ))
            )}
          </Panel>

          <Panel title="Run of Show" to="/run-of-show">
            {latestByPlatform.size === 0 ? (
              <Empty>No check-ins in this range.</Empty>
            ) : (
              PLATFORMS.filter((p) => latestByPlatform.has(p.id)).map((p) => {
                const e = latestByPlatform.get(p.id)!;
                return (
                  <div key={p.id} className="rounded-xl bg-surface-raised p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{p.name}</span>
                      <span className="mono-label text-muted-foreground">
                        {STAGE_STATUS_LABEL[e.status as StageStatus] ?? e.status}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {e.content_today || e.next_steps || "No notes logged."}
                    </p>
                  </div>
                );
              })
            )}
          </Panel>

          <Panel title="Calendar" to="/calendar">
            {upcoming.length === 0 ? (
              <Empty>No events in this range.</Empty>
            ) : (
              upcoming.map((e) => (
                <div key={e.id} className="flex gap-3 rounded-xl bg-surface-raised p-3">
                  <span
                    className="mt-1 size-2.5 shrink-0 rounded-full"
                    style={{ background: typeInfo(e.event_type).color }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{e.title}</p>
                    <p className="mono-label text-muted-foreground">
                      {prettyDate(e.event_date)}
                      {e.start_time ? ` · ${e.start_time}` : ""} · {e.status}
                    </p>
                  </div>
                </div>
              ))
            )}
          </Panel>
        </section>

        <section className="mt-5 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            <h2 className="mono-label text-foreground">Combined report preview</h2>
          </div>
          <pre className="mt-3 max-h-[420px] overflow-auto rounded-xl bg-surface-raised p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
            {report}
          </pre>
        </section>
      </div>
    </main>
  );
}

function Stat({ value, label, sub }: { value: number | string; label: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="font-display text-3xl text-foreground">{value}</p>
      <p className="mono-label mt-1 text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-xs text-muted-foreground/70">{sub}</p>
    </div>
  );
}

function Panel({ title, to, children }: { title: string; to: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="mono-label text-foreground">{title}</h2>
        <Link to={to} className="mono-label text-primary hover:underline">
          Open
        </Link>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}
