import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { Building2, Check, Loader2, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Action, Card, Pill } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { useFinancialProfile } from "@/hooks/useFinancialProfile";
import { cn } from "@/lib/utils";
import { connectToken, PluggyError, rememberItem, sync } from "@/lib/pluggy/client";
import { applyProposal, proposeFromSnapshot } from "@/services/pluggyMapping";
import type { MappingProposal } from "@/services/pluggyMapping";
import { ESSENTIAL_LINES } from "@/services/spending";
import { brl } from "@/utils/format";

/**
 * O widget vem da Pluggy e carrega o próprio bundle. Só entra na página de
 * quem chegou até aqui — não faz sentido pesar o app inteiro por causa dele.
 */
const PluggyConnect = lazy(() =>
  import("react-pluggy-connect").then((m) => ({ default: m.PluggyConnect })),
);

export const Route = createFileRoute("/conectar")({
  head: () => ({
    meta: [
      { title: "Conectar meu banco — DeBoa" },
      {
        name: "description",
        content:
          "Conecte sua conta por Open Finance e o DeBoa preenche seu Mapa com o que já existe: renda, saldo, fatura e para onde o dinheiro foi.",
      },
    ],
  }),
  component: ConnectPage,
});

type Stage = "intro" | "widget" | "loading" | "proposal" | "error";

function ConnectPage() {
  const { user, initialized } = useAuth();
  const { profile, update } = useFinancialProfile();
  const navigate = useNavigate();

  const [stage, setStage] = useState<Stage>("intro");
  const [token, setToken] = useState<string | null>(null);
  const [proposal, setProposal] = useState<MappingProposal | null>(null);
  const [bank, setBank] = useState<string | null>(null);
  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const toggle = (key: string) =>
    setAccepted((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  async function start() {
    setError(null);
    setStage("loading");
    try {
      setToken(await connectToken());
      setStage("widget");
    } catch (e) {
      setError(e instanceof PluggyError ? e.message : "Não consegui começar a conexão.");
      setStage("error");
    }
  }

  async function afterConnect(itemId: string) {
    setStage("loading");
    rememberItem(itemId);
    try {
      const snapshot = await sync(itemId);
      const next = proposeFromSnapshot(snapshot);
      setBank(snapshot.connectorName);
      setProposal(next);
      // Tudo vem marcado: é o que a pessoa espera depois de autorizar o banco.
      // Desmarcar é a exceção, não a regra.
      setAccepted(new Set(keysOf(next)));
      setStage("proposal");
    } catch (e) {
      setError(e instanceof PluggyError ? e.message : "Conectou, mas não consegui ler os dados.");
      setStage("error");
    }
  }

  /* ------------------------------ Sem conta ----------------------------- */
  if (initialized && !user) {
    return (
      <AppShell>
        <header className="animate-rise pt-8 pb-6">
          <Pill className="border-accent/25 bg-accent/10 text-accent">Open Finance</Pill>
          <h1 className="mt-4 text-[27px] font-semibold leading-tight tracking-[-0.03em]">
            Para conectar o banco, preciso saber que é você.
          </h1>
          <p className="mt-2.5 text-[14px] leading-relaxed text-muted-foreground">
            A conexão fica amarrada à sua conta no DeBoa. Sem login, eu não teria onde guardá-la
            com segurança.
          </p>
        </header>
        <Link to="/login" className="block">
          <Action variant="accent">Entrar ou criar conta</Action>
        </Link>
      </AppShell>
    );
  }

  /* ------------------------------- Proposta ----------------------------- */
  if (stage === "proposal" && proposal) {
    const hasAnything =
      proposal.netIncome !== null ||
      proposal.checking > 0 ||
      proposal.creditCards.length > 0 ||
      Object.keys(proposal.essentialExpenses).length > 0;

    return (
      <AppShell focused>
        <header className="animate-rise pt-8 pb-6">
          <Pill className="border-accent/25 bg-accent/10 text-accent">
            {bank ?? "Banco conectado"}
          </Pill>
          <h1 className="mt-4 text-[26px] font-semibold leading-tight tracking-[-0.03em]">
            Foi isso que eu li no seu extrato.
          </h1>
          <p className="mt-2.5 text-[14px] leading-relaxed text-muted-foreground">
            {proposal.months} {proposal.months === 1 ? "mês" : "meses"} de histórico. Desmarque o
            que não fizer sentido — nada entra no seu Mapa sem você confirmar.
          </p>
        </header>

        {!hasAnything ? (
          <Card>
            <p className="text-[14px] leading-relaxed">
              Conectou, mas não achei movimentação suficiente para propor números. Se a conta é
              nova ou pouco usada, vale preencher à mão mesmo.
            </p>
          </Card>
        ) : null}

        {proposal.netIncome !== null ? (
          <Group title="O que entra">
            <Choice
              on={accepted.has("renda")}
              onToggle={() => toggle("renda")}
              label="Renda mensal"
              value={brl(proposal.netIncome)}
              detail={
                proposal.salaryDay
                  ? `Mediana dos meses, caindo por volta do dia ${proposal.salaryDay}`
                  : "Mediana dos depósitos reconhecidos como salário"
              }
            />
          </Group>
        ) : null}

        {proposal.checking > 0 || proposal.savings > 0 ? (
          <Group title="O que você tem">
            <Choice
              on={accepted.has("saldo")}
              onToggle={() => toggle("saldo")}
              label="Saldo em conta"
              value={brl(proposal.checking + proposal.savings)}
              detail={
                proposal.savings > 0
                  ? `${brl(proposal.checking)} em conta corrente e ${brl(proposal.savings)} em poupança`
                  : "Saldo disponível agora"
              }
            />
          </Group>
        ) : null}

        {proposal.creditCards.length > 0 ? (
          <Group title="Cartões">
            <Choice
              on={accepted.has("cartoes")}
              onToggle={() => toggle("cartoes")}
              label={`${proposal.creditCards.length} ${proposal.creditCards.length === 1 ? "cartão" : "cartões"}`}
              value={brl(proposal.creditCards.reduce((s, c) => s + c.currentBill, 0))}
              detail={proposal.creditCards
                .map((c) => `${c.name} · vence dia ${c.dueDay}`)
                .join(" · ")}
            />
          </Group>
        ) : null}

        {Object.keys(proposal.essentialExpenses).length > 0 ? (
          <Group
            title="Para onde vai"
            hint={`Média por mês nos últimos ${proposal.months} ${proposal.months === 1 ? "mês" : "meses"}.`}
          >
            {ESSENTIAL_LINES.filter((l) => proposal.essentialExpenses[l.key]).map((line) => (
              <Choice
                key={line.key}
                on={accepted.has(`essencial:${line.key}`)}
                onToggle={() => toggle(`essencial:${line.key}`)}
                label={`${line.emoji}  ${line.label}`}
                value={brl(proposal.essentialExpenses[line.key]!)}
                detail={line.hint}
              />
            ))}
          </Group>
        ) : null}

        {proposal.subscriptions.length > 0 ? (
          <Group title="Parece assinatura" hint="Mesmo valor, mesmo lugar, todo mês.">
            {proposal.subscriptions.map((sub) => (
              <Choice
                key={sub.id}
                on={accepted.has(`assinatura:${sub.id}`)}
                onToggle={() => toggle(`assinatura:${sub.id}`)}
                label={sub.name}
                value={brl(sub.amount)}
                detail={sub.evidence}
              />
            ))}
          </Group>
        ) : null}

        {proposal.unclassified.length > 0 ? (
          <section className="mt-7">
            <h2 className="px-1 text-[13px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              Não consegui classificar
            </h2>
            <p className="mt-1.5 px-1 text-[13px] leading-relaxed text-muted-foreground">
              Estes eu vi saindo mas não soube em que categoria colocar. Deixei de fora da
              proposta em vez de chutar — dá para lançar à mão em Gastos.
            </p>
            <Card className="mt-3 space-y-2.5">
              {proposal.unclassified.map((u) => (
                <div key={u.label} className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 flex-1 truncate text-[14px] text-muted-foreground">
                    {u.label}
                  </span>
                  <span className="shrink-0 text-[14px] tabular-nums">{brl(u.monthly)}/mês</span>
                </div>
              ))}
            </Card>
          </section>
        ) : null}

        <div className="mt-8 space-y-2.5">
          <Action
            variant="accent"
            disabled={accepted.size === 0}
            onClick={() => {
              update(applyProposal(profile, proposal, accepted));
              void navigate({ to: "/gastos" });
            }}
          >
            Usar {accepted.size} {accepted.size === 1 ? "número" : "números"} no meu Mapa
          </Action>
          <Action variant="ghost" onClick={() => setStage("intro")}>
            Agora não
          </Action>
        </div>
      </AppShell>
    );
  }

  /* --------------------------------- Erro ------------------------------- */
  if (stage === "error") {
    return (
      <AppShell>
        <header className="animate-rise pt-8 pb-6">
          <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.03em]">
            Não deu certo desta vez.
          </h1>
          <p className="mt-2.5 text-[14px] leading-relaxed text-muted-foreground">{error}</p>
        </header>
        <div className="space-y-2.5">
          <Action variant="accent" onClick={start}>
            Tentar de novo
          </Action>
          <Link to="/gastos" className="block">
            <Action variant="ghost">Preencher à mão</Action>
          </Link>
        </div>
      </AppShell>
    );
  }

  /* -------------------------------- Início ------------------------------ */
  return (
    <AppShell>
      <header className="animate-rise pt-8 pb-6">
        <Pill className="border-accent/25 bg-accent/10 text-accent">Open Finance</Pill>
        <h1 className="mt-4 text-[27px] font-semibold leading-tight tracking-[-0.03em]">
          Deixe o seu banco me contar.
        </h1>
        <p className="mt-2.5 text-[14px] leading-relaxed text-muted-foreground">
          Em vez de digitar renda, saldo, fatura e gastos, o DeBoa lê o que já existe e te mostra
          uma proposta. Você confirma o que quiser.
        </p>
      </header>

      <Card>
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <div className="space-y-2.5 text-[13.5px] leading-relaxed">
            <p>
              <strong>Somente leitura.</strong> Ninguém movimenta seu dinheiro — nem eu, nem o
              provedor. Open Finance não dá esse poder.
            </p>
            <p>
              <strong>Você corta quando quiser.</strong> A autorização se revoga no app do seu
              banco, sem passar por aqui.
            </p>
            <p>
              <strong>Sua senha não passa por mim.</strong> Você se autentica no ambiente do
              próprio banco.
            </p>
          </div>
        </div>
      </Card>

      <div className="mt-7">
        <Action variant="accent" disabled={stage === "loading"} onClick={start}>
          {stage === "loading" ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Abrindo…
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Conectar meu banco
            </span>
          )}
        </Action>
      </div>

      <div className="mt-3">
        <Link to="/gastos" className="block">
          <Action variant="ghost">Prefiro preencher à mão</Action>
        </Link>
      </div>

      {stage === "widget" && token ? (
        <Suspense fallback={null}>
          <PluggyConnect
            connectToken={token}
            language="pt"
            onSuccess={({ item }) => void afterConnect(item.id)}
            onError={(e) => {
              setError(e.message || "O banco recusou a conexão.");
              setStage("error");
            }}
            onClose={() => setStage("intro")}
          />
        </Suspense>
      ) : null}
    </AppShell>
  );
}

/* -------------------------------- Pedaços -------------------------------- */

function keysOf(proposal: MappingProposal): string[] {
  const keys: string[] = [];
  if (proposal.netIncome !== null) keys.push("renda");
  if (proposal.checking > 0 || proposal.savings > 0) keys.push("saldo");
  if (proposal.creditCards.length > 0) keys.push("cartoes");
  for (const key of Object.keys(proposal.essentialExpenses)) keys.push(`essencial:${key}`);
  for (const sub of proposal.subscriptions) keys.push(`assinatura:${sub.id}`);
  return keys;
}

function Group({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-7">
      <h2 className="px-1 text-[13px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
        {title}
      </h2>
      {hint ? (
        <p className="mt-1.5 px-1 text-[13px] leading-relaxed text-muted-foreground">{hint}</p>
      ) : null}
      <div className="mt-3 space-y-2.5">{children}</div>
    </section>
  );
}

function Choice({
  on,
  onToggle,
  label,
  value,
  detail,
}: {
  on: boolean;
  onToggle: () => void;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      onClick={onToggle}
      className="block w-full text-left"
    >
      <Card
        className={cn(
          "flex items-start gap-3 transition-all active:scale-[0.99]",
          on && "border-accent/40 bg-accent/6",
        )}
      >
        <span
          className={cn(
            "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border",
            on ? "border-transparent bg-accent text-accent-foreground" : "border-border",
          )}
        >
          {on ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 flex-1 truncate text-[15px] font-medium tracking-tight">
              {label}
            </span>
            <span className="shrink-0 text-[16px] font-semibold tabular-nums tracking-[-0.02em]">
              {value}
            </span>
          </div>
          {detail ? (
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{detail}</p>
          ) : null}
        </div>
      </Card>
    </button>
  );
}
