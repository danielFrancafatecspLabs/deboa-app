/**
 * Contratos da camada de contexto financeiro do DeBoa.
 * Toda a origem dos dados é abstraída em `financialDataSource` para permitir,
 * no futuro, alimentar o mesmo modelo via Open Finance sem reescrever o
 * Decision Engine.
 */

export type FinancialDataSource =
  | "manual"
  | "open_finance"
  | "bank_api"
  | "credit_card_api"
  | "transaction_import";

export type EmploymentType =
  | "CLT"
  | "PJ"
  | "Autônomo"
  | "Empresário"
  | "Estudante"
  | "Desempregado"
  | "Outro";

export type EmploymentDuration =
  | "Menos de 6 meses"
  | "6 meses a 1 ano"
  | "1 a 2 anos"
  | "2 a 5 anos"
  | "5 a 10 anos"
  | "Mais de 10 anos";

export type IncomeFrequency = "Mensal" | "Quinzenal" | "Semanal" | "Variável" | "Anual";

export type IncomeSource = {
  id: string;
  name: string;
  amount: number;
  frequency: IncomeFrequency;
  payDay?: number | null;
};

export type LiquidAssets = {
  checking: number;
  yieldAccount: number;
  savings: number;
  investments: number;
  cash: number;
};

export type CardBrand =
  | "Visa"
  | "Mastercard"
  | "Elo"
  | "American Express"
  | "Hipercard"
  | "Outra";

export type CreditCard = {
  id: string;
  name: string;
  brand: CardBrand;
  issuer: string;
  currentBill: number;
  limit: number;
  committed: number;
  dueDay: number;
  bestDay: number;
};

export type EssentialExpenses = {
  housing: number;
  food: number;
  transport: number;
  utilities: number;
  health: number;
  education: number;
  other: number;
};

/**
 * Um gasto fixo que se repete e não é essencial: streaming, academia,
 * nuvem, jogo. Sai todo mês igual, mas cancelar é uma escolha — e é por
 * isso que ele não mora junto do aluguel.
 */
export type Subscription = {
  id: string;
  emoji: string;
  name: string;
  /** Valor mensal. */
  amount: number;
  /** Dia da cobrança, quando a pessoa sabe. */
  dueDay: number | null;
};

/**
 * Benefícios que entram como crédito e não como dinheiro.
 *
 * VR e VT não são renda livre: só compram uma coisa. Tratar R$ 800 de
 * vale-refeição como salário faz o DeBoa achar que sobra mais do que sobra;
 * ignorá-los faz achar que o mercado pesa mais do que pesa.
 */
export type Benefits = {
  /** Vale-refeição / alimentação por mês. */
  mealVoucher: number;
  /** Vale-transporte por mês. */
  transportVoucher: number;
};

export type HabitPeriod = "week" | "month";

export type Habit = {
  id: string;
  key: string;
  emoji: string;
  label: string;
  frequency: number;
  unitCost: number;
  period: HabitPeriod;
};

export type GoalPriority = "Alta" | "Média" | "Baixa";

export type Goal = {
  id: string;
  emoji: string;
  name: string;
  target: number;
  saved: number;
  /** yyyy-mm */
  deadline: string;
  priority: GoalPriority;
  kind: "emergency" | "custom" | "home";
  /** Campos específicos para objetivo de compra de imóvel */
  homeDetails: {
    /** Valor estimado do imóvel desejado */
    propertyValue: number;
    /** Usar FGTS como parte da entrada */
    useFgts: boolean;
    /** Valor adicional de entrada (poupança, etc) */
    additionalDownPayment: number;
    /** Cidade/região do imóvel */
    location?: string;
  } | null;
};

export type Pact = {
  id: string;
  title: string;
  detail: string;
  monthlySaving: number;
  goalId: string | null;
  createdAt: string;
};

/** Quanto vai para uma caixinha em um mês. */
export type PlanAllocation = {
  goalId: string;
  amount: number;
};

/**
 * O plano de um mês: como o dinheiro que entrou foi dividido.
 *
 * É o contrário de uma planilha de gastos. Não registra o que saiu — decide,
 * uma vez, para onde vai, e a partir daí a única pergunta que importa é
 * quanto sobrou livre.
 */
export type MonthPlan = {
  /** yyyy-mm */
  month: string;
  /** Renda considerada quando o plano foi fechado. */
  income: number;
  essentials: number;
  bills: number;
  /** Opcional: planos fechados antes das assinaturas existirem não têm. */
  subscriptions?: number;
  allocations: PlanAllocation[];
  /** Combinados que a pessoa assumiu para este mês. */
  pactIds: string[];
  closedAt: string;
};

export type FinancialProfile = {
  financialDataSource: FinancialDataSource;
  completedSteps: number;
  completed: boolean;

  age: number | null;
  employmentType: EmploymentType | null;
  employmentDuration: EmploymentDuration | null;

  netIncome: number;
  incomeSources: IncomeSource[];
  knowsGross: boolean | null;
  grossIncome: number | null;
  salaryDay: number | null;

  fgtsBalance: number;

  liquidAssets: LiquidAssets;
  creditCards: CreditCard[];

  essentialExpenses: EssentialExpenses;
  subscriptions: Subscription[];
  benefits: Benefits;
  habits: Habit[];
  goals: Goal[];
  pacts: Pact[];
  /** Um por mês, do mais recente para o mais antigo. */
  plans: MonthPlan[];

  createdAt: string;
  updatedAt: string;
};
