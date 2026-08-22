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
  kind: "emergency" | "custom";
};

export type Pact = {
  id: string;
  title: string;
  detail: string;
  monthlySaving: number;
  goalId: string | null;
  createdAt: string;
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
  habits: Habit[];
  goals: Goal[];
  pacts: Pact[];

  createdAt: string;
  updatedAt: string;
};
