import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CreditCard, LogOut, Repeat, Target, User as UserIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ChoiceGrid, Progress } from "@/components/mapa/primitives";
import { DayPicker, EditRow, Group, MoneyRow, ReadRow } from "@/components/perfil/editables";
import { Action, Card, Pill } from "@/components/ui-kit";
import { useAuth } from "@/hooks/useAuth";
import { useFinancialProfile } from "@/hooks/useFinancialProfile";
import { essentialTotal, goalMath, totalLiquidity } from "@/services/financeMath";
import { financialInsightEngine } from "@/services/financialInsightEngine";
import { toUserContext } from "@/services/contextBridge";
import type { EmploymentType, Goal } from "@/services/financeTypes";
import { brl } from "@/utils/format";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Seus dados — DeBoa" },
      {
        name: "description",
        content:
          "Tudo que o DeBoa sabe sobre o seu momento, em um lugar só. Mude qualquer número e veja a leitura mudar na hora.",
      },
      { property: "og:title", content: "Seus dados — DeBoa" },
      {
        property: "og:description",
        content:
          "O painel do seu Mapa Financeiro: o que eu sei, o que eu concluo, o que ainda falta.",
      },
    ],
  }),
  component: ProfilePage,
});

const TONE: Record<string, string> = {
  green: "🟢",
  yellow: "🟡",
  orange: "🟠",
  red: "🔴",
};

const EMPLOYMENT: readonly EmploymentType[] = [
  "CLT",
  "PJ",
  "Autônomo",
  "Empresário",
  "Estudante",
  "Desempregado",
] as const;

/** Employment types the reserve maths treats as variable income. */
const VARIABLE_INCOME: readonly string[] = ["PJ", "Autônomo", "Empresário", "Desempregado"];

/** A purchase used only to make "quanto isso pesa" concrete. */
const REFERENCE_PURCHASE = 400;

function ProfilePage() {
  const router = useRouter();
  const { user, initialized, signOut } = useAuth();
  const { profile, hydrated, hasProfile, update, clearProfile } = useFinancialProfile();

  /** Only one row is open at a time: five inputs at once is a spreadsheet. */
  const [open, setOpen] = useState<string | null>(null);
  const toggle = (key: string) => setOpen((cur) => (cur === key ? null : key));

  // The reading as it was when this screen opened, so an edit can show what it
  // moved. Captured once, in an effect, so it survives re-renders.
  const baseline = useRef<{ score: number; status: string } | null>(null);
  useEffect(() => {
    if (!hydrated || !hasProfile || baseline.current) return;
    // Reads the profile at the moment the screen settles, on purpose: this is a
    // snapshot to compare against, not a value to keep in step.
    const { score, status } = financialInsightEngine(profile).financialStatus;
    baseline.current = { score, status };
  }, [hydrated, hasProfile, profile]);

  const signOutAndLeave = async () => {
    await signOut();
    router.navigate({ to: "/login" });
  };

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
            Seus dados
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
            Ainda não há nada aqui — é o seu Mapa que alimenta esta tela.
          </p>
        </header>
        <Card>
          <p className="text-[14px] leading-relaxed text-muted-foreground">
            São <strong>quatro perguntas</strong>. Depois delas, tudo que eu souber sobre o seu
            momento aparece aqui, e você muda o que quiser sem repetir o questionário.
          </p>
          <div className="mt-5">
            <Link to="/mapa" className="block">
              <Action variant="accent">Montar meu Mapa</Action>
            </Link>
          </div>
        </Card>
        <AccountCard user={user} initialized={initialized} onSignOut={signOutAndLeave} />
      </AppShell>
    );
  }

  const r = financialInsightEngine(profile);
  const decisionInputs = toUserContext(profile);

  const essentials = essentialTotal(profile.essentialExpenses);
  const liquidity = totalLiquidity(profile.liquidAssets);
  const leftover = Math.max(r.income - essentials, 0);
  const committedShare = r.income > 0 ? (essentials + r.cards.bills) / r.income : 0;
  const monthsCovered = essentials > 0 ? liquidity / essentials : 0;

  /**
   * The Mapa asks for one lump sum and stores it in `housing`; the refinement
   * flow can itemise the rest. Editing the total therefore adjusts the lump
   * sum and leaves anything itemised alone.
   */
  const setEssentialsTotal = (next: number) => {
    const itemised = essentials - profile.essentialExpenses.housing;
    update({
      essentialExpenses: {
        ...profile.essentialExpenses,
        housing: Math.max(0, next - itemised),
      },
    });
  };

  const setLiquidityTotal = (next: number) => {
    const elsewhere = liquidity - profile.liquidAssets.checking;
    update({
      liquidAssets: {
        ...profile.liquidAssets,
        checking: Math.max(0, next - elsewhere),
      },
    });
  };

  const goal: Goal | null =
    profile.goals.find((g) => g.kind !== "emergency") ?? profile.goals[0] ?? null;
  const gm = goal ? goalMath(goal) : null;
  const patchGoal = (patch: Partial<Goal>) => {
    if (!goal) return;
    update({ goals: profile.goals.map((g) => (g.id === goal.id ? { ...g, ...patch } : g)) });
  };

  const missing = [
    profile.creditCards.length === 0
      ? {
          icon: CreditCard,
          title: "Seus cartões",
          why: "Para eu saber quanto do seu mês seguinte já está comprometido antes de responder.",
        }
      : null,
    profile.habits.length === 0
      ? {
          icon: Repeat,
          title: "Seus hábitos",
          why: "Para eu encontrar o dinheiro que escapa sem você perceber.",
        }
      : null,
    profile.goals.length <= 1
      ? {
          icon: Target,
          title: "Mais objetivos",
          why: "Para eu pesar cada compra contra tudo que você quer conquistar.",
        }
      : null,
  ].filter((m) => m !== null);

  const moved =
    baseline.current && baseline.current.score !== r.financialStatus.score
      ? {
          points: r.financialStatus.score - baseline.current.score,
          from: baseline.current.status,
          changed: baseline.current.status !== r.financialStatus.status,
        }
      : null;

  return (
    <AppShell>
      <header className="animate-rise pt-8 pb-6">
        <Pill className="border-accent/25 bg-accent/10 text-accent">Seus dados</Pill>
        <h1 className="mt-4 text-[27px] font-semibold leading-tight tracking-[-0.03em]">
          O que eu sei sobre o seu momento.
        </h1>
        <p className="mt-2.5 text-[14px] leading-relaxed text-muted-foreground">
          Toque em qualquer número para mudar. Eu refaço a leitura na hora — você não precisa
          repetir o questionário.
        </p>
      </header>

      {/* The reading, kept above the numbers that produce it. */}
      <Card>
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          Leitura de agora
        </p>
        <p className="mt-2 text-[22px] font-semibold tracking-[-0.03em]">
          {TONE[r.financialStatus.tone]} {r.financialStatus.status}
        </p>
        <Progress className="mt-3" value={r.financialStatus.score / 100} />
        {moved ? (
          <p className="mt-3 text-[13px] leading-relaxed">
            {moved.changed ? (
              <>
                Mudou de <strong>{moved.from}</strong> para{" "}
                <strong>{r.financialStatus.status}</strong> com o que você acabou de editar.
              </>
            ) : (
              <>
                {moved.points > 0 ? "Subiu" : "Caiu"}{" "}
                <strong>
                  {Math.abs(moved.points)} {Math.abs(moved.points) === 1 ? "ponto" : "pontos"}
                </strong>{" "}
                desde que você abriu esta tela.
              </>
            )}
          </p>
        ) : (
          <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
            {r.financialStatus.reading}
          </p>
        )}
      </Card>

      {/* ------------------------------ O que entra ----------------------------- */}
      <Group title="O que entra">
        <MoneyRow
          label="Renda por mês"
          amount={profile.netIncome}
          onAmountChange={(netIncome) => update({ netIncome })}
          open={open === "renda"}
          onToggle={() => toggle("renda")}
          extra={
            <DayPicker value={profile.salaryDay} onSelect={(salaryDay) => update({ salaryDay })} />
          }
          consequence={
            profile.netIncome > 0 ? (
              <>
                Depois do essencial sobram <strong>{brl(leftover)}</strong> por mês.
                {r.temporal.daysUntilNextIncome !== null
                  ? ` Faltam ${r.temporal.daysUntilNextIncome} dias até o próximo recebimento.`
                  : ""}
              </>
            ) : undefined
          }
        />
        <EditRow
          label="Seu vínculo"
          value={profile.employmentType ?? "Não informado"}
          open={open === "vinculo"}
          onToggle={() => toggle("vinculo")}
          consequence={
            profile.employmentType ? (
              <>
                Renda{" "}
                {VARIABLE_INCOME.includes(profile.employmentType) ? "variável" : "estável"} pede{" "}
                <strong>
                  {r.emergency.minMonths} a {r.emergency.maxMonths} meses
                </strong>{" "}
                de reserva — por isso eu sugiro {brl(r.emergency.min)}.
              </>
            ) : (
              <>
                Sem isso eu assumo renda estável, e posso estar sugerindo uma reserva menor do
                que a sua vida pede.
              </>
            )
          }
        >
          <ChoiceGrid
            options={EMPLOYMENT}
            value={profile.employmentType}
            onSelect={(v) => update({ employmentType: v as EmploymentType })}
          />
        </EditRow>
      </Group>

      {/* ----------------------------- O que sai -------------------------------- */}
      <Group title="O que sai todo mês">
        <MoneyRow
          label="Custo essencial"
          amount={essentials}
          onAmountChange={setEssentialsTotal}
          open={open === "essencial"}
          onToggle={() => toggle("essencial")}
          consequence={
            r.income > 0 && essentials > 0 ? (
              <>
                É <strong>{Math.round((essentials / r.income) * 100)}%</strong> da sua renda. É
                essa folga que uma compra come.
              </>
            ) : undefined
          }
        />
        <ReadRow
          label="Faturas de cartão"
          value={profile.creditCards.length > 0 ? brl(r.cards.bills) : "Não sei"}
          hint={
            profile.creditCards.length === 0 ? (
              <>Enquanto eu não souber, eu decido como se não houvesse fatura chegando.</>
            ) : r.cards.nextDueInDays !== null ? (
              <>Próxima vence em {r.cards.nextDueInDays} dias.</>
            ) : undefined
          }
        />
        <ReadRow
          label="Hábitos mapeados"
          value={profile.habits.length > 0 ? `${brl(r.habitsCost)}/mês` : "Não sei"}
          hint={
            profile.habits.length > 0 ? <>Em {profile.habits.length} hábitos.</> : undefined
          }
        />
      </Group>

      {/* --------------------------- O que você tem ----------------------------- */}
      <Group title="O que você tem">
        <MoneyRow
          label="Disponível hoje"
          amount={liquidity}
          onAmountChange={setLiquidityTotal}
          open={open === "disponivel"}
          onToggle={() => toggle("disponivel")}
          consequence={
            liquidity > 0 ? (
              <>
                Uma compra de {brl(REFERENCE_PURCHASE)} pesa{" "}
                <strong>{Math.round((REFERENCE_PURCHASE / liquidity) * 100)}%</strong> disso.
                {essentials > 0
                  ? ` Cobre ${monthsCovered.toFixed(1)} ${
                      monthsCovered < 2 ? "mês" : "meses"
                    } do seu essencial.`
                  : ""}
              </>
            ) : undefined
          }
        />
      </Group>

      {/* ------------------------ Onde você quer chegar ------------------------- */}
      <Group title="Onde você quer chegar">
        {goal && gm ? (
          <>
            <MoneyRow
              label={`${goal.emoji} ${goal.name} — quanto precisa`}
              amount={goal.target}
              onAmountChange={(target) => patchGoal({ target })}
              open={open === "meta"}
              onToggle={() => toggle("meta")}
              consequence={
                gm.remaining > 0 ? (
                  <>
                    Faltam <strong>{brl(gm.remaining)}</strong> — cerca de{" "}
                    {brl(gm.monthlyRequiredContribution)}/mês pelos próximos{" "}
                    {gm.monthsRemaining} meses.
                  </>
                ) : (
                  <>Você já chegou lá.</>
                )
              }
            />
            <MoneyRow
              label="Já guardado"
              amount={goal.saved}
              onAmountChange={(saved) => patchGoal({ saved: Math.min(saved, goal.target) })}
              open={open === "guardado"}
              onToggle={() => toggle("guardado")}
              consequence={<>Você está em {Math.round(gm.progress * 100)}% do objetivo.</>}
            />
          </>
        ) : (
          <ReadRow
            label="Objetivo"
            value="Nenhum"
            hint={<>Sem um objetivo eu só sei o que você tem, não o que você quer.</>}
          />
        )}
      </Group>

      {/* --------------------------- O que eu concluo --------------------------- */}
      <Group
        title="O que eu concluo disso"
        hint="Estes números eu calculo — você não precisa preencher."
      >
        <ReadRow
          label="Dá para guardar por mês"
          value={brl(Math.max(r.savingCapacity, 0))}
          hint={
            r.savingCapacity > 0 ? (
              <>Renda menos essencial, hábitos e a parcela das faturas.</>
            ) : (
              <>Pelas contas de agora, o mês fecha sem sobra.</>
            )
          }
        />
        <ReadRow
          label="Reserva sugerida"
          value={brl(r.emergency.min)}
          hint={
            <>
              {r.emergency.minMonths} meses do seu essencial
              {profile.employmentType ? ` para quem é ${profile.employmentType}` : ""}.
            </>
          }
        />
        <ReadRow
          label="Renda comprometida"
          value={`${Math.round(committedShare * 100)}%`}
          hint={<>Essencial e faturas somados, sobre o que entra.</>}
        />
      </Group>

      {/* ------------------------- Na hora de decidir --------------------------- */}
      <Card className="mt-7 border-accent/25 bg-accent/6">
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-accent">
          Na hora de decidir
        </p>
        <p className="mt-2 text-[14px] leading-relaxed">
          Quando você me perguntar sobre uma compra, é isto que eu levo comigo — nada além
          disso, nada que você não tenha me contado.
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
          {(
            [
              ["Renda do mês", decisionInputs.monthlyIncome],
              ["Disponível", decisionInputs.availableBalance],
              ["Compromissos", decisionInputs.upcomingCommitments],
              ["Guardando/mês", decisionInputs.monthlyGoal],
            ] as const
          ).map(([label, value]) => (
            <div key={label}>
              <dt className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
                {label}
              </dt>
              <dd className="mt-0.5 text-[16px] font-semibold tracking-[-0.02em] tabular-nums">
                {brl(value)}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      {/* ------------------------- O que ainda falta ---------------------------- */}
      {missing.length > 0 ? (
        <section className="mt-7">
          <h2 className="px-1 text-[13px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            O que eu ainda não sei
          </h2>
          <div className="mt-3 space-y-2.5">
            {missing.map(({ icon: Icon, title, why }) => (
              <Card key={title} className="flex items-center gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                  <Icon className="h-[17px] w-[17px]" strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium tracking-tight">{title}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
                    {why}
                  </p>
                </div>
              </Card>
            ))}
          </div>
          <div className="mt-3">
            <Link to="/refinar" className="block">
              <Action variant="outline">Contar isso ao DeBoa</Action>
            </Link>
          </div>
        </section>
      ) : null}

      <AccountCard user={user} initialized={initialized} onSignOut={signOutAndLeave} />

      <Card className="mt-4 space-y-4">
        <Pill>Seus dados são seus</Pill>
        <ul className="space-y-2 text-[13px] leading-relaxed text-muted-foreground">
          <li>Você inseriu tudo isto à mão. Não conectamos sua conta bancária neste MVP.</li>
          <li>Fica salvo neste aparelho e, se você tiver conta, na sua conta.</li>
          <li>Pode apagar tudo quando quiser.</li>
        </ul>
        <div className="space-y-2.5">
          <Link to="/como-pensa" className="block">
            <Action variant="ghost">Como o DeBoa pensa</Action>
          </Link>
          <Action
            variant="ghost"
            className="text-destructive"
            onClick={() => {
              if (
                typeof window !== "undefined" &&
                window.confirm("Apagar tudo que o DeBoa sabe sobre você?")
              ) {
                clearProfile();
              }
            }}
          >
            Apagar meus dados
          </Action>
        </div>
      </Card>
    </AppShell>
  );
}

/* -------------------------------- Conta ---------------------------------- */

function AccountCard({
  user,
  initialized,
  onSignOut,
}: {
  user: { email?: string | undefined; created_at: string } | null;
  initialized: boolean;
  onSignOut: () => void;
}) {
  return (
    <Card className="mt-7 space-y-3">
      <Pill>{user ? "Sua conta" : "Conta"}</Pill>
      {!initialized ? (
        <p className="text-[14px] text-muted-foreground">Carregando…</p>
      ) : user ? (
        <div className="space-y-2.5">
          <div className="flex items-center gap-3 rounded-2xl bg-muted/50 px-4 py-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10">
              <UserIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-medium">{user.email}</p>
              <p className="text-[12px] text-muted-foreground">
                Desde {new Date(user.created_at).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-2.5 text-[14px] text-muted-foreground transition-colors active:bg-muted"
          >
            <LogOut className="h-4 w-4" />
            Sair da conta
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-[14px] leading-relaxed text-muted-foreground">
            Sem conta, tudo isto vive só neste aparelho. Com conta, você reencontra seu Mapa em
            qualquer lugar.
          </p>
          <Link to="/login" className="block">
            <Action variant="primary">Criar conta ou entrar</Action>
          </Link>
        </div>
      )}
    </Card>
  );
}
