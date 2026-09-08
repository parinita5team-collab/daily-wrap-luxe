export type TaskStatus = "Not Started" | "In Progress" | "Completed" | "Blocked";

export const STATUSES: TaskStatus[] = ["Not Started", "In Progress", "Completed", "Blocked"];

export const TEAM_MEMBERS = ["Pranita", "Osama", "Njung"] as const;
export type TeamMember = (typeof TEAM_MEMBERS)[number];

export interface Task {
  id: string;
  teamMember: string;
  task: string;
  project: string;
  company: string;
  timeline: string;
  date: string; // yyyy-MM-dd
  status: TaskStatus;
}

export const MEMBER_AVATAR: Record<string, string> = {
  Pranita: "bg-[oklch(0.62_0.15_20)]",
  Osama: "bg-[oklch(0.60_0.11_250)]",
  Njung: "bg-[oklch(0.62_0.12_160)]",
};

export const STATUS_TOKENS: Record<
  TaskStatus,
  { pill: string; bar: string; text: string }
> = {
  "Not Started": {
    pill: "bg-muted-foreground/15 text-muted-foreground",
    bar: "bg-muted-foreground/60",
    text: "text-muted-foreground",
  },
  "In Progress": {
    pill: "bg-primary/15 text-primary",
    bar: "bg-primary",
    text: "text-primary",
  },
  Completed: {
    pill: "bg-success/15 text-success",
    bar: "bg-success",
    text: "text-success",
  },
  Blocked: {
    pill: "bg-danger/15 text-danger",
    bar: "bg-danger",
    text: "text-danger",
  },
};
/**
 * Department-wise staff rosters. Marketing is confirmed; the other
 * departments are empty until names are supplied, in which case the
 * columns are built from whoever already has entries logged.
 */
export const DEPARTMENT_MEMBERS: Record<string, string[]> = {
  marketing: ["Pranita", "Osama", "Njung"],
  creative: [],
  accounts: [],
  production: [],
  procurement: [],
  hr_admin: [],
};

/** Names to show as columns for a department, plus any logged extras. */
export function membersFor(department: string | null, logged: string[] = []): string[] {
  const roster = department ? (DEPARTMENT_MEMBERS[department] ?? []) : [];
  const extras = logged.filter((n) => n && !roster.includes(n));
  return [...roster, ...Array.from(new Set(extras))];
}
