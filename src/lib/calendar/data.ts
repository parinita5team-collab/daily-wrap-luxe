import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const EVENT_TYPES = [
  { id: "sitevisit", label: "Site Visit", color: "#38BDF8" },
  { id: "shoot", label: "Shoot", color: "#E85DA0" },
  { id: "event", label: "Event", color: "#E8B84B" },
  { id: "meeting", label: "Meeting", color: "#8B7FE8" },
  { id: "deadline", label: "Deadline", color: "#E1554F" },
  { id: "setup", label: "Setup", color: "#45C4A0" },
  { id: "other", label: "Other", color: "#8E8E9C" },
] as const;

export const EVENT_STATUSES = ["Planned", "Confirmed", "Done", "Cancelled"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export function typeInfo(id: string) {
  return EVENT_TYPES.find((t) => t.id === id) ?? EVENT_TYPES[6];
}

export interface CalendarEvent {
  id: string;
  title: string;
  event_type: string;
  status: EventStatus;
  event_date: string;
  start_time: string;
  end_time: string;
  venue: string;
  location: string;
  owner: string;
  requirements: string;
  notes: string;
}

const SELECT =
  "id, title, event_type, status, event_date, start_time, end_time, venue, location, owner, requirements, notes";

export function useCalendarEvents(companyId: string | null) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const refresh = useCallback(async () => {
    if (!companyId) return setEvents([]);
    const { data } = await supabase
      .from("calendar_events")
      .select(SELECT)
      .eq("company_id", companyId)
      .order("event_date", { ascending: true });
    if (data) setEvents(data as CalendarEvent[]);
  }, [companyId]);

  useEffect(() => {
    void refresh();
    if (!companyId) return;
    const channel = supabase
      .channel(`calendar-${companyId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "calendar_events" }, () => {
        void refresh();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [companyId, refresh]);

  const saveEvent = useCallback(
    async (event: Omit<CalendarEvent, "id"> & { id?: string }) => {
      if (!companyId) return;
      const { id, ...payload } = event;
      if (id) {
        await supabase.from("calendar_events").update(payload).eq("id", id);
      } else {
        const { data: userData } = await supabase.auth.getUser();
        await supabase
          .from("calendar_events")
          .insert({ ...payload, company_id: companyId, created_by: userData.user?.id ?? null });
      }
      await refresh();
    },
    [companyId, refresh],
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      await supabase.from("calendar_events").delete().eq("id", id);
      await refresh();
    },
    [refresh],
  );

  return { events, saveEvent, deleteEvent };
}