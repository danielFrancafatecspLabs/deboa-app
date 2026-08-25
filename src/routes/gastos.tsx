import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { MoneyField } from "@/components/mapa/primitives";
import { EditRow, Group, MoneyRow, ReadRow } from "@/components/editables";
import { Action, Card, Field, Pill } from "@/components/ui-kit";
import { useFinancialProfile } from "@/hooks/useFinancialProfile";
import { cn } from "@/lib/utils";
import { ESSENTIAL_LINES, breakdown, isLumped } from "@/services/spending";
import type { EssentialExpenses, Subscription } from "@/services/financeTypes";
import { brl } from "@/utils/format";

export const Route = createFileRoute("/gastos")({
  head: () => ({
    meta: [
      { title: "Para onde vai o seu dinheiro — DeBoa" },
      {
        name: "description",
        content:
          "Veja o mês separado por categoria: moradia, contas, mercado, assinaturas e o dia a dia. Descubra onde você mais gasta e ajuste na hora.",
      },
    ],
  }),
  component: SpendingPage,
});

const SUB_EMOJIS = ["📺", "🎵", "🏋️", "☁️", "🎮", "📱", "📰", "🐶", "🚗", "💳"];
const uid = () => Math.random().toString(36).slice(2, 9);

function SpendingPage() {
  const { profile, hydrated, hasProfile, update } = useFinancialProfile();
  const [open, setOpen] = useState<string | null>(null);
  const [draft, setDraft] = useState<Subscription | null>(null);
  /** Total original quando a pessoa começa a destrinchar o número único. */
  const [splitting, setSplitting] = useState<number | null>(null);

  const toggle = (key: string) => setOpen((cur) => (cur === key ? null : key));

  if (!hydrated) {
    return (
      <AppShell>
        <div className="pt-16 text-center text-[14px] text-muted-foreground">Carregando…</div>
      </AppShell>
    );
  }

  if (!hasProfile) {
    return (
      <AppShell>
        <header className="animate-rise pt-8 pb-6">
          <h1 className="text-[27px] font-semibold leading-tight tracking-[-0.03em]">
            Para onde vai o seu dinheiro
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
            Primeiro eu preciso saber quanto entra. São quatro perguntas.
          </p>
        </header>
        <Link to="/mapa" className="block">
          <Action variant="accent">Montar meu Mapa</Action>
        </Link>
      </AppShell>
    );
  }

  const b = breakdown(profile);
  const lumped = isLumped(profile);

  const setEssential = (key: keyof EssentialExpenses, value: number) =>
    update({ essentialExpenses: { ...profile.essentialExpenses, [key]: Math.max(0, value) } });

  const saveSub = (sub: Subscription) => {
    const exists = profile.subscriptions.some((s) => s.id === sub.id);
    update({
      subscriptions: exists
        ? profile.subscriptions.map((s) => (s.id === sub.id ? sub : s))
        : [...profile.subscriptions, sub],
    });
    setDraft(null);
  };

  const removeSub = (id: string) => {
    update({ subscriptions: profile.subscriptions.filter((s) => s.id !== id) });
    setDraft(null);
  };

  /* ------------------------ Destrinchar o número único ------------------- */
  if (splitting !== null) {
    const assigned = ESSENTIAL_LINES.reduce((s, l) => s + profile.essentialExpenses[l.key], 0);
    const left = splitting - assigned;

    return (
      <AppShell focused>
        <header className="animate-rise pt-8 pb-6">
          <Pill className="border-accent/25 bg-accent/10 text-accent">Detalhando</Pill>
          <h1 className="mt-4 text-[26px] font-semibold leading-tight tracking-[-0.03em]">
            De onde vêm esses {brl(splitting)}?
          </h1>
          <p className="mt-2.5 text-[14px] leading-relaxed text-muted-foreground">
            Preencha o que lembrar. Não precisa fechar na vírgula — o que faltar eu deixo em
            “outros fixos”.
          </p>
        </header>

        {/* O saldo a distribuir, sempre à vista. */}
        <Card
          className={cn(
            left === 0
              ? "border-accent/25 bg-accent/6"
              : left < 0
                ? "border-destructive/40 bg-destructive/5"
                : undefined,
          )}
        >
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {left > 0 ? "Ainda falta distribuir" : left < 0 ? "Passou do total" : "Fechou certinho"}
          </p>
          <p className="mt-1.5 text-[32px] font-semibold leading-none tracking-[-0.04em] tabular-nums">
            {brl(Math.abs(left))}
          </p>
          <p className="mt-2 text-[13px] text-muted-foreground">
            {brl(assigned)} de {brl(splitting)} distribuídos
          </p>
        </Card>

        <div className="mt-5 space-y-2.5">
          {ESSENTIAL_LINES.map((line) => (
            <Card key={line.key}>
              <div className="flex items-start gap-3">
                <span className="text-[20px] leading-none">{line.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium tracking-tight">{line.label}</p>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
                    {line.hint}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <MoneyField
                  label=""
                  value={profile.essentialExpenses[line.key]}
                  onValueChange={(v) => setEssential(line.key, v)}
                />
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-7 space-y-2.5">
          <Action
            variant="accent"
            onClick={() => {
              // O que sobrou sem categoria continua sendo custo de vida: jogar
              // fora faria a leitura do mês melhorar sozinha, sem nada ter
              // mudado na vida da pessoa.
              if (left > 0) setEssential("other", profile.essentialExpenses.other + left);
              setSplitting(null);
              window.scrollTo({ top: 0 });
            }}
          >
            {left > 0 ? `Pronto — deixar ${brl(left)} em outros fixos` : "Pronto"}
          </Action>
          <Action
            variant="ghost"
            onClick={() => {
              setSplitting(null);
              window.scrollTo({ top: 0 });
            }}
          >
            Continuo depois
          </Action>
        </div>
      </AppShell>
    );
  }

  /* ------------------------------ A leitura ------------------------------ */
  return (
    <AppShell>
      <header className="animate-rise pt-8 pb-6">
        <Pill className="border-accent/25 bg-accent/10 text-accent">Seus gastos</Pill>
        <h1 className="mt-4 text-[27px] font-semibold leading-tight tracking-[-0.03em]">
          Para onde vai o seu dinheiro.
        </h1>
      </header>

      {lumped ? (
        <Card className="border-accent/25 bg-accent/6">
          <p className="text-[14px] leading-relaxed">
            Você me deu <strong>{brl(profile.essentialExpenses.housing)}</strong> como um número
            só. Assim eu sei o quanto sai, mas não sei de quê — e é aí que mora a resposta de onde
            dá para mexer.
          </p>
          <div className="mt-5">
            <Action
              variant="accent"
              onClick={() => {
                const lump = profile.essentialExpenses.housing;
                setSplitting(lump);
                // O valor sai de "moradia" para não ser contado duas vezes
                // enquanto a pessoa distribui.
                setEssential("housing", 0);
                window.scrollTo({ top: 0 });
              }}
            >
              Separar por categoria
            </Action>
          </div>
        </Card>
      ) : (
        <>
          <Composition
            income={b.income}
            essential={b.essentialFromSalary}
            optional={b.nonEssential}
            free={b.leftover}
          />

          {b.biggest ? (
            <Card className="mt-4">
              <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Seu maior gasto
              </p>
              <p className="mt-2 text-[18px] font-medium leading-snug tracking-tight">
                {b.biggest.emoji} {b.biggest.label} — {brl(b.biggest.amount)}
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                {b.income > 0
                  ? `${Math.round((b.biggest.amount / b.income) * 100)}% de tudo que entra no seu mês.`
                  : "Some quanto entra para eu comparar."}
              </p>
            </Card>
          ) : null}
        </>
      )}

      {/* ------------------------------ Essencial --------------------------- */}
      <Group
        title="Essencial"
        hint={
          b.essential > 0
            ? `${brl(b.essential)} por mês — o que você não escolhe deixar de pagar.`
            : "O que sai todo mês sem você decidir."
        }
      >
        {ESSENTIAL_LINES.map((line) => (
          <MoneyRow
            key={line.key}
            label={`${line.emoji}  ${line.label}`}
            amount={profile.essentialExpenses[line.key]}
            onAmountChange={(v) => setEssential(line.key, v)}
            open={open === line.key}
            onToggle={() => toggle(line.key)}
            consequence={
              <>
                {line.hint}.
                {b.income > 0 && profile.essentialExpenses[line.key] > 0 ? (
                  <>
                    {" "}
                    São{" "}
                    <strong>
                      {Math.round((profile.essentialExpenses[line.key] / b.income) * 100)}%
                    </strong>{" "}
                    da sua renda.
                  </>
                ) : null}
              </>
            }
          />
        ))}
      </Group>

      {/* ------------------------------ Benefícios -------------------------- */}
      <Group
        title="Benefícios"
        hint="Crédito, não dinheiro: só compram uma coisa. Eu desconto do que sai do salário."
      >
        <MoneyRow
          label="🍽️  Vale-refeição / alimentação"
          amount={profile.benefits.mealVoucher}
          onAmountChange={(v) =>
            update({ benefits: { ...profile.benefits, mealVoucher: Math.max(0, v) } })
          }
          open={open === "vr"}
          onToggle={() => toggle("vr")}
          consequence={
            b.coveredByVoucher > 0 ? (
              <>
                <strong>{brl(b.coveredByVoucher)}</strong> do seu mercado sai daqui, não do
                salário.
              </>
            ) : profile.essentialExpenses.food === 0 ? (
              <>Preencha o mercado acima para eu saber quanto disto realmente é usado.</>
            ) : undefined
          }
        />
        <MoneyRow
          label="🚌  Vale-transporte"
          amount={profile.benefits.transportVoucher}
          onAmountChange={(v) =>
            update({ benefits: { ...profile.benefits, transportVoucher: Math.max(0, v) } })
          }
          open={open === "vt"}
          onToggle={() => toggle("vt")}
        />
      </Group>

      {/* ----------------------------- Assinaturas -------------------------- */}
      <section className="mt-7">
        <h2 className="px-1 text-[13px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          Assinaturas
        </h2>
        <p className="mt-1.5 px-1 text-[13px] leading-relaxed text-muted-foreground">
          {b.subscriptions > 0
            ? `${brl(b.subscriptions)} por mês · ${brl(b.subscriptions * 12)} por ano. Sai igual todo mês, mas cancelar é escolha sua.`
            : "Streaming, academia, nuvem, jogo. Some baixinho e ninguém percebe."}
        </p>
        <div className="mt-3 space-y-2.5">
          {profile.subscriptions.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => setDraft(sub)}
              className="block w-full text-left"
            >
              <Card className="flex items-center gap-3 transition-all active:scale-[0.99]">
                <span className="text-[20px]">{sub.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium tracking-tight">{sub.name}</p>
                  {sub.dueDay ? (
                    <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                      Cobra todo dia {sub.dueDay}
                    </p>
                  ) : null}
                </div>
                <span className="shrink-0 text-[16px] font-semibold tabular-nums">
                  {brl(sub.amount)}
                </span>
              </Card>
            </button>
          ))}

          <button
            type="button"
            onClick={() =>
              setDraft({ id: uid(), emoji: "📺", name: "", amount: 0, dueDay: null })
            }
            className="block w-full"
          >
            <Card className="flex items-center gap-3 border-dashed transition-all active:scale-[0.99]">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
                <Plus className="h-4 w-4" />
              </span>
              <span className="text-[15px] font-medium tracking-tight">Adicionar assinatura</span>
            </Card>
          </button>
        </div>
      </section>

      {/* ------------------------------ Dia a dia --------------------------- */}
      <section className="mt-7">
        <h2 className="px-1 text-[13px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          Dia a dia
        </h2>
        <p className="mt-1.5 px-1 text-[13px] leading-relaxed text-muted-foreground">
          {b.habits > 0
            ? `${brl(b.habits)} por mês em coisas que se repetem — rolê, café, almoço fora, delivery.`
            : "Rolê, café, almoço fora, delivery. É onde o dinheiro escapa sem passar pela sua cabeça."}
        </p>
        <div className="mt-3 space-y-2.5">
          {b.lines
            .filter((l) => l.source.type === "habit")
            .map((l) => (
              <Card key={l.id} className="flex items-center gap-3">
                <span className="text-[20px]">{l.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium tracking-tight">{l.label}</p>
                  <p className="mt-0.5 text-[12.5px] text-muted-foreground">{l.hint}</p>
                </div>
                <span className="shrink-0 text-[16px] font-semibold tabular-nums">
                  {brl(l.amount)}
                </span>
              </Card>
            ))}
          <Link to="/refinar" className="block">
            <Card className="flex items-center gap-3 border-dashed transition-all active:scale-[0.99]">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
                <Plus className="h-4 w-4" />
              </span>
              <span className="text-[15px] font-medium tracking-tight">
                {b.habits > 0 ? "Ajustar meus hábitos" : "Mapear meus hábitos"}
              </span>
            </Card>
          </Link>
        </div>
      </section>

      {/* -------------------------------- Cartão ---------------------------- */}
      <Group title="Cartão">
        <ReadRow
          label="Fatura atual"
          value={b.bills > 0 ? brl(b.bills) : "Não sei"}
          hint={
            b.bills > 0 ? (
              <>
                A fatura é a forma de pagar, não uma categoria — boa parte dela já está contada
                acima, no mercado e no dia a dia. Por isso eu não somo as duas coisas.
              </>
            ) : (
              <>
                <Link to="/refinar" className="underline underline-offset-2">
                  Me conte seus cartões
                </Link>{" "}
                e eu passo a saber quanto do mês seguinte já está comprometido.
              </>
            )
          }
        />
      </Group>

      {!lumped ? (
        <div className="mt-7">
          <Action
            variant="ghost"
            onClick={() => {
              setSplitting(b.essential);
              ESSENTIAL_LINES.forEach((l) => setEssential(l.key, 0));
              window.scrollTo({ top: 0 });
            }}
          >
            Refazer a divisão do essencial
          </Action>
        </div>
      ) : null}

      <p className="mt-6 px-1 text-[12px] leading-relaxed text-muted-foreground">
        Tudo aqui é o que você me contou. O DeBoa não lê sua conta nem seus cartões.
      </p>

      {draft ? (
        <SubscriptionSheet
          draft={draft}
          onChange={setDraft}
          onSave={() => saveSub(draft)}
          onDelete={
            profile.subscriptions.some((s) => s.id === draft.id)
              ? () => removeSub(draft.id)
              : null
          }
          onClose={() => setDraft(null)}
        />
      ) : null}
    </AppShell>
  );
}

/* ----------------------------- A composição ------------------------------ */

/**
 * O mês inteiro em uma barra.
 *
 * Três tipos de dinheiro, não nove categorias: o que você não escolhe, o que
 * você escolhe, e o que sobra. Cada fatia leva rótulo e valor logo abaixo —
 * o amarelo não tem contraste suficiente contra o fundo para carregar
 * significado sozinho, e cor sozinha nunca deveria carregar mesmo.
 */
function Composition({
  income,
  essential,
  optional,
  free,
}: {
  income: number;
  essential: number;
  optional: number;
  free: number;
}) {
  const total = Math.max(income, essential + optional, 1);
  const over = essential + optional > income;

  const parts = [
    { key: "essencial", label: "Essencial", value: essential, color: "var(--spend-essencial)" },
    { key: "opcional", label: "Não essencial", value: optional, color: "var(--spend-opcional)" },
    { key: "sobra", label: "Sobra do mês", value: free, color: "var(--spend-livre)" },
  ].filter((p) => p.value > 0);

  return (
    <Card>
      <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        Seu mês
      </p>
      <p className="mt-1.5 text-[15px] leading-relaxed">De cada {brl(income)} que entram:</p>

      {/* 2px de respiro entre as fatias, para as bordas não se fundirem. */}
      <div className="mt-4 flex h-3.5 w-full gap-[2px] overflow-hidden rounded-full bg-muted">
        {parts.map((p) => (
          <span
            key={p.key}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{ width: `${(p.value / total) * 100}%`, background: p.color }}
          />
        ))}
      </div>

      <dl className="mt-4 space-y-2.5">
        {parts.map((p) => (
          <div key={p.key} className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: p.color }}
            />
            <dt className="min-w-0 flex-1 text-[14px] tracking-tight">{p.label}</dt>
            <dd className="shrink-0 text-[14px] tabular-nums text-muted-foreground">
              {income > 0 ? `${Math.round((p.value / income) * 100)}%` : "—"}
            </dd>
            <dd className="w-24 shrink-0 text-right text-[15px] font-semibold tabular-nums tracking-[-0.02em]">
              {brl(p.value)}
            </dd>
          </div>
        ))}
      </dl>

      {/*
        Esta sobra é anterior às caixinhas. O "livre para gastar" do Plano é
        menor, porque lá o dinheiro guardado já saiu — dois números parecidos
        com nomes parecidos confundem mais do que ajudam.
      */}
      {!over && free > 0 ? (
        <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
          Ainda sem separar nada para as caixinhas. Depois de guardar, o que fica no bolso é o{" "}
          <Link to="/plano" className="underline underline-offset-2">
            livre do seu plano
          </Link>
          .
        </p>
      ) : null}

      {over ? (
        <p className="mt-4 text-[13px] leading-relaxed text-destructive">
          Pelo que você me contou, sai mais do que entra — a diferença é {brl(essential + optional - income)}
          . Vale conferir os números acima antes de eu montar qualquer plano.
        </p>
      ) : null}
    </Card>
  );
}

/* ---------------------------- Sheet de assinatura ------------------------- */

function SubscriptionSheet({
  draft,
  onChange,
  onSave,
  onDelete,
  onClose,
}: {
  draft: Subscription;
  onChange: (s: Subscription) => void;
  onSave: () => void;
  onDelete: (() => void) | null;
  onClose: () => void;
}) {
  const valid = draft.name.trim().length > 1 && draft.amount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 backdrop-blur-[6px]">
      <div className="animate-sheet flex max-h-[92vh] w-full max-w-md flex-col overflow-y-auto rounded-t-[32px] border border-border/60 bg-surface px-6 pt-6 pb-safe shadow-lift sm:mb-4 sm:rounded-b-[32px]">
        <div className="mb-5 flex justify-end">
          <button
            aria-label="Fechar"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <h2 className="text-[24px] font-semibold leading-tight tracking-[-0.03em]">
          {onDelete ? "Ajustar assinatura" : "Nova assinatura"}
        </h2>

        <div className="mt-6 space-y-6 pb-8">
          <div>
            <p className="text-[13px] font-medium text-muted-foreground">Ícone</p>
            <div className="mt-2.5 grid grid-cols-10 gap-1.5">
              {SUB_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => onChange({ ...draft, emoji: e })}
                  className={cn(
                    "grid h-9 place-items-center rounded-xl border text-[16px] transition-all active:scale-[0.94]",
                    draft.emoji === e ? "border-accent bg-accent/10" : "border-border bg-surface",
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <Field
            label="Qual é?"
            placeholder="Ex.: Netflix, academia, Spotify"
            value={draft.name}
            onChange={(e) => onChange({ ...draft, name: e.target.value })}
          />

          <MoneyField
            label="Quanto por mês"
            value={draft.amount}
            onValueChange={(amount) => onChange({ ...draft, amount })}
          />

          <div>
            <p className="text-[13px] font-medium text-muted-foreground">
              Dia da cobrança <span className="font-normal">— se você souber</span>
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {[1, 5, 10, 15, 20, 25].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onChange({ ...draft, dueDay: draft.dueDay === d ? null : d })}
                  className={cn(
                    "min-w-11 rounded-full border px-3 py-2 text-[13px] font-medium tabular-nums transition-all active:scale-[0.97]",
                    draft.dueDay === d
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border bg-surface",
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {valid ? (
            <div className="animate-rise rounded-2xl border border-accent/25 bg-accent/6 p-4">
              <p className="text-[13.5px] leading-relaxed">
                {brl(draft.amount)} por mês são <strong>{brl(draft.amount * 12)}</strong> por ano.
              </p>
            </div>
          ) : null}

          <div className="space-y-2.5">
            <Action variant="accent" disabled={!valid} onClick={onSave}>
              {onDelete ? "Salvar" : "Adicionar"}
            </Action>
            {onDelete ? (
              <Action variant="ghost" className="text-destructive" onClick={onDelete}>
                <span className="inline-flex items-center gap-1.5">
                  <Trash2 className="h-4 w-4" />
                  Cancelei essa assinatura
                </span>
              </Action>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
