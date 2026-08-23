import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Sparkles, Mail, ArrowLeft, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/auth/confirm-email")({
  component: ConfirmEmailPage,
});

function ConfirmEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    if (!email) return;
    setSending(true);
    setError(null);

    const { error: err } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    setSending(false);

    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm text-center">
        {/* Ícone */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
          <Mail className="h-7 w-7 text-accent" />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">Confirme seu email</h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Enviamos um link de confirmação para <strong className="text-foreground">{email || "seu email"}</strong>.
          Clique no link para ativar sua conta.
        </p>

        {sent && (
          <div className="mt-6 rounded-2xl bg-emerald-50/80 px-4 py-4 text-sm text-emerald-700 border border-emerald-200/50">
            ✉️ Link reenviado! Verifique sua caixa de entrada e spam.
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl bg-destructive/10 px-4 py-4 text-sm text-destructive border border-destructive/20">
            {error}
          </div>
        )}

        {/* Input para reenviar */}
        <div className="mt-8 space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="w-full rounded-2xl border border-input bg-surface px-4 py-3.5 text-[16px] text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-accent/60 transition-colors"
          />

          <button
            onClick={handleResend}
            disabled={sending || !email}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-3.5 text-[15px] font-medium text-accent-foreground transition-all active:scale-[0.985] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${sending ? "animate-spin" : ""}`} />
            {sending ? "Enviando..." : "Reenviar email de confirmação"}
          </button>
        </div>

        {/* Dicas */}
        <div className="mt-8 space-y-2 text-xs text-muted-foreground">
          <p>📬 Verifique também a caixa de <strong>spam</strong></p>
          <p>⏱ O link expira em 24 horas</p>
        </div>

        {/* Voltar */}
        <button
          onClick={() => router.navigate({ to: "/login" })}
          className="mt-8 flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao login
        </button>
      </div>
    </div>
  );
}