import {
  calculateFinancialHealth,
  buildTemporalContext,
  cardTotals,
  emergencyRange,
  essentialTotal,
  goalMath,
  habitMonthlyCost,
  monthlySavingCapacity,
  totalLiquidity,
  totalNetIncome,
  type FinancialHealth,
  type GoalMath,
  type TemporalContext,
} from "./financeMath";
import type { FinancialProfile, Goal, Habit } from "./financeTypes";

export type SmallWin = {
  id: string;
  emoji: string;
  title: string;
  detail: string;
  monthlySaving: number;
  habitId?: string;
  goalId?: string | null;
};

export type Insight = {
  id: string;
  text: string;
};

export type GoalImpact = GoalMath & {
  monthsSaved: number;
  coverageOfRequired: number;
};

export type FinancialReading = {
  income: number;
  essential: number;
  liquidity: number;
  habitsCost: number;
  savingCapacity: number;
  cards: ReturnType<typeof cardTotals>;
  emergency: ReturnType<typeof emergencyRange>;
  emergencyGoal: Goal | null;
  temporal: TemporalContext;
  financialStatus: FinancialHealth;
  goals: GoalMath[];
  smallWins: SmallWin[];
  totalSmallWins: number;
  insights: Insight[];
  recommendations: SmallWin[];
  goalsImpact: GoalImpact[];
};

function reducibleHabits(habits: Habit[]) {
  return [...habits].sort((a, b) => habitMonthlyCost(b) - habitMonthlyCost(a));
}

function buildSmallWins(profile: FinancialProfile, primaryGoal: Goal | null): SmallWin[] {
  const wins: SmallWin[] = [];
  for (const habit of reducibleHabits(profile.habits)) {
    const cost = habitMonthlyCost(habit);
    if (cost < 40 || habit.frequency < 2) continue;
    const targetFrequency = Math.max(1, Math.round(habit.frequency * 0.6));
    if (targetFrequency >= habit.frequency) continue;
    const saving = Math.round(
      habitMonthlyCost(habit) - habitMonthlyCost({ ...habit, frequency: targetFrequency }),
    );
    if (saving < 20) continue;
    wins.push({
      id: `win-${habit.id}`,
      emoji: habit.emoji,
      title: `Reduzir ${habit.label.toLowerCase()} de ${habit.frequency} para ${targetFrequency}${
        habit.period === "week" ? " vezes/semana" : " vezes/mês"
      }`,
      detail: `Você não precisa parar. Só ajustar o ritmo já libera dinheiro para seus objetivos.`,
      monthlySaving: saving,
      habitId: habit.id,
      goalId: primaryGoal?.id ?? null,
    });
    if (wins.length === 3) break;
  }

  if (wins.length < 3 && primaryGoal) {
    const capacity = Math.max(monthlySavingCapacity(profile), 0);
    const amount = Math.max(50, Math.round(Math.min(capacity * 0.2, 300) / 50) * 50);
    wins.push({
      id: "win-auto-save",
      emoji: "🛟",
      title: `Guardar ${amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 })} assim que receber`,
      detail: `Separar antes de gastar é o combinado mais simples que existe.`,
      monthlySaving: amount,
      goalId: primaryGoal.id,
    });
  }

  return wins.slice(0, 3);
}

export function financialInsightEngine(
  profile: FinancialProfile,
  currentDate: Date = new Date(),
): FinancialReading {
  const income = totalNetIncome(profile);
  const essential = essentialTotal(profile.essentialExpenses);
  const liquidity = totalLiquidity(profile.liquidAssets);
  const cards = cardTotals(profile.creditCards, currentDate);
  const habitsCost = Math.round(
    profile.habits.reduce((s, h) => s + habitMonthlyCost(h), 0),
  );
  const savingCapacity = monthlySavingCapacity(profile);
  const emergency = emergencyRange(profile.essentialExpenses, profile.employmentType);
  const emergencyGoal = profile.goals.find((g) => g.kind === "emergency") ?? null;
  const temporal = buildTemporalContext(profile.salaryDay, currentDate);
  const financialStatus = calculateFinancialHealth(profile, currentDate);
  const goals = profile.goals.map((g) => goalMath(g, currentDate));

  const priorityOrder = { Alta: 0, Média: 1, Baixa: 2 } as const;
  const primaryGoal =
    [...profile.goals]
      .filter((g) => g.kind !== "emergency")
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])[0] ??
    emergencyGoal ??
    null;

  const smallWins = buildSmallWins(profile, primaryGoal);
  const totalSmallWins = smallWins.reduce((s, w) => s + w.monthlySaving, 0);

  const goalsImpact: GoalImpact[] = goals.map((g) => {
    const monthsSaved =
      totalSmallWins > 0 && g.remaining > 0
        ? Math.min(
            g.monthsRemaining,
            Math.round(g.remaining / Math.max(g.monthlyRequiredContribution + totalSmallWins, 1)),
          )
        : 0;
    return {
      ...g,
      monthsSaved: Math.max(g.monthsRemaining - monthsSaved, 0),
      coverageOfRequired:
        g.monthlyRequiredContribution > 0
          ? totalSmallWins / g.monthlyRequiredContribution
          : 0,
    };
  });

  const insights: Insight[] = [];

  const topHabit = reducibleHabits(profile.habits)[0];
  if (topHabit) {
    insights.push({
      id: "top-habit",
      text: `Seu maior potencial de economia parece estar em ${topHabit.label.toLowerCase()}: cerca de ${money(
        habitMonthlyCost(topHabit),
      )} por mês.`,
    });
  }

  if (income > 0 && cards.bills / income > 0.3) {
    insights.push({
      id: "cards",
      text: `Seu cartão concentra ${(Math.min(cards.bills / income, 1) * 100).toFixed(
        0,
      )}% da sua renda líquida deste mês.`,
    });
  }

  if (emergencyGoal && emergency.min > 0) {
    const missing = Math.max(emergency.min - emergencyGoal.saved, 0);
    if (missing > 0 && savingCapacity > 0) {
      insights.push({
        id: "emergency",
        text: `Guardando ${money(savingCapacity)} por mês, você chega à reserva sugerida em aproximadamente ${Math.ceil(
          missing / savingCapacity,
        )} meses.`,
      });
    }
  }

  const nearest = [...goals]
    .filter((g) => g.remaining > 0)
    .sort((a, b) => a.remaining - b.remaining)[0];
  if (nearest) {
    insights.push({
      id: "nearest-goal",
      text: `Você está a ${money(nearest.remaining)} de completar “${nearest.goal.name}”.`,
    });
  }

  if (totalSmallWins > 0 && primaryGoal) {
    const yearly = totalSmallWins * 12;
    const share = primaryGoal.target > 0 ? yearly / primaryGoal.target : 0;
    insights.push({
      id: "small-wins",
      text: `${money(totalSmallWins)}/mês viram ${money(yearly)}/ano — isso representa ${(share * 100).toFixed(
        0,
      )}% da sua meta “${primaryGoal.name}”.`,
    });
  }

  if (temporal.daysUntilNextIncome !== null) {
    insights.push({
      id: "temporal",
      text:
        temporal.cyclePosition === "recem-recebido"
          ? "Seu dinheiro caiu há pouco. Este pode ser um bom momento para separar o valor da sua reserva."
          : `Faltam ${temporal.daysUntilNextIncome} dias até o próximo recebimento.`,
    });
  }

  if (cards.nextDueInDays !== null && cards.nextDueInDays <= 5 && cards.nextDueCard) {
    insights.push({
      id: "due",
      text: `A fatura do ${cards.nextDueCard.name} vence em ${cards.nextDueInDays} dias.`,
    });
  }

  return {
    income,
    essential,
    liquidity,
    habitsCost,
    savingCapacity,
    cards,
    emergency,
    emergencyGoal,
    temporal,
    financialStatus,
    goals,
    smallWins,
    totalSmallWins,
    insights: insights.slice(0, 5),
    recommendations: smallWins,
    goalsImpact,
  };
}

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(Math.round(value));
}
