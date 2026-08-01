import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CompanyRole = "admin" | "editor" | "viewer";

export const ROLES: { id: CompanyRole; label: string; blurb: string }[] = [
  { id: "admin", label: "Admin", blurb: "Full control, manages members" },
  { id: "editor", label: "Editor", blurb: "Can create and edit tracker data" },
  { id: "viewer", label: "Viewer", blurb: "Read-only across trackers" },
];

export interface CompanyMember {
  id: string;
  company_id: string;
  user_email: string;
  role: CompanyRole;
  created_at: string;
}

const SELECT = "id, company_id, user_email, role, created_at";

export function useCompanyMembers(companyId: string | null) {
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState(true);

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
  // Until a company has members, everyone signed in behaves as an admin so nobody is locked out.
  const unclaimed = members.length === 0;
  const isAdmin = unclaimed || myRole === "admin";
  const canEdit = unclaimed || myRole === "admin" || myRole === "editor";

  const addMember = useCallback(
    async (newEmail: string, role: CompanyRole) => {
      if (!companyId) return;
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("company_members").insert({
        company_id: companyId,
        user_email: newEmail.trim().toLowerCase(),
        role,
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

  const removeMember = useCallback(
    async (id: string) => {
      await supabase.from("company_members").delete().eq("id", id);
      await refresh();
    },
    [refresh],
  );

  return { members, loading, myRole, unclaimed, isAdmin, canEdit, email, addMember, setRole, removeMember, refresh };
}
