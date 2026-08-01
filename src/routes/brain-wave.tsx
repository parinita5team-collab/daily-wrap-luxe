import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Lightbulb, Plus, ThumbsUp, Trash2, X } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { useCompanies } from "@/lib/companies/context";
import { useCompanyMembers } from "@/lib/access/roles";
import {
  IDEA_CATEGORIES,
  IDEA_IMPACTS,
  IDEA_STATUSES,
  IDEA_STATUS_LABEL,
  impactInfo,
  useIdeas,
  type IdeaDraft,
  type IdeaStatus,
} from "@/lib/ideas/data";
import { prettyDate } from "@/lib/reports/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/brain-wave")({
  head: () => ({
    meta: [
      { title: "Brain Wave — Team Ideas That Save Time & Money" },
      {
        name: "description",
        content:
          "Employees submit process improvement ideas, tag the savings they unlock, vote on favourites and track them to implementation.",
      },
      { property: "og:title", content: "Brain Wave — Team Idea Board" },
      {
        property: "og:description",
        content: "Capture and rank ideas that save the company time, money or effort.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <BrainWave />
    </AppShell>
  ),
});

const field =
  "w-full rounded-xl border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors duration-200 placeholder:text-muted-foreground/60 focus:border-primary/60";

const EMPTY: IdeaDraft = {
  title: "",
  description: "",
  category: "Process",
  impact: "time",
  estimated_saving: "",
  status: "new",
};

function BrainWave() {
  const { company } = useCompanies();
  const { canEdit } = useCompanyMembers(company?.id ?? null);
  const { ideas, votes, myVotes, userId, loading, addIdea, updateIdea, deleteIdea, toggleVote } =
    useIdeas(company?.id ?? null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<IdeaDraft>(EMPTY);
  const [impactFilter, setImpactFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sort, setSort] = useState<"new" | "votes">("votes");

  const rows = useMemo(() => {
    const out = ideas.filter(
      (i) =>
        (impactFilter === "all" || i.impact === impactFilter) &&
        (statusFilter === "all" || i.status === statusFilter),
    );
    return sort === "votes"
      ? [...out].sort((a, b) => (votes[b.id] ?? 0) - (votes[a.id] ?? 0))
      : out;
  }, [ideas, impactFilter, sort, statusFilter, votes]);

  const stats = useMemo(
    () => ({
      total: ideas.length,
      implemented: ideas.filter((i) => i.status === "implemented").length,
      approved: ideas.filter((i) => i.status === "approved").length,
      votes: Object.values(votes).reduce((a, b) => a + b, 0),
    }),
    [ideas, votes],
  );

  const submit = async () => {
    if (!draft.title.trim()) return;
    await addIdea(draft);
    setDraft(EMPTY);
    setOpen(false);
  };

  return (
    <main className="mx-auto w-full max-w-[1180px] px-5 py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="mono-label text-primary">Brain Wave</span>
          <h1 className="mt-2 font-display text-3xl tracking-tight text-foreground">
            Ideas from the {company?.name ?? "company"} team
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Anything that saves the company time, money or effort. Post it, let the team vote, and
            follow it through to implementation.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          <Plus className="size-4" /> Share an idea
        </button>
      </header>

      <section className="mt-7 grid gap-3 sm:grid-cols-4">
        {[
          { label: "Ideas", value: stats.total },
          { label: "Approved", value: stats.approved },
          { label: "Implemented", value: stats.implemented },
          { label: "Total votes", value: stats.votes },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card px-4 py-3.5">
            <p className="mono-label text-muted-foreground">{s.label}</p>
            <p className="mt-1 font-display text-2xl text-foreground">{s.value}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 flex flex-wrap items-center gap-2">
        <FilterPills
          value={impactFilter}
          onChange={setImpactFilter}
          options={[
            { id: "all", label: "All impact" },
            ...IDEA_IMPACTS.map((i) => ({ id: i.id, label: i.label })),
          ]}
        />
        <FilterPills
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { id: "all", label: "Any status" },
            ...IDEA_STATUSES.map((s) => ({ id: s, label: IDEA_STATUS_LABEL[s] })),
          ]}
        />
        <button
          onClick={() => setSort((s) => (s === "votes" ? "new" : "votes"))}
          className="mono-label ml-auto rounded-full border border-border px-3 py-2 text-muted-foreground hover:text-foreground"
        >
          Sort: {sort === "votes" ? "Most voted" : "Newest"}
        </button>
      </section>

      <section className="mt-5 space-y-3">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading ideas…</p>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
            <Lightbulb className="size-7 text-primary" />
            <p className="text-sm text-muted-foreground">No ideas match this view yet.</p>
          </div>
        ) : (
          rows.map((idea) => {
            const impact = impactInfo(idea.impact);
            const mine = idea.created_by && idea.created_by === userId;
            return (
              <motion.article
                key={idea.id}
                layout
                className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
              >
                <div className="flex flex-wrap items-start gap-4">
                  <button
                    onClick={() => void toggleVote(idea.id)}
                    className={cn(
                      "flex w-14 shrink-0 flex-col items-center gap-1 rounded-xl border px-2 py-2.5 transition-colors",
                      myVotes.has(idea.id)
                        ? "border-primary/60 bg-surface-raised text-primary"
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <ThumbsUp className="size-4" />
                    <span className="text-sm font-semibold">{votes[idea.id] ?? 0}</span>
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-foreground">{idea.title}</h2>
                      <span
                        className="mono-label rounded-full px-2 py-0.5"
                        style={{ background: `${impact.color}1f`, color: impact.color }}
                      >
                        {impact.label}
                      </span>
                      <span className="mono-label rounded-full bg-surface-raised px-2 py-0.5 text-muted-foreground">
                        {idea.category}
                      </span>
                    </div>
                    {idea.description ? (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                        {idea.description}
                      </p>
                    ) : null}
                    <p className="mono-label mt-2.5 text-muted-foreground/70">
                      {idea.author_name || idea.author_email || "Anonymous"} ·{" "}
                      {prettyDate(idea.created_at.slice(0, 10))}
                      {idea.estimated_saving ? ` · saves ${idea.estimated_saving}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={idea.status}
                      disabled={!canEdit && !mine}
                      onChange={(e) => void updateIdea(idea.id, { status: e.target.value })}
                      className="rounded-lg border border-border bg-surface-raised px-2.5 py-1.5 text-xs text-foreground outline-none disabled:opacity-50"
                    >
                      {IDEA_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {IDEA_STATUS_LABEL[s as IdeaStatus]}
                        </option>
                      ))}
                    </select>
                    {mine || canEdit ? (
                      <button
                        onClick={() => void deleteIdea(idea.id)}
                        aria-label={`Delete ${idea.title}`}
                        className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:text-danger"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
              </motion.article>
            );
          })
        )}
      </section>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/70 p-4 py-10 backdrop-blur-md"
            onClick={() => setOpen(false)}
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
                  <span className="mono-label text-primary">New idea</span>
                  <h2 className="mt-2 text-xl font-semibold text-foreground">Brain Wave</h2>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-surface-raised hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="Idea in one line"
                  className={field}
                />
                <textarea
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="How would it work, and what does it improve?"
                  rows={4}
                  className={field}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mono-label text-muted-foreground">Category</span>
                    <select
                      value={draft.category}
                      onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                      className={`${field} mt-1.5`}
                    >
                      {IDEA_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="mono-label text-muted-foreground">Impact</span>
                    <select
                      value={draft.impact}
                      onChange={(e) => setDraft({ ...draft, impact: e.target.value })}
                      className={`${field} mt-1.5`}
                    >
                      {IDEA_IMPACTS.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="block">
                  <span className="mono-label text-muted-foreground">Estimated saving</span>
                  <input
                    value={draft.estimated_saving}
                    onChange={(e) => setDraft({ ...draft, estimated_saving: e.target.value })}
                    placeholder="e.g. 4 hrs / week or AED 2,000 / month"
                    className={`${field} mt-1.5`}
                  />
                </label>
                <button
                  onClick={() => void submit()}
                  className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
                >
                  Post idea
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}

function FilterPills({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-full border border-border bg-card p-1">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "mono-label rounded-full px-3 py-1.5 transition-colors",
            value === o.id ? "bg-surface-raised text-primary" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
