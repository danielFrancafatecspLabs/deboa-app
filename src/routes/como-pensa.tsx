import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Action, Card } from "@/components/ui-kit";

export const Route = createFileRoute("/como-pensa")({
  head: () => ({
    meta: [
      { title: "Como o DeBoa pensa" },
      {
        name: "description",
        content:
          "O DeBoa considera contexto financeiro, objetivos, compromissos, comportamento e impacto — não apenas o preço.",
      },
      { property: "og:title", content: "Como o DeBoa pensa" },
      {
        property: "og:description",
        content: "Os cinco fatores que o agente considera antes de recomendar algo.",
      },
    ],
  }),
  component: HowPage,
});

const FACTORS = [
  { title: "Contexto financeiro", text: "Quanto você realmente tem disponível agora." },
  { title: "Objetivos", text: "O que você reservou para os próximos passos." },
  { title: "Compromissos", text: "O que já está prometido nos próximos dias." },
  { title: "Comportamento", text: "Como e quando essa decisão está acontecendo." },
  { title: "Impacto da decisão", text: "O que muda depois que você clica em comprar." },
];

function HowPage() {
  return (
    <AppShell>
      <PageHeader
        title="Como o DeBoa pensa"
        subtitle="O DeBoa considera o contexto da decisão, não apenas o preço."
      />

      <div className="space-y-3">
        {FACTORS.map((f, i) => (
          <Card key={f.title} className="flex gap-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-[13px] font-medium">
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="text-[16px] font-medium tracking-tight">{f.title}</p>
              <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">
                {f.text}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-6 bg-primary text-primary-foreground shadow-lift">
        <p className="text-[18px] font-medium leading-snug tracking-tight">
          O DeBoa não decide por você. Ele ajuda você a decidir melhor.
        </p>
      </Card>

      <div className="mt-5">
        <Link to="/decidir" className="block">
          <Action variant="accent">Antes de decidir, pergunte ao DeBoa</Action>
        </Link>
      </div>
    </AppShell>
  );
}
