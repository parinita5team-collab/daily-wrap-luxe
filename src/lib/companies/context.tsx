import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Company {
  id: string;
  name: string;
  accent: string;
  sort_order: number;
}

const SELECT = "id, name, accent, sort_order";
const STORAGE_KEY = "tracker.company";

interface Ctx {
  companies: Company[];
  company: Company | null;
  loading: boolean;
  selectCompany: (id: string) => void;
  addCompany: (name: string, accent: string) => Promise<void>;
  updateCompany: (id: string, patch: Partial<Company>) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
}

const CompanyContext = createContext<Ctx | null>(null);

export function CompanyProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("companies")
      .select(SELECT)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (data) setCompanies(data as Company[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
    const channel = supabase
      .channel("companies-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "companies" }, () => {
        void refresh();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, refresh]);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored) setSelectedId(stored);
  }, []);

  const company = useMemo(
    () => companies.find((c) => c.id === selectedId) ?? companies[0] ?? null,
    [companies, selectedId],
  );

  const selectCompany = useCallback((id: string) => {
    setSelectedId(id);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const addCompany = useCallback(
    async (name: string, accent: string) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data } = await supabase
        .from("companies")
        .insert({
          name,
          accent,
          sort_order: companies.length + 1,
          created_by: userData.user?.id ?? null,
        })
        .select(SELECT)
        .single();
      if (data) selectCompany((data as Company).id);
      await refresh();
    },
    [companies.length, refresh, selectCompany],
  );

  const updateCompany = useCallback(
    async (id: string, patch: Partial<Company>) => {
      await supabase.from("companies").update(patch).eq("id", id);
      await refresh();
    },
    [refresh],
  );

  const deleteCompany = useCallback(
    async (id: string) => {
      await supabase.from("companies").delete().eq("id", id);
      if (selectedId === id) {
        setSelectedId(null);
        if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
      }
      await refresh();
    },
    [refresh, selectedId],
  );

  const value: Ctx = {
    companies,
    company,
    loading,
    selectCompany,
    addCompany,
    updateCompany,
    deleteCompany,
  };

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCompanies() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error("useCompanies must be used inside CompanyProvider");
  return ctx;
}

/** Readable foreground for a hex accent. */
export function accentForeground(hex: string) {
  const h = hex.replace("#", "");
  if (h.length !== 6) return "#14140f";
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.55 ? "#14140f" : "#FFFFFF";
}