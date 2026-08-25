import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { MoneyField, Progress } from "@/components/mapa/primitives";
import { Action, Card, Field, Pill } from "@/components/ui-kit";
import { useFinancialProfile } from "@/hooks/useFinancialProfile";
import { cn } from "@/lib/utils";
import { goalMath } from "@/services/financeMath";
import { goalsByPriority } from "@/services/monthPlan";
import type { Goal, GoalPriority } from "@/services/financeTypes";
import { brl } from "@/utils/format";

export const Route = createFileRoute("/caixinhas")({
  head: () => ({
    meta: [
      { title: "Suas caixinhas — DeBoa" },
      {
        name: "description",
        content:
          "Crie caixinhas do seu jeito, veja quanto falta e guarde dinheiro nelas. É o que dá destino ao que sobra no fim do mês.",
      },
    ],
  }),
  component: BoxesPage,
});

/** Emojis o suficiente para a caixinha parecer sua, poucos o suficiente para caber numa tela. */
const EMOJIS = [
  "🎯", "✈️", "🏠", "🚗", "🎓", "💍", "🛟", "💻",
  "🏝️", "🎸", "🚀", "👶", "🐶", "🦷", "🏋️", "📷",
  "🎁", "🛠️", "🩺", "🌱", "🎢", "💰",
];

const PRIORITIES: GoalPriority[] = ["Alta", "Média", "Baixa"];

const uid = () => Math.random().toString(36).slice(2, 9);

function monthsAhead(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthsBetween(deadline: string): number {
  const [y, m] = deadline.split("-").map(Number);
  if (!y || !m) return 12;
  const now = new Date();
  return Math.max((y - now.getFullYear()) * 12 + (m - 1 - now.getMonth()), 1);
}

type Draft = {
  id: string | null;
  emoji: string;
  name: string;
  target: number;
  saved: number;
  months: number;
  priority: GoalPriority;
};

const BLANK: Draft = {
  id: null,
  emoji: "🎯",
  name: "",
  target: 0,
  saved: 0,
  months: 12,
  priority: "Alta",
};

function BoxesPage() {
  const { profile, hydrated, update } = useFinancialProfile();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [depositing, setDepositing] = useState<Goal | null>(null);

  if (!hydrated) {
    return (
      <AppShell>
        <div className="pt-16 text-center text-[14px] text-muted-foreground">Carregando…</div>
      </AppShell>
    );
  }

  const goals = goalsByPriority(profile.goals);

  function save(d: Draft) {
    const goal: Goal = {
      id: d.id ?? uid(),
      emoji: d.emoji,
      name: d.name.trim(),
      target: d.target,
      saved: Math.min(d.saved, d.target),
      deadline: monthsAhead(d.months),
      priority: d.priority,
      kind: profile.goals.find((g) => g.id === d.id)?.kind ?? "custom",
      homeDetails: profile.goals.find((g) => g.id === d.id)?.homeDetails ?? null,
    };
    update({
      goals: d.id
        ? profile.goals.map((g) => (g.id === d.id ? goal : g))
        : [...profile.goals, goal],
    });
    setDraft(null);
  }

  function remove(id: string) {
    update({
      goals: profile.goals.filter((g) => g.id !== id),
      // Um plano não pode apontar para uma caixinha que não existe mais.
      plans: profile.plans.map((p) => ({
        ...p,
        allocations: p.allocations.filter((a) => a.goalId !== id),
      })),
    });
    setDraft(null);
  }

  function deposit(goal: Goal, amount: number) {
    update({
      goals: profile.goals.map((g) =>
        g.id === goal.id ? { ...g, saved: Math.min(g.saved + amount, g.target) } : g,
      ),
    });
    setDepositing(null);
  }

  const totalSaved = goals.reduce((s, g) => s + g.saved, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target, 0);

  return (
    <AppShell>
      <header className="animate-rise pt-8 pb-6">
        <Pill className="border-accent/25 bg-accent/10 text-accent">Suas caixinhas</Pill>
        <h1 className="mt-4 text-[27px] font-semibold leading-tight tracking-[-0.03em]">
          {goals.length === 0
            ? "Todo dinheiro precisa de um destino."
            : "O que você está construindo."}
        </h1>
        <p className="mt-2.5 text-[14px] leading-relaxed text-muted-foreground">
          {goals.length === 0
            ? "Sem uma caixinha, o que sobra no fim do mês some sem você perceber. Com uma, sobra vira progresso."
            : "Cada caixinha tem um prazo e um ritmo. Eu uso isso para saber o peso de cada compra."}
        </p>
      </header>

      {goals.length > 0 ? (
        <Card className="border-accent/25 bg-accent/6">
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-accent">
            Guardado no total
          </p>
          <p className="mt-1.5 text-[34px] font-semibold leading-none tracking-[-0.04em] tabular-nums">
            {brl(totalSaved)}
          </p>
          <p className="mt-2 text-[13.5px] text-muted-foreground">
            de {brl(totalTarget)} em {goals.length}{" "}
            {goals.length === 1 ? "caixinha" : "caixinhas"}
          </p>
          <Progress className="mt-3.5" value={totalTarget > 0 ? totalSaved / totalTarget : 0} />
        </Card>
      ) : null}

      <div className="mt-5 space-y-3">
        {goals.map((goal) => {
          const m = goalMath(goal);
          return (
            <Card key={goal.id}>
              <button
                type="button"
                onClick={() =>
                  setDraft({
                    id: goal.id,
                    emoji: goal.emoji,
                    name: goal.name,
                    target: goal.target,
                    saved: goal.saved,
                    months: monthsBetween(goal.deadline),
                    priority: goal.priority,
                  })
                }
                className="flex w-full items-start gap-3 text-left"
              >
                <span className="text-[24px] leading-none">{goal.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[16px] font-medium tracking-tight">{goal.name}</p>
                  <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                    {brl(goal.saved)} de {brl(goal.target)} · prioridade{" "}
                    {goal.priority.toLowerCase()}
                  </p>
                </div>
                <span className="shrink-0 text-[15px] font-semibold tabular-nums">
                  {Math.round(m.progress * 100)}%
                </span>
              </button>

              <Progress className="mt-3" value={m.progress} />

              <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                {m.remaining > 0 ? (
                  <>
                    Faltam <strong className="text-foreground">{brl(m.remaining)}</strong> —{" "}
                    {brl(m.monthlyRequiredContribution)}/mês pelos próximos {m.monthsRemaining}{" "}
                    {m.monthsRemaining === 1 ? "mês" : "meses"}.
                  </>
                ) : (
                  <>Você chegou lá. 🎉</>
                )}
              </p>

              {m.remaining > 0 ? (
                <div className="mt-4">
                  <Action variant="outline" onClick={() => setDepositing(goal)}>
                    Guardei dinheiro aqui
                  </Action>
                </div>
              ) : null}
            </Card>
          );
        })}

        <button type="button" onClick={() => setDraft({ ...BLANK })} className="block w-full">
          <Card className="flex items-center gap-3 border-dashed transition-all active:scale-[0.99]">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
              <Plus className="h-5 w-5" />
            </span>
            <span className="text-[15px] font-medium tracking-tight">Criar uma caixinha</span>
          </Card>
        </button>
      </div>

      {goals.length > 0 ? (
        <div className="mt-7">
          <Link to="/plano" className="block">
            <Action variant="accent">Dividir o mês entre elas</Action>
          </Link>
        </div>
      ) : null}

      <p className="mt-7 px-1 text-[12px] leading-relaxed text-muted-foreground">
        As caixinhas são um plano, não uma conta. O dinheiro continua onde você o deixou — o
        DeBoa não movimenta nada e não indica onde investir.
      </p>

      {draft ? (
        <DraftSheet
          draft={draft}
          onChange={setDraft}
          onSave={() => save(draft)}
          onDelete={draft.id ? () => remove(draft.id!) : null}
          onClose={() => setDraft(null)}
        />
      ) : null}

      {depositing ? (
        <DepositSheet
          goal={depositing}
          onConfirm={(amount) => deposit(depositing, amount)}
          onClose={() => setDepositing(null)}
        />
      ) : null}
    </AppShell>
  );
}

/* --------------------------------- Sheets --------------------------------- */

function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 backdrop-blur-[6px]">
      <div className="animate-sheet flex max-h-[92vh] w-full max-w-md flex-col overflow-y-auto rounded-t-[32px] border border-border/60 bg-surface px-6 pt-6 pb-safe shadow-lift sm:mb-4 sm:rounded-b-[32px]">
        <div className="mb-5 flex justify-end">
          <button
            aria-label="Fechar"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function DraftSheet({
  draft,
  onChange,
  onSave,
  onDelete,
  onClose,
}: {
  draft: Draft;
  onChange: (d: Draft) => void;
  onSave: () => void;
  onDelete: (() => void) | null;
  onClose: () => void;
}) {
  const valid = draft.name.trim().length > 1 && draft.target > 0;
  const monthly = draft.target > draft.saved ? (draft.target - draft.saved) / draft.months : 0;

  return (
    <Sheet onClose={onClose}>
      <h2 className="text-[24px] font-semibold leading-tight tracking-[-0.03em]">
        {draft.id ? "Ajustar caixinha" : "Nova caixinha"}
      </h2>

      <div className="mt-6 space-y-6 pb-8">
        <div>
          <p className="text-[13px] font-medium text-muted-foreground">Escolha um ícone</p>
          <div className="mt-2.5 grid grid-cols-8 gap-1.5">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => onChange({ ...draft, emoji: e })}
                className={cn(
                  "grid h-10 place-items-center rounded-xl border text-[18px] transition-all active:scale-[0.94]",
                  draft.emoji === e ? "border-accent bg-accent/10" : "border-border bg-surface",
                )}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <Field
          label="Nome"
          placeholder="Ex.: Viagem para o Chile"
          value={draft.name}
          onChange={(e) => onChange({ ...draft, name: e.target.value })}
        />

        <MoneyField
          label="Quanto você quer juntar"
          value={draft.target}
          onValueChange={(target) => onChange({ ...draft, target })}
        />

        <MoneyField
          label="Quanto já tem guardado"
          value={draft.saved}
          onValueChange={(saved) => onChange({ ...draft, saved })}
        />

        <div>
          <p className="text-[13px] font-medium text-muted-foreground">Em quanto tempo?</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {[6, 12, 18, 24, 36, 60].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange({ ...draft, months: n })}
                className={cn(
                  "rounded-full border px-3.5 py-2 text-[13px] font-medium tabular-nums transition-all active:scale-[0.97]",
                  draft.months === n
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-surface",
                )}
              >
                {n < 12 ? `${n} meses` : `${n / 12} ${n === 12 ? "ano" : "anos"}`}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[13px] font-medium text-muted-foreground">
            Prioridade
            <span className="ml-1.5 font-normal">— quem recebe primeiro quando sobra pouco</span>
          </p>
          <div className="mt-2.5 grid grid-cols-3 gap-2">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onChange({ ...draft, priority: p })}
                className={cn(
                  "min-h-11 rounded-2xl border text-[14px] font-medium transition-all active:scale-[0.98]",
                  draft.priority === p
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-surface",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {valid ? (
          <div className="animate-rise rounded-2xl border border-accent/25 bg-accent/6 p-4">
            <p className="text-[13.5px] leading-relaxed">
              Para chegar em {brl(draft.target)} nesse prazo, dá{" "}
              <strong>{brl(Math.round(monthly))} por mês</strong>. Eu já sugiro isso quando você
              for dividir o mês.
            </p>
          </div>
        ) : null}

        <div className="space-y-2.5">
          <Action variant="accent" disabled={!valid} onClick={onSave}>
            {draft.id ? "Salvar" : "Criar caixinha"}
          </Action>
          {onDelete ? (
            <Action variant="ghost" className="text-destructive" onClick={onDelete}>
              <span className="inline-flex items-center gap-1.5">
                <Trash2 className="h-4 w-4" />
                Apagar esta caixinha
              </span>
            </Action>
          ) : null}
        </div>
      </div>
    </Sheet>
  );
}

function DepositSheet({
  goal,
  onConfirm,
  onClose,
}: {
  goal: Goal;
  onConfirm: (amount: number) => void;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(0);
  const m = goalMath(goal);
  const after = Math.min(goal.saved + amount, goal.target);

  return (
    <Sheet onClose={onClose}>
      <h2 className="text-[24px] font-semibold leading-tight tracking-[-0.03em]">
        {goal.emoji} Guardei dinheiro
      </h2>
      <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
        Quanto entrou em “{goal.name}”? Eu só anoto — o dinheiro fica onde você o colocou.
      </p>

      <div className="mt-6 space-y-5 pb-8">
        <MoneyField label="Valor" value={amount} onValueChange={setAmount} />

        <div className="flex flex-wrap gap-2">
          {[50, 100, 200, Math.round(m.monthlyRequiredContribution)]
            .filter((v, i, a) => v > 0 && a.indexOf(v) === i)
            .map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAmount(v)}
                className="rounded-full border border-border bg-surface px-3.5 py-2 text-[13px] font-medium transition-all active:scale-[0.97]"
              >
                {brl(v)}
              </button>
            ))}
        </div>

        {amount > 0 ? (
          <div className="animate-rise rounded-2xl border border-accent/25 bg-accent/6 p-4">
            <p className="text-[13.5px] leading-relaxed">
              Vai para <strong>{brl(after)}</strong> de {brl(goal.target)} —{" "}
              {Math.round((after / goal.target) * 100)}% do objetivo.
              {after >= goal.target ? " Você chegou lá. 🎉" : ""}
            </p>
          </div>
        ) : null}

        <Action variant="accent" disabled={amount <= 0} onClick={() => onConfirm(amount)}>
          Anotar
        </Action>
      </div>
    </Sheet>
  );
}
