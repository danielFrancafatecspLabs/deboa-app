import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import {
  Sparkles,
  Map,
  Compass,
  Clock,
  ArrowRight,
  Check,
} from "lucide-react";
import { Action } from "@/components/ui-kit";

type Step = {
  icon: typeof Sparkles;
  title: string;
  subtitle: string;
  body: string[];
};

const STEPS: Step[] = [
  {
    icon: Sparkles,
    title: "O DeBoa pensa com você",
    subtitle: "Antes de comprar, pare. O DeBoa te ajuda a decidir melhor.",
    body: [
      "Você está prestes a comprar algo e quer ter certeza de que é uma boa decisão?",
      "O DeBoa analisa seu contexto financeiro, objetivos e compromissos — e te dá uma visão clara antes do clique.",
      "Não é um conselho financeiro. É um agente que te ajuda a pensar.",
    ],
  },
  {
    icon: Map,
    title: "Monte seu Mapa Financeiro",
    subtitle: "Quanto melhor o DeBoa te conhecer, melhores as análises.",
    body: [
      "O Mapa Financeiro é um raio-X da sua vida financeira: renda, despesas, cartões, objetivos e hábitos.",
      "Você pode preencher tudo de uma vez ou ir aos poucos. Cada informação ajuda o DeBoa a ser mais preciso.",
      "Seus dados ficam salvos na nuvem quando você cria uma conta.",
    ],
  },
  {
    icon: Compass,
    title: "Decida com contexto",
    subtitle: "Simule qualquer compra antes de decidir.",
    body: [
      "No Decidir, você diz o que está pensando em comprar e o DeBoa analisa na hora.",
      "Ele considera: quanto do seu disponível isso representa, seus compromissos futuros e seus objetivos ativos.",
      "O resultado pode ser: tranquilo, analisar com calma, ou esperar um momento melhor.",
    ],
  },
  {
    icon: Clock,
    title: "Acompanhe seu histórico",
    subtitle: "Veja como você decide ao longo do tempo.",
    body: [
      "Todas as suas simulações ficam registradas no Histórico.",
      "Você pode ver o que pensou em comprar, o que o DeBoa recomendou e qual foi sua decisão final.",
      "Com o tempo, você começa a enxergar padrões — e isso é o primeiro passo para decidir melhor.",
    ],
  },
];

export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const Icon = current.icon;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Progress dots */}
      <div className="fixed inset-x-0 top-0 z-50 flex justify-center gap-2 pt-6">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === step
                ? "w-8 bg-primary"
                : i < step
                  ? "w-1.5 bg-primary/40"
                  : "w-1.5 bg-border"
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-center px-6">
        <div className="animate-rise">
          {/* Icon */}
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
            <Icon className="h-10 w-10 text-primary" strokeWidth={1.5} />
          </div>

          {/* Title */}
          <h1 className="text-center text-[28px] font-semibold leading-tight tracking-[-0.03em]">
            {current.title}
          </h1>
          <p className="mt-3 text-center text-[15px] leading-relaxed text-muted-foreground">
            {current.subtitle}
          </p>

          {/* Body */}
          <div className="mt-8 space-y-4">
            {current.body.map((paragraph, i) => (
              <p
                key={i}
                className="text-[15px] leading-relaxed text-foreground/80"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="fixed inset-x-0 bottom-0 px-6 pb-safe pb-8">
        <div className="mx-auto max-w-md space-y-3">
          <Action
            variant="primary"
            onClick={() => {
              if (isLast) {
                onComplete();
              } else {
                setStep((s) => s + 1);
              }
            }}
          >
            {isLast ? (
              <>
                <Check className="mr-2 h-5 w-5" />
                Começar
              </>
            ) : (
              <>
                Próximo
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Action>

          {!isLast && (
            <button
              onClick={onComplete}
              className="w-full text-center text-[13px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground"
            >
              Pular introdução
            </button>
          )}
        </div>
      </div>
    </div>
  );
}