import { createFileRoute } from "@tanstack/react-router";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Card, Pill } from "@/components/ui-kit";
import { useDeBoa } from "@/hooks/useDeBoa";
import type { Recommendation } from "@/services/types";
import { brl, shortDate } from "@/utils/format";

export const Route = createFileRoute("/historico")({
  head: () => ({
    meta: [
      { title: "Histórico de decisões — DeBoa" },
      {
        name: "description",
        content:
          "Todas as decisões analisadas pelo DeBoa: preço, recomendação, decisão final e utilidade da intervenção.",
      },
      { property: "og:title", content: "Histórico de decisões — DeBoa" },
      {
        property: "og:description",
        content: "Veja como cada intervenção do DeBoa terminou.",
      },
    ],
  }),
  component: HistoryPage,
});

const LABEL: Record<Recommendation, string> = {
  WAIT: "Esperar",
  REVIEW: "Analisar impacto",
  GO: "Pode fazer sentido",
};

function HistoryPage() {
  const { history } = useDeBoa();

  return (
    <AppShell>
      <PageHeader
        title="Histórico"
        subtitle="Decisões que passaram pelo DeBoa."
      />

      {history.length === 0 ? (
        <Card>
          <p className="text-[15px] text-muted-foreground">
            Nenhuma decisão registrada ainda.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <Card key={item.id}>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                <div className="min-w-0">
                  <p className="truncate text-[16px] font-medium tracking-tight">
                    {item.product}
                  </p>
                  <p className="text-[13px] text-muted-foreground">
                    {item.category} · {shortDate(item.createdAt)}
                  </p>
                </div>
                <span className="shrink-0 text-[16px] font-semibold tracking-tight">
                  {brl(item.price)}
                </span>
              </div>

              <div className="mt-4 space-y-2 border-t border-border/70 pt-4 text-[14px]">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Recomendação</span>
                  <span className="text-right font-medium">
                    {LABEL[item.recommendation]}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Decisão final</span>
                  <span className="text-right font-medium">
                    {item.finalDecision === "BOUGHT"
                      ? "Usuário comprou"
                      : "Usuário decidiu esperar"}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                {item.helpful === null ? (
                  <Pill>Sem avaliação</Pill>
                ) : (
                  <Pill className="border-accent/25 bg-accent/10 text-accent">
                    {item.helpful ? (
                      <ThumbsUp className="mr-1.5 h-3 w-3" />
                    ) : (
                      <ThumbsDown className="mr-1.5 h-3 w-3" />
                    )}
                    {item.helpful ? "Intervenção útil" : "Não foi útil"}
                  </Pill>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
