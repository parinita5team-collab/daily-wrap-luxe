import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const IDEA_CATEGORIES = ["Process", "Tooling", "Client", "Production", "Finance", "Culture"] as const;
export const IDEA_IMPACTS = [
  { id: "time", label: "Saves time", color: "#E8B84B" },
  { id: "money", label: "Saves money", color: "#2FEA6A" },
  { id: "effort", label: "Saves effort", color: "#6AA9FF" },
] as const;
export const IDEA_STATUSES = ["new", "reviewing", "approved", "implemented", "parked"] as const;
export type IdeaStatus = (typeof IDEA_STATUSES)[number];

export const IDEA_STATUS_LABEL: Record<IdeaStatus, string> = {
  new: "New",
  reviewing: "Under review",
  approved: "Approved",
  implemented: "Implemented",
  parked: "Parked",
};

export function impactInfo(id: string) {
  return IDEA_IMPACTS.find((i) => i.id === id) ?? IDEA_IMPACTS[0];
}

export interface Idea {
  id: string;
  company_id: string;
  title: string;
  description: string;
  category: string;
  impact: string;
  estimated_saving: string;
  status: string;
  author_name: string;
  author_email: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface IdeaDraft {
  title: string;
  description: string;
  category: string;
  impact: string;
  estimated_saving: string;
  status: string;
}

const SELECT =
  "id, company_id, title, description, category, impact, estimated_saving, status, author_name, author_email, created_by, created_at, updated_at";

export function useIdeas(companyId: string | null, department: string | null) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [myVotes, setMyVotes] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!companyId || !department) {
      setIdeas([]);
      setLoading(false);
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id ?? null;
    setUserId(uid);

    const { data } = await supabase
      .from("ideas")
      .select(SELECT)
      .eq("company_id", companyId)
      .eq("department", department)
      .order("created_at", { ascending: false });
    const rows = (data ?? []) as Idea[];
    setIdeas(rows);

    const ids = rows.map((r) => r.id);
    if (ids.length) {
      const { data: voteRows } = await supabase
        .from("idea_votes")
        .select("idea_id, user_id")
        .in("idea_id", ids);
      const counts: Record<string, number> = {};
      const mine = new Set<string>();
      for (const v of voteRows ?? []) {
        counts[v.idea_id] = (counts[v.idea_id] ?? 0) + 1;
        if (uid && v.user_id === uid) mine.add(v.idea_id);
      }
      setVotes(counts);
      setMyVotes(mine);
    } else {
      setVotes({});
      setMyVotes(new Set());
    }
    setLoading(false);
  }, [companyId, department]);

  useEffect(() => {
    setLoading(true);
    void refresh();
  }, [refresh]);

  const addIdea = useCallback(
    async (draft: IdeaDraft) => {
      if (!companyId || !department) return;
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      await supabase.from("ideas").insert({
        ...draft,
        company_id: companyId,
        department,
        created_by: user?.id ?? null,
        author_email: user?.email ?? "",
        author_name: (user?.email ?? "").split("@")[0] ?? "",
      });
      await refresh();
    },
    [companyId, department, refresh],
  );

  const updateIdea = useCallback(
    async (id: string, patch: Partial<IdeaDraft>) => {
      await supabase.from("ideas").update(patch).eq("id", id);
      await refresh();
    },
    [refresh],
  );

  const deleteIdea = useCallback(
    async (id: string) => {
      await supabase.from("ideas").delete().eq("id", id);
      await refresh();
    },
    [refresh],
  );

  const toggleVote = useCallback(
    async (id: string) => {
      if (!userId) return;
      if (myVotes.has(id)) {
        await supabase.from("idea_votes").delete().eq("idea_id", id).eq("user_id", userId);
      } else {
        await supabase.from("idea_votes").insert({ idea_id: id, user_id: userId });
      }
      await refresh();
    },
    [myVotes, refresh, userId],
  );

  return { ideas, votes, myVotes, userId, loading, addIdea, updateIdea, deleteIdea, toggleVote, refresh };
}
