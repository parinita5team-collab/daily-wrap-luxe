import { PLATFORMS, STAGE_STATUS_LABEL, type StageStatus } from "@/lib/run-of-show/data";
import { typeInfo } from "@/lib/calendar/data";
import { prettyDate, type CompanyData } from "./data";

function group<T>(rows: T[], key: (row: T) => string) {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const k = key(row);
    map.set(k, [...(map.get(k) ?? []), row]);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function platformName(id: string) {
  return PLATFORMS.find((p) => p.id === id)?.name ?? id;
}

export function buildTextReport(company: string, from: string, to: string, data: CompanyData) {
  const L: string[] = [];
  L.push(`${company.toUpperCase()} — COMBINED TRACKER REPORT`);
  L.push(`${prettyDate(from)}  →  ${prettyDate(to)}`);
  L.push("=".repeat(58), "");

  L.push("SUMMARY");
  L.push(`Tasks logged: ${data.tasks.length}`);
  L.push(`Completed: ${data.tasks.filter((t) => t.status === "Completed").length}`);
  L.push(`Blocked: ${data.tasks.filter((t) => t.status === "Blocked").length}`);
  L.push(`Run of Show check-ins: ${data.entries.length}`);
  L.push(`Calendar events: ${data.events.length}`);
  L.push("");

  L.push("DAILY WRAP", "-".repeat(58));
  if (data.tasks.length === 0) L.push("No tasks in this range.");
  for (const [day, rows] of group(data.tasks, (t) => t.date)) {
    L.push(prettyDate(day));
    for (const [member, mrows] of group(rows, (t) => t.team_member)) {
      L.push(`  ${member}`);
      for (const t of mrows) {
        const meta = [t.project, t.timeline, t.company].filter(Boolean).join(", ");
        L.push(`    [${t.status}] ${t.task}${meta ? ` (${meta})` : ""}`);
      }
    }
    L.push("");
  }

  L.push("RUN OF SHOW", "-".repeat(58));
  if (data.entries.length === 0) L.push("No check-ins in this range.");
  for (const [day, rows] of group(data.entries, (e) => e.entry_date)) {
    L.push(prettyDate(day));
    for (const e of rows) {
      const status = STAGE_STATUS_LABEL[e.status as StageStatus] ?? e.status;
      L.push(
        `  ${platformName(e.platform)} — ${status}${e.metric_value != null ? ` · ${e.metric_value}` : ""}${e.owner ? ` · ${e.owner}` : ""}`,
      );
      if (e.content_today) L.push(`    Today: ${e.content_today}`);
      if (e.next_steps) L.push(`    Next: ${e.next_steps}`);
      if (e.notes) L.push(`    Notes: ${e.notes}`);
    }
    L.push("");
  }

  L.push("CALENDAR", "-".repeat(58));
  if (data.events.length === 0) L.push("No events in this range.");
  for (const [day, rows] of group(data.events, (e) => e.event_date)) {
    L.push(prettyDate(day));
    for (const e of rows) {
      const time = [e.start_time, e.end_time].filter(Boolean).join("–");
      const where = [e.venue, e.location].filter(Boolean).join(", ");
      L.push(
        `  ${time ? `${time} ` : ""}${e.title} [${typeInfo(e.event_type).label} · ${e.status}]${where ? ` @ ${where}` : ""}${e.owner ? ` · ${e.owner}` : ""}`,
      );
      if (e.requirements) L.push(`    Requirements: ${e.requirements}`);
      if (e.notes) L.push(`    Notes: ${e.notes}`);
    }
    L.push("");
  }

  return L.join("\n").trim();
}

export function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Opens a print-ready window; the browser's print dialog saves it as PDF. */
export function printReport(title: string, text: string) {
  const win = window.open("", "_blank", "width=900,height=1000");
  if (!win) return false;
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  @page { margin: 18mm; }
  body { font: 12px/1.55 "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace; color: #14140f; }
  pre { white-space: pre-wrap; word-break: break-word; }
</style></head><body><pre>${esc(text)}</pre>
<script>window.onload = function(){ window.focus(); window.print(); };</script>
</body></html>`);
  win.document.close();
  return true;
}
