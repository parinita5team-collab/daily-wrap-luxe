import { PLATFORMS, STAGE_STATUS_LABEL, type StageStatus } from "@/lib/run-of-show/data";
import { typeInfo } from "@/lib/calendar/data";
import type { CompanyData } from "./data";

function cell(value: unknown) {
  const s = value == null ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: (string | number | null)[][]) {
  return rows.map((r) => r.map(cell).join(",")).join("\r\n");
}

function platformName(id: string) {
  return PLATFORMS.find((p) => p.id === id)?.name ?? id;
}

export function tasksCsv(data: CompanyData) {
  return toCsv([
    ["Date", "Team member", "Task", "Project", "Company", "Timeline", "Status", "Updated at"],
    ...data.tasks.map((t) => [
      t.date,
      t.team_member,
      t.task,
      t.project,
      t.company,
      t.timeline,
      t.status,
      t.updated_at,
    ]),
  ]);
}

export function stagesCsv(data: CompanyData) {
  return toCsv([
    ["Date", "Platform", "Status", "Metric", "Content today", "Next steps", "Notes", "Owner", "Updated at"],
    ...data.entries.map((e) => [
      e.entry_date,
      platformName(e.platform),
      STAGE_STATUS_LABEL[e.status as StageStatus] ?? e.status,
      e.metric_value,
      e.content_today,
      e.next_steps,
      e.notes,
      e.owner,
      e.updated_at,
    ]),
  ]);
}

export function eventsCsv(data: CompanyData) {
  return toCsv([
    ["Date", "Start", "End", "Title", "Type", "Status", "Venue", "Location", "Owner", "Requirements", "Notes", "Updated at"],
    ...data.events.map((e) => [
      e.event_date,
      e.start_time,
      e.end_time,
      e.title,
      typeInfo(e.event_type).label,
      e.status,
      e.venue,
      e.location,
      e.owner,
      e.requirements,
      e.notes,
      e.updated_at,
    ]),
  ]);
}

/** One CSV with every tracker row normalised into shared columns. */
export function combinedCsv(company: string, data: CompanyData) {
  const rows: (string | number | null)[][] = [
    ["Company", "Tracker", "Date", "Title", "Owner", "Status", "Detail", "Extra", "Updated at"],
  ];
  for (const t of data.tasks)
    rows.push([
      company,
      "Daily Wrap",
      t.date,
      t.task,
      t.team_member,
      t.status,
      [t.project, t.company].filter(Boolean).join(" · "),
      t.timeline,
      t.updated_at,
    ]);
  for (const e of data.entries)
    rows.push([
      company,
      "Run of Show",
      e.entry_date,
      `${platformName(e.platform)} check-in`,
      e.owner,
      STAGE_STATUS_LABEL[e.status as StageStatus] ?? e.status,
      e.content_today || e.notes,
      e.next_steps,
      e.updated_at,
    ]);
  for (const e of data.events)
    rows.push([
      company,
      "Calendar",
      e.event_date,
      e.title,
      e.owner,
      `${typeInfo(e.event_type).label} · ${e.status}`,
      [e.venue, e.location].filter(Boolean).join(", "),
      [e.start_time, e.end_time].filter(Boolean).join("–"),
      e.updated_at,
    ]);
  rows.sort((a, b) => String(a[2]).localeCompare(String(b[2])));
  return toCsv(rows);
}

export function downloadCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
