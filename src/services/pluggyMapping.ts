import { ESSENTIAL_LINES } from "./spending";
import type {
  CreditCard,
  EssentialExpenses,
  FinancialProfile,
  Subscription,
} from "./financeTypes";
import type { PluggyAccount, PluggySnapshot, PluggyTransaction } from "./pluggyTypes";

/**
 * Do extrato para o Mapa.
 *
 * O que a Pluggy entrega é o que a pessoa faria à mão, e melhor: saldos,
 * faturas e transações já categorizadas. O trabalho aqui é traduzir isso para
 * o modelo do DeBoa sem inventar nada.
 *
 * Duas regras governam este arquivo:
 *
 * 1. **Proposta, nunca imposição.** Nada sobrescreve o perfil sozinho. Isto
 *    devolve uma sugestão com a origem de cada número, e a pessoa confirma.
 *    Um extrato de dois meses não sabe do aluguel que subiu ontem.
 * 2. **O que não deu para classificar aparece.** A taxonomia de categorias da
 *    Pluggy muda com o tempo e varia por instituição; adivinhar em silêncio
 *    produziria um custo essencial errado com cara de certo. O que sobra vai
 *    para uma lista que a interface mostra.
 */

/* ------------------------------- Categorias ------------------------------- */

type Bucket = keyof EssentialExpenses | "renda" | "assinatura" | "diaadia" | "transferencia";

/**
 * Palavras, não códigos.
 *
 * A Pluggy devolve `category` como texto ("Rent", "Aluguel", "Groceries"…) e o
 * conjunto exato depende do conector e do idioma da conta. Casar por palavra em
 * português e inglês sobrevive a isso; casar por id fixo não sobreviveria.
 *
 * A distinção entre `prefix` e `exact` é a parte que erra sozinha se ficar
 * implícita: "salar" precisa pegar "salário" e "Salary", mas "gas" não pode
 * pegar "gasolina" — que é transporte, não conta de casa. Prefixo abre a
 * palavra pela esquerda; exato fecha dos dois lados.
 *
 * Os termos são sem acento porque o texto chega normalizado.
 */
type Rule = { bucket: Bucket; prefix?: string[]; exact?: string[] };

const RULES: Rule[] = [
  {
    bucket: "renda",
    prefix: ["salar", "salary", "payroll", "provento", "remunera", "pro labore", "prolabore"],
    exact: ["income", "13o", "ferias"],
  },
  {
    bucket: "transferencia",
    prefix: ["transfer", "investiment", "resgate", "aplicacao"],
    exact: ["pix", "ted", "doc", "investment"],
  },

  {
    bucket: "housing",
    prefix: ["aluguel", "mortgage", "financiamento imobili", "condomin", "housing", "moradia"],
    exact: ["rent", "condo", "iptu"],
  },
  {
    bucket: "utilities",
    prefix: [
      "utilit", "electric", "energia", "water", "internet", "telecom", "telefon", "celular",
      "saneamento", "banda larga",
    ],
    // "luz" e "gas" só como palavra inteira: "gasolina" é transporte.
    exact: ["luz", "gas", "agua", "phone"],
  },
  {
    bucket: "food",
    prefix: ["groceri", "supermerc", "hortifruti", "acougue", "padaria", "quitanda"],
    exact: ["mercado", "feira", "supermarket"],
  },
  {
    bucket: "transport",
    prefix: [
      "transport", "combustivel", "gasolina", "posto", "estacionamento", "pedagio", "metro",
      "onibus", "seguro auto", "aluguel de carro",
    ],
    exact: ["fuel", "uber", "99", "taxi", "bus", "ipva", "cabify"],
  },
  {
    bucket: "health",
    prefix: ["health", "saude", "pharmac", "farmacia", "drogaria", "hospital", "medic", "dentist", "terapia", "psic", "unimed"],
  },
  {
    bucket: "education",
    prefix: ["education", "educacao", "escola", "faculdade", "universit", "mensalidade", "tuition", "livraria"],
    exact: ["school", "curso", "cursos"],
  },

  {
    bucket: "assinatura",
    prefix: [
      "subscription", "assinatura", "streaming", "netflix", "spotify", "disney", "deezer",
      "youtube premium", "apple tv", "apple music", "apple one", "icloud", "google one",
      "dropbox", "academia", "smart fit", "smartfit", "playstation", "nintendo", "prime video",
    ],
    exact: ["hbo", "max", "gym", "xbox"],
  },
  {
    bucket: "diaadia",
    prefix: [
      "restaurant", "delivery", "ifood", "rappi", "cafe", "coffee", "starbucks", "lanche",
      "fast food", "leisure", "lazer", "entertainment", "cinema", "shopping", "vestuario",
      "clothing", "beleza", "barbearia", "salao", "padoca",
    ],
    exact: ["food", "bar", "bares"],
  },
];

/** Prefixo abre pela esquerda; exato fecha dos dois lados. */
function toRegExp(rule: Rule): RegExp {
  const parts: string[] = [];
  if (rule.prefix?.length) parts.push(`\\b(?:${rule.prefix.join("|")})`);
  if (rule.exact?.length) parts.push(`\\b(?:${rule.exact.join("|")})\\b`);
  return new RegExp(parts.join("|"), "i");
}

const MATCHERS = RULES.map((rule) => ({ bucket: rule.bucket, test: toRegExp(rule) }));

/** Sem acento: "Alimentação" e "alimentacao" viram a mesma coisa. */
function normalise(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function classify(transaction: PluggyTransaction): Bucket | null {
  const haystack = normalise(
    [transaction.category, transaction.merchant?.category, transaction.description]
      .filter(Boolean)
      .join(" · "),
  );
  for (const matcher of MATCHERS) {
    if (matcher.test.test(haystack)) return matcher.bucket;
  }
  return null;
}

/* --------------------------------- Contas --------------------------------- */

function toCreditCard(account: PluggyAccount): CreditCard {
  const credit = account.creditData;
  const limit = Math.max(credit?.creditLimit ?? 0, 0);
  const available = Math.max(credit?.availableCreditLimit ?? 0, 0);
  return {
    id: `pluggy-${account.id}`,
    name: account.marketingName || account.name || "Cartão",
    // A Pluggy devolve texto livre aqui; o modelo do DeBoa tem lista fechada.
    brand: matchBrand(credit?.brand),
    issuer: account.name || "",
    // Fatura vem negativa em várias instituições: é dívida, não saldo.
    currentBill: Math.round(Math.abs(account.balance)),
    limit: Math.round(limit),
    // O comprometido é o que o limite já não tem mais.
    committed: Math.round(Math.max(limit - available, 0)),
    dueDay: dayOf(credit?.balanceDueDate) ?? 10,
    bestDay: dayOf(credit?.balanceCloseDate) ?? 1,
  };
}

const BRANDS = ["Visa", "Mastercard", "Elo", "American Express", "Hipercard"] as const;

function matchBrand(raw: string | null | undefined): CreditCard["brand"] {
  if (!raw) return "Outra";
  const value = normalise(raw).toLowerCase();
  const hit = BRANDS.find((b) => value.includes(normalise(b).toLowerCase()));
  if (hit) return hit;
  if (/amex/.test(value)) return "American Express";
  return "Outra";
}

function dayOf(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date.getDate();
}

/* ------------------------------- Recorrência ------------------------------ */

/** Chave que junta o mesmo gasto em meses diferentes. */
function recurrenceKey(t: PluggyTransaction): string {
  const name = t.merchant?.name ?? t.description;
  return normalise(name)
    .toLowerCase()
    .replace(/\d+/g, "")
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

/* --------------------------------- Proposta ------------------------------- */

export type ProposedSubscription = Subscription & { evidence: string };

export type MappingProposal = {
  /** Quantos meses de extrato entraram na conta. */
  months: number;
  netIncome: number | null;
  salaryDay: number | null;
  checking: number;
  savings: number;
  creditCards: CreditCard[];
  essentialExpenses: Partial<EssentialExpenses>;
  subscriptions: ProposedSubscription[];
  /** Média mensal de gastos do dia a dia que não viraram categoria fixa. */
  everyday: number;
  /**
   * O que o classificador não reconheceu, agrupado e com o quanto pesa. É o
   * que a tela pede para a pessoa classificar.
   */
  unclassified: { label: string; monthly: number; sample: string }[];
};

const IGNORE = new Set<Bucket>(["transferencia"]);

export function proposeFromSnapshot(
  snapshot: PluggySnapshot,
  today = new Date(),
): MappingProposal {
  const accounts = snapshot.accounts;
  const bank = accounts.filter((a) => a.type === "BANK");
  const checking = bank
    .filter((a) => a.subtype !== "SAVINGS_ACCOUNT")
    .reduce((s, a) => s + Math.max(a.balance, 0), 0);
  const savings = bank
    .filter((a) => a.subtype === "SAVINGS_ACCOUNT")
    .reduce((s, a) => s + Math.max(a.balance, 0), 0);

  const creditCards = accounts.filter((a) => a.type === "CREDIT").map(toCreditCard);

  // Meses completos apenas: o mês corrente está pela metade e puxaria toda
  // média para baixo.
  const thisMonth = monthKey(today.toISOString());
  const usable = snapshot.transactions.filter((t) => monthKey(t.date) !== thisMonth);
  const months = new Set(usable.map((t) => monthKey(t.date))).size || 1;

  /* Renda: entradas reconhecidas como salário. */
  const salaries = usable.filter((t) => t.type === "CREDIT" && classify(t) === "renda");
  const byMonth = new Map<string, number>();
  for (const t of salaries) {
    const key = monthKey(t.date);
    byMonth.set(key, (byMonth.get(key) ?? 0) + Math.abs(t.amount));
  }
  const monthly = [...byMonth.values()].sort((a, b) => a - b);
  const netIncome = monthly.length
    ? Math.round(monthly[Math.floor(monthly.length / 2)]!)
    : null;
  const salaryDay = salaries.length ? modeOf(salaries.map((t) => new Date(t.date).getDate())) : null;

  /* Gastos: média mensal por categoria. */
  const spendByBucket = new Map<Bucket, number>();
  const unknown = new Map<string, { total: number; sample: string }>();
  const recurring = new Map<
    string,
    { amounts: number[]; months: Set<string>; label: string; day: number | null }
  >();

  for (const t of usable) {
    if (t.type !== "DEBIT") continue;
    const amount = Math.abs(t.amount);
    if (amount <= 0) continue;

    const bucket = classify(t);
    if (bucket && IGNORE.has(bucket)) continue;

    if (bucket && bucket !== "renda") {
      spendByBucket.set(bucket, (spendByBucket.get(bucket) ?? 0) + amount);
    } else if (!bucket) {
      const key = recurrenceKey(t) || "outros";
      const prev = unknown.get(key);
      unknown.set(key, {
        total: (prev?.total ?? 0) + amount,
        sample: prev?.sample ?? (t.merchant?.name ?? t.description),
      });
    }

    // Candidatos a assinatura: mesmo nome, valor parecido, um por mês.
    const key = recurrenceKey(t);
    if (key) {
      const entry = recurring.get(key) ?? {
        amounts: [],
        months: new Set<string>(),
        label: t.merchant?.name ?? t.description,
        day: new Date(t.date).getDate(),
      };
      entry.amounts.push(amount);
      entry.months.add(monthKey(t.date));
      recurring.set(key, entry);
    }
  }

  const essentialExpenses: Partial<EssentialExpenses> = {};
  for (const line of ESSENTIAL_LINES) {
    const total = spendByBucket.get(line.key);
    if (total) essentialExpenses[line.key] = Math.round(total / months);
  }

  const subscriptions: ProposedSubscription[] = [];
  for (const [, entry] of recurring) {
    // Precisa aparecer na maioria dos meses e com valor estável — senão é
    // só um lugar onde a pessoa compra sempre, não uma assinatura.
    if (months < 2 || entry.months.size < Math.min(months, 2)) continue;
    const avg = entry.amounts.reduce((s, a) => s + a, 0) / entry.amounts.length;
    const spread = Math.max(...entry.amounts) - Math.min(...entry.amounts);
    if (avg < 5 || spread > avg * 0.15) continue;
    subscriptions.push({
      id: `pluggy-${normalise(entry.label).toLowerCase().replace(/\W+/g, "-").slice(0, 24)}`,
      emoji: "📺",
      name: entry.label.slice(0, 40),
      amount: Math.round(avg),
      dueDay: entry.day,
      evidence: `Apareceu em ${entry.months.size} ${entry.months.size === 1 ? "mês" : "meses"}`,
    });
  }
  subscriptions.sort((a, b) => b.amount - a.amount);

  const everyday = Math.round((spendByBucket.get("diaadia") ?? 0) / months);

  const unclassified = [...unknown.entries()]
    .map(([, v]) => ({
      label: v.sample.slice(0, 40),
      monthly: Math.round(v.total / months),
      sample: v.sample,
    }))
    .filter((u) => u.monthly >= 20)
    .sort((a, b) => b.monthly - a.monthly)
    .slice(0, 12);

  return {
    months,
    netIncome,
    salaryDay,
    checking: Math.round(checking),
    savings: Math.round(savings),
    creditCards,
    essentialExpenses,
    subscriptions,
    everyday,
    unclassified,
  };
}

function modeOf(values: number[]): number | null {
  if (values.length === 0) return null;
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]![0];
}

/**
 * Aplica só o que a pessoa marcou.
 *
 * Recebe a proposta e o conjunto de chaves aceitas, e devolve o patch. Cartões
 * vindos da Pluggy substituem os que já tinham vindo da Pluggy, e preservam os
 * que a pessoa digitou à mão — reconectar o banco não pode apagar trabalho
 * manual.
 */
export function applyProposal(
  profile: FinancialProfile,
  proposal: MappingProposal,
  accepted: Set<string>,
): Partial<FinancialProfile> {
  const patch: Partial<FinancialProfile> = { financialDataSource: "open_finance" };

  if (accepted.has("renda") && proposal.netIncome !== null) {
    patch.netIncome = proposal.netIncome;
    if (proposal.salaryDay !== null) patch.salaryDay = proposal.salaryDay;
  }

  if (accepted.has("saldo")) {
    patch.liquidAssets = {
      ...profile.liquidAssets,
      checking: proposal.checking,
      savings: proposal.savings,
    };
  }

  if (accepted.has("cartoes") && proposal.creditCards.length > 0) {
    const manual = profile.creditCards.filter((c) => !c.id.startsWith("pluggy-"));
    patch.creditCards = [...manual, ...proposal.creditCards];
  }

  const essentialKeys = ESSENTIAL_LINES.map((l) => l.key).filter((k) =>
    accepted.has(`essencial:${k}`),
  );
  if (essentialKeys.length > 0) {
    const next = { ...profile.essentialExpenses };
    for (const key of essentialKeys) {
      const value = proposal.essentialExpenses[key];
      if (value !== undefined) next[key] = value;
    }
    patch.essentialExpenses = next;
  }

  const subs = proposal.subscriptions.filter((s) => accepted.has(`assinatura:${s.id}`));
  if (subs.length > 0) {
    const kept = profile.subscriptions.filter((s) => !subs.some((n) => n.id === s.id));
    patch.subscriptions = [
      ...kept,
      ...subs.map(({ evidence: _evidence, ...sub }) => sub),
    ];
  }

  return patch;
}
