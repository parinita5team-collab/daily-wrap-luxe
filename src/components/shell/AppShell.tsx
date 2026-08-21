import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { BellRing, Building2, ChevronDown, Layers, Search, Settings2, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { CompanyProvider, accentForeground, useCompanies } from "@/lib/companies/context";
import { DepartmentProvider, departmentLabel, useDepartment } from "@/lib/departments/context";
import { useCanEdit } from "@/lib/access/roles";
import { CompanyManager } from "./CompanyManager";
import { MembersManager } from "./MembersManager";
import { ReminderCenter } from "./ReminderCenter";
import { GlobalSearch } from "./GlobalSearch";
import { cn } from "@/lib/utils";

const TRACKERS = [
  { to: "/overview", label: "Overview" },
  { to: "/", label: "Daily Wrap" },
  { to: "/run-of-show", label: "Run of Show" },
  { to: "/calendar", label: "Calendar" },
  { to: "/timeline", label: "Timeline" },
  { to: "/brain-wave", label: "Brain Wave" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const { isAppAdmin, loading: adminLoading } = useAppAdmin();
  const navigate = useNavigate();
  const email = user?.email ?? "";
  const allowed = !email || isCompanyEmail(email) || isAppAdmin;

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth", search: { next: "/" } });
  }, [loading, user, navigate]);

  if (user && !adminLoading && !allowed) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-5 text-center">
        <ShieldAlert className="size-8 text-destructive" />
        <h1 className="text-xl font-semibold text-foreground">Company access only</h1>
        <p className="text-sm text-muted-foreground">
          {email} isn’t a company mailbox. Sign in with your {DOMAIN_HINT} email to use the portal.
        </p>
        <button
          onClick={() => void signOut()}
          className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground"
        >
          Sign out
        </button>
      </main>
    );
  }

  return (
    <CompanyProvider enabled={!!user && allowed}>
      <DepartmentProvider>
        <Shell email={email} onSignOut={() => void signOut()}>
          {children}
        </Shell>
      </DepartmentProvider>
    </CompanyProvider>
  );
}


function Shell({
  email,
  onSignOut,
  children,
}: {
  email: string;
  onSignOut: () => void;
  children: ReactNode;
}) {
  const { companies, company, selectCompany } = useCompanies();
  const { isAdmin, canEdit } = useCanEdit();
  const {
    departments,
    department,
    loading: deptLoading,
    selectDepartment,
  } = useDepartment();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [deptOpen, setDeptOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [remindersOpen, setRemindersOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const accent = company?.accent ?? "#E8B84B";

  return (
    <div
      className="min-h-screen bg-background"
      style={
        {
          "--primary": accent,
          "--ring": accent,
          "--primary-foreground": accentForeground(accent),
        } as React.CSSProperties
      }
    >
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center gap-3 px-5 py-3">
          <nav className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
            {TRACKERS.filter((t) => t.to !== "/run-of-show" || department === "marketing").map((t) => (
              <Link
                key={t.to}
                to={t.to}
                activeOptions={{ exact: t.to === "/" }}
                className="mono-label rounded-full px-3.5 py-2 text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "bg-surface-raised !text-primary" }}
              >
                {t.label}
              </Link>
            ))}
          </nav>

          <button
            onClick={() => setSearchOpen(true)}
            className="ml-auto flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <Search className="size-3.5" />
            <span className="hidden sm:inline">Search everything</span>
            <span className="mono-label hidden rounded bg-surface-raised px-1.5 py-0.5 md:inline">
              ⌘K
            </span>
          </button>

          <button
            onClick={() => setRemindersOpen(true)}
            aria-label="Reminder settings"
            className="grid size-9 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <BellRing className="size-4" />
          </button>

          <div className="relative">
            <button
              onClick={() => setPickerOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40"
            >
              <span className="size-2.5 rounded-full" style={{ background: accent }} />
              {company?.name ?? "No company"}
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </button>
            {pickerOpen ? (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setPickerOpen(false)} />
                <div className="absolute right-0 z-20 mt-2 w-60 rounded-xl border border-border bg-card p-1.5 shadow-lift">
                  {companies.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        selectCompany(c.id);
                        setPickerOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-surface-raised",
                        c.id === company?.id ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      <span className="size-2.5 rounded-full" style={{ background: c.accent }} />
                      {c.name}
                    </button>
                  ))}
                  {companies.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-muted-foreground">No companies yet.</p>
                  ) : null}
                  {isAdmin ? (
                    <button
                      onClick={() => {
                        setManageOpen(true);
                        setPickerOpen(false);
                      }}
                      className="mt-1 flex w-full items-center gap-2 rounded-lg border-t border-border px-3 py-2 text-left text-sm text-primary"
                    >
                      <Settings2 className="size-3.5" /> Manage companies
                    </button>
                  ) : null}
                  <button
                    onClick={() => {
                      setMembersOpen(true);
                      setPickerOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-primary"
                  >
                    <Users className="size-3.5" /> Roles &amp; access
                  </button>
                </div>
              </>
            ) : null}
          </div>

          {department ? (
            <div className="relative">
              <button
                onClick={() => setDeptOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40"
              >
                <Layers className="size-3.5 text-primary" />
                {departmentLabel(department)}
                {departments.length > 1 ? (
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                ) : null}
              </button>
              {deptOpen && departments.length > 1 ? (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setDeptOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-60 rounded-xl border border-border bg-card p-1.5 shadow-lift">
                    {departments.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => {
                          selectDepartment(d.id);
                          setDeptOpen(false);
                        }}
                        className={cn(
                          "flex w-full flex-col rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-surface-raised",
                          d.id === department ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        <span className="font-medium">{d.label}</span>
                        <span className="text-[11px] text-muted-foreground">{d.blurb}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          ) : null}

          <span className="mono-label hidden text-muted-foreground sm:inline">{email}</span>
          <span
            className="mono-label rounded-full border border-border px-2 py-1 text-muted-foreground"
            title={isAdmin ? "Admin — full control" : canEdit ? "Editor" : "User — view only"}
          >
            {isAdmin ? "Admin" : canEdit ? "Editor" : "View only"}
          </span>
          <button
            onClick={onSignOut}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </header>

      {!company ? (
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-5 py-24 text-center">
          <Building2 className="size-8 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">
            {isAdmin ? "Add your first company" : "No company access yet"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? "Every tracker is scoped to a company, so create one to get started."
              : "Ask an admin to set up a company — trackers are scoped per company."}
          </p>
          {isAdmin ? (
            <button
              onClick={() => setManageOpen(true)}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
            >
              Manage companies
            </button>
          ) : null}
        </div>
      ) : deptLoading ? (
        <div className="mx-auto max-w-md px-5 py-24 text-center text-sm text-muted-foreground">
          Loading your access…
        </div>
      ) : department ? (
        children
      ) : departments.length > 0 ? (
        <div className="mx-auto w-full max-w-2xl px-5 py-20">
          <span className="mono-label text-primary">Step 1</span>
          <h1 className="mt-2 font-display text-3xl tracking-tight text-foreground">
            Choose a department
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Every tracker — Daily Wrap, Run of Show, Calendar, Brain Wave — is scoped to the
            department you pick. You can switch any time from the header.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {departments.map((d) => (
              <button
                key={d.id}
                onClick={() => selectDepartment(d.id)}
                className="rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/50"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Layers className="size-4 text-primary" /> {d.label}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">{d.blurb}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-5 py-24 text-center">
          <Layers className="size-8 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">No department assigned yet</h1>
          <p className="text-sm text-muted-foreground">
            Ask an admin to assign you to a department (Creative, Marketing, Accounts, Production,
            Procurement or HR / Admin) for {company.name}.
          </p>
        </div>
      )}

      <CompanyManager open={manageOpen} onClose={() => setManageOpen(false)} />
      <MembersManager open={membersOpen} onClose={() => setMembersOpen(false)} />
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <ReminderCenter settingsOpen={remindersOpen} onCloseSettings={() => setRemindersOpen(false)} />
    </div>
  );
}