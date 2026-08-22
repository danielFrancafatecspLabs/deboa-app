import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { InterventionFlow } from "@/components/InterventionFlow";
import { Action, Card, Pill } from "@/components/ui-kit";
import { FEATURED_PRODUCT, SECOND_PRODUCT } from "@/data/seed";
import type { ProductContext } from "@/services/types";
import { brl } from "@/utils/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DeBoa — Você decide. O DeBoa pensa com você." },
      {
        name: "description",
        content:
          "DeBoa é um agente pessoal que intervém antes de uma decisão de compra e ajuda você a decidir com mais contexto.",
      },
      { property: "og:title", content: "DeBoa — Você decide. O DeBoa pensa com você." },
      {
        property: "og:description",
        content: "DeBoa é um agente pessoal que intervém antes de uma decisão de compra e ajuda você a decidir com mais contexto.",
      },
    ],
  }),
  component: MomentPage,
});

function MomentPage() {
  const [active, setActive] = useState<ProductContext | null>(null);

  return (
    <AppShell>
      <header className="animate-rise pt-8">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[22px] font-semibold tracking-[-0.04em]">DeBoa</span>
          <Link
            to="/como-pensa"
            className="text-[13px] font-medium text-muted-foreground underline-offset-4"
          >
            Como o DeBoa pensa
          </Link>
        </div>
        <p className="mt-6 text-[30px] font-semibold leading-[1.1] tracking-[-0.035em]">
          Uma decisão melhor começa antes do clique.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Você decide. O DeBoa pensa com você.
        </p>
      </header>

      <section className="mt-9">
        <div className="flex items-center gap-2">
          <span className="animate-orb h-2 w-2 rounded-full bg-accent" />
          <h2 className="text-[13px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Momento de decisão
          </h2>
        </div>

        <Card className="mt-4">
          <Pill>{FEATURED_PRODUCT.merchant}</Pill>
          <p className="mt-4 text-[19px] font-medium tracking-tight">
            {FEATURED_PRODUCT.name}
          </p>
          <p className="mt-1 text-[30px] font-semibold tracking-[-0.03em]">
            {brl(FEATURED_PRODUCT.price)}
          </p>
          <div className="mt-6">
            <Action variant="accent" onClick={() => setActive(FEATURED_PRODUCT)}>
              Estou prestes a comprar
            </Action>
          </div>
        </Card>

        <Card className="mt-3">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <div className="min-w-0">
              <p className="truncate text-[16px] font-medium tracking-tight">
                {SECOND_PRODUCT.name}
              </p>
              <p className="text-[13px] text-muted-foreground">
                {brl(SECOND_PRODUCT.price)} · {SECOND_PRODUCT.category}
              </p>
            </div>
            <button
              onClick={() => setActive(SECOND_PRODUCT)}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"
              aria-label="Simular compra do tênis"
            >
              <ArrowUpRight className="h-5 w-5" />
            </button>
          </div>
        </Card>

        <p className="mt-4 px-1 text-[12px] leading-relaxed text-muted-foreground">
          Simulação baseada em um perfil de teste. Antes de decidir, pergunte ao DeBoa.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <Link to="/mapa" className="block">
          <Card className="border-accent/25 bg-accent/6">
            <p className="text-[16px] font-medium tracking-tight">Meu Mapa</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Quanto melhor eu entender sua vida, melhor posso te ajudar a decidir.
            </p>
          </Card>
        </Link>
        <Link to="/decidir" className="block">
          <Card className="bg-primary text-primary-foreground shadow-lift">
            <p className="text-[16px] font-medium tracking-tight">Simule uma decisão</p>
            <p className="mt-1 text-[13px] opacity-70">
              Diga o que você está pensando em comprar e o DeBoa analisa.
            </p>
          </Card>
        </Link>
      </section>

      {active ? (
        <InterventionFlow
          product={active}
          source="moment"
          onClose={() => setActive(null)}
        />
      ) : null}
    </AppShell>
  );
}
