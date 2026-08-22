import { supabase } from "./client";
import type { FinancialProfile } from "@/services/financeTypes";
import type { UserContext, DecisionRecord } from "@/services/types";

// ── Financial Profile ───────────────────────────────────────────────────

export async function saveProfileToServer(
  userId: string,
  profile: FinancialProfile,
): Promise<void> {
  const { error } = await supabase.from("financial_profiles").upsert(
    {
      user_id: userId,
      profile,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

export async function loadProfileFromServer(
  userId: string,
): Promise<FinancialProfile | null> {
  const { data, error } = await supabase
    .from("financial_profiles")
    .select("profile")
    .eq("user_id", userId)
    .single();
  if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
  return data?.profile ?? null;
}

// ── User Context ────────────────────────────────────────────────────────

export async function saveContextToServer(
  userId: string,
  context: UserContext,
): Promise<void> {
  const { error } = await supabase.from("user_contexts").upsert(
    {
      user_id: userId,
      context,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

export async function loadContextFromServer(
  userId: string,
): Promise<UserContext | null> {
  const { data, error } = await supabase
    .from("user_contexts")
    .select("context")
    .eq("user_id", userId)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data?.context ?? null;
}

// ── Decision History ────────────────────────────────────────────────────

export async function saveHistoryToServer(
  userId: string,
  history: DecisionRecord[],
): Promise<void> {
  // Replace all records for this user in a single transaction
  const { error: delError } = await supabase
    .from("decision_history")
    .delete()
    .eq("user_id", userId);
  if (delError) throw delError;

  if (history.length === 0) return;

  const rows = history.map((record) => ({
    user_id: userId,
    record,
  }));

  const { error: insError } = await supabase.from("decision_history").insert(rows);
  if (insError) throw insError;
}

export async function loadHistoryFromServer(
  userId: string,
): Promise<DecisionRecord[]> {
  const { data, error } = await supabase
    .from("decision_history")
    .select("record")
    .eq("user_id", userId)
    .order("record->>createdAt", { ascending: false });
  if (error) throw error;
  return data?.map((r) => r.record as DecisionRecord) ?? [];
}