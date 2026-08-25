import type {
  CardBrand,
  EmploymentType,
  FinancialProfile,
  Goal,
} from "@/services/financeTypes";

export const EMPLOYMENT_TYPES: EmploymentType[] = [
  "CLT",
  "PJ",
  "Autônomo",
  "Empresário",
  "Estudante",
  "Desempregado",
  "Outro",
];

export const EMPLOYMENT_DURATIONS = [
  "Menos de 6 meses",
  "6 meses a 1 ano",
  "1 a 2 anos",
  "2 a 5 anos",
  "5 a 10 anos",
  "Mais de 10 anos",
] as const;

export const INCOME_SOURCE_SUGGESTIONS = [
  "Freelances",
  "Comissões",
  "PPR/PLR",
  "Aluguéis",
  "Rendimentos",
  "Vale/benefícios em dinheiro",
  "Outros",
];

export const CARD_BRANDS: CardBrand[] = [
  "Visa",
  "Mastercard",
  "Elo",
  "American Express",
  "Hipercard",
  "Outra",
];

export const CARD_ISSUERS = [
  "Nubank",
  "Itaú",
  "Bradesco",
  "Santander",
  "Inter",
  "C6",
  "Caixa",
  "Banco do Brasil",
  "Mercado Pago",
  "PicPay",
  "Outro",
];

export const ESSENTIAL_FIELDS = [
  { key: "housing", label: "Moradia" },
  { key: "food", label: "Alimentação" },
  { key: "transport", label: "Transporte" },
  { key: "utilities", label: "Contas básicas" },
  { key: "health", label: "Saúde" },
  { key: "education", label: "Educação" },
  { key: "other", label: "Outros essenciais" },
] as const;

export const LIQUID_FIELDS = [
  { key: "checking", label: "Conta corrente" },
  { key: "yieldAccount", label: "Conta remunerada" },
  { key: "savings", label: "Poupança" },
  { key: "investments", label: "Investimentos líquidos" },
  { key: "cash", label: "Dinheiro em espécie" },
] as const;

export const HABIT_CATALOG = [
  { key: "eating_out", emoji: "🍔", label: "Alimentação fora", unitCost: 45, frequency: 2, period: "week" as const },
  { key: "delivery", emoji: "🍟", label: "Delivery", unitCost: 45, frequency: 10, period: "month" as const },
  { key: "rides", emoji: "🚗", label: "Uber/99", unitCost: 25, frequency: 5, period: "week" as const },
  { key: "shopping", emoji: "🛍️", label: "Compras", unitCost: 150, frequency: 1, period: "month" as const },
  { key: "entertainment", emoji: "🎮", label: "Entretenimento", unitCost: 60, frequency: 2, period: "month" as const },
  { key: "coffee", emoji: "☕", label: "Cafés", unitCost: 12, frequency: 4, period: "week" as const },
  { key: "subscriptions", emoji: "📱", label: "Assinaturas", unitCost: 39, frequency: 3, period: "month" as const },
  { key: "leisure", emoji: "🍺", label: "Lazer", unitCost: 90, frequency: 2, period: "month" as const },
  { key: "travel", emoji: "✈️", label: "Viagens", unitCost: 400, frequency: 1, period: "month" as const },
  { key: "beauty", emoji: "💄", label: "Beleza", unitCost: 80, frequency: 1, period: "month" as const },
  { key: "clothes", emoji: "👕", label: "Roupas", unitCost: 150, frequency: 1, period: "month" as const },
  { key: "other", emoji: "✨", label: "Outro", unitCost: 50, frequency: 1, period: "month" as const },
];

export const GOAL_TEMPLATES = [
  { emoji: "🏠", name: "Comprar minha casa", target: 200000, kind: "home" as const },
  { emoji: "✈️", name: "Fazer uma viagem", target: 15000, kind: "custom" as const },
  { emoji: "🚗", name: "Comprar um carro", target: 45000, kind: "custom" as const },
  { emoji: "🎓", name: "Estudar", target: 5000, kind: "custom" as const },
  { emoji: "💰", name: "Criar reserva de emergência", target: 12000, kind: "custom" as const },
  { emoji: "🌴", name: "Aposentadoria", target: 100000, kind: "custom" as const },
  { emoji: "💻", name: "Comprar algo importante", target: 6000, kind: "custom" as const },
  { emoji: "❤️", name: "Casamento", target: 30000, kind: "custom" as const },
  { emoji: "🚀", name: "Abrir um negócio", target: 25000, kind: "custom" as const },
  { emoji: "🎯", name: "Outro objetivo", target: 3000, kind: "custom" as const },
];

function futureMonth(monthsAhead: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsAhead);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export const EMERGENCY_GOAL: Goal = {
  id: "goal-emergency",
  emoji: "🛟",
  name: "Reserva de emergência",
  target: 12000,
  saved: 0,
  deadline: futureMonth(18),
  priority: "Alta",
  kind: "emergency",
  homeDetails: null,
};

export const EMPTY_PROFILE: FinancialProfile = {
  financialDataSource: "manual",
  completedSteps: 0,
  completed: false,

  age: null,
  employmentType: null,
  employmentDuration: null,

  netIncome: 0,
  incomeSources: [],
  knowsGross: null,
  grossIncome: null,
  salaryDay: null,

  fgtsBalance: 0,

  liquidAssets: {
    checking: 0,
    yieldAccount: 0,
    savings: 0,
    investments: 0,
    cash: 0,
  },
  creditCards: [],

  essentialExpenses: {
    housing: 0,
    food: 0,
    transport: 0,
    utilities: 0,
    health: 0,
    education: 0,
    other: 0,
  },
  habits: [],
  goals: [EMERGENCY_GOAL],
  pacts: [],
  plans: [],

  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
};

export const STEPS = [
  { id: 0, title: "Você", question: "Vamos começar por você." },
  { id: 1, title: "Sua renda", question: "Quanto entra na sua conta por mês?" },
  { id: 2, title: "Seu dinheiro", question: "Quanto dinheiro você tem disponível hoje?" },
  { id: 3, title: "Seus cartões", question: "Como está seu crédito hoje?" },
  { id: 4, title: "Seus objetivos", question: "Por que você quer organizar melhor seu dinheiro?" },
  { id: 5, title: "Seus hábitos", question: "Como seu dinheiro costuma escapar?" },
  { id: 6, title: "Seu plano", question: "Pequenos combinados para começar." },
] as const;
