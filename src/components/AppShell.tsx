import { Link, useRouter } from "@tanstack/react-router";
import { Compass, Home, LogOut, PiggyBank, User, Wallet } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

/**
 * A ordem é a do ciclo do dinheiro: você chega em Hoje, decide o mês no
 * Plano, vê o progresso nas Caixinhas, consulta em Decidir. Mapa e Histórico
 * saíram da barra — são leitura, não ação, e vivem dentro de Hoje e Perfil.
 */
const NAV = [
  { to: "/", label: "Hoje", icon: Home },
  { to: "/plano", label: "Plano", icon: Wallet },
  { to: "/caixinhas", label: "Caixinhas", icon: PiggyBank },
  { to: "/decidir", label: "Decidir", icon: Compass },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function AppShell({
  children,
  /**
   * Hides the tab bar. A guided flow should not offer five ways out of itself
   * on every screen — the exit belongs in the flow, as one deliberate choice.
   */
  focused = false,
}: {
  children: ReactNode;
  focused?: boolean;
}) {
  const { user, initialized } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar with auth status */}
      <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-end border-b border-border/50 bg-background/80 px-5 py-2 backdrop-blur-lg">
        {initialized && !user ? (
          <Link
            to="/login"
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
          >
            Entrar
          </Link>
        ) : initialized && user ? (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                {user.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <span className="max-w-[100px] truncate">{user.email}</span>
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-border bg-popover p-1 shadow-lg">
                  <button
                    onClick={async () => {
                      setMenuOpen(false);
                      const { supabase } = await import("@/lib/supabase/client");
                      await supabase.auth.signOut();
                      router.navigate({ to: "/login" });
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="h-8" /> /* spacer while loading */
        )}
      </div>

      <main className={cn("mx-auto w-full max-w-md px-5 pt-safe", focused ? "pb-16" : "pb-32")}>
        {/* Spacer for the top bar */}
        <div className="h-10" />
        {children}
      </main>

      {focused ? null : (
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-surface/85 backdrop-blur-xl">
        <div className="mx-auto grid w-full max-w-md grid-cols-5 px-1 pt-2 pb-safe">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="group flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-muted-foreground transition-colors data-[status=active]:text-foreground"
            >
              <Icon className="h-[22px] w-[22px]" strokeWidth={1.7} />
              <span className="text-[11px] font-medium tracking-tight">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
      )}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="animate-rise pt-6 pb-7">
      <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.03em]">{title}</h1>
      {subtitle ? (
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{subtitle}</p>
      ) : null}
    </header>
  );
}
