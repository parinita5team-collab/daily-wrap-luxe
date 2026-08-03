import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ShieldCheck, Trash2, X } from "lucide-react";
import { useCompanies } from "@/lib/companies/context";
import { ROLES, useCompanyMembers, type CompanyRole } from "@/lib/access/roles";

const field =
  "w-full rounded-xl border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground/60 focus:border-primary/60";

export function MembersManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { company } = useCompanies();
  const { members, myRole, isAppAdmin, isAdmin, email, addMember, setRole, removeMember } =
    useCompanyMembers(open ? (company?.id ?? null) : null);
  const [invite, setInvite] = useState("");
  const [role, setRoleDraft] = useState<CompanyRole>("viewer");
  const [error, setError] = useState("");

  const submit = async () => {
    if (!invite.trim()) return;
    setError("");
    try {
      await addMember(invite, role);
      setInvite("");
    } catch {
      setError("Could not add that person — they may already be on this company.");
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/70 p-4 py-10 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-[16px] border border-border bg-card p-6 shadow-lift"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="mono-label text-primary">Access</span>
                <h2 className="mt-2 text-xl font-semibold text-foreground">
                  {company?.name ?? "Company"} team
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {isAppAdmin
                    ? `Signed in as ${email} — permanent admin.`
                    : `Signed in as ${email} (${myRole === "editor" ? "editor" : myRole === "admin" ? "admin" : "user — view only"}).`}
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-surface-raised hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-5 space-y-2">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-raised px-3 py-2"
                >
                  <ShieldCheck className="size-4 text-primary" />
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                    {m.user_email}
                  </span>
                  <select
                    value={m.role}
                    disabled={!isAdmin}
                    onChange={(e) => void setRole(m.id, e.target.value as CompanyRole)}
                    className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-foreground outline-none disabled:opacity-50"
                  >
                    {ROLES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  {isAdmin ? (
                    <button
                      onClick={() => void removeMember(m.id)}
                      aria-label={`Remove ${m.user_email}`}
                      className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:text-danger"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  ) : null}
                </div>
              ))}
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground">No roles assigned yet.</p>
              ) : null}
            </div>

            {isAdmin ? (
              <div className="mt-5 space-y-3 border-t border-border pt-5">
                <label className="mono-label block text-muted-foreground">Add by email</label>
                <input
                  value={invite}
                  onChange={(e) => setInvite(e.target.value)}
                  placeholder="teammate@company.com"
                  className={field}
                />
                <div className="flex flex-wrap gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setRoleDraft(r.id)}
                      className={
                        "rounded-lg border px-3 py-2 text-left text-xs transition-colors " +
                        (role === r.id
                          ? "border-primary/60 bg-surface-raised text-foreground"
                          : "border-border text-muted-foreground hover:text-foreground")
                      }
                    >
                      <span className="block font-medium">{r.label}</span>
                      <span className="block text-[11px] text-muted-foreground">{r.blurb}</span>
                    </button>
                  ))}
                </div>
                {error ? <p className="text-xs text-danger">{error}</p> : null}
                <button
                  onClick={() => void submit()}
                  className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
                >
                  Add member
                </button>
              </div>
            ) : (
              <p className="mt-5 border-t border-border pt-5 text-xs text-muted-foreground">
                Only admins can change roles. New teammates get view-only access by default.
              </p>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
