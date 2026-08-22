import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Progress, Stat } from "@/components/mapa/primitives";
import { Action, Card, Pill } from "@/components/ui-kit";
import { useFinancialProfile } from "@/hooks/useFinancialProfile";
import { financialInsightEngine } from "@/services/financialInsightEngine";
import { brl } from "@/utils/format";

export const Route = createFileRoute("/meu-mapa")({
  head: () => ({
    meta: [
      { title: "Seu Mapa Financeiro — DeBoa" },
      {
        name: "description",
        content:
          "A leitura do DeBoa sobre o seu momento: renda, faturas, reserva, objetivos, insights e pequenos combinados.",
      },
      { property: "og:title", content: "Seu Mapa Financeiro — DeBoa" },
      {
        property: "og:description",
        content: "Agora eu consigo entender melhor o seu momento.",
      },
    ],
  }),
  component: MapPage,
});

const TONE: Record<string, string> = {
  green: "🟢",
  yellow: "🟡",
  orange: "🟠",
  red: "🔴",
};

function MapPage() {
  const { profile, hydrated, hasProfile } = useFinancialProfile();

  if (!hydrated) {
    return (
      <AppShell>
        <div className="pt-16 text-center text-[14px] text-muted-foreground">
          Carregando seu mapa…
        </div>
      </AppShell>
    );
  }

  if (!hasProfile) {
    return (
      <AppShell>
        <header className="animate-rise pt-8 pb-6">
          <h1 className="text-[27px] font-semibold leading-tight tracking-[-0.03em]">
            Seu Mapa Financeiro
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
            Quanto melhor eu entender sua vida, melhor posso te ajudar a decidir.
          </p>
        </header>
        <Card>
          <p className="text-[14px] leading-relaxed text-muted-foreground">
            Ainda não conheço seu momento. Leva poucos minutos e é tudo em etapas curtas.
          </p>
          <div className="mt-5">
            <Link to="/mapa" className="block">
              <Action variant="accent">Criar meu mapa</Action>
            </Link>
          </div>
        </Card>
      </AppShell>
    );
  }

  const r = financialInsightEngine(profile);
  const emergencyProgress =
    r.emergencyGoal && r.emergency.min > 0
      ? Math.min(r.emergencyGoal.saved / r.emergency.min, 1)
      : 0;

  return (
    <AppShell>
      <header className="animate-rise pt-8 pb-6">
        <Pill className="border-accent/25 bg-accent/10 text-accent">Seu Mapa Financeiro</Pill>
        <h1 className="mt-4 text-[27px] font-semibold leading-tight tracking-[-0.03em]">
          Agora eu consigo entender melhor o seu momento.
        </h1>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Stat emoji="💰" label="Renda líquida" value={brl(r.income)} />
        <Stat emoji="💳" label="Faturas atuais" value={brl(r.cards.bills)} />
        <Stat
          emoji="🛟"
          label="Reserva"
          value={`${Math.round(emergencyProgress * 100)}%`}
          hint={r.emergency.min > 0 ? `Sugerida: ${brl(r.emergency.min)}` : undefined}
        />
        <Stat emoji="🎯" label="Objetivos" value={`${profile.goals.length} ativos`} />
      </div>

      <Card className="mt-4">
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Seu momento
        </p>
        <p className="mt-2 text-[22px] font-semibold tracking-[-0.03em]">
          {TONE[r.financialStatus.tone]} {r.financialStatus.status}
        </p>
        <Progress className="mt-3" value={r.financialStatus.score / 100} />
        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
          <strong className="text-foreground">Leitura do DeBoa:</strong>{" "}
          {r.financialStatus.reading} Não é um diagnóstico financeiro profissional.
        </p>
      </Card>

      {r.temporal.daysUntilNextIncome !== null ? (
        <Card className="mt-3">
          <p className="text-[14px] leading-relaxed">
            {r.temporal.cyclePosition === "recem-recebido"
              ? "Seu salário caiu. Este pode ser um bom momento para separar o valor da sua reserva."
              : `Você ainda tem ${r.temporal.daysUntilNextIncome} dias até o próximo recebimento.`}
          </p>
        </Card>
      ) : null}

      <section className="mt-8">
        <h2 className="text-[13px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          DeBoa percebeu algumas coisas
        </h2>
        <div className="mt-3 space-y-2.5">
          {r.insights.map((i) => (
            <Card key={i.id}>
              <p className="text-[14px] leading-relaxed">{i.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-[13px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          Suas caixinhas
        </h2>
        <Card className="mt-3 space-y-3">
          {r.goals.map((g) => (
            <div key={g.goal.id}>
              <div className="flex items-center justify-between text-[14px]">
                <span className="font-medium tracking-tight">
                  {g.goal.emoji} {g.goal.name}
                </span>
                <span className="text-muted-foreground">
                  {Math.round(g.progress * 100)}%
                </span>
              </div>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                {brl(g.goal.saved)} / {brl(g.goal.target)} · {brl(g.monthlyRequiredContribution)}
                /mês por {g.monthsRemaining} meses
              </p>
              <Progress className="mt-2" value={g.progress} />
            </div>
          ))}
        </Card>
      </section>

      <section className="mt-8">
        <h2 className="text-[13px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          Se eu estivesse no seu lugar, começaria por aqui
        </h2>
        <div className="mt-3 space-y-2.5">
          {r.recommendations.map((w, i) => (
            <Card key={w.id}>
              <Pill>Combinado #{i + 1}</Pill>
              <p className="mt-3 text-[16px] font-medium leading-snug tracking-tight">
                {w.emoji} {w.title}
              </p>
              <p className="mt-2 text-[13px] text-muted-foreground">
                Economia estimada: {brl(w.monthlySaving)}/mês · {brl(w.monthlySaving * 12)}/ano
              </p>
            </Card>
          ))}
          {r.totalSmallWins > 0 ? (
            <Card className="border-accent/25 bg-accent/6">
              <p className="text-[13px] leading-relaxed">
                Total potencial: <strong>{brl(r.totalSmallWins)}/mês</strong>. Você não
                precisa mudar sua vida financeira inteira.
              </p>
            </Card>
          ) : null}
        </div>
      </section>

      {profile.pacts.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-[13px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Combinados ativos
          </h2>
          <Card className="mt-3 space-y-3">
            {profile.pacts.map((p) => (
              <div key={p.id} className="text-[14px]">
                <p className="font-medium tracking-tight">{p.title}</p>
                <p className="text-[12px] text-muted-foreground">
                  {brl(p.monthlySaving)}/mês liberados
                </p>
              </div>
            ))}
          </Card>
        </section>
      ) : null}

      <Card className="mt-8">
        <p className="text-[17px] font-medium leading-snug tracking-tight">Pronto.</p>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
          Agora eu conheço melhor o seu momento. Quando uma decisão importante aparecer, eu
          vou estar aqui para pensar com você.
        </p>
        <div className="mt-5 space-y-2.5">
          <Link to="/decidir" className="block">
            <Action variant="accent">Começar a usar o DeBoa</Action>
          </Link>
          <Link to="/mapa" className="block">
            <Action variant="outline">Editar meus dados</Action>
          </Link>
        </div>
      </Card>
    </AppShell>
  );
}
