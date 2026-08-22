export type UserContext = {
  monthlyIncome: number;
  availableBalance: number;
  monthlyGoal: number;
  upcomingCommitments: number;
};

export type ProductContext = {
  name: string;
  price: number;
  category: string;
  merchant?: string | undefined;
};

export type DecisionContext = {
  /** Where the decision was detected: checkout simulation or manual simulator. */
  source: "moment" | "simulator";
  timestamp?: string | undefined;
};

export type Recommendation = "WAIT" | "REVIEW" | "GO";
export type InterventionLevel = "HIGH" | "MEDIUM" | "LOW";

export type DecisionResult = {
  recommendation: Recommendation;
  confidence: number;
  interventionLevel: InterventionLevel;
  headline: string;
  message: string;
  advice: string;
  reasons: string[];
  impact: "Alto" | "Médio" | "Baixo";
  shareOfAvailable: number;
};

export type FinalDecision = "BOUGHT" | "WAITED";

export type DecisionRecord = {
  id: string;
  product: string;
  price: number;
  category: string;
  recommendation: Recommendation;
  headline: string;
  finalDecision: FinalDecision;
  helpful: boolean | null;
  createdAt: string;
};

export type ProductEventName =
  | "decision_started"
  | "context_analyzed"
  | "intervention_shown"
  | "analysis_opened"
  | "recommendation_shown"
  | "user_followed_recommendation"
  | "user_ignored_recommendation"
  | "intervention_helpful"
  | "intervention_not_helpful";

export type ProductEvent = {
  name: ProductEventName;
  payload?: Record<string, unknown> | undefined;
  at: string;
};
