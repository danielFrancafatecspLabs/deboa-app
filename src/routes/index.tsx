import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Compass, Globe, ArrowRight, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui-kit";

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
  component: HomePage,
});

function HomePage() {
  const router = useRouter();

  return (
    <AppShell>
      <header className="animate-rise pt-8">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[22px] font-semibold tracking-[-0.04em]">DeBoa</span>
          <Link
            to="/como-pensa"
            className="text-[13px] font-medium text-muted-foreground underline-offset-4 hover:underline"
          >
            Como funciona
          </Link>
        </div>
        <p className="mt-6 text-[30px] font-semibold leading-[1.1] tracking-[-0.035em]">
          Uma decisão melhor começa antes do clique.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Você decide. O DeBoa pensa com você.
        </p>
      </header>

      {/* Seção: Primeiros passos */}
      <section className="mt-9">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent" />
          <h2 className="text-[13px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            Primeiros passos
          </h2>
        </div>

        <div className="mt-4 space-y-3">
          {/* Card: Simular decisão */}
          <Card className="border-accent/20 bg-accent/[0.04]">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/10">
                <Compass className="h-6 w-6 text-accent" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[17px] font-semibold tracking-tight">
                  Simule uma decisão
                </h3>
                <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">
                  Diga o que você está pensando em comprar e veja na hora a análise do DeBoa.
                </p>
                <button
                  onClick={() => router.navigate({ to: "/decidir" })}
                  className="mt-3 flex items-center gap-1.5 text-[14px] font-medium text-accent hover:underline"
                >
                  Simular agora
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </Card>

          {/* Card: Como funciona na prática */}
          <Card>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[17px] font-semibold tracking-tight">
                  Enquanto você navega
                </h3>
                <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">
                  Quando você estiver em um site de compras e encontrar um produto, o DeBoa pode te ajudar a decidir com base no seu perfil financeiro.
                </p>
                <button
                  onClick={() => router.navigate({ to: "/como-pensa" })}
                  className="mt-3 flex items-center gap-1.5 text-[14px] font-medium text-primary hover:underline"
                >
                  Entender como funciona
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Seção: Configurar perfil */}
      <section className="mt-8 space-y-3">
        <Link to="/meu-mapa" className="block">
          <Card className="border-accent/25 bg-accent/6">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 shrink-0 text-accent" />
              <div>
                <p className="text-[16px] font-medium tracking-tight">
                  Montar Mapa Financeiro
                </p>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  Quanto melhor eu te conhecer, melhores serão as análises.
                </p>
              </div>
            </div>
          </Card>
        </Link>
      </section>

      {/* Footer */}
      <p className="mt-8 px-1 text-[13px] leading-relaxed text-muted-foreground/60">
        O DeBoa não dá conselhos financeiros. Ele te ajuda a pensar antes de decidir.
      </p>
    </AppShell>
  );
}
