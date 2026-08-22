import type {
  DecisionContext,
  DecisionResult,
  ProductContext,
  UserContext,
} from "./types";

/**
 * Deterministic decision engine for the MVP.
 * Intentionally isolated so it can later be swapped for an LLM/agent API
 * with the exact same input/output contract.
 */
export function evaluateDecision(
  userContext: UserContext,
  productContext: ProductContext,
  decisionContext: DecisionContext = { source: "simulator" },
): DecisionResult {
  const available = Math.max(userContext.availableBalance, 1);
  const price = Math.max(productContext.price, 0);
  const share = price / available;
  const freeAfterCommitments =
    userContext.availableBalance -
    userContext.upcomingCommitments -
    userContext.monthlyGoal;

  const reasons: string[] = [];
  if (userContext.upcomingCommitments > 0) {
    reasons.push("Você está próximo de outros compromissos financeiros.");
  }
  reasons.push(
    `Essa compra representa ${(share * 100).toFixed(0)}% do seu dinheiro disponível.`,
  );
  if (userContext.monthlyGoal > 0) {
    reasons.push("Você possui um objetivo financeiro ativo.");
  }

  let recommendation: DecisionResult["recommendation"];
  let interventionLevel: DecisionResult["interventionLevel"];
  let headline: string;
  let message: string;
  let advice: string;
  let impact: DecisionResult["impact"];
  let confidence: number;

  if (share > 0.3) {
    recommendation = "WAIT";
    interventionLevel = "HIGH";
    impact = "Alto";
    headline = "Eu pensaria duas vezes.";
    message =
      "Pelo seu momento financeiro atual, essa compra pode comprometer uma parte relevante do dinheiro que você reservou para seus próximos objetivos.";
    advice = "Eu esperaria 7 dias antes de comprar.";
    confidence = Math.min(0.95, 0.6 + share * 0.6);
    reasons.push("Existe uma alternativa: esperar alguns dias antes de decidir.");
  } else if (share >= 0.1) {
    recommendation = "REVIEW";
    interventionLevel = "MEDIUM";
    impact = "Médio";
    headline = "Vale analisar o impacto.";
    message =
      "Você consegue comprar. A pergunta é: deveria agora? Essa decisão mexe com uma fatia média do que você tem disponível.";
    advice = "Eu daria 48 horas antes de confirmar.";
    confidence = 0.68;
    reasons.push("Dá para seguir, mas o timing muda o impacto dessa decisão.");
  } else {
    recommendation = "GO";
    interventionLevel = "LOW";
    impact = "Baixo";
    headline = "Pode fazer sentido.";
    message = "Essa decisão parece compatível com o seu contexto de teste.";
    advice = "Essa compra parece tranquila. Segue.";
    confidence = 0.81;
  }

  if (freeAfterCommitments < 0 && recommendation !== "WAIT") {
    reasons.push(
      "Seus compromissos e objetivo já consomem todo o saldo disponível deste mês.",
    );
    confidence = Math.min(0.9, confidence + 0.08);
  }

  if (decisionContext.source === "moment") {
    confidence = Math.min(0.97, confidence + 0.02);
  }

  return {
    recommendation,
    confidence: Number(confidence.toFixed(2)),
    interventionLevel,
    headline,
    message,
    advice,
    reasons,
    impact,
    shareOfAvailable: Number(share.toFixed(3)),
  };
}
