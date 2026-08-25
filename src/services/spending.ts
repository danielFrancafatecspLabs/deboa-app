import { cardTotals, essentialTotal, habitMonthlyCost, totalNetIncome } from "./financeMath";
import type { EssentialExpenses, FinancialProfile } from "./financeTypes";

/**
 * De onde sai cada real do mês.
 *
 * O Mapa pergunta o custo essencial como um número só, porque quatro
 * perguntas curtas valem mais que quarenta campos. Mas um número só não
 * responde a pergunta que vem logo depois — "onde eu estou gastando mais?" —
 * e sem essa resposta o produto vira um espelho sem foco.
 *
 * Aqui esse número vira linhas. Cada uma sabe de onde veio e como se edita,
 * então a tela pode ser leitura e formulário ao mesmo tempo.
 */

export type SpendKind = "essencial" | "nao-essencial";

export type SpendSource =
  | { type: "essential"; key: keyof EssentialExpenses }
  | { type: "subscription"; id: string }
  | { type: "habit"; id: string };

export type SpendLine = {
  id: string;
  emoji: string;
  label: string;
  /** O que a pessoa reconhece quando bate o olho — não o nome do campo. */
  hint: string;
  amount: number;
  kind: SpendKind;
  source: SpendSource;
};

/** Rótulos que uma pessoa usa, na ordem em que costumam pesar. */
export const ESSENTIAL_LINES: {
  key: keyof EssentialExpenses;
  emoji: string;
  label: string;
  hint: string;
}[] = [
  {
    key: "housing",
    emoji: "🏠",
    label: "Moradia",
    hint: "Aluguel ou financiamento, condomínio, IPTU",
  },
  {
    key: "utilities",
    emoji: "💡",
    label: "Contas de casa",
    hint: "Água, luz, gás, internet, celular",
  },
  { key: "food", emoji: "🛒", label: "Mercado", hint: "A compra do mês, feira, açougue" },
  {
    key: "transport",
    emoji: "🚌",
    label: "Transporte",
    hint: "Combustível, ônibus, metrô, app, seguro do carro",
  },
  { key: "health", emoji: "🩺", label: "Saúde", hint: "Plano, remédio de uso contínuo, terapia" },
  { key: "education", emoji: "📚", label: "Educação", hint: "Faculdade, curso, escola" },
  { key: "other", emoji: "📦", label: "Outros fixos", hint: "Pensão, empréstimo, o que mais for fixo" },
];

export type SpendingBreakdown = {
  income: number;
  /** VR + VT: crédito, não dinheiro livre. */
  benefits: number;
  /**
   * Quanto do mercado o vale-refeição cobre. Sai da conta do salário porque
   * esse dinheiro já chegou carimbado.
   */
  coveredByVoucher: number;
  /** Todas as linhas com valor, da maior para a menor. */
  lines: SpendLine[];
  /** Custo de vida completo, com ou sem benefício. */
  essential: number;
  /** A parte do essencial que sai do salário. */
  essentialFromSalary: number;
  nonEssential: number;
  subscriptions: number;
  habits: number;
  bills: number;
  /** essencial do salário + não essencial. Sem faturas: ver a nota abaixo. */
  committed: number;
  leftover: number;
  biggest: SpendLine | null;
  /** Quantas categorias essenciais ainda estão zeradas. */
  unfilled: number;
};

export function breakdown(profile: FinancialProfile, today = new Date()): SpendingBreakdown {
  const income = totalNetIncome(profile);
  const benefits = profile.benefits.mealVoucher + profile.benefits.transportVoucher;

  const lines: SpendLine[] = [];

  for (const spec of ESSENTIAL_LINES) {
    const amount = profile.essentialExpenses[spec.key];
    if (amount > 0) {
      lines.push({
        id: `essential-${spec.key}`,
        emoji: spec.emoji,
        label: spec.label,
        hint: spec.hint,
        amount,
        kind: "essencial",
        source: { type: "essential", key: spec.key },
      });
    }
  }

  for (const sub of profile.subscriptions) {
    if (sub.amount <= 0) continue;
    lines.push({
      id: `sub-${sub.id}`,
      emoji: sub.emoji,
      label: sub.name,
      hint: sub.dueDay ? `Cobra todo dia ${sub.dueDay}` : "Assinatura mensal",
      amount: sub.amount,
      kind: "nao-essencial",
      source: { type: "subscription", id: sub.id },
    });
  }

  for (const habit of profile.habits) {
    const amount = Math.round(habitMonthlyCost(habit));
    if (amount <= 0) continue;
    lines.push({
      id: `habit-${habit.id}`,
      emoji: habit.emoji,
      label: habit.label,
      hint: `${habit.frequency}x ${habit.period === "week" ? "por semana" : "por mês"} · ${brl(
        habit.unitCost,
      )} cada`,
      amount,
      kind: "nao-essencial",
      source: { type: "habit", id: habit.id },
    });
  }

  lines.sort((a, b) => b.amount - a.amount);

  const essential = essentialTotal(profile.essentialExpenses);
  const subscriptions = profile.subscriptions.reduce((s, x) => s + Math.max(x.amount, 0), 0);
  const habits = Math.round(profile.habits.reduce((s, h) => s + habitMonthlyCost(h), 0));
  const nonEssential = subscriptions + habits;

  // O VR só abate o que ele realmente compra. Sobra de vale não vira dinheiro.
  const coveredByVoucher = Math.min(profile.benefits.mealVoucher, profile.essentialExpenses.food);
  const essentialFromSalary = Math.max(essential - coveredByVoucher, 0);

  const bills = cardTotals(profile.creditCards, today).bills;
  const committed = essentialFromSalary + nonEssential;

  return {
    income,
    benefits,
    coveredByVoucher,
    lines,
    essential,
    essentialFromSalary,
    nonEssential,
    subscriptions,
    habits,
    bills,
    committed,
    leftover: Math.max(income - committed, 0),
    biggest: lines[0] ?? null,
    unfilled: ESSENTIAL_LINES.filter((s) => profile.essentialExpenses[s.key] <= 0).length,
  };
}

/**
 * Verdadeiro quando o essencial ainda é o número único das quatro perguntas:
 * moradia preenchida e todo o resto zerado. É o estado que a tela de gastos
 * existe para desfazer.
 */
export function isLumped(profile: FinancialProfile): boolean {
  const e = profile.essentialExpenses;
  const others = ESSENTIAL_LINES.filter((s) => s.key !== "housing").reduce(
    (sum, s) => sum + e[s.key],
    0,
  );
  return e.housing > 0 && others === 0;
}

function brl(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(Math.round(value));
}
