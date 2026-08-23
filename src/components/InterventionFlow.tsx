import { useEffect, useRef, useState } from "react";
import { Check, Loader2, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { Action, Card, Pill } from "@/components/ui-kit";
import { useDeBoa } from "@/hooks/useDeBoa";
import { useFinancialProfile } from "@/hooks/useFinancialProfile";
import { contextualNotes, toUserContext } from "@/services/contextBridge";
import { trackEvent } from "@/services/analytics";
import { evaluateDecision } from "@/services/decisionEngine";
import type {
  DecisionResult,
  FinalDecision,
  ProductContext,
} from "@/services/types";
import { brl } from "@/utils/format";

type Stage = "analyzing" | "intervention" | "analysis" | "autonomy" | "result";

const STEPS = [
  "Produto identificado",
  "Preço identificado",
  "Seu contexto financeiro analisado",
];

export function InterventionFlow({
  product,
  source,
  onClose,
}: {
  product: ProductContext;
  source: "moment" | "simulator";
  onClose: () => void;
}) {
  const { context: testContext, addDecision, rateDecision } = useDeBoa();
  const { profile, hasProfile } = useFinancialProfile();

  // Contexto com fallback seguro — nunca quebra mesmo se profile estiver vazio
  let context: UserContext;
  let notes: string[];
  try {
    context = hasProfile && profile ? toUserContext(profile) : testContext;
    notes = hasProfile && profile ? contextualNotes(profile, product) : [];
  } catch (err) {
    console.error("InterventionFlow: error building context", err);
    context = testContext;
    notes = [];
  }

  const [stage, setStage] = useState<Stage>("analyzing");
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<DecisionResult | null>(null);
  const [decision, setDecision] = useState<FinalDecision | null>(null);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [rated, setRated] = useState<boolean | null>(null);

  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    trackEvent("decision_started", { product: product.name, price: product.price, source });

    // Safety timeout: se algo der errado, avança mesmo assim após 5s
    const safetyTimer = setTimeout(() => {
      if (stage === "analyzing") {
        try {
          const r = evaluateDecision(context, product, { source });
          setResult(r);
          setStage("intervention");
        } catch {
          // Fallback mínimo se evaluateDecision falhar
          setStage("intervention");
        }
      }
    }, 5000);

    const timers = [
      setTimeout(() => setStep(1), 700),
      setTimeout(() => setStep(2), 1300),
      setTimeout(() => setStep(3), 1900),
      setTimeout(() => {
        try {
          const r = evaluateDecision(context, product, { source });
          setResult(r);
          setStage("intervention");
          trackEvent("context_analyzed", { product: product.name });
          trackEvent("intervention_shown", {
            product: product.name,
            level: r.interventionLevel,
          });
        } catch (err) {
          console.error("InterventionFlow: evaluateDecision failed", err);
          // Safety fallback — avança mesmo com erro
          setStage("intervention");
        }
      }, 2400),
    ];
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(safetyTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finalize(final: FinalDecision) {
    if (!result) return;
    const followed =
      (result.recommendation === "GO" && final === "BOUGHT") ||
      (result.recommendation !== "GO" && final === "WAITED");
    trackEvent(
      followed ? "user_followed_recommendation" : "user_ignored_recommendation",
      { product: product.name, recommendation: result.recommendation },
    );
    const id = `d-${Date.now()}`;
    setRecordId(id);
    setDecision(final);
    addDecision({
      id,
      product: product.name,
      price: product.price,
      category: product.category,
      recommendation: result.recommendation,
      headline: result.headline,
      finalDecision: final,
      helpful: null,
      createdAt: new Date().toISOString(),
    });
    setStage("result");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 backdrop-blur-[6px]">
      <div className="animate-sheet flex max-h-[92vh] w-full max-w-md flex-col overflow-y-auto rounded-t-[32px] border border-border/60 bg-surface px-6 pt-6 pb-safe shadow-lift sm:rounded-b-[32px] sm:mb-4">
        <div className="mb-5 flex items-center justify-between">
          <Pill className="border-accent/25 bg-accent/10 text-accent">DeBoa</Pill>
          <button
            aria-label="Fechar"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {stage === "analyzing" && (
          <div className="pb-10">
            <div className="flex items-center gap-3">
              <span className="animate-orb grid h-10 w-10 place-items-center rounded-full bg-accent/15">
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
              </span>
              <p className="text-[17px] font-medium tracking-tight">
                DeBoa está analisando…
              </p>
            </div>
            <ul className="mt-7 space-y-3">
              {STEPS.map((label, i) => (
                <li
                  key={label}
                  className={`flex items-center gap-3 text-[15px] transition-all duration-500 ${
                    step > i ? "opacity-100" : "translate-y-1 opacity-30"
                  }`}
                >
                  <span
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                      step > i ? "bg-accent text-accent-foreground" : "bg-muted"
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
            <p className="mt-8 text-[12px] text-muted-foreground">
              Simulação baseada em um perfil de teste.
            </p>
          </div>
        )}

        {stage === "intervention" && result && (
          <div className="pb-8">
            <h2 className="text-[26px] font-semibold leading-tight tracking-[-0.03em]">
              {result.recommendation === "GO"
                ? "Essa parece tranquila."
                : "Ei. Vale a pena comprar isso mesmo?"}
            </h2>

            <Card className="mt-6 bg-muted/40 shadow-none">
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-[15px] font-medium">
                  {product.name}
                </span>
                <span className="shrink-0 text-[17px] font-semibold tracking-tight">
                  {brl(product.price)}
                </span>
              </div>
              <p className="mt-1 text-[12px] text-muted-foreground">
                {product.category}
                {product.merchant ? ` · ${product.merchant}` : ""}
              </p>
            </Card>

            <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">
              {result.message}
            </p>

            {notes.length > 0 ? (
              <ul className="mt-5 space-y-2.5 rounded-2xl bg-muted/50 p-4">
                {notes.map((note) => (
                  <li key={note} className="flex gap-3 text-[14px] leading-relaxed">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {note}
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-7 space-y-2.5">
              <Action
                variant="accent"
                onClick={() => {
                  trackEvent("analysis_opened", { product: product.name });
                  setStage("analysis");
                  trackEvent("recommendation_shown", {
                    product: product.name,
                    recommendation: result.recommendation,
                    confidence: result.confidence,
                  });
                }}
              >
                Quero entender
              </Action>
              <Action variant="outline" onClick={() => setStage("autonomy")}>
                Acho que sim
              </Action>
              <Action variant="ghost" onClick={() => finalize("WAITED")}>
                Deixa pra lá
              </Action>
            </div>
          </div>
        )}

        {stage === "analysis" && result && (
          <div className="pb-8">
            <h2 className="text-[26px] font-semibold leading-tight tracking-[-0.03em]">
              {result.headline}
            </h2>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Card className="shadow-none">
                <p className="text-[12px] text-muted-foreground">Compra</p>
                <p className="mt-1 text-[19px] font-semibold tracking-tight">
                  {brl(product.price)}
                </p>
              </Card>
              <Card className="shadow-none">
                <p className="text-[12px] text-muted-foreground">Impacto estimado</p>
                <p className="mt-1 text-[19px] font-semibold tracking-tight">
                  {result.impact}
                </p>
              </Card>
            </div>

            <p className="mt-7 text-[13px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Motivos
            </p>
            <ul className="mt-3 space-y-3">
              {result.reasons.map((reason) => (
                <li key={reason} className="flex gap-3 text-[15px] leading-relaxed">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {reason}
                </li>
              ))}
            </ul>

            <p className="mt-5 text-[12px] text-muted-foreground">
              {hasProfile
                ? "Leitura baseada no seu Mapa Financeiro."
                : "Simulação baseada em um perfil de teste."}
            </p>

            <Card className="mt-6 border-accent/25 bg-accent/6">
              <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-accent">
                Minha recomendação
              </p>
              <p className="mt-2 text-[18px] font-medium leading-snug tracking-tight">
                {result.advice}
              </p>
              <p className="mt-2 text-[12px] text-muted-foreground">
                Confiança {(result.confidence * 100).toFixed(0)}%
              </p>
            </Card>

            <div className="mt-6 space-y-2.5">
              <Action
                variant="accent"
                onClick={() =>
                  finalize(result.recommendation === "GO" ? "BOUGHT" : "WAITED")
                }
              >
                {result.recommendation === "GO" ? "Vou comprar" : "Vou esperar"}
              </Action>
              <Action variant="outline" onClick={() => setStage("autonomy")}>
                {result.recommendation === "GO"
                  ? "Prefiro esperar mesmo assim"
                  : "Quero comprar mesmo assim"}
              </Action>
            </div>
          </div>
        )}

        {stage === "autonomy" && result && (
          <div className="pb-8">
            <h2 className="text-[26px] font-semibold leading-tight tracking-[-0.03em]">
              Tudo bem.
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-muted-foreground">
              Minha função não é decidir por você. É ajudar você a enxergar melhor antes
              de decidir.
            </p>
            <Card className="mt-6 bg-muted/40 shadow-none">
              <p className="text-[15px]">
                {result.recommendation === "GO"
                  ? "Espera registrada como decisão do usuário."
                  : "Compra registrada como decisão do usuário."}
              </p>
            </Card>
            <div className="mt-7">
              <Action
                onClick={() =>
                  finalize(result.recommendation === "GO" ? "WAITED" : "BOUGHT")
                }
              >
                Continuar
              </Action>
            </div>
          </div>
        )}

        {stage === "result" && result && (
          <div className="pb-8">
            <Pill className="border-accent/25 bg-accent/10 text-accent">Momento DeBoa</Pill>
            <h2 className="mt-4 text-[26px] font-semibold leading-tight tracking-[-0.03em]">
              Você acabou de tomar uma decisão com mais contexto.
            </h2>

            <div className="mt-6 space-y-3">
              <Row label="Decisão" value={`Comprar ${product.name}`} />
              <Row label="Recomendação do DeBoa" value={result.advice} />
              <Row
                label="Decisão final"
                value={
                  decision === "BOUGHT"
                    ? "Usuário decidiu comprar"
                    : "Usuário decidiu esperar"
                }
              />
            </div>

            <div className="mt-8">
              <p className="text-[15px] font-medium">Essa intervenção foi útil?</p>
              <div className="mt-3 flex gap-3">
                <button
                  onClick={() => {
                    setRated(true);
                    if (recordId) rateDecision(recordId, true);
                    trackEvent("intervention_helpful", { product: product.name });
                  }}
                  className={`flex min-h-13 flex-1 items-center justify-center gap-2 rounded-2xl border text-[15px] transition-colors ${
                    rated === true
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border bg-surface"
                  }`}
                >
                  <ThumbsUp className="h-4 w-4" /> Sim
                </button>
                <button
                  onClick={() => {
                    setRated(false);
                    if (recordId) rateDecision(recordId, false);
                    trackEvent("intervention_not_helpful", { product: product.name });
                  }}
                  className={`flex min-h-13 flex-1 items-center justify-center gap-2 rounded-2xl border text-[15px] transition-colors ${
                    rated === false
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border bg-surface"
                  }`}
                >
                  <ThumbsDown className="h-4 w-4" /> Não
                </button>
              </div>
            </div>

            <div className="mt-7">
              <Action variant="accent" onClick={onClose}>
                Concluir
              </Action>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/70 pb-3">
      <span className="shrink-0 text-[13px] text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right text-[15px] font-medium tracking-tight">
        {value}
      </span>
    </div>
  );
}
