import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Header } from "@/components/daily-wrap/Header";
import { Toolbar } from "@/components/daily-wrap/Toolbar";
import { StatsCard } from "@/components/daily-wrap/StatsCard";
import { TeamColumn } from "@/components/daily-wrap/TeamColumn";
import { TaskModal, type TaskDraft } from "@/components/daily-wrap/TaskModal";
import { useTasks } from "@/lib/daily-wrap/storage";
import { AppShell } from "@/components/shell/AppShell";
import { useCompanies } from "@/lib/companies/context";
import { useCanEdit } from "@/lib/access/roles";
import { TEAM_MEMBERS, type Task } from "@/lib/daily-wrap/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Daily Wrap — Team Report" },
      {
        name: "description",
        content:
          "End-of-day team report: tasks, projects, clients and status logged throughout the day.",
      },
      { property: "og:title", content: "Daily Wrap — Team Report" },
      {
        property: "og:description",
        content:
          "End-of-day team report: tasks, projects, clients and status logged throughout the day.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <Index />
    </AppShell>
  ),
});

function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function longLabel(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function shift(key: string, days: number) {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toKey(date);
}

function Index() {
  const { company } = useCompanies();
  const { canEdit } = useCanEdit();
  const { tasks, saveTask, deleteTask } = useTasks(company?.id ?? null);
  const [dateKey, setDateKey] = useState(() => toKey(new Date()));
  const [draft, setDraft] = useState<TaskDraft | null>(null);
  const [copied, setCopied] = useState(false);

  const dayTasks = useMemo(() => tasks.filter((t) => t.date === dateKey), [tasks, dateKey]);

  const stats = useMemo(
    () => ({
      total: dayTasks.length,
      completed: dayTasks.filter((t) => t.status === "Completed").length,
      progress: dayTasks.filter((t) => t.status === "In Progress").length,
      blocked: dayTasks.filter((t) => t.status === "Blocked").length,
    }),
    [dayTasks],
  );

  const newDraft = (member: string): TaskDraft => ({
    teamMember: member,
    task: "",
    project: "",
    company: company?.name ?? "",
    timeline: "",
    date: dateKey,
    status: "Not Started",
  });

  const copyReport = async () => {
    const lines = [`Daily Wrap — ${longLabel(dateKey)}`, ""];
    for (const member of TEAM_MEMBERS) {
      lines.push(member);
      const rows = dayTasks.filter((t) => t.teamMember === member);
      if (rows.length === 0) lines.push("No updates logged.");
      else
        for (const t of rows) {
          const meta = [t.timeline, t.company].filter(Boolean).join(", ");
          lines.push(
            `[${t.status}] ${t.task}${t.project ? ` — ${t.project}` : ""}${meta ? ` (${meta})` : ""}`,
          );
        }
      lines.push("");
    }
    try {
      await navigator.clipboard.writeText(lines.join("\n").trim());
    } catch {
      /* clipboard unavailable */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="bg-background">
      <div className="mx-auto w-full max-w-[1180px] px-5 pt-7 pb-[60px]">
        <Header
          onLogTask={canEdit ? () => setDraft(newDraft(TEAM_MEMBERS[0])) : undefined}
          onCopy={copyReport}
          copied={copied}
        />

        <div className="mt-6">
          <Toolbar
            dateLabel={longLabel(dateKey)}
            onPrev={() => setDateKey((k) => shift(k, -1))}
            onNext={() => setDateKey((k) => shift(k, 1))}
            onToday={() => setDateKey(toKey(new Date()))}
          />
        </div>

        <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatsCard value={stats.total} label="Tasks Logged" />
          <StatsCard value={stats.completed} label="Completed" tone="green" />
          <StatsCard value={stats.progress} label="In Progress" tone="gold" />
          <StatsCard value={stats.blocked} label="Blocked" tone="red" />
        </section>

        <section className="mt-6 grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TEAM_MEMBERS.map((member) => (
            <TeamColumn
              key={member}
              member={member}
              tasks={dayTasks.filter((t) => t.teamMember === member)}
              onAdd={canEdit ? () => setDraft(newDraft(member)) : undefined}
              onSelect={canEdit ? (task) => setDraft(task) : undefined}
            />
          ))}
        </section>
      </div>

      <TaskModal
        open={draft !== null}
        draft={draft}
        onClose={() => setDraft(null)}
        onSave={(task: Task) => {
          saveTask(task);
          setDraft(null);
        }}
        onDelete={(id) => {
          deleteTask(id);
          setDraft(null);
        }}
      />
    </main>
  );
}
