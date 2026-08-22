import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { InterventionFlow } from "@/components/InterventionFlow";
import { Action, Card, Field } from "@/components/ui-kit";
import { CATEGORIES } from "@/data/seed";
import type { ProductContext } from "@/services/types";

export const Route = createFileRoute("/decidir")({
  head: () => ({
    meta: [
      { title: "Teste o DeBoa — simulador de decisão" },
      {
        name: "description",
        content:
          "Informe o que você está pensando em comprar e receba uma recomendação contextual do DeBoa.",
      },
      { property: "og:title", content: "Teste o DeBoa — simulador de decisão" },
      {
        property: "og:description",
        content: "Simule uma compra e veja como o agente DeBoa recomenda esperar, analisar ou seguir.",
      },
    ],
  }),
  component: DecidePage,
});

function DecidePage() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [active, setActive] = useState<ProductContext | null>(null);

  const parsedPrice = Number(price.replace(/\./g, "").replace(",", "."));
  const valid = name.trim().length > 1 && parsedPrice > 0;

  return (
    <AppShell>
      <PageHeader
        title="Teste o DeBoa"
        subtitle="Antes de decidir, pergunte ao DeBoa."
      />

      <Card className="space-y-5">
        <Field
          label="O que você está pensando em comprar?"
          placeholder="Ex.: cadeira de escritório"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Field
          label="Preço"
          prefix="R$"
          inputMode="decimal"
          placeholder="0,00"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <label className="block">
          <span className="text-[13px] font-medium text-muted-foreground">Categoria</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-2 min-h-13 w-full appearance-none rounded-2xl border border-border bg-surface px-4 text-[16px] tracking-tight outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </Card>

      <div className="mt-5">
        <Action
          variant="accent"
          disabled={!valid}
          onClick={() =>
            setActive({ name: name.trim(), price: parsedPrice, category })
          }
        >
          DeBoa, analise isso
        </Action>
      </div>

      <p className="mt-4 px-1 text-[12px] leading-relaxed text-muted-foreground">
        A recomendação usa o seu contexto de teste — altere os valores em Perfil e veja a
        resposta mudar.
      </p>

      {active ? (
        <InterventionFlow
          product={active}
          source="simulator"
          onClose={() => setActive(null)}
        />
      ) : null}
    </AppShell>
  );
}
