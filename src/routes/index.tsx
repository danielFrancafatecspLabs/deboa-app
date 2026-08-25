import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Compass, PiggyBank, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Progress } from "@/components/mapa/primitives";
import { Action, Card, Pill } from "@/components/ui-kit";
import { useFinancialProfile } from "@/hooks/useFinancialProfile";
import { financialInsightEngine } from "@/services/financialInsightEngine";
import { goalMath } from "@/services/financeMath";
import {
  currentMonth,
  findPlan,
  goalsByPriority,
  monthLabel,
  planProgress,
} from "@/services/monthPlan";
import { brl } from "@/utils/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DeBoa — Você decide. O DeBoa pensa com você." },
      {
        name: "description",
        content:
          "O DeBoa divide o seu mês quando o dinheiro cai e te diz, todo dia, quanto dá para gastar sem culpa.",
      },
      { property: "og:title", content: "DeBoa — Você decide. O DeBoa pensa com você." },
      {
        property: "og:description",
        content:
          "O DeBoa divide o seu mês quando o dinheiro cai e te diz, todo dia, quanto dá para gastar sem culpa.",
      },
    ],
  }),
  component: HomePage,
});

function greeting(hour: number): string {
  if (hour < 5) return "Boa madrugada";
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function HomePage() {
  const { profile, hydrated, hasProfile } = useFinancialProfile();

  if (!hydrated) {
    return (
      <AppShell>
        <div className="pt-16 text-center text-[14px] text-muted-foreground">Carregando…</div>
      </AppShell>
    );
  }

  /* ------------------------- Ainda não me conhece ------------------------- */
  if (!hasProfile) {
    return (
      <AppShell>
        <header className="animate-rise pt-10">
          <span className="text-[22px] font-semibold tracking-[-0.04em]">
            DeBoa<span className="text-accent">.</span>
          </span>
          <h1 className="mt-7 text-[30px] font-semibold leading-[1.1] tracking-[-0.035em]">
            Seu dinheiro merece um plano, não um susto no fim do mês.
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Quatro perguntas e eu já consigo dividir o seu mês com você.
          </p>
        </header>

        <div className="mt-8">
          <Link to="/mapa" className="block">
            <Action variant="accent">Começar — leva 1 minuto</Action>
          </Link>
        </div>

        <Card className="mt-6">
          <p className="text-[14px] leading-relaxed text-muted-foreground">
            Nada de planilha, nada de conectar banco. Você me conta o essencial, eu devolvo uma
            leitura do seu momento e um plano do mês com um número no fim: quanto dá para gastar
            sem culpa.
          </p>
        </Card>
      </AppShell>
    );
  }

  const reading = financialInsightEngine(profile);
  const month = currentMonth();
  const plan = findPlan(profile, month);
  const hello = greeting(new Date().getHours());

  /* ---------------------------- Já tem plano ------------------------------ */
  if (plan) {
    const progress = planProgress(plan);
    const next = goalsByPriority(profile.goals)
      .map((goal) => ({ goal, math: goalMath(goal) }))
      .filter((g) => g.math.remaining > 0)[0];

    return (
      <AppShell>
        <header className="animate-rise pt-10">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[20px] font-semibold tracking-[-0.04em]">
              DeBoa<span className="text-accent">.</span>
            </span>
            <span className="text-[13px] text-muted-foreground">{monthLabel(month)}</span>
          </div>
          <p className="mt-6 text-[15px] text-muted-foreground">{hello}.</p>
        </header>

        {/* O número do dia. */}
        <Card className="mt-3 border-accent/25 bg-accent/6">
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-accent">
            Livre para gastar
          </p>
          <p className="mt-1.5 text-[44px] font-semibold leading-none tracking-[-0.045em] tabular-nums">
            {brl(progress.free)}
          </p>
          <p className="mt-3 text-[14px] leading-relaxed">
            {progress.daysLeft} {progress.daysLeft === 1 ? "dia" : "dias"} até o mês virar. Dá{" "}
            <strong>{brl(progress.perDay)} por dia</strong> sem furar o plano.
          </p>
          <Progress className="mt-4" value={progress.elapsed} />
        </Card>

        {reading.temporal.cyclePosition === "recem-recebido" ? (
          <Card className="mt-3">
            <p className="text-[14px] leading-relaxed">
              Seu dinheiro caiu há pouco. Se ainda não separou as caixinhas deste mês, hoje é o
              melhor dia — antes de ele encontrar outro destino.
            </p>
          </Card>
        ) : null}

        {next ? (
          <Card className="mt-3">
            <div className="flex items-start gap-3">
              <span className="text-[22px] leading-none">{next.goal.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium tracking-tight">{next.goal.name}</p>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  Faltam {brl(next.math.remaining)} · {Math.round(next.math.progress * 100)}% do
                  caminho
                </p>
                <Progress className="mt-2.5" value={next.math.progress} />
              </div>
            </div>
          </Card>
        ) : null}

        <section className="mt-7 space-y-2.5">
          <Shortcut
            to="/decidir"
            icon={Compass}
            title="Vale a pena comprar?"
            detail="Me diga o que é e eu peso contra o seu livre do mês."
          />
          <Shortcut
            to="/caixinhas"
            icon={PiggyBank}
            title="Guardei dinheiro"
            detail="Anote o que entrou numa caixinha e veja o progresso mexer."
          />
        </section>

        <div className="mt-7">
          <Link to="/meu-mapa" className="block">
            <Action variant="ghost">Ver a leitura completa do meu momento</Action>
          </Link>
        </div>
      </AppShell>
    );
  }

  /* ------------------------- Tem mapa, falta plano ------------------------ */
  return (
    <AppShell>
      <header className="animate-rise pt-10">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[20px] font-semibold tracking-[-0.04em]">
            DeBoa<span className="text-accent">.</span>
          </span>
          <span className="text-[13px] text-muted-foreground">{monthLabel(month)}</span>
        </div>
        <p className="mt-6 text-[15px] text-muted-foreground">{hello}.</p>
        <h1 className="mt-2 text-[27px] font-semibold leading-[1.12] tracking-[-0.035em]">
          {reading.temporal.cyclePosition === "recem-recebido"
            ? "Caiu o dinheiro. Vamos dividir?"
            : "Seu mês ainda não tem plano."}
        </h1>
      </header>

      <Card className="mt-5 border-accent/25 bg-accent/6">
        <p className="text-[14px] leading-relaxed">
          Em um minuto eu divido o que entrou entre o essencial, suas caixinhas e o que sobra
          livre. Depois disso, a pergunta “posso gastar?” já vem respondida todo dia.
        </p>
        <div className="mt-5">
          <Link to="/plano" className="block">
            <Action variant="accent">
              <span className="inline-flex items-center gap-1.5">
                Montar o plano do mês
                <ArrowRight className="h-4 w-4" />
              </span>
            </Action>
          </Link>
        </div>
      </Card>

      <Card className="mt-3">
        <Pill>Seu momento</Pill>
        <p className="mt-3 text-[19px] font-semibold tracking-[-0.03em]">
          {reading.financialStatus.status}
        </p>
        <Progress className="mt-3" value={reading.financialStatus.score / 100} />
        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
          {reading.financialStatus.reading}
        </p>
      </Card>

      <section className="mt-7 space-y-2.5">
        <Shortcut
          to="/caixinhas"
          icon={PiggyBank}
          title="Suas caixinhas"
          detail="Crie do seu jeito e veja quanto falta para cada uma."
        />
        <Shortcut
          to="/decidir"
          icon={Compass}
          title="Vale a pena comprar?"
          detail="Me diga o que é e eu peso contra o seu momento."
        />
        <Shortcut
          to="/meu-mapa"
          icon={Sparkles}
          title="A leitura completa"
          detail="Tudo que eu percebi sobre o seu mês."
        />
      </section>
    </AppShell>
  );
}

function Shortcut({
  to,
  icon: Icon,
  title,
  detail,
}: {
  to: "/decidir" | "/caixinhas" | "/meu-mapa" | "/plano";
  icon: typeof Compass;
  title: string;
  detail: string;
}) {
  return (
    <Link to={to} className="block">
      <Card className="flex items-center gap-4 transition-all active:scale-[0.99]">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-muted text-muted-foreground">
          <Icon className="h-[19px] w-[19px]" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15.5px] font-medium tracking-tight">{title}</p>
          <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{detail}</p>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </Card>
    </Link>
  );
}
