import { useCallback, useEffect, useState } from "react";
import type { Task } from "./types";

const KEY = "daily-wrap-tasks-v1";

function read(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Task[]) : [];
  } catch {
    return [];
  }
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setTasks(read());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(KEY, JSON.stringify(tasks));
  }, [tasks, hydrated]);

  const saveTask = useCallback((task: Task) => {
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === task.id);
      return exists ? prev.map((t) => (t.id === task.id ? task : t)) : [...prev, task];
    });
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { tasks, hydrated, saveTask, deleteTask };
}