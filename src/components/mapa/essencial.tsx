import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { maskMoney, parseMoney } from "@/components/mapa/primitives";
import { GOAL_TEMPLATES } from "@/data/financeSeed";
import type { FinancialProfile, Goal } from "@/services/financeTypes";
import { brl } from "@/utils/format";

/**
 * The essential map: four questions that are enough for the engine to produce
 * a real reading. Everything else (cards, habits, extra goals) is refinement
 * the person opts into afterwards, from a map that already works.
 *
 * The old flow asked around forty-five fields across seven dense screens
 * before showing anything back — a spreadsheet, which is the one thing this
 * product says it is not.
 */

export type EssencialStepProps = {
  profile: FinancialProfile;
  update: (patch: Partial<FinancialProfile>) => void;
};

/** Typical share of income taken by essentials, used when someone doesn't know. */
const ESSENTIALS_ESTIMATE = 0.55;

const uid = () => Math.random().toString(36).slice(2, 9);

/* ------------------------------- Primitives ------------------------------- */

export function QuestionShell({
  step,
  total,
  title,
  helper,
  children,
  readback,
}: {
  step: number;
  total: number;
  title: string;
  helper?: string;
  children: ReactNode;
  /** What DeBoa understood so far — the payoff for having answered. */
  readback?: ReactNode;
}) {
  return (
    <section className="animate-rise">
      <div className="flex items-center gap-3">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${(step / total) * 100}%` }}
          />
        </div>
        <span className="shrink-0 text-[12px] font-medium tabular-nums text-muted-foreground">
          {step} de {total}
        </span>
      </div>

      <h1 className="mt-8 text-balance text-[27px] font-semibold leading-[1.15] tracking-[-0.03em]">
        {title}
      </h1>
      {helper ? (
        <p className="mt-2.5 text-[14px] leading-relaxed text-muted-foreground">{helper}</p>
      ) : null}

      <div className="mt-8">{children}</div>

      {readback ? (
        <div className="animate-rise mt-6 flex gap-3 rounded-2xl border border-accent/25 bg-accent/6 p-4">
          <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
          <p className="text-[13px] leading-relaxed">{readback}</p>
        </div>
      ) : null}
    </section>
  );
}

/** The one input on the screen, so it gets to be big and grabs focus. */
export function BigMoney({
  value,
  onValueChange,
  autoFocus = true,
}: {
  value: number;
  onValueChange: (n: number) => void;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  return (
    <div className="flex items-baseline gap-2 border-b border-border pb-3 focus-within:border-accent">
      <span className="text-[24px] font-medium text-muted-foreground">R$</span>
      <input
        ref={ref}
        inputMode="decimal"
        placeholder="0,00"
        value={value ? maskMoney(value) : ""}
        onChange={(e) => onValueChange(parseMoney(e.target.value))}
        className="w-full bg-transparent text-[40px] font-semibold tracking-[-0.03em] tabular-nums outline-none placeholder:text-muted-foreground/30"
      />
    </div>
  );
}

/** Presets turn a blank field into a one-tap answer. */
function Suggestions({
  options,
  onPick,
}: {
  options: { label: string; value: number }[];
  onPick: (n: number) => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.label}
          type="button"
          onClick={() => onPick(o.value)}
          className="rounded-full border border-border bg-surface px-3.5 py-2 text-[13px] font-medium transition-all active:scale-[0.97]"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------ 1. Sua renda ------------------------------ */

export function AskIncome({ profile, update }: EssencialStepProps) {
  return (
    <QuestionShell
      step={1}
      total={4}
      title="Quanto entra na sua conta por mês?"
      helper="O valor que chega até você, já sem os descontos. Se varia, use uma média."
      readback={
        profile.netIncome > 0 ? (
          <>
            São <strong>{brl(profile.netIncome)}</strong> por mês. É daqui que eu parto para
            entender o peso de cada decisão sua.
          </>
        ) : undefined
      }
    >
      <BigMoney
        value={profile.netIncome}
        onValueChange={(netIncome) => update({ netIncome })}
      />
      <Suggestions
        options={[
          { label: "R$ 2.000", value: 2000 },
          { label: "R$ 3.500", value: 3500 },
          { label: "R$ 5.000", value: 5000 },
          { label: "R$ 8.000", value: 8000 },
        ]}
        onPick={(netIncome) => update({ netIncome })}
      />

      {profile.netIncome > 0 ? (
        <div className="animate-rise mt-8">
          <p className="text-[13px] font-medium text-muted-foreground">
            Que dia costuma cair?
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
            Isso me diz em que ponto do mês você está quando uma decisão aparece.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[1, 5, 10, 15, 20, 30].map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => update({ salaryDay: day })}
                className={cn(
                  "min-w-12 rounded-full border px-3.5 py-2 text-[13px] font-medium tabular-nums transition-all active:scale-[0.97]",
                  profile.salaryDay === day
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-surface",
                )}
              >
                {day}
              </button>
            ))}
            <button
              type="button"
              onClick={() => update({ salaryDay: null })}
              className={cn(
                "rounded-full border px-3.5 py-2 text-[13px] font-medium transition-all active:scale-[0.97]",
                profile.salaryDay === null
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-surface",
              )}
            >
              Varia
            </button>
          </div>
        </div>
      ) : null}
    </QuestionShell>
  );
}

/* ---------------------------- 2. Seu disponível --------------------------- */

export function AskAvailable({ profile, update }: EssencialStepProps) {
  const available = profile.liquidAssets.checking;

  return (
    <QuestionShell
      step={2}
      total={4}
      title="Quanto você tem disponível hoje?"
      helper="Somando conta, poupança e o que dá para acessar agora. Sem contar o FGTS."
      readback={
        available > 0 ? (
          <>
            Com <strong>{brl(available)}</strong> na mão, uma compra de {brl(400)} pesa{" "}
            <strong>{Math.round((400 / available) * 100)}%</strong> do seu disponível. É esse
            tipo de conta que eu faço antes de responder.
          </>
        ) : undefined
      }
    >
      <BigMoney
        value={available}
        onValueChange={(v) =>
          update({ liquidAssets: { ...profile.liquidAssets, checking: v } })
        }
      />
      <Suggestions
        options={[
          { label: "R$ 500", value: 500 },
          { label: "R$ 1.500", value: 1500 },
          { label: "R$ 3.000", value: 3000 },
          { label: "R$ 6.000", value: 6000 },
        ]}
        onPick={(v) => update({ liquidAssets: { ...profile.liquidAssets, checking: v } })}
      />
    </QuestionShell>
  );
}

/* ----------------------------- 3. Custo do mês ---------------------------- */

export function AskEssentials({ profile, update }: EssencialStepProps) {
  const housing = profile.essentialExpenses.housing;
  const estimate = Math.round((profile.netIncome * ESSENTIALS_ESTIMATE) / 50) * 50;

  return (
    <QuestionShell
      step={3}
      total={4}
      title="Quanto custa o seu mês?"
      helper="Tudo que é obrigatório: moradia, comida, transporte, contas. Um número aproximado basta."
      readback={
        housing > 0 && profile.netIncome > 0 ? (
          <>
            Sobram cerca de <strong>{brl(Math.max(profile.netIncome - housing, 0))}</strong> por
            mês depois do essencial. É essa folga que uma compra come.
          </>
        ) : undefined
      }
    >
      <BigMoney
        value={housing}
        onValueChange={(v) =>
          update({ essentialExpenses: { ...profile.essentialExpenses, housing: v } })
        }
      />

      {estimate > 0 ? (
        <button
          type="button"
          onClick={() =>
            update({
              essentialExpenses: { ...profile.essentialExpenses, housing: estimate },
            })
          }
          className="mt-4 rounded-full border border-border bg-surface px-3.5 py-2 text-[13px] font-medium transition-all active:scale-[0.97]"
        >
          Não sei — usar estimativa de {brl(estimate)}
        </button>
      ) : null}
    </QuestionShell>
  );
}

/* ------------------------------ 4. Objetivo ------------------------------- */

function futureMonth(monthsAhead: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsAhead);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function AskGoal({ profile, update }: EssencialStepProps) {
  const goal = profile.goals[0] ?? null;

  function pick(template: (typeof GOAL_TEMPLATES)[number]) {
    const next: Goal = {
      id: uid(),
      emoji: template.emoji,
      name: template.name,
      target: template.target,
      saved: 0,
      deadline: futureMonth(18),
      priority: "Alta",
      kind: template.kind,
      homeDetails: null,
    };
    update({ goals: [next] });
  }

  return (
    <QuestionShell
      step={4}
      total={4}
      title="O que você quer conquistar?"
      helper="Escolha um para começar. Dá para acrescentar outros depois."
      readback={
        goal ? (
          <>
            Anotado: <strong>{goal.name}</strong>. Agora, quando uma compra aparecer, eu consigo
            te mostrar o que ela custa em relação a isso.
          </>
        ) : undefined
      }
    >
      <div className="grid grid-cols-2 gap-2.5">
        {GOAL_TEMPLATES.map((t) => {
          const active = goal?.name === t.name;
          return (
            <button
              key={t.name}
              type="button"
              onClick={() => pick(t)}
              className={cn(
                "min-h-20 rounded-2xl border p-3.5 text-left transition-all active:scale-[0.98]",
                active
                  ? "border-accent bg-accent/10"
                  : "border-border bg-surface",
              )}
            >
              <span className="block text-[18px]">{t.emoji}</span>
              <span
                className={cn(
                  "mt-1.5 block text-[13px] font-medium leading-snug tracking-tight",
                  active && "text-accent",
                )}
              >
                {t.name}
              </span>
            </button>
          );
        })}
      </div>

      {goal ? (
        <div className="animate-rise mt-7">
          <p className="text-[13px] font-medium text-muted-foreground">
            Quanto você precisa juntar?
          </p>
          <div className="mt-3">
            <BigMoney
              value={goal.target}
              autoFocus={false}
              onValueChange={(target) => update({ goals: [{ ...goal, target }] })}
            />
          </div>
        </div>
      ) : null}
    </QuestionShell>
  );
}

/* -------------------------------- Sequence -------------------------------- */

export const ESSENCIAL_STEPS = [
  { key: "renda", Component: AskIncome, isAnswered: (p: FinancialProfile) => p.netIncome > 0 },
  {
    key: "disponivel",
    Component: AskAvailable,
    isAnswered: (p: FinancialProfile) => p.liquidAssets.checking > 0,
  },
  {
    key: "essencial",
    Component: AskEssentials,
    isAnswered: (p: FinancialProfile) => p.essentialExpenses.housing > 0,
  },
  { key: "objetivo", Component: AskGoal, isAnswered: (p: FinancialProfile) => p.goals.length > 0 },
] as const;
