import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

type AuthStore = {
  /** Whether the initial session check has finished. */
  initialized: boolean;
  /** The current authenticated user, or null when signed out. */
  user: User | null;
  /** True while an auth operation is in flight. */
  loading: boolean;
  /** Sign in with email + password. */
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null; needsEmailConfirm?: boolean }>;
  /** Create a new account with email + password. */
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  /** Sign in through an OAuth provider. Navigates away from the app on success. */
  signInWithProvider: (provider: OAuthProvider) => Promise<{ error: AuthError | null }>;
  /** Sign out the current user. */
  signOut: () => Promise<void>;
  /** Send a password-reset email. */
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  /** Re-send the email confirmation link. */
  resendConfirmation: (email: string) => Promise<{ error: AuthError | null }>;
};

export type OAuthProvider = "google" | "apple";

/**
 * Absolute URL of the callback route.
 *
 * window.location.origin stops at the host, so on a GitHub Pages project site
 * it would send people to /auth/callback at the account root instead of
 * /deboa-app/auth/callback. BASE_URL carries the subpath the app was built
 * with, and is "/" everywhere else.
 */
function callbackUrl(query = ""): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}auth/callback${query}`;
}

const AuthContext = createContext<AuthStore | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // ── Restore session on mount ──────────────────────────────────────────
  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => setInitialized(true));

    // Listen for future auth changes (sign in / sign out across tabs)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);

      // On first sign in (OAuth or email), redirect to welcome
      // if user has no local data yet
      if (event === "SIGNED_IN") {
        const ctxRaw = localStorage.getItem("deboa.context");
        const histRaw = localStorage.getItem("deboa.history");
        const profRaw = localStorage.getItem("deboa.financialProfile");
        const hasLocalData = !!(ctxRaw || histRaw || profRaw);

        // Same subpath problem as callbackUrl: under /deboa-app/ the pathname
        // is prefixed, so comparing it against bare routes never matched and
        // the redirect fired from pages it should have skipped.
        const base = import.meta.env.BASE_URL;
        const path = window.location.pathname.slice(base.length - 1) || "/";
        if (
          !hasLocalData &&
          path !== "/welcome" &&
          path !== "/auth/migrate" &&
          path !== "/login"
        ) {
          window.location.href = `${base}welcome`;
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Auth actions ──────────────────────────────────────────────────────
  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    // Detecta se o email não foi confirmado
    const needsEmailConfirm =
      error?.message?.toLowerCase().includes("email not confirmed") ?? false;

    return { error, needsEmailConfirm };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    return { error };
  }, []);

  const signInWithProvider = useCallback(async (provider: OAuthProvider) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      // Without this, Supabase falls back to the project's Site URL and the
      // browser never reaches /auth/callback.
      options: { redirectTo: callbackUrl() },
    });
    // On success the browser leaves for the provider, so only release the
    // spinner when we are staying on this page.
    if (error) setLoading(false);
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: callbackUrl("?type=recovery"),
    });
    setLoading(false);
    return { error };
  }, []);

  const resendConfirmation = useCallback(async (email: string) => {
    setLoading(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setLoading(false);
    return { error };
  }, []);

  const value = useMemo(
    () => ({
      initialized,
      user,
      loading,
      signIn,
      signUp,
      signInWithProvider,
      signOut,
      resetPassword,
      resendConfirmation,
    }),
    [
      initialized,
      user,
      loading,
      signIn,
      signUp,
      signInWithProvider,
      signOut,
      resetPassword,
      resendConfirmation,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthStore {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}