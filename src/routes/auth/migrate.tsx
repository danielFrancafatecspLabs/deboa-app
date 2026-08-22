import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useDeBoa } from "@/hooks/useDeBoa";
import { useFinancialProfile } from "@/hooks/useFinancialProfile";
import {
  saveContextToServer,
  saveProfileToServer,
  saveHistoryToServer,
} from "@/lib/supabase/dataService";
import { Sparkles, Upload } from "lucide-react";

export const Route = createFileRoute("/auth/migrate")({
  component: MigratePage,
});

function MigratePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { context, history } = useDeBoa();
  const { profile, hasProfile } = useFinancialProfile();
  const [migrating, setMigrating] = useState(false);
  const [done, setDone] = useState(false);
  const [hasLocalData, setHasLocalData] = useState(false);

  useEffect(() => {
    // Check if there's local data worth migrating
    const ctxRaw = localStorage.getItem("deboa.context");
    const histRaw = localStorage.getItem("deboa.history");
    const profRaw = localStorage.getItem("deboa.financialProfile");
    setHasLocalData(!!(ctxRaw || histRaw || profRaw));
  }, []);

  const handleMigrate = async () => {
    if (!user) return;
    setMigrating(true);

    try {
      const promises: Promise<void>[] = [];

      // Only save if data differs from defaults
      const DEFAULT_CONTEXT = { monthlyIncome: 5000, availableBalance: 2800, monthlyGoal: 1500, upcomingCommitments: 1400 };
      const isDefaultCtx = JSON.stringify(context) === JSON.stringify(DEFAULT_CONTEXT);
      if (!isDefaultCtx) {
        promises.push(saveContextToServer(user.id, context));
      }

      if (hasProfile) {
        promises.push(saveProfileToServer(user.id, profile));
      }

      if (history.length > 0) {
        promises.push(saveHistoryToServer(user.id, history));
      }

      await Promise.all(promises);
      setDone(true);
    } catch (err) {
      console.error("Migration failed:", err);
    } finally {
      setMigrating(false);
    }
  };

  const handleSkip = () => {
    router.navigate({ to: "/" });
  };

  if (!user) {
    router.navigate({ to: "/login" });
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
          <Sparkles className="h-7 w-7 text-primary-foreground" />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">Bem-vindo ao DeBoa!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Olá, {user.email}
        </p>

        {done ? (
          <>
            <div className="mt-8 rounded-xl bg-emerald-50 px-4 py-6">
              <Upload className="mx-auto mb-3 h-8 w-8 text-emerald-600" />
              <p className="text-sm font-medium text-emerald-700">
                Dados sincronizados com sucesso!
              </p>
              <p className="mt-1 text-xs text-emerald-600">
                Seus dados estão salvos na nuvem e disponíveis em qualquer dispositivo.
              </p>
            </div>
            <button
              onClick={() => router.navigate({ to: "/" })}
              className="mt-6 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
            >
              Começar
            </button>
          </>
        ) : hasLocalData ? (
          <>
            <div className="mt-8 rounded-xl bg-amber-50 px-4 py-6">
              <Upload className="mx-auto mb-3 h-8 w-8 text-amber-600" />
              <p className="text-sm font-medium text-amber-800">
                Dados locais encontrados
              </p>
              <p className="mt-1 text-xs text-amber-700">
                Encontramos dados salvos no seu navegador. Deseja migrá-los para
                sua conta para ficarem disponíveis em qualquer dispositivo?
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={handleMigrate}
                disabled={migrating}
                className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {migrating ? "Migrando..." : "Sim, migrar meus dados"}
              </button>
              <button
                onClick={handleSkip}
                disabled={migrating}
                className="w-full rounded-xl border border-input bg-background py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                Começar do zero
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mt-8 rounded-xl bg-muted px-4 py-6">
              <p className="text-sm text-muted-foreground">
                Sua conta está pronta! Seus dados serão salvos na nuvem
                automaticamente.
              </p>
            </div>
            <button
              onClick={() => router.navigate({ to: "/" })}
              className="mt-6 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
            >
              Começar
            </button>
          </>
        )}
      </div>
    </div>
  );
}