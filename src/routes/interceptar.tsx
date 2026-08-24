import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Store } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { InterventionFlow } from "@/components/InterventionFlow";
import { Action, Card, Field, Pill } from "@/components/ui-kit";
import { notify } from "@/lib/notifications";
import { CATEGORIES } from "@/data/seed";
import { extractPrice, parseSharedPurchase } from "@/services/purchaseParser";
import type { ProductContext } from "@/services/types";

/**
 * Onde uma compra do mundo real entra no DeBoa.
 *
 * O manifest registra o app como destino de compartilhamento apontando para
 * cá, então o que a loja mandou chega como parâmetros de busca. Também é a
 * rota que o atalho do iOS e o bookmarklet abrem — todos os caminhos de
 * interceptação terminam aqui.
 */
export const Route = createFileRoute("/interceptar")({
  validateSearch: (search: Record<string, unknown>) => {
    const str = (key: string) =>
      typeof search[key] === "string" && search[key] ? (search[key] as string) : undefined;
    return {
      // Nomes fixados pelo share_target do manifest.
      title: str("title"),
      text: str("text"),
      url: str("url"),
      // Preenchimento direto, para o bookmarklet que já leu o preço da página.
      preco: str("preco"),
    };
  },
  head: () => ({
    meta: [
      { title: "O DeBoa está olhando essa compra" },
      {
        name: "description",
        content:
          "Compartilhe um produto com o DeBoa e ele analisa a compra com base no seu Mapa Financeiro antes de você decidir.",
      },
    ],
  }),
  component: InterceptPage,
});

function InterceptPage() {
  const search = Route.useSearch();

  const shared = useMemo(
    () => parseSharedPurchase({ title: search.title, text: search.text, url: search.url }),
    [search.title, search.text, search.url],
  );

  // Um preço explícito vence a adivinhação: quem mandou leu a página. Vem em
  // formato brasileiro ("1.899,90"), então passa pelo mesmo leitor.
  const givenPrice = search.preco ? extractPrice(`R$ ${search.preco}`) : null;
  const price = givenPrice ?? shared.price;

  const [name, setName] = useState(shared.name);
  const [priceText, setPriceText] = useState(
    price ? price.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "",
  );
  const [category, setCategory] = useState<string>(shared.category);
  const [active, setActive] = useState<ProductContext | null>(null);
  const [done, setDone] = useState(false);

  const parsedPrice = Number(priceText.replace(/\./g, "").replace(",", "."));
  const ready = name.trim().length > 1 && parsedPrice > 0;

  // Quando o preço veio junto não há nada a perguntar: a interrupção é a
  // razão de existir da tela, então ela abre sozinha.
  const started = useRef(false);
  useEffect(() => {
    if (started.current || !price || !shared.name) return;
    started.current = true;
    setActive({
      name: shared.name,
      price,
      category: shared.category,
      ...(shared.merchant ? { merchant: shared.merchant } : {}),
    });

    // Se o compartilhamento abriu o app atrás de outra coisa, uma notificação
    // é o que traz a pessoa de volta antes de ela concluir a compra.
    if (document.visibilityState === "hidden") {
      void notify("O DeBoa quer falar dessa compra", {
        body: `${shared.name} — toque para ver a análise antes de decidir.`,
        tag: "deboa-interceptacao",
      });
    }
  }, [price, shared]);

  // Nada foi compartilhado: alguém abriu a rota na mão.
  const empty = !search.title && !search.text && !search.url && !search.preco;

  if (empty) {
    return (
      <AppShell>
        <header className="animate-rise pt-8 pb-6">
          <Pill className="border-accent/25 bg-accent/10 text-accent">Interceptação</Pill>
          <h1 className="mt-4 text-[26px] font-semibold leading-tight tracking-[-0.03em]">
            Compartilhe um produto comigo.
          </h1>
          <p className="mt-2.5 text-[14px] leading-relaxed text-muted-foreground">
            Esta tela abre sozinha quando você compartilha uma compra com o DeBoa. Para isso
            funcionar no seu aparelho, é preciso ativar uma vez.
          </p>
        </header>
        <div className="space-y-2.5">
          <Link to="/ativar" className="block">
            <Action variant="accent">Ativar no meu aparelho</Action>
          </Link>
          <Link to="/decidir" className="block">
            <Action variant="outline">Digitar a compra na mão</Action>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell focused>
      <header className="animate-rise pt-8 pb-6">
        <Pill className="border-accent/25 bg-accent/10 text-accent">Momento de decisão</Pill>
        <h1 className="mt-4 text-[26px] font-semibold leading-tight tracking-[-0.03em]">
          {price ? "Peguei essa compra." : "Quase lá — só falta o preço."}
        </h1>
        <p className="mt-2.5 text-[14px] leading-relaxed text-muted-foreground">
          {price
            ? "Confira se entendi certo. Você pode corrigir qualquer coisa antes de eu analisar."
            : "A loja não mandou o valor junto com o link. Me diga quanto custa e eu analiso na hora."}
        </p>
      </header>

      {shared.merchant ? (
        <div className="mb-4 flex items-center gap-2 text-[13px] text-muted-foreground">
          <Store className="h-4 w-4 shrink-0" />
          <span className="truncate">{shared.merchant}</span>
        </div>
      ) : null}

      <Card className="space-y-5">
        <Field
          label="O que você está comprando"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Field
          label="Preço"
          prefix="R$"
          inputMode="decimal"
          placeholder="0,00"
          value={priceText}
          onChange={(e) => setPriceText(e.target.value)}
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

      <div className="mt-5 space-y-2.5">
        <Action
          variant="accent"
          disabled={!ready}
          onClick={() =>
            setActive({
              name: name.trim(),
              price: parsedPrice,
              category,
              ...(shared.merchant ? { merchant: shared.merchant } : {}),
            })
          }
        >
          {done ? "Analisar de novo" : "DeBoa, analise isso"}
        </Action>

        {shared.url ? (
          <a href={shared.url} rel="noopener noreferrer" className="block">
            <Action variant="ghost">
              <span className="inline-flex items-center gap-1.5">
                Voltar para a loja
                <ExternalLink className="h-4 w-4" />
              </span>
            </Action>
          </a>
        ) : null}
      </div>

      <p className="mt-6 px-1 text-[12px] leading-relaxed text-muted-foreground">
        O DeBoa não vê o que você faz em outros sites — nenhum app consegue. Ele só sabe o que
        você compartilhou com ele agora.
      </p>

      {active ? (
        <InterventionFlow
          product={active}
          source="moment"
          onClose={() => {
            setActive(null);
            setDone(true);
          }}
        />
      ) : null}
    </AppShell>
  );
}
