import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Action, Card, Field, Pill } from "@/components/ui-kit";
import { FEATURED_PRODUCT } from "@/data/seed";
import { useAuth } from "@/hooks/useAuth";
import { useDeBoa } from "@/hooks/useDeBoa";
import { useFinancialProfile } from "@/hooks/useFinancialProfile";
import { evaluateDecision } from "@/services/decisionEngine";
import { brl } from "@/utils/format";
import { LogOut, User as UserIcon, Mail } from "lucide-react";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Seu contexto — perfil de teste do DeBoa" },
      {
        name: "description",
        content:
          "Edite renda, saldo disponível, objetivo e compromissos do perfil de teste e veja a recomendação do DeBoa mudar.",
      },
      { property: "og:title", content: "Seu contexto — perfil de teste do DeBoa" },
      {
        property: "og:description",
        content: "Ajuste o contexto financeiro simulado que alimenta o agente.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const router = useRouter();
  const { user, initialized, signOut } = useAuth();
  const { context, updateContext, resetContext } = useDeBoa();
  const { clearProfile } = useFinancialProfile();
  const preview = evaluateDecision(context, FEATURED_PRODUCT, { source: "moment" });

  const fields = [
    { key: "monthlyIncome", label: "Renda mensal" },
    { key: "availableBalance", label: "Dinheiro disponível" },
    { key: "monthlyGoal", label: "Objetivo mensal" },
    { key: "upcomingCommitments", label: "Compromissos próximos" },
  ] as const;

  return (
    <AppShell>
      <PageHeader
        title="Seu contexto"
        subtitle="Valores fictícios de um perfil de teste. Altere e veja a recomendação mudar."
      />

      {/* Auth section */}
      <Card className="mb-4 space-y-3">
        <Pill>{user ? "Conta" : "Autenticação"}</Pill>
        {!initialized ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : user ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <UserIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 truncate">
                <p className="text-sm font-medium text-foreground">{user.email}</p>
                <p className="text-xs text-muted-foreground">
                  Criada em {new Date(user.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                await signOut();
                router.navigate({ to: "/login" });
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-input py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent"
            >
              <LogOut className="h-4 w-4" />
              Sair da conta
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Crie uma conta para salvar seus dados na nuvem e acessá-los de qualquer dispositivo.
            </p>
            <Link to="/login">
              <Action variant="primary">Criar conta ou entrar</Action>
            </Link>
          </div>
        )}
      </Card>

      <Card className="space-y-5">
        <Pill>Perfil de teste</Pill>
        {fields.map(({ key, label }) => (
          <Field
            key={key}
            label={label}
            prefix="R$"
            inputMode="numeric"
            value={String(context[key])}
            onChange={(e) =>
              updateContext({ [key]: Number(e.target.value.replace(/\D/g, "")) || 0 })
            }
          />
        ))}
      </Card>

      <Card className="mt-4 border-accent/25 bg-accent/6">
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-accent">
          Prévia da recomendação
        </p>
        <p className="mt-2 text-[17px] font-medium leading-snug tracking-tight">
          {preview.headline}
        </p>
        <p className="mt-2 text-[13px] text-muted-foreground">
          Para {FEATURED_PRODUCT.name} ({brl(FEATURED_PRODUCT.price)}) ·{" "}
          {(preview.shareOfAvailable * 100).toFixed(0)}% do disponível · impacto{" "}
          {preview.impact.toLowerCase()}
        </p>
      </Card>

      <div className="mt-5 space-y-2.5">
        <Action variant="outline" onClick={resetContext}>
          Restaurar valores padrão
        </Action>
        <Link to="/como-pensa" className="block">
          <Action variant="ghost">Como o DeBoa pensa</Action>
        </Link>
      </div>

      <Card className="mt-8 space-y-4">
        <Pill>Seus dados são seus</Pill>
        <ul className="space-y-2 text-[13px] leading-relaxed text-muted-foreground">
          <li>Por enquanto, você está inserindo seus dados manualmente.</li>
          <li>Não conectamos sua conta bancária neste MVP.</li>
          <li>Você pode editar ou apagar suas informações quando quiser.</li>
        </ul>
        <div className="space-y-2.5">
          <Link to="/mapa" className="block">
            <Action variant="outline">Editar meu Mapa Financeiro</Action>
          </Link>
          <Action
            variant="ghost"
            onClick={() => {
              if (
                typeof window !== "undefined" &&
                window.confirm("Apagar todos os dados do seu Mapa Financeiro?")
              ) {
                clearProfile();
              }
            }}
          >
            Excluir dados do meu mapa
          </Action>
        </div>
      </Card>
    </AppShell>
  );
}
