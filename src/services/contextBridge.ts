import {
  cardTotals,
  essentialTotal,
  goalMath,
  totalLiquidity,
  totalNetIncome,
} from "./financeMath";
import { financialInsightEngine } from "./financialInsightEngine";
import { currentMonth, findPlan, planAllocated, planFree } from "./monthPlan";
import type { FinancialProfile } from "./financeTypes";
import type { ProductContext, UserContext } from "./types";

/**
 * Ponte entre o Mapa Financeiro e o Decision Engine.
 * Converte o perfil detalhado no contexto enxuto consumido pelo agente,
 * sem que o Decision Engine precise conhecer a origem dos dados.
 */
export function toUserContext(profile: FinancialProfile, today = new Date()): UserContext {
  const income = totalNetIncome(profile);
  const cards = cardTotals(profile.creditCards, today);
  const essential = essentialTotal(profile.essentialExpenses);

  // Com um plano fechado no mês, "disponível" deixa de ser tudo que a pessoa
  // tem e passa a ser o que ela decidiu que pode gastar. É uma resposta muito
  // mais dura e muito mais justa: R$ 899 num saldo de R$ 2.800 parece
  // sustentável; nos R$ 640 que sobraram livres, não parece.
  const plan = findPlan(profile, currentMonth(today));
  if (plan) {
    return {
      monthlyIncome: plan.income,
      availableBalance: Math.round(planFree(plan)),
      monthlyGoal: Math.round(planAllocated(plan)),
      upcomingCommitments: Math.round(plan.essentials + plan.bills),
    };
  }

  const goals = profile.goals.map((g) => goalMath(g, today));
  const monthlyGoal = goals.reduce((s, g) => s + g.monthlyRequiredContribution, 0);
  return {
    monthlyIncome: income,
    availableBalance: Math.round(totalLiquidity(profile.liquidAssets)),
    monthlyGoal: Math.round(monthlyGoal),
    upcomingCommitments: Math.round(essential + cards.bills),
  };
}

/** Frases contextuais que o agente usa durante uma intervenção. */
export function contextualNotes(
  profile: FinancialProfile,
  product: ProductContext,
): string[] {
  const reading = financialInsightEngine(profile);
  const notes: string[] = [];

  const plan = findPlan(profile, currentMonth());
  if (plan) {
    const free = planFree(plan);
    notes.push(
      free > 0
        ? `Do que você separou como livre neste mês sobram ${brl(free)} — essa compra é ${Math.round(
            (product.price / free) * 100,
          )}% disso.`
        : "Você já usou todo o livre que separou para este mês.",
    );
  }

  const priority = { Alta: 0, Média: 1, Baixa: 2 } as const;
  const goal = [...reading.goals]
    .filter((g) => g.remaining > 0)
    .sort((a, b) => priority[a.goal.priority] - priority[b.goal.priority])[0];

  if (goal) {
    const monthsDelay =
      goal.monthlyRequiredContribution > 0
        ? product.price / goal.monthlyRequiredContribution
        : 0;
    notes.push(
      `Eu sei que você quer ${goal.goal.name.toLowerCase()} e ainda faltam ${brl(goal.remaining)}.`,
    );
    if (monthsDelay >= 0.5) {
      // pt-BR uses a comma for decimals, and "mês(es)" is placeholder grammar
      // that made it all the way into the product.
      const amount = monthsDelay.toFixed(1).replace(".", ",");
      const unit = monthsDelay < 2 ? "mês" : "meses";
      notes.push(
        `Essa compra equivale a cerca de ${amount} ${unit} do que você precisa guardar para esse objetivo.`,
      );
    }
  }

  if (reading.temporal.daysUntilNextIncome !== null) {
    notes.push(
      reading.temporal.cyclePosition === "recem-recebido"
        ? "Seu dinheiro caiu há pouco — bom momento para separar a reserva antes de gastar."
        : `Faltam ${reading.temporal.daysUntilNextIncome} dias até o próximo recebimento.`,
    );
  }

  if (reading.cards.nextDueInDays !== null && reading.cards.nextDueInDays <= 7) {
    notes.push(`Sua próxima fatura vence em ${reading.cards.nextDueInDays} dias.`);
  }

  notes.push(`Leitura do DeBoa hoje: ${reading.financialStatus.status.toLowerCase()}.`);

  return notes.slice(0, 4);
}

function brl(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(Math.round(value));
}
