import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ESSENCIAL_STEPS } from "@/components/mapa/essencial";
import { Action } from "@/components/ui-kit";
import { useFinancialProfile } from "@/hooks/useFinancialProfile";

export const Route = createFileRoute("/mapa")({
  head: () => ({
    meta: [
      { title: "Meu Mapa — contexto financeiro do DeBoa" },
      {
        name: "description",
        content:
          "Quatro perguntas para o DeBoa entender o seu momento e começar a te ajudar a decidir.",
      },
      { property: "og:title", content: "Meu Mapa — contexto financeiro do DeBoa" },
      {
        property: "og:description",
        content: "Quanto melhor eu entender sua vida, melhor posso te ajudar a decidir.",
      },
    ],
  }),
  component: MapaPage,
});

function MapaPage() {
  const { profile, update } = useFinancialProfile();
  const navigate = useNavigate();
  const [step, setStep] = useState(() =>
    Math.min(
      ESSENCIAL_STEPS.findIndex((s) => !s.isAnswered(profile)) === -1
        ? ESSENCIAL_STEPS.length - 1
        : ESSENCIAL_STEPS.findIndex((s) => !s.isAnswered(profile)),
      ESSENCIAL_STEPS.length - 1,
    ),
  );

  const current = ESSENCIAL_STEPS[step]!;
  const Step = current.Component;
  const answered = current.isAnswered(profile);
  const last = step === ESSENCIAL_STEPS.length - 1;

  function goNext() {
    if (last) {
      update({ completed: true, completedSteps: ESSENCIAL_STEPS.length });
      void navigate({ to: "/meu-mapa" });
      return;
    }
    update({ completedSteps: Math.max(profile.completedSteps, step + 1) });
    setStep(step + 1);
    window.scrollTo({ top: 0 });
  }

  function goBack() {
    setStep(Math.max(step - 1, 0));
    window.scrollTo({ top: 0 });
  }

  return (
    <AppShell focused>
      <div className="flex items-center justify-between pt-4 pb-2">
        {step > 0 ? (
          <button
            aria-label="Voltar"
            onClick={goBack}
            className="-ml-2 grid h-10 w-10 place-items-center rounded-full text-muted-foreground transition-colors active:bg-muted"
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
          </button>
        ) : (
          <span className="h-10" />
        )}
        <button
          onClick={() => navigate({ to: "/" })}
          className="text-[13px] font-medium text-muted-foreground"
        >
          Agora não
        </button>
      </div>

      <Step profile={profile} update={update} />

      <div className="mt-9">
        <Action variant="accent" onClick={goNext} disabled={!answered}>
          {last ? "Ver meu Mapa" : "Continuar"}
        </Action>
        {!answered ? (
          <button
            onClick={goNext}
            className="mt-3 w-full text-[13px] font-medium text-muted-foreground"
          >
            Responder depois
          </button>
        ) : null}
      </div>

      <p className="mt-8 flex items-start gap-2 px-1 text-[12px] leading-relaxed text-muted-foreground">
        <Lock className="mt-0.5 h-3 w-3 shrink-0" strokeWidth={2} />
        Seus dados ficam salvos apenas neste aparelho. Não conectamos sua conta bancária.
      </p>
    </AppShell>
  );
}
