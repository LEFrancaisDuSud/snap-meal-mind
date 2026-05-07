import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { NSUser } from "@/types/db";

export function useNSUser() {
  const { user } = useAuth();
  const [data, setData] = useState<NSUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setData(null); setLoading(false); return; }
    const { data: row, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (error) console.error("useNSUser", error);
    setData((row as NSUser | null) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => { setLoading(true); refresh(); }, [refresh]);

  const update = useCallback(async (patch: Partial<NSUser>) => {
    if (!user) return { error: new Error("not signed in") };
    const { error } = await supabase.from("users").update(patch as any).eq("id", user.id);
    if (!error) await refresh();
    return { error };
  }, [user, refresh]);

  return { user: data, loading, refresh, update };
}
