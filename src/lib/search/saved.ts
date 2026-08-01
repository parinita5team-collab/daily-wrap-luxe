import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  trackers: string[];
  statuses: string[];
  date_from: string;
  date_to: string;
}

export type SavedSearchDraft = Omit<SavedSearch, "id">;

const SELECT = "id, name, query, trackers, statuses, date_from, date_to";

export function useSavedSearches(companyId: string | null) {
  const [searches, setSearches] = useState<SavedSearch[]>([]);

  const refresh = useCallback(async () => {
    if (!companyId) {
      setSearches([]);
      return;
    }
    const { data } = await supabase
      .from("saved_searches")
      .select(SELECT)
      .eq("company_id", companyId)
      .order("created_at", { ascending: true });
    setSearches((data ?? []) as SavedSearch[]);
  }, [companyId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = useCallback(
    async (draft: SavedSearchDraft) => {
      if (!companyId) return;
      const { data: userData } = await supabase.auth.getUser();
      await supabase
        .from("saved_searches")
        .insert({ ...draft, company_id: companyId, user_id: userData.user?.id ?? "" });
      await refresh();
    },
    [companyId, refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      await supabase.from("saved_searches").delete().eq("id", id);
      await refresh();
    },
    [refresh],
  );

  return { searches, save, remove, refresh };
}
