import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ReminderSettings {
  id: string | null;
  enabled: boolean;
  wrap_time: string;
  timeline_time: string;
  weekdays_only: boolean;
}

export const DEFAULT_REMINDERS: ReminderSettings = {
  id: null,
  enabled: true,
  wrap_time: "17:30",
  timeline_time: "18:30",
  weekdays_only: true,
};

const SELECT = "id, enabled, wrap_time, timeline_time, weekdays_only";

export function useReminderSettings(companyId: string | null) {
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_REMINDERS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!companyId) {
      setSettings(DEFAULT_REMINDERS);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("reminder_settings")
      .select(SELECT)
      .eq("company_id", companyId)
      .maybeSingle();
    setSettings(data ? (data as ReminderSettings) : DEFAULT_REMINDERS);
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    setLoading(true);
    void refresh();
  }, [refresh]);

  const save = useCallback(
    async (patch: Partial<ReminderSettings>) => {
      if (!companyId) return;
      const next = { ...settings, ...patch };
      setSettings(next);
      const { data: userData } = await supabase.auth.getUser();
      await supabase.from("reminder_settings").upsert(
        {
          user_id: userData.user?.id ?? "",
          company_id: companyId,
          enabled: next.enabled,
          wrap_time: next.wrap_time,
          timeline_time: next.timeline_time,
          weekdays_only: next.weekdays_only,
        },
        { onConflict: "user_id,company_id" },
      );
      await refresh();
    },
    [companyId, refresh, settings],
  );

  return { settings, loading, save };
}

/** Minute-resolution clock used to evaluate reminder times. */
export function useMinuteTick() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

export function isPastTime(now: Date, hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h)) return false;
  return now.getHours() * 60 + now.getMinutes() >= h * 60 + (m || 0);
}
