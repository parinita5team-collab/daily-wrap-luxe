import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Task, TaskStatus } from "./types";

type Row = {
  id: string;
  team_member: string;
  task: string;
  project: string;
  company: string;
  timeline: string;
  date: string;
  status: string;
};

function toTask(row: Row): Task {
  return {
    id: row.id,
    teamMember: row.team_member,
    task: row.task,
    project: row.project,
    company: row.company,
    timeline: row.timeline,
    date: row.date,
    status: row.status as TaskStatus,
  };
}

const SELECT = "id, team_member, task, project, company, timeline, date, status";

function isUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export function useTasks(companyId: string | null, department: string | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(async () => {
    if (!companyId || !department) {
      setTasks([]);
      setHydrated(true);
      return;
    }
    const { data, error } = await supabase
      .from("tasks")
      .select(SELECT)
      .eq("company_id", companyId)
      .eq("department", department)
      .order("created_at", { ascending: true });
    if (!error && data) setTasks((data as Row[]).map(toTask));
    setHydrated(true);
  }, [companyId, department]);

  useEffect(() => {
    void refresh();
    if (!companyId) return;
    const channel = supabase
      .channel("tasks-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => {
        void refresh();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [companyId, refresh]);

  const saveTask = useCallback(
    async (task: Task) => {
      if (!companyId || !department) return;
      const payload = {
        team_member: task.teamMember,
        task: task.task,
        project: task.project,
        company: task.company,
        timeline: task.timeline,
        date: task.date,
        status: task.status,
        company_id: companyId,
        department,
      };

      if (task.id && isUuid(task.id) && tasks.some((t) => t.id === task.id)) {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
        await supabase.from("tasks").update(payload).eq("id", task.id);
      } else {
        const { data: userData } = await supabase.auth.getUser();
        const { data } = await supabase
          .from("tasks")
          .insert({ ...payload, created_by: userData.user?.id ?? null })
          .select(SELECT)
          .single();
        if (data) setTasks((prev) => [...prev, toTask(data as Row)]);
      }
      void refresh();
    },
    [tasks, refresh, companyId, department],
  );

  const deleteTask = useCallback(
    async (id: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      await supabase.from("tasks").delete().eq("id", id);
      void refresh();
    },
    [refresh],
  );

  return { tasks, hydrated, saveTask, deleteTask };
}