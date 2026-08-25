import {
  cardTotals,
  essentialTotal,
  goalMath,
  habitMonthlyCost,
  totalNetIncome,
} from "./financeMath";
import type { FinancialProfile, Goal, MonthPlan, PlanAllocation } from "./financeTypes";

/**
 * O plano do mês.
 *
 * A ideia central: o momento de maior alavancagem não é a hora da compra — é a
 * hora em que o dinheiro cai. Ali a pessoa está fria, com o saldo inteiro na
 * mão, e uma decisão só ("para onde vai isso") vale mais do que trinta
 * decisões de "posso gastar?" depois.
 *
 * E o produto deixa de ser sobre proibição. O resultado do plano é um número
 * de dinheiro **livre**: o que sobra depois do essencial, das faturas e das
 * caixinhas, e que pode ser gasto sem culpa nenhuma. É uma permissão, não uma
 * restrição.
 */

/** yyyy-mm do mês corrente. */
export function currentMonth(today = new Date()): string {
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
    new Date(y, m - 1, 1),
  );
}

/* ------------------------------- Sugestão --------------------------------- */

const PRIORITY_ORDER = { Alta: 0, Média: 1, Baixa: 2 } as const;

/** Caixinhas na ordem em que o dinheiro deve encontrá-las. */
export function goalsByPriority(goals: Goal[]): Goal[] {
  return [...goals].sort((a, b) => {
    // A reserva de emergência vem antes de qualquer sonho: ela é o que
    // protege os sonhos de virarem dívida.
    if (a.kind === "emergency" && b.kind !== "emergency") return -1;
    if (b.kind === "emergency" && a.kind !== "emergency") return 1;
    return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  });
}

export type PlanSuggestion = {
  income: number;
  essentials: number;
  bills: number;
  /** O que sobra depois do que já está comprometido. */
  surplus: number;
  allocations: PlanAllocation[];
  /** Soma do que cada caixinha precisaria por mês para bater o prazo. */
  needed: number;
  /** Quanto foi possível separar de fato. */
  allocated: number;
  /** needed − allocated. Maior que zero quer dizer que o mês não fecha. */
  shortfall: number;
  free: number;
};

/**
 * Divide o mês.
 *
 * Regra: o essencial e as faturas saem primeiro porque não são escolha. O que
 * sobra vai para as caixinhas na ordem de prioridade, cada uma recebendo o que
 * precisaria para bater o prazo. Se não dá para todas, as últimas recebem
 * menos — e o plano diz isso em voz alta em vez de fingir que fechou.
 */
export function suggestPlan(profile: FinancialProfile, today = new Date()): PlanSuggestion {
  const income = totalNetIncome(profile);
  const essentials = essentialTotal(profile.essentialExpenses);
  const bills = cardTotals(profile.creditCards, today).bills;
  const surplus = Math.max(income - essentials - bills, 0);

  const ordered = goalsByPriority(profile.goals);
  const needs = ordered.map((goal) => ({
    goal,
    need: Math.max(goalMath(goal, today).monthlyRequiredContribution, 0),
  }));
  const needed = needs.reduce((sum, n) => sum + n.need, 0);

  // Nunca separar tudo: um mês sem nenhum dinheiro livre é um plano que a
  // pessoa quebra na primeira sexta-feira. Setenta por cento do que sobra é o
  // teto do que vai para as caixinhas por sugestão — o resto ela decide.
  const ceiling = Math.floor(surplus * 0.7);

  const allocations: PlanAllocation[] = [];
  let remaining = ceiling;
  for (const { goal, need } of needs) {
    if (remaining <= 0) break;
    const amount = Math.min(need, remaining);
    if (amount <= 0) continue;
    allocations.push({ goalId: goal.id, amount: Math.round(amount) });
    remaining -= amount;
  }

  const allocated = allocations.reduce((sum, a) => sum + a.amount, 0);

  return {
    income,
    essentials,
    bills,
    surplus,
    allocations,
    needed: Math.round(needed),
    allocated,
    shortfall: Math.max(Math.round(needed) - allocated, 0),
    free: Math.max(surplus - allocated, 0),
  };
}

/* -------------------------------- Leitura --------------------------------- */

export function planFree(plan: MonthPlan): number {
  const allocated = plan.allocations.reduce((sum, a) => sum + a.amount, 0);
  return Math.max(plan.income - plan.essentials - plan.bills - allocated, 0);
}

export function planAllocated(plan: MonthPlan): number {
  return plan.allocations.reduce((sum, a) => sum + a.amount, 0);
}

export function findPlan(profile: FinancialProfile, month: string): MonthPlan | null {
  return profile.plans.find((p) => p.month === month) ?? null;
}

export type PlanProgress = {
  free: number;
  /** Dias que ainda faltam para o mês virar. */
  daysLeft: number;
  /** Quanto dá para gastar por dia sem furar o livre. */
  perDay: number;
  /** Fração do mês já percorrida, 0–1. */
  elapsed: number;
};

export function planProgress(plan: MonthPlan, today = new Date()): PlanProgress {
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const day = today.getDate();
  const daysLeft = Math.max(daysInMonth - day + 1, 1);
  const free = planFree(plan);
  return {
    free,
    daysLeft,
    perDay: Math.round(free / daysLeft),
    elapsed: Math.min(day / daysInMonth, 1),
  };
}

/* -------------------------------- Caminhos -------------------------------- */

export type PlanPath = {
  id: string;
  /** O que fazer. */
  title: string;
  /** Quanto isso resolve por mês, quando dá para calcular. */
  worth: number | null;
  /** Por que isso funciona. */
  detail: string;
};

/**
 * Quando o mês não fecha, o produto tem que mostrar saídas — não repetir o
 * problema. Cada caminho é uma alavanca concreta, com o valor que ela libera.
 */
export function planPaths(
  profile: FinancialProfile,
  suggestion: PlanSuggestion,
  today = new Date(),
): PlanPath[] {
  const paths: PlanPath[] = [];
  if (suggestion.shortfall <= 0) return paths;

  // 1. Hábitos: o dinheiro que já está saindo e ninguém decidiu que sairia.
  const habits = [...profile.habits].sort((a, b) => habitMonthlyCost(b) - habitMonthlyCost(a));
  for (const habit of habits.slice(0, 2)) {
    const cost = habitMonthlyCost(habit);
    if (cost < 40 || habit.frequency < 2) continue;
    const target = Math.max(1, Math.round(habit.frequency * 0.6));
    if (target >= habit.frequency) continue;
    const saving = Math.round(cost - habitMonthlyCost({ ...habit, frequency: target }));
    if (saving < 20) continue;
    paths.push({
      id: `habito-${habit.id}`,
      title: `Passar ${habit.label.toLowerCase()} de ${habit.frequency} para ${target}${
        habit.period === "week" ? "x na semana" : "x no mês"
      }`,
      worth: saving,
      detail: "Não é parar. É mudar o ritmo — e esse dinheiro já é seu, só estava saindo sozinho.",
    });
  }

  // 2. Prazo: esticar é sempre mais barato que desistir.
  const tightest = goalsByPriority(profile.goals)
    .map((goal) => ({ goal, math: goalMath(goal, today) }))
    .filter((g) => g.math.remaining > 0 && g.math.monthsRemaining > 0)
    .sort((a, b) => b.math.monthlyRequiredContribution - a.math.monthlyRequiredContribution)[0];

  if (tightest) {
    const extended = tightest.math.monthsRemaining + 6;
    const newMonthly = Math.round(tightest.math.remaining / extended);
    const saving = tightest.math.monthlyRequiredContribution - newMonthly;
    if (saving > 0) {
      paths.push({
        id: `prazo-${tightest.goal.id}`,
        title: `Dar mais 6 meses para "${tightest.goal.name}"`,
        worth: saving,
        detail: `Cai de ${brl(tightest.math.monthlyRequiredContribution)} para ${brl(
          newMonthly,
        )} por mês. Chegar mais tarde ainda é chegar.`,
      });
    }
  }

  // 3. Fatura: quando ela domina o mês, é ela que precisa de plano.
  if (suggestion.income > 0 && suggestion.bills / suggestion.income > 0.25) {
    paths.push({
      id: "fatura",
      title: "Atacar a fatura antes de guardar",
      worth: null,
      detail: `Sua fatura come ${Math.round(
        (suggestion.bills / suggestion.income) * 100,
      )}% do que entra. Enquanto ela estiver nesse tamanho, guardar dinheiro é enxugar gelo.`,
    });
  }

  // 4. O último recurso, dito sem rodeio.
  if (paths.length === 0) {
    paths.push({
      id: "meta",
      title: "Rever o tamanho das metas",
      worth: null,
      detail:
        "Pelo que entra hoje, o que você quer guardar não cabe. Não é falta de disciplina — é aritmética. Vale escolher uma caixinha para focar e pausar as outras.",
    });
  }

  return paths;
}

function brl(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(Math.round(value));
}
