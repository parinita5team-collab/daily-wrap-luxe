import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ReportTask {
  id: string;
  team_member: string;
  task: string;
  project: string;
  company: string;
  timeline: string;
  date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ReportStageEntry {
  id: string;
  platform: string;
  entry_date: string;
  status: string;
  metric_value: number | null;
  content_today: string;
  notes: string;
  next_steps: string;
  owner: string;
  created_at: string;
  updated_at: string;
}

export interface ReportEvent {
  id: string;
  title: string;
  event_type: string;
  status: string;
  event_date: string;
  start_time: string;
  end_time: string;
  venue: string;
  location: string;
  owner: string;
  requirements: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyData {
  tasks: ReportTask[];
  entries: ReportStageEntry[];
  events: ReportEvent[];
}

const EMPTY: CompanyData = { tasks: [], entries: [], events: [] };

export function dateKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function shiftKey(key: string, days: number) {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

export function prettyDate(key: string) {
  if (!key) return "";
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** All tracker rows for a company, optionally limited to an inclusive date range. */
export function useCompanyData(companyId: string | null, from?: string, to?: string) {
  const [data, setData] = useState<CompanyData>(EMPTY);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!companyId) {
      setData(EMPTY);
      setLoading(false);
      return;
    }
    setLoading(true);

    let tasksQ = supabase
      .from("tasks")
      .select(
        "id, team_member, task, project, company, timeline, date, status, created_at, updated_at",
      )
      .eq("company_id", companyId);
    let entriesQ = supabase
      .from("stage_entries")
      .select(
        "id, platform, entry_date, status, metric_value, content_today, notes, next_steps, owner, created_at, updated_at",
      )
      .eq("company_id", companyId);
    let eventsQ = supabase
      .from("calendar_events")
      .select(
        "id, title, event_type, status, event_date, start_time, end_time, venue, location, owner, requirements, notes, created_at, updated_at",
      )
      .eq("company_id", companyId);

    if (from) {
      tasksQ = tasksQ.gte("date", from);
      entriesQ = entriesQ.gte("entry_date", from);
      eventsQ = eventsQ.gte("event_date", from);
    }
    if (to) {
      tasksQ = tasksQ.lte("date", to);
      entriesQ = entriesQ.lte("entry_date", to);
      eventsQ = eventsQ.lte("event_date", to);
    }

    const [tasks, entries, events] = await Promise.all([
      tasksQ.order("date", { ascending: true }),
      entriesQ.order("entry_date", { ascending: true }),
      eventsQ.order("event_date", { ascending: true }),
    ]);

    setData({
      tasks: (tasks.data ?? []) as ReportTask[],
      entries: (entries.data ?? []) as ReportStageEntry[],
      events: (events.data ?? []) as ReportEvent[],
    });
    setLoading(false);
  }, [companyId, from, to]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, loading, refresh };
}
