import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, Minus, Plus, RotateCcw, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Progress } from "@/components/mapa/primitives";
import { Action, Card, Pill } from "@/components/ui-kit";
import { useFinancialProfile } from "@/hooks/useFinancialProfile";
import { cn } from "@/lib/utils";
import { financialInsightEngine } from "@/services/financialInsightEngine";
import {
  currentMonth,
  findPlan,
  monthLabel,
  planAllocated,
  planFree,
  planPaths,
  planProgress,
  suggestPlan,
} from "@/services/monthPlan";
import type { MonthPlan, PlanAllocation } from "@/services/financeTypes";
import { brl } from "@/utils/format";

export const Route = createFileRoute("/plano")({
  head: () => ({
    meta: [
      { title: "Seu plano do mês — DeBoa" },
      {
        name: "description",
        content:
          "Quando o dinheiro cai, o DeBoa divide o mês com você: essencial, caixinhas e — o mais importante — quanto sobra livre para gastar sem culpa.",
      },
    ],
  }),
  component: PlanPage,
});

/** Passo dos botões de ajuste. Redondo o suficiente para decidir rápido. */
const STEP = 50;

function PlanPage() {
  const { profile, hydrated, hasProfile, update } = useFinancialProfile();
  const navigate = useNavigate();

  const month = currentMonth();
  const existing = hydrated ? findPlan(profile, month) : null;
  const [editing, setEditing] = useState(false);

  if (!hydrated) {
    return (
      <AppShell>
        <div className="pt-16 text-center text-[14px] text-muted-foreground">Carregando…</div>
      </AppShell>
    );
  }

  if (!hasProfile) {
    return (
      <AppShell>
        <header className="animate-rise pt-8 pb-6">
          <h1 className="text-[27px] font-semibold leading-tight tracking-[-0.03em]">
            Seu plano do mês
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
            Para dividir o mês eu preciso saber quanto entra e quanto sai.
          </p>
        </header>
        <Card>
          <p className="text-[14px] leading-relaxed text-muted-foreground">
            São <strong>quatro perguntas</strong>. Depois delas eu monto o plano em segundos.
          </p>
          <div className="mt-5">
            <Link to="/mapa" className="block">
              <Action variant="accent">Montar meu Mapa</Action>
            </Link>
          </div>
        </Card>
      </AppShell>
    );
  }

  if (existing && !editing) {
    return <ClosedPlan plan={existing} onRedo={() => setEditing(true)} />;
  }

  return (
    <PlanBuilder
      onDone={() => {
        setEditing(false);
        void navigate({ to: "/plano" });
      }}
      onCancel={existing ? () => setEditing(false) : null}
    />
  );

  function ClosedPlan({ plan, onRedo }: { plan: MonthPlan; onRedo: () => void }) {
    const progress = planProgress(plan);
    const reading = financialInsightEngine(profile);
    const goalOf = (id: string) => profile.goals.find((g) => g.id === id);

    return (
      <AppShell>
        <header className="animate-rise pt-8 pb-6">
          <Pill className="border-accent/25 bg-accent/10 text-accent">
            {monthLabel(plan.month)}
          </Pill>
          <h1 className="mt-4 text-[27px] font-semibold leading-tight tracking-[-0.03em]">
            Seu mês já está dividido.
          </h1>
        </header>

        {/* O número que a pessoa abre o app para ver. */}
        <Card className="border-accent/25 bg-accent/6">
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-accent">
            Livre para gastar
          </p>
          <p className="mt-1.5 text-[40px] font-semibold leading-none tracking-[-0.04em] tabular-nums">
            {brl(progress.free)}
          </p>
          <p className="mt-2.5 text-[14px] leading-relaxed">
            Faltam {progress.daysLeft} {progress.daysLeft === 1 ? "dia" : "dias"} para o mês
            virar — dá <strong>{brl(progress.perDay)} por dia</strong>. Isso é seu, sem culpa
            nenhuma: o essencial e as caixinhas já estão separados.
          </p>
          <Progress className="mt-4" value={progress.elapsed} />
          <p className="mt-2 text-[12px] text-muted-foreground">
            {Math.round(progress.elapsed * 100)}% do mês percorrido
          </p>
        </Card>

        <section className="mt-7">
          <h2 className="px-1 text-[13px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Para onde o resto foi
          </h2>
          <Card className="mt-3 space-y-3">
            <Line label="Entrou" value={plan.income} strong />
            <Line label="Essencial do mês" value={-plan.essentials} />
            {plan.bills > 0 ? <Line label="Faturas" value={-plan.bills} /> : null}
            {plan.allocations.map((a) => {
              const goal = goalOf(a.goalId);
              return (
                <Line
                  key={a.goalId}
                  label={goal ? `${goal.emoji} ${goal.name}` : "Caixinha"}
                  value={-a.amount}
                />
              );
            })}
            <div className="border-t border-border pt-3">
              <Line label="Livre" value={planFree(plan)} strong />
            </div>
          </Card>
        </section>

        {plan.pactIds.length > 0 ? (
          <section className="mt-7">
            <h2 className="px-1 text-[13px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              Combinados deste mês
            </h2>
            <Card className="mt-3 space-y-3">
              {profile.pacts
                .filter((p) => plan.pactIds.includes(p.id))
                .map((p) => (
                  <div key={p.id} className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <div>
                      <p className="text-[14px] font-medium tracking-tight">{p.title}</p>
                      <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                        {brl(p.monthlySaving)}/mês que deixam de escapar
                      </p>
                    </div>
                  </div>
                ))}
            </Card>
          </section>
        ) : null}

        {reading.temporal.daysUntilNextIncome !== null ? (
          <Card className="mt-4">
            <p className="text-[14px] leading-relaxed">
              {reading.temporal.cyclePosition === "recem-recebido"
                ? "Você acabou de receber. Se for separar as caixinhas, hoje é o dia — antes do dinheiro encontrar outro destino."
                : `Faltam ${reading.temporal.daysUntilNextIncome} dias até o próximo recebimento.`}
            </p>
          </Card>
        ) : null}

        <div className="mt-7 space-y-2.5">
          <Link to="/caixinhas" className="block">
            <Action variant="outline">Ver minhas caixinhas</Action>
          </Link>
          <Action variant="ghost" onClick={onRedo}>
            <span className="inline-flex items-center gap-1.5">
              <RotateCcw className="h-4 w-4" />
              Refazer o plano
            </span>
          </Action>
        </div>
      </AppShell>
    );
  }

  function PlanBuilder({
    onDone,
    onCancel,
  }: {
    onDone: () => void;
    onCancel: (() => void) | null;
  }) {
    const suggestion = useMemo(() => suggestPlan(profile), []);
    const reading = useMemo(() => financialInsightEngine(profile), []);
    const paths = useMemo(() => planPaths(profile, suggestion), [suggestion]);

    const [allocations, setAllocations] = useState<PlanAllocation[]>(suggestion.allocations);
    const [pactIds, setPactIds] = useState<string[]>([]);

    const ordered = useMemo(
      () =>
        profile.goals.map((goal) => ({
          goal,
          amount: allocations.find((a) => a.goalId === goal.id)?.amount ?? 0,
        })),
      [allocations],
    );

    const allocated = allocations.reduce((sum, a) => sum + a.amount, 0);
    const free = Math.max(suggestion.surplus - allocated, 0);
    const overspent = allocated > suggestion.surplus;

    function setAmount(goalId: string, next: number) {
      const amount = Math.max(0, Math.round(next));
      setAllocations((prev) => {
        const without = prev.filter((a) => a.goalId !== goalId);
        return amount > 0 ? [...without, { goalId, amount }] : without;
      });
    }

    function close() {
      const plan: MonthPlan = {
        month,
        income: suggestion.income,
        essentials: suggestion.essentials,
        bills: suggestion.bills,
        allocations,
        pactIds,
        closedAt: new Date().toISOString(),
      };
      // Combinados aceitos viram compromissos do perfil, não só do plano.
      const accepted = reading.recommendations
        .filter((w) => pactIds.includes(w.id))
        .map((w) => ({
          id: w.id,
          title: w.title,
          detail: w.detail,
          monthlySaving: w.monthlySaving,
          goalId: w.goalId ?? null,
          createdAt: new Date().toISOString(),
        }));

      update({
        plans: [plan, ...profile.plans.filter((p) => p.month !== month)],
        pacts: [...accepted.filter((a) => !profile.pacts.some((p) => p.id === a.id)), ...profile.pacts],
      });
      window.scrollTo({ top: 0 });
      onDone();
    }

    return (
      <AppShell focused>
        <header className="animate-rise pt-8 pb-6">
          <Pill className="border-accent/25 bg-accent/10 text-accent">
            {monthLabel(month)}
          </Pill>
          <h1 className="mt-4 text-[27px] font-semibold leading-tight tracking-[-0.03em]">
            {reading.temporal.cyclePosition === "recem-recebido"
              ? "Caiu o dinheiro. Vamos dividir?"
              : "Vamos dividir o seu mês."}
          </h1>
          <p className="mt-2.5 text-[14px] leading-relaxed text-muted-foreground">
            Uma decisão agora vale mais do que trinta decisões de “posso gastar?” depois. Eu
            proponho, você ajusta.
          </p>
        </header>

        {/* Não é escolha: sai antes de tudo. */}
        <Card>
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            O que já tem dono
          </p>
          <div className="mt-3 space-y-2.5">
            <Line label="Entrou" value={suggestion.income} strong />
            <Line label="Essencial do mês" value={-suggestion.essentials} />
            {suggestion.bills > 0 ? <Line label="Faturas" value={-suggestion.bills} /> : null}
            <div className="border-t border-border pt-2.5">
              <Line label="Sobra para você decidir" value={suggestion.surplus} strong />
            </div>
          </div>
        </Card>

        {/* Caixinhas */}
        <section className="mt-7">
          <h2 className="px-1 text-[13px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Quanto vai para cada caixinha
          </h2>
          {profile.goals.length === 0 ? (
            <Card className="mt-3">
              <p className="text-[14px] leading-relaxed text-muted-foreground">
                Você ainda não tem caixinha nenhuma. Sem um destino, todo o dinheiro que sobra
                vira “livre” — e some.
              </p>
              <div className="mt-4">
                <Link to="/caixinhas" className="block">
                  <Action variant="outline">Criar uma caixinha</Action>
                </Link>
              </div>
            </Card>
          ) : (
            <div className="mt-3 space-y-2.5">
              {ordered.map(({ goal, amount }) => (
                <AllocRow
                  key={goal.id}
                  emoji={goal.emoji}
                  name={goal.name}
                  amount={amount}
                  hint={hintFor(goal.id)}
                  onChange={(next) => setAmount(goal.id, next)}
                />
              ))}
            </div>
          )}
        </section>

        {/* O resultado, sempre à vista. */}
        <Card
          className={cn(
            "mt-5",
            overspent ? "border-destructive/40 bg-destructive/5" : "border-accent/25 bg-accent/6",
          )}
        >
          <p
            className={cn(
              "text-[12px] font-medium uppercase tracking-[0.08em]",
              overspent ? "text-destructive" : "text-accent",
            )}
          >
            {overspent ? "Passou do que sobra" : "Livre para gastar"}
          </p>
          <p className="mt-1.5 text-[36px] font-semibold leading-none tracking-[-0.04em] tabular-nums">
            {brl(overspent ? allocated - suggestion.surplus : free)}
          </p>
          <p className="mt-2.5 text-[13.5px] leading-relaxed">
            {overspent ? (
              <>Você separou mais do que sobrou. Tire de alguma caixinha para o plano fechar.</>
            ) : (
              <>
                Depois do essencial e das caixinhas, é isto que fica no seu bolso — sem culpa
                nenhuma. Nada aqui é proibido.
              </>
            )}
          </p>
        </Card>

        {/* Caminhos, quando o mês não fecha */}
        {paths.length > 0 ? (
          <section className="mt-7">
            <h2 className="px-1 text-[13px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              Se você quiser esticar o mês
            </h2>
            <p className="mt-1.5 px-1 text-[13px] leading-relaxed text-muted-foreground">
              No ritmo que você quer, faltam <strong>{brl(suggestion.shortfall)}</strong> por mês.
              Estes são os caminhos.
            </p>
            <div className="mt-3 space-y-2.5">
              {paths.map((path) => (
                <Card key={path.id}>
                  <div className="flex items-start gap-3">
                    <Sparkles className="mt-0.5 h-[18px] w-[18px] shrink-0 text-accent" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-medium leading-snug tracking-tight">
                        {path.title}
                      </p>
                      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                        {path.detail}
                      </p>
                      {path.worth !== null ? (
                        <p className="mt-2 text-[13px] font-medium text-accent">
                          Libera {brl(path.worth)}/mês
                        </p>
                      ) : null}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ) : null}

        {/* Combinados */}
        {reading.recommendations.length > 0 ? (
          <section className="mt-7">
            <h2 className="px-1 text-[13px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              Combinados para este mês
            </h2>
            <p className="mt-1.5 px-1 text-[13px] leading-relaxed text-muted-foreground">
              Nada de parar tudo. Só o que você topa segurar até o mês virar.
            </p>
            <div className="mt-3 space-y-2.5">
              {reading.recommendations.map((w) => {
                const on = pactIds.includes(w.id);
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() =>
                      setPactIds((prev) =>
                        prev.includes(w.id) ? prev.filter((i) => i !== w.id) : [...prev, w.id],
                      )
                    }
                    className="block w-full text-left"
                  >
                    <Card
                      className={cn(
                        "flex items-start gap-3 transition-all active:scale-[0.99]",
                        on && "border-accent/40 bg-accent/6",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border",
                          on
                            ? "border-transparent bg-accent text-accent-foreground"
                            : "border-border",
                        )}
                      >
                        {on ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14.5px] font-medium leading-snug tracking-tight">
                          {w.emoji} {w.title}
                        </p>
                        <p className="mt-1 text-[13px] text-muted-foreground">
                          {brl(w.monthlySaving)}/mês · {brl(w.monthlySaving * 12)}/ano
                        </p>
                      </div>
                    </Card>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        <div className="mt-8 space-y-2.5">
          <Action variant="accent" disabled={overspent} onClick={close}>
            Fechar meu plano do mês
          </Action>
          {onCancel ? (
            <Action variant="ghost" onClick={onCancel}>
              Cancelar
            </Action>
          ) : null}
        </div>

        <p className="mt-6 px-1 text-[12px] leading-relaxed text-muted-foreground">
          Isto é organização, não recomendação de investimento. O DeBoa não indica onde aplicar
          seu dinheiro.
        </p>
      </AppShell>
    );

    function hintFor(goalId: string): string | undefined {
      const need = suggestion.allocations.find((a) => a.goalId === goalId)?.amount;
      const goal = profile.goals.find((g) => g.id === goalId);
      if (!goal) return undefined;
      if (need && need > 0) return `Sugeri ${brl(need)} para bater o prazo`;
      return "Sem sugestão este mês — o que sobrou não alcançou";
    }
  }
}

/* -------------------------------- Pedaços --------------------------------- */

function Line({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  const negative = value < 0;
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-[14px] tracking-tight",
          strong ? "font-medium" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "shrink-0 tabular-nums tracking-[-0.02em]",
          strong ? "text-[17px] font-semibold" : "text-[15px] text-muted-foreground",
        )}
      >
        {negative ? "−" : ""}
        {brl(Math.abs(value))}
      </span>
    </div>
  );
}

function AllocRow({
  emoji,
  name,
  amount,
  hint,
  onChange,
}: {
  emoji: string;
  name: string;
  amount: number;
  hint?: string | undefined;
  onChange: (next: number) => void;
}) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <span className="text-[20px]">{emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-medium tracking-tight">{name}</p>
          {hint ? <p className="mt-0.5 text-[12px] text-muted-foreground">{hint}</p> : null}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <StepButton
          label={`Diminuir ${name}`}
          disabled={amount <= 0}
          onClick={() => onChange(amount - STEP)}
        >
          <Minus className="h-4 w-4" />
        </StepButton>
        <span className="flex-1 text-center text-[24px] font-semibold tabular-nums tracking-[-0.03em]">
          {brl(amount)}
        </span>
        <StepButton label={`Aumentar ${name}`} onClick={() => onChange(amount + STEP)}>
          <Plus className="h-4 w-4" />
        </StepButton>
      </div>
    </Card>
  );
}

function StepButton({
  children,
  label,
  disabled = false,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border bg-surface text-foreground transition-all active:scale-[0.94] disabled:opacity-30"
    >
      {children}
    </button>
  );
}
