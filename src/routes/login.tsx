import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase/client";
import { Sparkles, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const { signIn, signUp, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setNeedsConfirm(null);

    if (isSignUp) {
      const { error: err } = await signUp(email, password);
      if (err) {
        setError(err.message);
      } else {
        setSuccess("Conta criada! Verifique seu email para confirmar o cadastro.");
        setNeedsConfirm(email);
      }
    } else {
      const { error: err, needsEmailConfirm } = await signIn(email, password);
      if (err) {
        if (needsEmailConfirm) {
          setNeedsConfirm(email);
          setError("Este email ainda não foi confirmado. Clique no link que enviamos ou reenvie abaixo.");
        } else {
          setError(err.message);
        }
      } else {
        const ctxRaw = localStorage.getItem("deboa.context");
        const histRaw = localStorage.getItem("deboa.history");
        const profRaw = localStorage.getItem("deboa.financialProfile");
        const hasLocalData = !!(ctxRaw || histRaw || profRaw);

        if (!hasLocalData) {
          router.navigate({ to: "/welcome" });
        } else {
          router.navigate({ to: "/" });
        }
      }
    }
  };

  const handleResendConfirm = async () => {
    if (!needsConfirm) return;
    setError(null);
    const { error: err } = await supabase.auth.resend({ type: "signup", email: needsConfirm });
    if (err) {
      setError(err.message);
    } else {
      setSuccess("Email reenviado! Verifique sua caixa de entrada e spam.");
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError(null);
    setSuccess(null);
    setNeedsConfirm(null);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        {/* ── Header ── */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-accent to-accent/80 shadow-lift">
            <Sparkles className="h-8 w-8 text-accent-foreground" />
          </div>
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground">
            {isSignUp ? "Criar conta" : "Entrar"}
          </h1>
          <p className="mt-1.5 text-[15px] text-muted-foreground">
            {isSignUp
              ? "Crie sua conta para salvar seus dados"
              : "Bem-vindo de volta ao DeBoa"}
          </p>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-[13px] font-medium text-muted-foreground">
              Email
            </label>
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 transition-colors focus-within:border-accent/60">
              <Mail className="h-4 w-4 shrink-0 text-muted-foreground/60" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="min-h-13 w-full bg-transparent text-[16px] tracking-tight text-foreground outline-none placeholder:text-muted-foreground/50"
              />
            </div>
          </div>

          {/* Senha */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-[13px] font-medium text-muted-foreground">
              Senha
            </label>
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 transition-colors focus-within:border-accent/60">
              <Lock className="h-4 w-4 shrink-0 text-muted-foreground/60" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignUp ? "Mínimo 6 caracteres" : "Sua senha"}
                className="min-h-13 w-full bg-transparent text-[16px] tracking-tight text-foreground outline-none placeholder:text-muted-foreground/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="shrink-0 text-muted-foreground/60 hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Mensagens */}
          {error && (
            <div className="rounded-2xl bg-destructive/10 px-4 py-3.5 text-sm text-destructive border border-destructive/20">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-2xl bg-emerald-50/80 px-4 py-3.5 text-sm text-emerald-700 border border-emerald-200/50">
              {success}
            </div>
          )}

          {/* Botão de reenvio (quando email não confirmado) */}
          {needsConfirm && (
            <button
              type="button"
              onClick={handleResendConfirm}
              className="w-full rounded-2xl border border-accent/30 bg-accent/5 py-3 text-sm font-medium text-accent transition-all hover:bg-accent/10 active:scale-[0.985]"
            >
              Reenviar email de confirmação
            </button>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-[15px] font-medium text-primary-foreground shadow-soft transition-all hover:opacity-90 active:scale-[0.985] disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Aguarde..." : isSignUp ? "Criar conta" : "Entrar"}
          </button>
        </form>

        {/* ── Toggle sign in / sign up ── */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={toggleMode}
            className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
          >
            {isSignUp ? "Já tem conta? Faça login" : "Não tem conta? Cadastre-se"}
          </button>
        </div>

        {/* ── Divider ── */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-3 text-xs uppercase tracking-wider text-muted-foreground/60">
              ou continue com
            </span>
          </div>
        </div>

        {/* ── Social login ── */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })}
            className="flex items-center justify-center gap-2.5 rounded-2xl border border-border bg-surface px-4 py-3.5 text-[14px] font-medium text-foreground shadow-soft transition-all hover:bg-accent/5 active:scale-[0.985]"
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google
          </button>
          <button
            type="button"
            onClick={() => supabase.auth.signInWithOAuth({ provider: "apple" })}
            className="flex items-center justify-center gap-2.5 rounded-2xl border border-border bg-surface px-4 py-3.5 text-[14px] font-medium text-foreground shadow-soft transition-all hover:bg-accent/5 active:scale-[0.985]"
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            Apple
          </button>
        </div>

        {/* ── Footer ── */}
        <p className="mt-8 text-center text-xs text-muted-foreground/50">
          Ao continuar, você concorda com nossos Termos de Uso
        </p>
      </div>
    </div>
  );
}