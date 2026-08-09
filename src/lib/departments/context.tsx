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
import { useCompanies } from "@/lib/companies/context";
import { useAppAdmin } from "@/lib/access/roles";

export interface Department {
  id: string;
  label: string;
  blurb: string;
}

export const DEPARTMENTS: Department[] = [
  { id: "creative", label: "Creative", blurb: "Design, content and brand output" },
  { id: "marketing", label: "Marketing", blurb: "Campaigns, channels and growth" },
  { id: "accounts", label: "Accounts", blurb: "Finance, invoicing and payables" },
  { id: "production", label: "Production", blurb: "Shoots, events and delivery" },
  { id: "procurement", label: "Procurement", blurb: "Vendors, sourcing and supply" },
  { id: "hr_admin", label: "HR / Admin", blurb: "People, hiring and office ops" },
];

export function departmentLabel(id: string | null | undefined) {
  return DEPARTMENTS.find((d) => d.id === id)?.label ?? "—";
}

const STORAGE_KEY = "tracker.department";

interface Ctx {
  /** Departments this user may open (all six for admins). */
  departments: Department[];
  department: string | null;
  loading: boolean;
  isAdmin: boolean;
  selectDepartment: (id: string | null) => void;
}

const DepartmentContext = createContext<Ctx | null>(null);

export function DepartmentProvider({ children }: { children: ReactNode }) {
  const { company } = useCompanies();
  const { isAppAdmin, loading: adminLoading } = useAppAdmin();
  const [mine, setMine] = useState<string | null>(null);
  const [memberLoading, setMemberLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored) setSelected(stored);
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      setMemberLoading(true);
      if (!company) {
        if (active) {
          setMine(null);
          setMemberLoading(false);
        }
        return;
      }
      const { data: userData } = await supabase.auth.getUser();
      const mail = (userData.user?.email ?? "").toLowerCase();
      const { data } = await supabase
        .from("company_members")
        .select("department")
        .eq("company_id", company.id)
        .ilike("user_email", mail)
        .maybeSingle();
      if (active) {
        setMine((data?.department as string | null) ?? null);
        setMemberLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [company]);

  const loading = adminLoading || memberLoading;

  const departments = useMemo(
    () => (isAppAdmin ? DEPARTMENTS : DEPARTMENTS.filter((d) => d.id === mine)),
    [isAppAdmin, mine],
  );

  const department = useMemo(() => {
    if (loading) return null;
    if (selected && departments.some((d) => d.id === selected)) return selected;
    if (!isAppAdmin) return departments[0]?.id ?? null;
    return null;
  }, [departments, isAppAdmin, loading, selected]);

  const selectDepartment = useCallback((id: string | null) => {
    setSelected(id);
    if (typeof window === "undefined") return;
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value: Ctx = {
    departments,
    department,
    loading,
    isAdmin: isAppAdmin,
    selectDepartment,
  };

  return <DepartmentContext.Provider value={value}>{children}</DepartmentContext.Provider>;
}

export function useDepartment() {
  const ctx = useContext(DepartmentContext);
  if (!ctx) throw new Error("useDepartment must be used inside DepartmentProvider");
  return ctx;
}
