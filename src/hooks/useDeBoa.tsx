import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_CONTEXT, SEED_HISTORY } from "@/data/seed";
import type { DecisionRecord, UserContext } from "@/services/types";
import { supabase } from "@/lib/supabase/client";
import {
  saveContextToServer,
  loadContextFromServer,
  saveHistoryToServer,
  loadHistoryFromServer,
} from "@/lib/supabase/dataService";

const CTX_KEY = "deboa.context";
const HISTORY_KEY = "deboa.history";

type Store = {
  hydrated: boolean;
  context: UserContext;
  history: DecisionRecord[];
  updateContext: (patch: Partial<UserContext>) => void;
  resetContext: () => void;
  addDecision: (record: DecisionRecord) => void;
  rateDecision: (id: string, helpful: boolean) => void;
};

const DeBoaContext = createContext<Store | null>(null);

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function DeBoaProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [context, setContext] = useState<UserContext>(DEFAULT_CONTEXT);
  const [history, setHistory] = useState<DecisionRecord[]>(SEED_HISTORY);
  const userIdRef = useRef<string | null>(null);

  // ── Listen for auth changes to load/sync data ─────────────────────────
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const uid = session?.user?.id ?? null;
      userIdRef.current = uid;

      if (uid && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
        // User just signed in — try to load server data
        try {
          const [serverCtx, serverHistory] = await Promise.all([
            loadContextFromServer(uid),
            loadHistoryFromServer(uid),
          ]);
          if (serverCtx) {
            setContext(serverCtx);
            write(CTX_KEY, serverCtx);
          }
          if (serverHistory.length > 0) {
            setHistory(serverHistory);
            write(HISTORY_KEY, serverHistory);
          }
        } catch (err) {
          console.error("Failed to load server data:", err);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Hydrate from localStorage on mount ────────────────────────────────
  useEffect(() => {
    setContext(read(CTX_KEY, DEFAULT_CONTEXT));
    setHistory(read(HISTORY_KEY, SEED_HISTORY));
    setHydrated(true);
  }, []);

  // ── Sync to server ────────────────────────────────────────────────────
  const syncContext = useCallback(async (ctx: UserContext) => {
    const uid = userIdRef.current;
    if (!uid) return;
    try {
      await saveContextToServer(uid, ctx);
    } catch (err) {
      console.error("Failed to sync context:", err);
    }
  }, []);

  const syncHistory = useCallback(async (hist: DecisionRecord[]) => {
    const uid = userIdRef.current;
    if (!uid) return;
    try {
      await saveHistoryToServer(uid, hist);
    } catch (err) {
      console.error("Failed to sync history:", err);
    }
  }, []);

  const updateContext = useCallback(
    (patch: Partial<UserContext>) => {
      setContext((prev) => {
        const next = { ...prev, ...patch };
        write(CTX_KEY, next);
        syncContext(next);
        return next;
      });
    },
    [syncContext],
  );

  const resetContext = useCallback(() => {
    setContext(DEFAULT_CONTEXT);
    write(CTX_KEY, DEFAULT_CONTEXT);
    syncContext(DEFAULT_CONTEXT);
  }, [syncContext]);

  const addDecision = useCallback(
    (record: DecisionRecord) => {
      setHistory((prev) => {
        const next = [record, ...prev];
        write(HISTORY_KEY, next);
        syncHistory(next);
        return next;
      });
    },
    [syncHistory],
  );

  const rateDecision = useCallback(
    (id: string, helpful: boolean) => {
      setHistory((prev) => {
        const next = prev.map((d) => (d.id === id ? { ...d, helpful } : d));
        write(HISTORY_KEY, next);
        syncHistory(next);
        return next;
      });
    },
    [syncHistory],
  );

  const value = useMemo(
    () => ({
      hydrated,
      context,
      history,
      updateContext,
      resetContext,
      addDecision,
      rateDecision,
    }),
    [hydrated, context, history, updateContext, resetContext, addDecision, rateDecision],
  );

  return <DeBoaContext.Provider value={value}>{children}</DeBoaContext.Provider>;
}

export function useDeBoa() {
  const ctx = useContext(DeBoaContext);
  if (!ctx) throw new Error("useDeBoa must be used inside DeBoaProvider");
  return ctx;
}
