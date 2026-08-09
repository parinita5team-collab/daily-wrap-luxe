import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const PLATFORMS = [
  {
    id: "website",
    name: "Website",
    stage: "Stage 01",
    metricLabel: "Weekly visitors",
    contentLabel: "Pages / posts shipped today",
  },
  {
    id: "facebook",
    name: "Facebook",
    stage: "Stage 02",
    metricLabel: "Followers",
    contentLabel: "Posts published today",
  },
  {
    id: "instagram",
    name: "Instagram",
    stage: "Stage 03",
    metricLabel: "Followers",
    contentLabel: "Posts / Reels published today",
  },
  {
    id: "youtube",
    name: "YouTube",
    stage: "Stage 04",
    metricLabel: "Subscribers",
    contentLabel: "Videos uploaded today",
  },
  {
    id: "tiktok",
    name: "TikTok",
    stage: "Stage 05",
    metricLabel: "Followers",
    contentLabel: "Videos posted today",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    stage: "Stage 06",
    metricLabel: "Followers",
    contentLabel: "Posts published today",
  },
] as const;

export type StageStatus = "green" | "amber" | "red";

export const STAGE_STATUS_LABEL: Record<StageStatus, string> = {
  green: "On Cue",
  amber: "Standby",
  red: "Hold",
};

export const STAGE_STATUS_COLOR: Record<StageStatus, string> = {
  green: "var(--color-success)",
  amber: "var(--color-primary)",
  red: "var(--color-danger)",
};

export interface StageEntry {
  id: string;
  platform: string;
  entry_date: string;
  status: StageStatus;
  metric_value: number | null;
  content_today: string;
  notes: string;
  next_steps: string;
  owner: string;
  updated_at: string;
}

const SELECT =
  "id, platform, entry_date, status, metric_value, content_today, notes, next_steps, owner, updated_at";

export function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function emptyEntry(platform: string): StageEntry {
  return {
    id: "",
    platform,
    entry_date: todayKey(),
    status: "amber",
    metric_value: null,
    content_today: "",
    notes: "",
    next_steps: "",
    owner: "",
    updated_at: "",
  };
}

export function useStageEntries(companyId: string | null, department: string | null) {
  const [entries, setEntries] = useState<StageEntry[]>([]);

  const refresh = useCallback(async () => {
    if (!companyId || !department) return setEntries([]);
    const { data } = await supabase
      .from("stage_entries")
      .select(SELECT)
      .eq("company_id", companyId)
      .eq("department", department)
      .order("entry_date", { ascending: false });
    if (data) setEntries(data as StageEntry[]);
  }, [companyId, department]);

  useEffect(() => {
    void refresh();
    if (!companyId) return;
    const channel = supabase
      .channel(`stage-${companyId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "stage_entries" }, () => {
        void refresh();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [companyId, refresh]);

  const logUpdate = useCallback(
    async (entry: Omit<StageEntry, "id" | "updated_at">) => {
      if (!companyId || !department) return;
      const { data: userData } = await supabase.auth.getUser();
      await supabase.from("stage_entries").upsert(
        {
          company_id: companyId,
          department,
          platform: entry.platform,
          entry_date: entry.entry_date,
          status: entry.status,
          metric_value: entry.metric_value,
          content_today: entry.content_today,
          notes: entry.notes,
          next_steps: entry.next_steps,
          owner: entry.owner,
          created_by: userData.user?.id ?? null,
        },
        { onConflict: "company_id,department,platform,entry_date" },
      );
      await refresh();
    },
    [companyId, department, refresh],
  );

  const current = (platform: string, date: string) =>
    entries.find((e) => e.platform === platform && e.entry_date === date) ?? {
      ...emptyEntry(platform),
      entry_date: date,
    };

  const history = (platform: string, date: string) =>
    entries.filter((e) => e.platform === platform && e.entry_date < date).slice(0, 5);

  return { entries, current, history, logUpdate };
}