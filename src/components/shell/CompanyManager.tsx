import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Trash2, X } from "lucide-react";
import { useCompanies } from "@/lib/companies/context";

const field =
  "w-full rounded-xl border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground/60 focus:border-primary/60";

export function CompanyManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { companies, addCompany, updateCompany, deleteCompany } = useCompanies();
  const [name, setName] = useState("");
  const [accent, setAccent] = useState("#E8B84B");

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
                <span className="mono-label text-primary">Workspace</span>
                <h2 className="mt-2 text-xl font-semibold text-foreground">Manage companies</h2>
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
              {companies.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface-raised px-3 py-2"
                >
                  <input
                    type="color"
                    value={c.accent}
                    onChange={(e) => void updateCompany(c.id, { accent: e.target.value })}
                    className="size-7 cursor-pointer rounded-md border border-border bg-transparent"
                    aria-label={`${c.name} accent colour`}
                  />
                  <input
                    defaultValue={c.name}
                    onBlur={(e) =>
                      e.target.value.trim() && e.target.value !== c.name
                        ? void updateCompany(c.id, { name: e.target.value.trim() })
                        : undefined
                    }
                    className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none"
                  />
                  <button
                    onClick={() => void deleteCompany(c.id)}
                    aria-label={`Delete ${c.name}`}
                    className="text-muted-foreground transition-colors hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center gap-2">
              <input
                type="color"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="size-9 shrink-0 cursor-pointer rounded-md border border-border bg-transparent"
                aria-label="New company accent colour"
              />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="New company name"
                className={field}
              />
              <button
                onClick={() => {
                  if (!name.trim()) return;
                  void addCompany(name.trim(), accent);
                  setName("");
                }}
                className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:brightness-110"
              >
                Add
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}