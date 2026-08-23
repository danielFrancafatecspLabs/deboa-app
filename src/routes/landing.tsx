import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { ArrowRight, Loader2, Check, Brain, Zap, Shield, Sparkles } from "lucide-react";
import { submitWaitlist } from "./api/-waitlist";

export const Route = createFileRoute("/landing")({
  head: () => ({
    meta: [
      { title: "DeBoa — Seu momento de pausa antes de decidir." },
      {
        name: "description",
        content:
          "Antes de comprar, DeBoa. Um agente pessoal que cria um momento de pausa entre o desejo e a decisão de compra.",
      },
      { property: "og:title", content: "DeBoa — Seu momento de pausa antes de decidir." },
      {
        property: "og:description",
        content: "Antes de comprar, DeBoa. Um agente pessoal que cria um momento de pausa entre o desejo e a decisão de compra.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "DeBoa — Seu momento de pausa antes de decidir." },
      { name: "twitter:description", content: "Antes de comprar, DeBoa. Um agente pessoal que cria um momento de pausa entre o desejo e a decisão de compra." },
      { name: "robots", content: "index, follow" },
      { name: "canonical", content: "https://debboa.app/landing" },
    ],
    links: [
      { rel: "canonical", href: "https://debboa.app/landing" },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
    ],
  }),
  component: LandingPage,
});

/* ─── Utilitários ─── */

function track(event: string, data?: Record<string, unknown>) {
  try {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", event, data);
    }
  } catch { /* ignore */ }
}

function getUtmParams(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    const val = params.get(key);
    if (val) utm[key] = val;
  }
  return utm;
}

/* ─── Componente principal ─── */

function LandingPage() {
  const router = useRouter();
  const [formState, setFormState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    track("page_view", { page: "landing" });
  }, []);

  const scrollToForm = () => {
    track("hero_cta_click");
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    track("form_started");

    if (!name.trim() || !email.trim()) {
      setErrorMsg("Preencha nome e email.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Email inválido.");
      return;
    }

    setFormState("loading");

    try {
      const utm = getUtmParams();
      const result = await submitWaitlist({
        data: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: "",
          purchasePain: "",
          source: utm.utm_source || "direct",
          campaign: utm.utm_campaign || "",
        },
      });

      if (result.error) {
        throw new Error(result.error);
      }

      track("form_completed");
      setFormState("success");
    } catch (err: any) {
      track("form_error", { error: err.message });
      setErrorMsg(err.message || "Erro ao cadastrar. Tente novamente.");
      setFormState("error");
    }
  };

  /* ─── Tela de sucesso ─── */
  if (formState === "success") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-6">
        <div className="mx-auto w-full max-w-sm text-center">
          <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full border border-white/10">
            <Check className="h-6 w-6 text-[#f97316]" />
          </div>
          <h1 className="text-[32px] font-light leading-tight tracking-[-0.03em] text-white">
            Você está dentro
          </h1>
          <p className="mt-4 text-[16px] leading-relaxed text-white/35">
            Quando o DeBoa estiver pronto, você vai saber.
          </p>
          <button
            onClick={() => router.navigate({ to: "/" })}
            className="mt-10 inline-flex items-center gap-2 border-b border-white/20 px-1 pb-1 text-[14px] text-white/50 transition-all hover:text-white/80 hover:border-white/40"
          >
            Conhecer o DeBoa
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#f97316]/30">
      {/* ─── NAVBAR ─── */}
      <nav className="fixed inset-x-0 top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-10">
          <div className="flex items-center gap-12">
            <span className="text-[20px] font-semibold tracking-tight text-white">DeBoa<span className="text-[#f97316]">.</span></span>
            <div className="hidden items-center gap-8 md:flex">
              <a href="#como-funciona" className="text-[14px] text-white/40 transition-colors hover:text-white/80">Como funciona</a>
              <a href="#diferencial" className="text-[14px] text-white/40 transition-colors hover:text-white/80">Diferencial</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={scrollToForm}
              className="rounded-full bg-white px-6 py-2.5 text-[14px] font-medium text-black transition-all hover:bg-white/90"
            >
              Lista de espera
            </button>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_oklch(0.58_0.16_34_/_0.08),_transparent_60%)]" />
        <div className="pointer-events-none absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-[#f97316]/3 blur-3xl" />
        <div className="mx-auto w-full max-w-7xl px-6 pt-32 pb-24 sm:px-10 sm:pt-40 sm:pb-32">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div className="relative z-10">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#f97316]" />
                <span className="text-[12px] font-medium text-white/40 tracking-wide">Antes de comprar, DeBoa</span>
              </div>
              <h1 className="text-[56px] font-bold leading-[1.04] tracking-[-0.03em] text-white sm:text-[72px] md:text-[88px]">
                Seu momento de <br />
                <span className="text-[#f97316]">pausa</span>
                <br />
                antes de decidir
              </h1>
              <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-white/30 sm:text-[19px]">
                Um agente pessoal que cria um momento de pausa entre o desejo e a decisão de compra. Análise financeira inteligente para você entender o impacto real antes de comprar.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <button
                  onClick={scrollToForm}
                  className="group flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-[15px] font-semibold text-black transition-all hover:bg-white/90 hover:gap-3"
                >
                  Entrar na lista de espera
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
                <a
                  href="#como-funciona"
                  className="flex items-center justify-center gap-2 rounded-full border border-white/15 px-8 py-4 text-[15px] text-white/50 transition-all hover:border-white/30 hover:text-white/80"
                >
                  Como funciona
                </a>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="relative mx-auto h-[500px] w-[500px]">
                <div className="absolute inset-0 rounded-full border border-white/[0.06]" />
                <div className="absolute inset-8 rounded-full border border-white/[0.04]" />
                <div className="absolute inset-16 rounded-full border border-white/[0.03]" />
                <div className="absolute inset-24 rounded-full bg-[radial-gradient(ellipse_at_center,_oklch(0.58_0.16_34_/_0.06),_transparent_60%)]" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/10">
                    <Brain className="h-10 w-10 text-[#f97316]" />
                  </div>
                  <p className="mt-4 text-[13px] text-white/25 font-mono">pause()</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── COMO FUNCIONA ─── */}
      <section id="como-funciona" className="px-6 py-24 sm:px-10 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center text-center">
            <span className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/20">Processo</span>
            <h2 className="mt-4 max-w-2xl text-[40px] font-bold leading-[1.1] tracking-[-0.02em] text-white sm:text-[52px]">
              Como funciona
            </h2>
            <p className="mt-4 max-w-lg text-[16px] leading-relaxed text-white/30">
              Em quatro passos simples, o DeBoa te ajuda a comprar com mais consciência.
            </p>
          </div>

          <div className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { num: "01", icon: Zap, title: "Você quer comprar", desc: "Encontrou algo que despertou seu interesse. Um produto, um serviço, uma oportunidade." },
              { num: "02", icon: Brain, title: "DeBoa entra em cena", desc: "O aplicativo cria um momento de pausa. Uma análise rápida do seu contexto financeiro e da compra em si." },
              { num: "03", icon: Shield, title: "Você entende melhor", desc: "O DeBoa te mostra o impacto, os motivos para pensar duas vezes — ou para seguir tranquilo." },
              { num: "04", icon: Sparkles, title: "Você decide", desc: "A decisão continua sendo sua. O DeBoa só te ajuda a enxergar melhor antes de escolher." },
            ].map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.num} className="group relative overflow-hidden rounded-2xl border border-white/[0.06] p-8 transition-all duration-300 hover:border-white/15 hover:bg-white/[0.02] hover:-translate-y-1">
                  <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-[#f97316]/3 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative z-10">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.06]">
                      <Icon className="h-5 w-5 text-[#f97316]" />
                    </div>
                    <span className="mt-6 block text-[12px] font-mono text-white/15">{step.num}</span>
                    <h3 className="mt-2 text-[20px] font-semibold tracking-[-0.01em] text-white/90">{step.title}</h3>
                    <p className="mt-3 text-[14px] leading-relaxed text-white/30">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── DIFERENCIAL ─── */}
      <section id="diferencial" className="border-t border-white/[0.04] px-6 py-24 sm:px-10 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center text-center">
            <span className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/20">Diferencial</span>
            <h2 className="mt-4 max-w-2xl text-[40px] font-bold leading-[1.1] tracking-[-0.02em] text-white sm:text-[52px]">
              Por que é diferente
            </h2>
            <p className="mt-4 max-w-lg text-[16px] leading-relaxed text-white/30">
              O DeBoa não é um banco, não é um cartão. É um novo jeito de se relacionar com o consumo.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2">
            {[
              { icon: Zap, title: "Pausa", desc: "Interrompe o automático. Cria um espaço entre o desejo e o clique." },
              { icon: Brain, title: "Contexto", desc: "Entende a compra além do preço. Analisa seu momento financeiro real." },
              { icon: Sparkles, title: "Inteligência", desc: "Usa tecnologia para gerar uma análise útil — não um palpite genérico." },
              { icon: Shield, title: "Autonomia", desc: "A decisão continua sendo sua. O DeBoa é um espelho, não um juiz." },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="group relative overflow-hidden rounded-2xl border border-white/[0.06] p-10 transition-all duration-300 hover:border-white/15 hover:bg-white/[0.02]">
                  <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-[#f97316]/3 blur-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative z-10">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f97316]/5 border border-[#f97316]/10">
                      <Icon className="h-6 w-6 text-[#f97316]" />
                    </div>
                    <span className="mt-6 block text-[16px] font-semibold text-white/90">{item.title}</span>
                    <p className="mt-3 text-[15px] leading-relaxed text-white/30">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── FORMULÁRIO ─── */}
      <section ref={formRef} className="border-t border-white/[0.04] px-6 py-24 sm:px-10 sm:py-32" id="form">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-br from-white/[0.02] to-transparent p-10 sm:p-16">
            <div className="pointer-events-none absolute -top-40 -right-40 h-80 w-80 rounded-full bg-[#f97316]/3 blur-3xl" />
            <div className="relative z-10 grid items-center gap-12 lg:grid-cols-2">
              <div className="max-w-lg">
                <span className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/20">Espera</span>
                <h2 className="mt-4 text-[36px] font-bold leading-[1.1] tracking-[-0.02em] text-white sm:text-[44px]">
                  Quer saber quando lançar?
                </h2>
                <p className="mt-4 text-[16px] leading-relaxed text-white/30">
                  Deixe seu nome e email. Seja o primeiro a saber quando o DeBoa estiver disponível.
                </p>
              </div>

              <div className="w-full max-w-md">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="landing-name" className="sr-only">Nome</label>
                    <input
                      id="landing-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nome"
                      className="min-h-14 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-5 text-[15px] text-white outline-none placeholder:text-white/15 transition-all focus:border-[#f97316]/40 focus:bg-white/[0.04] focus:ring-1 focus:ring-[#f97316]/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="landing-email" className="sr-only">Email</label>
                    <input
                      id="landing-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      className="min-h-14 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] px-5 text-[15px] text-white outline-none placeholder:text-white/15 transition-all focus:border-[#f97316]/40 focus:bg-white/[0.04] focus:ring-1 focus:ring-[#f97316]/20"
                    />
                  </div>

                  {errorMsg && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-[13px] text-red-400">
                      {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={formState === "loading"}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-4 text-[15px] font-semibold text-black transition-all hover:bg-white/90 disabled:opacity-50"
                  >
                    {formState === "loading" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Quero entrar na lista"
                    )}
                  </button>

                  <p className="text-center text-[12px] text-white/12">
                    Seus dados não serão compartilhados.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/[0.04] px-6 py-16 sm:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <span className="text-[20px] font-semibold tracking-tight text-white">DeBoa<span className="text-[#f97316]">.</span></span>
              <p className="mt-3 max-w-xs text-[14px] leading-relaxed text-white/20">
                Seu momento de pausa antes de decidir.
              </p>
            </div>
            <div>
              <span className="text-[12px] font-semibold uppercase tracking-[0.15em] text-white/20">Produto</span>
              <ul className="mt-5 space-y-3">
                <li><a href="#como-funciona" className="text-[14px] text-white/35 transition-colors hover:text-white/60">Como funciona</a></li>
                <li><a href="#diferencial" className="text-[14px] text-white/35 transition-colors hover:text-white/60">Diferencial</a></li>
                <li><a href="#form" className="text-[14px] text-white/35 transition-colors hover:text-white/60">Lista de espera</a></li>
              </ul>
            </div>
            <div>
              <span className="text-[12px] font-semibold uppercase tracking-[0.15em] text-white/20">Empresa</span>
              <ul className="mt-5 space-y-3">
                <li><span className="text-[14px] text-white/20">Em breve</span></li>
              </ul>
            </div>
            <div>
              <span className="text-[12px] font-semibold uppercase tracking-[0.15em] text-white/20">Legal</span>
              <ul className="mt-5 space-y-3">
                <li><span className="text-[14px] text-white/20">Privacidade</span></li>
                <li><span className="text-[14px] text-white/20">Termos</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-white/[0.04] pt-8 sm:flex-row sm:items-center">
            <p className="text-[13px] text-white/12">© 2026 DeBoa</p>
            <div className="flex gap-6">
              <span className="text-[13px] text-white/12">Português (Brasil)</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}