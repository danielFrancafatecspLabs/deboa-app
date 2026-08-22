import type {
  CreditCard,
  EmploymentType,
  EssentialExpenses,
  FinancialProfile,
  Goal,
  Habit,
  IncomeSource,
  LiquidAssets,
} from "./financeTypes";

const WEEKS_PER_MONTH = 4.33;

/** Fator configurável usado apenas para ESTIMAR o bruto a partir do líquido. */
export const GROSS_ESTIMATE_FACTOR = 1.28;

/** Alíquota configurável de depósito mensal do FGTS. */
export const FGTS_MONTHLY_RATE = 0.08;

export function estimateGrossFromNet(net: number) {
  return Math.round(Math.max(net, 0) * GROSS_ESTIMATE_FACTOR);
}

export function calculateEstimatedFGTSMonthly(
  grossSalary: number,
  rate: number = FGTS_MONTHLY_RATE,
) {
  return Math.round(Math.max(grossSalary, 0) * rate);
}

export function monthlyFromSource(source: IncomeSource) {
  const amount = Math.max(source.amount, 0);
  switch (source.frequency) {
    case "Semanal":
      return amount * WEEKS_PER_MONTH;
    case "Quinzenal":
      return amount * 2;
    case "Anual":
      return amount / 12;
    default:
      return amount;
  }
}

export function totalNetIncome(profile: FinancialProfile) {
  const extra = profile.incomeSources.reduce((sum, s) => sum + monthlyFromSource(s), 0);
  return Math.round(profile.netIncome + extra);
}

export function totalLiquidity(assets: LiquidAssets) {
  return (
    assets.checking +
    assets.yieldAccount +
    assets.savings +
    assets.investments +
    assets.cash
  );
}

export function essentialTotal(expenses: EssentialExpenses) {
  return Object.values(expenses).reduce((a, b) => a + b, 0);
}

export function cardTotals(cards: CreditCard[], today = new Date()) {
  const bills = cards.reduce((s, c) => s + c.currentBill, 0);
  const limits = cards.reduce((s, c) => s + c.limit, 0);
  const committed = cards.reduce((s, c) => s + c.committed, 0);
  const utilization = limits > 0 ? committed / limits : 0;
  const nextDue = cards
    .map((c) => ({ card: c, days: daysUntilDay(c.dueDay, today) }))
    .sort((a, b) => a.days - b.days)[0];
  return {
    bills,
    limits,
    committed,
    utilization,
    nextDueCard: nextDue?.card ?? null,
    nextDueInDays: nextDue?.days ?? null,
  };
}

export function daysUntilDay(day: number | null | undefined, today = new Date()) {
  if (!day || day < 1 || day > 31) return 0;
  const current = today.getDate();
  if (day >= current) return day - current;
  const daysInMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
  ).getDate();
  return daysInMonth - current + day;
}

export type TemporalContext = {
  currentDate: string;
  currentMonthDay: number;
  salaryDay: number | null;
  daysUntilNextIncome: number | null;
  daysSinceLastIncome: number | null;
  cyclePosition: "recem-recebido" | "meio-do-ciclo" | "fim-do-ciclo" | null;
};

export function buildTemporalContext(
  salaryDay: number | null,
  today = new Date(),
): TemporalContext {
  if (!salaryDay) {
    return {
      currentDate: today.toISOString(),
      currentMonthDay: today.getDate(),
      salaryDay: null,
      daysUntilNextIncome: null,
      daysSinceLastIncome: null,
      cyclePosition: null,
    };
  }
  const daysUntilNextIncome = daysUntilDay(salaryDay, today);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysSinceLastIncome =
    today.getDate() >= salaryDay
      ? today.getDate() - salaryDay
      : daysInMonth - salaryDay + today.getDate();
  const cyclePosition =
    daysSinceLastIncome <= 4
      ? "recem-recebido"
      : daysUntilNextIncome <= 7
        ? "fim-do-ciclo"
        : "meio-do-ciclo";
  return {
    currentDate: today.toISOString(),
    currentMonthDay: today.getDate(),
    salaryDay,
    daysUntilNextIncome,
    daysSinceLastIncome,
    cyclePosition,
  };
}

export function habitMonthlyCost(habit: Habit) {
  const perPeriod = Math.max(habit.frequency, 0) * Math.max(habit.unitCost, 0);
  return habit.period === "week" ? perPeriod * WEEKS_PER_MONTH : perPeriod;
}

export function monthsUntil(deadline: string, today = new Date()) {
  if (!deadline) return 12;
  const [y, m] = deadline.split("-").map(Number);
  if (!y || !m) return 12;
  const diff = (y - today.getFullYear()) * 12 + (m - 1 - today.getMonth());
  return Math.max(diff, 1);
}

export type GoalMath = {
  goal: Goal;
  remaining: number;
  monthsRemaining: number;
  monthlyRequiredContribution: number;
  progress: number;
};

export function goalMath(goal: Goal, today = new Date()): GoalMath {
  const remaining = Math.max(goal.target - goal.saved, 0);
  const monthsRemaining = monthsUntil(goal.deadline, today);
  return {
    goal,
    remaining,
    monthsRemaining,
    monthlyRequiredContribution: Math.round(remaining / monthsRemaining),
    progress: goal.target > 0 ? Math.min(goal.saved / goal.target, 1) : 0,
  };
}

/** Faixa sugerida de reserva, em meses de despesas essenciais. */
export function emergencyMonthsRange(employmentType: EmploymentType | null) {
  const variable =
    employmentType === "PJ" ||
    employmentType === "Autônomo" ||
    employmentType === "Empresário" ||
    employmentType === "Desempregado";
  return variable ? ([6, 12] as const) : ([3, 6] as const);
}

export function emergencyRange(
  expenses: EssentialExpenses,
  employmentType: EmploymentType | null,
) {
  const essential = essentialTotal(expenses);
  const [minMonths, maxMonths] = emergencyMonthsRange(employmentType);
  return {
    essential,
    minMonths,
    maxMonths,
    min: essential * minMonths,
    max: essential * maxMonths,
  };
}

export type FinancialHealth = {
  status: "Confortável" | "Atenção" | "Pressionado" | "Crítico";
  tone: "green" | "yellow" | "orange" | "red";
  score: number;
  reading: string;
};

export function calculateFinancialHealth(profile: FinancialProfile, today = new Date()) {
  const income = Math.max(totalNetIncome(profile), 1);
  const essential = essentialTotal(profile.essentialExpenses);
  const cards = cardTotals(profile.creditCards, today);
  const liquidity = totalLiquidity(profile.liquidAssets);
  const habits = profile.habits.reduce((s, h) => s + habitMonthlyCost(h), 0);
  const emergency = profile.goals.find((g) => g.kind === "emergency");
  const range = emergencyRange(profile.essentialExpenses, profile.employmentType);

  let score = 100;
  score -= Math.min((essential / income) * 60, 45);
  score -= Math.min((cards.bills / income) * 45, 30);
  score -= Math.min(cards.utilization * 20, 18);
  score -= Math.min((habits / income) * 25, 15);
  if (essential > 0) score += Math.min((liquidity / essential) * 6, 18);
  if (emergency && range.min > 0) {
    score += Math.min((emergency.saved / range.min) * 14, 14);
  }
  if (profile.goals.length > 1) score += 2;
  score = Math.max(0, Math.min(100, Math.round(score)));

  const health: FinancialHealth =
    score >= 72
      ? {
          status: "Confortável",
          tone: "green",
          score,
          reading:
            "Seu momento tem folga: dá para decidir com calma e ainda avançar nos objetivos.",
        }
      : score >= 54
        ? {
            status: "Atenção",
            tone: "yellow",
            score,
            reading:
              "Dá para respirar, mas algumas decisões maiores merecem uma pausa antes do clique.",
          }
        : score >= 36
          ? {
              status: "Pressionado",
              tone: "orange",
              score,
              reading:
                "Seus compromissos ocupam boa parte da sua renda. Pequenos ajustes fazem diferença agora.",
            }
          : {
              status: "Crítico",
              tone: "red",
              score,
              reading:
                "O mês está apertado. Vale priorizar o essencial e adiar decisões que possam esperar.",
            };
  return health;
}

/** Capacidade estimada de poupança mensal. */
export function monthlySavingCapacity(profile: FinancialProfile) {
  const income = totalNetIncome(profile);
  const essential = essentialTotal(profile.essentialExpenses);
  const habits = profile.habits.reduce((s, h) => s + habitMonthlyCost(h), 0);
  const cards = cardTotals(profile.creditCards).bills;
  return Math.round(income - essential - habits - cards * 0.15);
}
