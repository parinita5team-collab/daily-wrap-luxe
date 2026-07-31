import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Building2, ChevronDown, Search, Settings2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { CompanyProvider, accentForeground, useCompanies } from "@/lib/companies/context";
import { CompanyManager } from "./CompanyManager";
import { GlobalSearch } from "./GlobalSearch";
import { cn } from "@/lib/utils";

const TRACKERS = [
  { to: "/overview", label: "Overview" },
  { to: "/", label: "Daily Wrap" },
  { to: "/run-of-show", label: "Run of Show" },
  { to: "/calendar", label: "Calendar" },
  { to: "/timeline", label: "Timeline" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth", search: { next: "/" } });
  }, [loading, user, navigate]);

  return (
    <CompanyProvider enabled={!!user}>
      <Shell email={user?.email ?? ""} onSignOut={() => void signOut()}>
        {children}
      </Shell>
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
  const [pickerOpen, setPickerOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

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
            {TRACKERS.map((t) => (
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
                  <button
                    onClick={() => {
                      setManageOpen(true);
                      setPickerOpen(false);
                    }}
                    className="mt-1 flex w-full items-center gap-2 rounded-lg border-t border-border px-3 py-2 text-left text-sm text-primary"
                  >
                    <Settings2 className="size-3.5" /> Manage companies
                  </button>
                </div>
              </>
            ) : null}
          </div>

          <span className="mono-label hidden text-muted-foreground sm:inline">{email}</span>
          <button
            onClick={onSignOut}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </header>

      {company ? (
        children
      ) : (
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-5 py-24 text-center">
          <Building2 className="size-8 text-primary" />
          <h1 className="text-xl font-semibold text-foreground">Add your first company</h1>
          <p className="text-sm text-muted-foreground">
            Every tracker is scoped to a company, so create one to get started.
          </p>
          <button
            onClick={() => setManageOpen(true)}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Manage companies
          </button>
        </div>
      )}

      <CompanyManager open={manageOpen} onClose={() => setManageOpen(false)} />
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}