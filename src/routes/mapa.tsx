import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StepDots } from "@/components/mapa/primitives";
import {
  StepCards,
  StepGoals,
  StepHabits,
  StepIncome,
  StepMoney,
  StepPlan,
  StepYou,
} from "@/components/mapa/steps";
import { Action } from "@/components/ui-kit";
import { STEPS } from "@/data/financeSeed";
import { useFinancialProfile } from "@/hooks/useFinancialProfile";

export const Route = createFileRoute("/mapa")({
  head: () => ({
    meta: [
      { title: "Meu Mapa — contexto financeiro do DeBoa" },
      {
        name: "description",
        content:
          "Conte ao DeBoa como sua vida financeira funciona: renda, dinheiro disponível, cartões, objetivos e hábitos.",
      },
      { property: "og:title", content: "Meu Mapa — contexto financeiro do DeBoa" },
      {
        property: "og:description",
        content:
          "Quanto melhor eu entender sua vida, melhor posso te ajudar a decidir.",
      },
    ],
  }),
  component: MapaPage,
});

const COMPONENTS = [
  StepYou,
  StepIncome,
  StepMoney,
  StepCards,
  StepGoals,
  StepHabits,
  StepPlan,
];

function MapaPage() {
  const { profile, update } = useFinancialProfile();
  const [step, setStep] = useState(Math.min(profile.completedSteps, STEPS.length - 1));
  const navigate = useNavigate();
  const Step = COMPONENTS[step]!;
  const last = step === STEPS.length - 1;

  function next() {
    if (last) {
      update({ completed: true, completedSteps: STEPS.length });
      void navigate({ to: "/meu-mapa" });
      return;
    }
    update({ completedSteps: Math.max(profile.completedSteps, step + 1) });
    setStep(step + 1);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }

  return (
    <AppShell>
      <header className="animate-rise pt-6 pb-6">
        <div className="flex items-center gap-3">
          {step > 0 ? (
            <button
              aria-label="Voltar"
              onClick={() => setStep(step - 1)}
              className="grid h-10 w-10 place-items-center rounded-full bg-muted text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : null}
          <div>
            <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.03em]">
              Meu Mapa
            </h1>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              Quanto melhor eu entender sua vida, melhor posso te ajudar a decidir.
            </p>
          </div>
        </div>
        <div className="mt-5">
          <StepDots total={STEPS.length} current={step} />
          <p className="mt-2 text-[12px] uppercase tracking-[0.08em] text-muted-foreground">
            {STEPS[step]!.title}
          </p>
        </div>
      </header>

      <Step profile={profile} update={update} />

      <div className="mt-7 space-y-2.5">
        <Action variant="accent" onClick={next}>
          {last ? "Gerar meu Mapa Financeiro" : "Continuar"}
        </Action>
        {!last ? (
          <Action variant="ghost" onClick={next}>
            Pular por enquanto
          </Action>
        ) : null}
      </div>

      <p className="mt-5 px-1 text-[12px] leading-relaxed text-muted-foreground">
        Seus dados ficam salvos apenas neste dispositivo. Não conectamos sua conta bancária
        neste MVP.
      </p>
    </AppShell>
  );
}
