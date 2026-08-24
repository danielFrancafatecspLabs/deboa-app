import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"processing" | "done" | "error">("processing");
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    // O provedor pode voltar com um erro no lugar do código.
    const params = new URLSearchParams(window.location.search);
    const providerError = params.get("error_description") ?? params.get("error");
    if (providerError) {
      setReason(providerError);
      setStatus("error");
      return;
    }

    let settled = false;
    const succeed = () => {
      if (settled) return;
      settled = true;
      setStatus("done");
      setTimeout(() => router.navigate({ to: "/" }), 1000);
    };

    // O cliente troca o ?code= por uma sessão de forma assíncrona. Consultar
    // getSession() direto perde essa corrida e mostra erro num login que deu
    // certo — por isso escutamos a mudança de estado também.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) succeed();
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) succeed();
    });

    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      setReason("A resposta demorou demais para chegar.");
      setStatus("error");
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
          <Sparkles className="h-7 w-7 text-primary-foreground" />
        </div>

        {status === "processing" && (
          <>
            <h1 className="text-xl font-semibold tracking-tight">Autenticando...</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Aguarde enquanto confirmamos seu login.
            </p>
          </>
        )}

        {status === "done" && (
          <>
            <h1 className="text-xl font-semibold tracking-tight">Autenticado!</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Redirecionando...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-xl font-semibold tracking-tight">Erro na autenticação</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {reason ?? "Não foi possível confirmar seu login. Tente novamente."}
            </p>
            <button
              onClick={() => router.navigate({ to: "/login" })}
              className="mt-6 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
            >
              Voltar ao login
            </button>
          </>
        )}
      </div>
    </div>
  );
}