import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Sparkles, Compass, Globe, ArrowRight } from "lucide-react";
import { Action, Card } from "@/components/ui-kit";

export const Route = createFileRoute("/welcome")({
  component: WelcomePage,
});

function WelcomePage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 flex-col justify-center px-6">
        <div className="mx-auto w-full max-w-sm">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-accent to-accent/80 shadow-lift">
              <Sparkles className="h-10 w-10 text-accent-foreground" />
            </div>
            <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.03em]">
              Bem-vindo ao DeBoa
            </h1>
            <p className="mt-3 text-[16px] leading-relaxed text-muted-foreground">
              Um agente pessoal que te ajuda a decidir antes de comprar.
            </p>
          </div>

          {/* Cards de ação */}
          <div className="mt-10 space-y-4">
            <Card className="border-accent/20 bg-accent/[0.04]">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/10">
                  <Compass className="h-6 w-6 text-accent" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-[17px] font-semibold tracking-tight">
                    Simule uma decisão agora
                  </h2>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">
                    Diga o que você está pensando em comprar e veja na hora o que o DeBoa recomenda.
                  </p>
                  <button
                    onClick={() => router.navigate({ to: "/decidir" })}
                    className="mt-4 flex items-center gap-1.5 text-[14px] font-medium text-accent hover:underline"
                  >
                    Simular decisão
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-[17px] font-semibold tracking-tight">
                    Navegue e decida melhor
                  </h2>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">
                    Quando você estiver em um site de compras e encontrar um produto, o DeBoa pode te ajudar a decidir com base no seu perfil financeiro.
                  </p>
                  <button
                    onClick={() => router.navigate({ to: "/como-pensa" })}
                    className="mt-4 flex items-center gap-1.5 text-[14px] font-medium text-primary hover:underline"
                  >
                    Entender como funciona
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          </div>

          {/* Call to action */}
          <div className="mt-10">
            <Action
              variant="accent"
              onClick={() => router.navigate({ to: "/" })}
            >
              Começar
              <ArrowRight className="ml-2 h-5 w-5" />
            </Action>
          </div>

          <p className="mt-6 text-center text-[13px] text-muted-foreground">
            Você também pode configurar seu{" "}
            <button
              onClick={() => router.navigate({ to: "/meu-mapa" })}
              className="font-medium text-accent underline underline-offset-2"
            >
              Mapa Financeiro
            </button>{" "}
            para análises mais precisas.
          </p>
        </div>
      </div>
    </div>
  );
}