import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check, ChevronRight, CreditCard, Repeat, Target } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StepCards, StepGoals, StepHabits } from "@/components/mapa/steps";
import { Action, Card } from "@/components/ui-kit";
import { useFinancialProfile } from "@/hooks/useFinancialProfile";
import { habitMonthlyCost } from "@/services/financeMath";
import type { FinancialProfile } from "@/services/financeTypes";
import { brl } from "@/utils/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/refinar")({
  head: () => ({
    meta: [
      { title: "Refinar meu Mapa — DeBoa" },
      {
        name: "description",
        content:
          "Acrescente cartões, hábitos e objetivos para o DeBoa ler o seu momento com mais precisão.",
      },
    ],
  }),
  component: RefinarPage,
});

type ModuleKey = "cartoes" | "habitos" | "objetivos";

/**
 * Everything past the four essential questions lives here, entered one module
 * at a time. Each one states what it buys the person, so adding detail is a
 * choice with a visible payoff rather than a wall of fields up front.
 */
const MODULES: {
  key: ModuleKey;
  icon: typeof CreditCard;
  title: string;
  payoff: string;
  Component: (props: {
    profile: FinancialProfile;
    update: (patch: Partial<FinancialProfile>) => void;
  }) => React.JSX.Element;
  status: (p: FinancialProfile) => string | null;
}[] = [
  {
    key: "cartoes",
    icon: CreditCard,
    title: "Seus cartões",
    payoff: "Para eu saber quanto do seu futuro já está comprometido antes de responder.",
    Component: StepCards,
    status: (p) =>
      p.creditCards.length > 0
        ? `${p.creditCards.length} ${p.creditCards.length === 1 ? "cartão" : "cartões"}`
        : null,
  },
  {
    key: "habitos",
    icon: Repeat,
    title: "Seus hábitos",
    payoff: "Para eu encontrar o dinheiro que escapa sem você perceber.",
    Component: StepHabits,
    status: (p) => {
      if (p.habits.length === 0) return null;
      const total = p.habits.reduce((s, h) => s + habitMonthlyCost(h), 0);
      return `${brl(Math.round(total))}/mês mapeados`;
    },
  },
  {
    key: "objetivos",
    icon: Target,
    title: "Mais objetivos",
    payoff: "Para eu pesar cada compra contra tudo que você quer conquistar.",
    Component: StepGoals,
    status: (p) =>
      p.goals.length > 1 ? `${p.goals.length} objetivos` : p.goals.length === 1 ? "1 objetivo" : null,
  },
];

function RefinarPage() {
  const { profile, update } = useFinancialProfile();
  const navigate = useNavigate();
  const [open, setOpen] = useState<ModuleKey | null>(null);

  const active = MODULES.find((m) => m.key === open) ?? null;

  if (active) {
    const Step = active.Component;
    return (
      <AppShell>
        <div className="flex items-center gap-3 pt-4 pb-6">
          <button
            aria-label="Voltar"
            onClick={() => {
              setOpen(null);
              window.scrollTo({ top: 0 });
            }}
            className="-ml-2 grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition-colors active:bg-muted"
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
          </button>
          <h1 className="text-[20px] font-semibold tracking-[-0.03em]">{active.title}</h1>
        </div>

        <Step profile={profile} update={update} />

        <div className="mt-8">
          <Action
            variant="accent"
            onClick={() => {
              setOpen(null);
              window.scrollTo({ top: 0 });
            }}
          >
            Pronto
          </Action>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="animate-rise pt-6 pb-7">
        <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.03em]">
          Refinar meu Mapa
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
          Seu mapa já funciona. Cada item aqui deixa minha leitura um pouco mais precisa —
          entre quando quiser, na ordem que quiser.
        </p>
      </header>

      <div className="space-y-3">
        {MODULES.map(({ key, icon: Icon, title, payoff, status }) => {
          const done = status(profile);
          return (
            <button
              key={key}
              onClick={() => {
                setOpen(key);
                window.scrollTo({ top: 0 });
              }}
              className="block w-full text-left"
            >
              <Card className="flex items-center gap-4 transition-all active:scale-[0.99]">
                <span
                  className={cn(
                    "grid h-11 w-11 shrink-0 place-items-center rounded-full",
                    done ? "bg-accent/12 text-accent" : "bg-muted text-muted-foreground",
                  )}
                >
                  {done ? (
                    <Check className="h-[18px] w-[18px]" strokeWidth={2.4} />
                  ) : (
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] font-medium tracking-tight">{title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                    {done ?? payoff}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Card>
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        <Link to="/meu-mapa" className="block">
          <Action variant="outline">Ver meu Mapa</Action>
        </Link>
      </div>
    </AppShell>
  );
}
