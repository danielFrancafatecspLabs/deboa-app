import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { EMPTY_PROFILE } from "@/data/financeSeed";
import type { FinancialProfile, Pact } from "@/services/financeTypes";
import { supabase } from "@/lib/supabase/client";
import {
  saveProfileToServer,
  loadProfileFromServer,
} from "@/lib/supabase/dataService";

const KEY = "deboa.financialProfile";

type Store = {
  hydrated: boolean;
  profile: FinancialProfile;
  update: (patch: Partial<FinancialProfile>) => void;
  addPact: (pact: Pact) => void;
  removePact: (id: string) => void;
  clearProfile: () => void;
  hasProfile: boolean;
};

const Ctx = createContext<Store | null>(null);

export function FinancialProfileProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [profile, setProfile] = useState<FinancialProfile>(EMPTY_PROFILE);

  // ── Listen for auth changes to load/sync data ─────────────────────────
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const uid = session?.user?.id ?? null;
      if (uid && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
        try {
          const serverProfile = await loadProfileFromServer(uid);
          if (serverProfile) {
            setProfile(serverProfile);
            try {
              window.localStorage.setItem(KEY, JSON.stringify(serverProfile));
            } catch {
              /* ignore */
            }
          }
        } catch (err) {
          console.error("Failed to load financial profile from server:", err);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Hydrate from localStorage on mount ────────────────────────────────
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setProfile({ ...EMPTY_PROFILE, ...(JSON.parse(raw) as FinancialProfile) });
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const persist = useCallback((next: FinancialProfile) => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const syncProfile = useCallback(async (next: FinancialProfile) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const uid = session?.user?.id;
    if (!uid) return;
    try {
      await saveProfileToServer(uid, next);
    } catch (err) {
      console.error("Failed to sync financial profile:", err);
    }
  }, []);

  const update = useCallback(
    (patch: Partial<FinancialProfile>) => {
      setProfile((prev) => {
        const next: FinancialProfile = {
          ...prev,
          ...patch,
          createdAt:
            prev.createdAt === new Date(0).toISOString()
              ? new Date().toISOString()
              : prev.createdAt,
          updatedAt: new Date().toISOString(),
        };
        persist(next);
        syncProfile(next);
        return next;
      });
    },
    [persist, syncProfile],
  );

  const addPact = useCallback(
    (pact: Pact) => {
      setProfile((prev) => {
        if (prev.pacts.some((p) => p.id === pact.id)) return prev;
        const next = {
          ...prev,
          pacts: [pact, ...prev.pacts],
          updatedAt: new Date().toISOString(),
        };
        persist(next);
        syncProfile(next);
        return next;
      });
    },
    [persist, syncProfile],
  );

  const removePact = useCallback(
    (id: string) => {
      setProfile((prev) => {
        const next = { ...prev, pacts: prev.pacts.filter((p) => p.id !== id) };
        persist(next);
        syncProfile(next);
        return next;
      });
    },
    [persist, syncProfile],
  );

  const clearProfile = useCallback(() => {
    setProfile(EMPTY_PROFILE);
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    // Also clear from server
    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id;
      if (uid) {
        supabase.from("financial_profiles").delete().eq("user_id", uid).then(() => {});
      }
    });
  }, []);

  const value = useMemo(
    () => ({
      hydrated,
      profile,
      update,
      addPact,
      removePact,
      clearProfile,
      hasProfile: profile.completed || profile.netIncome > 0,
    }),
    [hydrated, profile, update, addPact, removePact, clearProfile],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFinancialProfile() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFinancialProfile must be used inside FinancialProfileProvider");
  return ctx;
}
