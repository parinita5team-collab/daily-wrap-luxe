import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanies } from "@/lib/companies/context";

export type CompanyRole = "admin" | "editor" | "viewer";

export const ROLES: { id: CompanyRole; label: string; blurb: string }[] = [
  { id: "viewer", label: "User", blurb: "View trackers, add Brain Wave ideas" },
  { id: "editor", label: "Editor", blurb: "Can also log and edit tracker data" },
  { id: "admin", label: "Admin", blurb: "Full control, manages members" },
];

/** Permanent admins live in the app_admins table; only they can read it. */
export function useAppAdmin() {
  const [isAppAdmin, setIsAppAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const mail = (userData.user?.email ?? "").toLowerCase();
      if (!mail) {
        if (active) {
          setIsAppAdmin(false);
          setLoading(false);
        }
        return;
      }
      const { data } = await supabase.from("app_admins").select("email").eq("email", mail).maybeSingle();
      if (active) {
        setIsAppAdmin(Boolean(data));
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return { isAppAdmin, loading };
}

export interface CompanyMember {
  id: string;
  company_id: string;
  user_email: string;
  role: CompanyRole;
  department: string | null;
  created_at: string;
}

const SELECT = "id, company_id, user_email, role, department, created_at";

export function useCompanyMembers(companyId: string | null) {
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { isAppAdmin } = useAppAdmin();

  const refresh = useCallback(async () => {
    if (!companyId) {
      setMembers([]);
      setLoading(false);
      return;
    }
    const [{ data }, { data: userData }] = await Promise.all([
      supabase.from("company_members").select(SELECT).eq("company_id", companyId).order("created_at"),
      supabase.auth.getUser(),
    ]);
    setMembers((data ?? []) as CompanyMember[]);
    setEmail((userData.user?.email ?? "").toLowerCase());
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    setLoading(true);
    void refresh();
  }, [refresh]);

  const myRole: CompanyRole | null =
    members.find((m) => m.user_email.toLowerCase() === email)?.role ?? null;
  // Permanent admins (app_admins table) always have full control; everyone
  // else is view-only until an admin grants them editor or admin rights.
  const isAdmin = isAppAdmin || myRole === "admin";
  const canEdit = isAdmin || myRole === "editor";

  const addMember = useCallback(
    async (newEmail: string, role: CompanyRole, department: string) => {
      if (!companyId) return;
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("company_members").insert({
        company_id: companyId,
        user_email: newEmail.trim().toLowerCase(),
        role,
        department,
        invited_by: userData.user?.id ?? null,
      });
      await refresh();
      if (error) throw error;
    },
    [companyId, refresh],
  );

  const setRole = useCallback(
    async (id: string, role: CompanyRole) => {
      await supabase.from("company_members").update({ role }).eq("id", id);
      await refresh();
    },
    [refresh],
  );

  const setDepartment = useCallback(
    async (id: string, department: string) => {
      await supabase.from("company_members").update({ department }).eq("id", id);
      await refresh();
    },
    [refresh],
  );

  const removeMember = useCallback(
    async (id: string) => {
      await supabase.from("company_members").delete().eq("id", id);
      await refresh();
    },
    [refresh],
  );

  return {
    members,
    loading,
    myRole,
    isAppAdmin,
    isAdmin,
    canEdit,
    email,
    addMember,
    setRole,
    setDepartment,
    removeMember,
    refresh,
  };
}

/** Only these two mailboxes may add or remove super admins. */
export const SUPER_OWNERS = ["pranita@5team.me", "pranita@supremeuae.me"];

export interface SuperAdmin {
  email: string;
  created_at: string;
}

/** Super admin (app_admins) registry, editable only by the two owners. */
export function useSuperAdmins(active: boolean) {
  const [admins, setAdmins] = useState<SuperAdmin[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!active) return;
    const [{ data }, { data: userData }] = await Promise.all([
      supabase.from("app_admins").select("email, created_at").order("created_at"),
      supabase.auth.getUser(),
    ]);
    setAdmins((data ?? []) as SuperAdmin[]);
    setEmail((userData.user?.email ?? "").toLowerCase());
    setLoading(false);
  }, [active]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const isOwner = SUPER_OWNERS.includes(email);

  const addAdmin = useCallback(
    async (newEmail: string) => {
      const { error } = await supabase
        .from("app_admins")
        .insert({ email: newEmail.trim().toLowerCase() });
      await refresh();
      if (error) throw error;
    },
    [refresh],
  );

  const removeAdmin = useCallback(
    async (target: string) => {
      const { error } = await supabase.from("app_admins").delete().eq("email", target);
      await refresh();
      if (error) throw error;
    },
    [refresh],
  );

  return { admins, loading, isOwner, email, addAdmin, removeAdmin };
}

/** Edit rights for the currently selected company. */
export function useCanEdit() {
  const { company } = useCompanies();
  const { canEdit, isAdmin, myRole, isAppAdmin } = useCompanyMembers(company?.id ?? null);
  return { canEdit, isAdmin, myRole, isAppAdmin };
}
