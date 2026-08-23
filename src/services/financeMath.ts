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

/**
 * FGTS Home Buying Intelligence
 *
 * Calcula o potencial de compra de imóvel usando FGTS como parte da entrada.
 * Baseado nas regras do Programa Minha Casa Minha Vida / FGTS:
 * - Pode usar até 100% do saldo do FGTS para entrada
 * - Valor máximo de imóvel: R$ 350.000 (MCMV Faixa 3 - 2025)
 * - Financiamento máximo: ~80% do valor do imóvel
 * - Taxa de juros aproximada: 0.5% ao mês (SAC)
 * - Prazo máximo: 420 meses (35 anos)
 * - Prestação ideal: até 30% da renda líquida
 */

export type FgtsHomeAnalysis = {
  /** Valor máximo do imóvel que o usuário pode comprar */
  maxPropertyValue: number;
  /** Valor da entrada disponível (FGTS + poupança) */
  downPayment: number;
  /** Percentual de entrada */
  downPaymentPercent: number;
  /** Valor necessário de financiamento */
  financingNeeded: number;
  /** Estimativa de prestação mensal (SAC - primeira parcela) */
  estimatedMonthlyPayment: number;
  /** Percentual da renda comprometido com a prestação */
  incomeCommitmentPercent: number;
  /** Se a prestação cabe no orçamento (<= 30% da renda) */
  isAffordable: boolean;
  /** Valor que falta para tornar a compra viável */
  gapToAffordability: number;
  /** Sugestão de faixa de preço ideal */
  recommendedRange: { min: number; max: number };
  /** Tempo estimado para juntar o restante necessário */
  monthsToSaveGap: number;
  /** Score de viabilidade (0-100) */
  viabilityScore: number;
  /** Mensagem personalizada */
  message: string;
};

const FGTS_MAX_PROPERTY_VALUE = 350_000;
const FGTS_FINANCING_RATE = 0.005; // 0.5% ao mês (SAC)
const FGTS_MAX_TERM = 420; // 35 anos em meses
const FGTS_IDEAL_COMMITMENT = 0.30; // 30% da renda

/**
 * Calcula a primeira prestação de um financiamento SAC.
 * As prestações decrescem ao longo do tempo, então a primeira é a maior.
 */
function sacFirstInstallment(
  principal: number,
  monthlyRate: number,
  months: number,
): number {
  if (principal <= 0 || months <= 0) return 0;
  const amortization = principal / months;
  const firstInterest = principal * monthlyRate;
  return Math.round(amortization + firstInterest);
}

/**
 * Analisa o potencial de compra de imóvel usando FGTS.
 */
export function analyzeFgtsHomePurchase(
  fgtsBalance: number,
  netIncome: number,
  liquidAssets: { checking: number; yieldAccount: number; savings: number; investments: number; cash: number },
  essentialExpenses: EssentialExpenses,
  targetPropertyPrice?: number,
): FgtsHomeAnalysis {
  // Dinheiro disponível para entrada (FGTS + poupança + conta remunerada)
  const savingsForDownPayment =
    liquidAssets.savings + liquidAssets.yieldAccount + (liquidAssets.investments * 0.7);
  const downPayment = fgtsBalance + savingsForDownPayment;

  // Renda disponível após despesas essenciais
  const essential = essentialTotal(essentialExpenses);
  const disposableIncome = Math.max(netIncome - essential, 0);
  const maxMonthlyPayment = netIncome * FGTS_IDEAL_COMMITMENT;

  // Se o usuário especificou um imóvel alvo, calculamos a viabilidade
  if (targetPropertyPrice && targetPropertyPrice > 0) {
    const price = Math.min(targetPropertyPrice, FGTS_MAX_PROPERTY_VALUE);
    const financingNeeded = Math.max(price - downPayment, 0);
    const downPaymentPercent = price > 0 ? downPayment / price : 0;
    const estimatedMonthlyPayment = sacFirstInstallment(
      financingNeeded,
      FGTS_FINANCING_RATE,
      FGTS_MAX_TERM,
    );
    const incomeCommitmentPercent = netIncome > 0 ? estimatedMonthlyPayment / netIncome : 0;
    const isAffordable = incomeCommitmentPercent <= FGTS_IDEAL_COMMITMENT;
    const gapToAffordability = isAffordable
      ? 0
      : Math.max(
          0,
          estimatedMonthlyPayment - maxMonthlyPayment,
        );

    // Quanto tempo para juntar o gap
    const monthsToSaveGap =
      gapToAffordability > 0 && disposableIncome > 0
        ? Math.ceil(gapToAffordability / Math.max(disposableIncome * 0.3, 1))
        : 0;

    // Score de viabilidade
    let score = 0;
    if (downPaymentPercent >= 0.2) score += 40;
    else if (downPaymentPercent >= 0.1) score += 25;
    else score += 10;

    if (incomeCommitmentPercent <= 0.2) score += 35;
    else if (incomeCommitmentPercent <= 0.3) score += 25;
    else score += 10;

    if (fgtsBalance > 0) score += 15;
    if (savingsForDownPayment > 0) score += 10;

    const viabilityScore = Math.min(100, score);

    // Mensagem personalizada
    let message = "";
    if (viabilityScore >= 70) {
      message = `Com seu FGTS de ${formatMoney(fgtsBalance)} e sua poupança, você tem uma boa entrada de ${formatMoney(downPayment)}. O financiamento cabe no seu orçamento! 🏠`;
    } else if (viabilityScore >= 40) {
      message = `Você já tem ${formatMoney(downPayment)} de entrada (${(downPaymentPercent * 100).toFixed(0)}% do imóvel). Com mais alguns meses de planejamento, sua compra fica viável.`;
    } else {
      message = `Seu FGTS de ${formatMoney(fgtsBalance)} é um ótimo começo! Sugiro explorar imóveis um pouco abaixo desse valor ou fortalecer sua poupança por mais alguns meses.`;
    }

    // Faixa recomendada
    const recommendedMax = Math.min(
      FGTS_MAX_PROPERTY_VALUE,
      Math.round(downPayment / 0.2), // 20% de entrada
    );
    const recommendedMin = Math.round(recommendedMax * 0.6);

    return {
      maxPropertyValue: price,
      downPayment: Math.round(downPayment),
      downPaymentPercent: Math.round(downPaymentPercent * 100) / 100,
      financingNeeded: Math.round(financingNeeded),
      estimatedMonthlyPayment,
      incomeCommitmentPercent: Math.round(incomeCommitmentPercent * 100) / 100,
      isAffordable,
      gapToAffordability: Math.round(gapToAffordability),
      recommendedRange: { min: recommendedMin, max: recommendedMax },
      monthsToSaveGap,
      viabilityScore,
      message,
    };
  }

  // Sem imóvel alvo: calcula o máximo que pode pagar
  // Encontra o maior valor de imóvel onde a prestação cabe em 30% da renda
  let maxPropertyValue = 0;
  let bestFinancing = 0;
  let bestPayment = 0;

  // Busca binária para encontrar o valor máximo
  let low = 0;
  let high = FGTS_MAX_PROPERTY_VALUE;
  for (let i = 0; i < 50; i++) {
    const mid = Math.round((low + high) / 2);
    const financing = Math.max(mid - downPayment, 0);
    const payment = sacFirstInstallment(financing, FGTS_FINANCING_RATE, FGTS_MAX_TERM);
    if (payment <= maxMonthlyPayment) {
      maxPropertyValue = mid;
      bestFinancing = financing;
      bestPayment = payment;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const downPaymentPercent = maxPropertyValue > 0 ? downPayment / maxPropertyValue : 0;
  const incomeCommitmentPercent = netIncome > 0 ? bestPayment / netIncome : 0;
  const isAffordable = incomeCommitmentPercent <= FGTS_IDEAL_COMMITMENT;
  const gapToAffordability = 0;

  let score = 0;
  if (downPaymentPercent >= 0.2) score += 40;
  else if (downPaymentPercent >= 0.1) score += 25;
  else score += 10;
  if (incomeCommitmentPercent <= 0.2) score += 35;
  else if (incomeCommitmentPercent <= 0.3) score += 25;
  else score += 10;
  if (fgtsBalance > 0) score += 15;
  if (savingsForDownPayment > 0) score += 10;
  const viabilityScore = Math.min(100, score);

  let message = "";
  if (maxPropertyValue >= 150_000) {
    message = `Com seu FGTS de ${formatMoney(fgtsBalance)}, você pode financiar um imóvel de até ${formatMoney(maxPropertyValue)}! 🏠`;
  } else if (maxPropertyValue > 0) {
    message = `Com seu FGTS, você já pode começar a pensar em um imóvel de até ${formatMoney(maxPropertyValue)}. Que tal definir esse objetivo?`;
  } else {
    message = `Seu FGTS de ${formatMoney(fgtsBalance)} é um ótimo começo. Continue fortalecendo sua poupança para dar o próximo passo.`;
  }

  const recommendedMax = Math.min(
    FGTS_MAX_PROPERTY_VALUE,
    Math.round(downPayment / 0.2),
  );
  const recommendedMin = Math.round(recommendedMax * 0.6);

  return {
    maxPropertyValue: Math.round(maxPropertyValue),
    downPayment: Math.round(downPayment),
    downPaymentPercent: Math.round(downPaymentPercent * 100) / 100,
    financingNeeded: Math.round(bestFinancing),
    estimatedMonthlyPayment: Math.round(bestPayment),
    incomeCommitmentPercent: Math.round(incomeCommitmentPercent * 100) / 100,
    isAffordable,
    gapToAffordability: 0,
    recommendedRange: { min: recommendedMin, max: recommendedMax },
    monthsToSaveGap: 0,
    viabilityScore,
    message,
  };
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(Math.round(value));
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
