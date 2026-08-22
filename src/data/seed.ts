import type { DecisionRecord, UserContext } from "@/services/types";

export const DEFAULT_CONTEXT: UserContext = {
  monthlyIncome: 5000,
  availableBalance: 2800,
  monthlyGoal: 1500,
  upcomingCommitments: 1400,
};

export const FEATURED_PRODUCT = {
  name: "Apple AirPods Pro",
  price: 1899,
  category: "Tecnologia",
  merchant: "Apple Store",
};

export const SECOND_PRODUCT = {
  name: "Tênis",
  price: 399,
  category: "Moda",
  merchant: "Loja de esportes",
};

export const CATEGORIES = [
  "Tecnologia",
  "Moda",
  "Alimentação",
  "Viagem",
  "Entretenimento",
  "Casa",
  "Outro",
] as const;

export const SEED_HISTORY: DecisionRecord[] = [
  {
    id: "seed-airpods",
    product: "AirPods Pro",
    price: 1899,
    category: "Tecnologia",
    recommendation: "WAIT",
    headline: "Eu pensaria duas vezes.",
    finalDecision: "WAITED",
    helpful: true,
    createdAt: "2026-08-12T14:20:00.000Z",
  },
  {
    id: "seed-tenis",
    product: "Tênis",
    price: 399,
    category: "Moda",
    recommendation: "GO",
    headline: "Pode fazer sentido.",
    finalDecision: "BOUGHT",
    helpful: null,
    createdAt: "2026-08-13T18:05:00.000Z",
  },
];
