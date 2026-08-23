import { Home, Plus, Sparkles, Trash2, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Action, Card, Pill } from "@/components/ui-kit";
import {
  ChoiceGrid,
  MoneyField,
  NumberField,
  Progress,
  SelectField,
  StepShell,
  TextField,
} from "@/components/mapa/primitives";
import {
  CARD_BRANDS,
  CARD_ISSUERS,
  EMPLOYMENT_DURATIONS,
  EMPLOYMENT_TYPES,
  ESSENTIAL_FIELDS,
  GOAL_TEMPLATES,
  HABIT_CATALOG,
  INCOME_SOURCE_SUGGESTIONS,
  LIQUID_FIELDS,
} from "@/data/financeSeed";
import {
  analyzeFgtsHomePurchase,
  calculateEstimatedFGTSMonthly,
  cardTotals,
  emergencyRange,
  essentialTotal,
  estimateGrossFromNet,
  goalMath,
  habitMonthlyCost,
  monthlySavingCapacity,
  totalLiquidity,
  totalNetIncome,
} from "@/services/financeMath";
import { financialInsightEngine } from "@/services/financialInsightEngine";
import type {
  CardBrand,
  EmploymentDuration,
  EmploymentType,
  FinancialProfile,
  Goal,
  GoalPriority,
  Habit,
  IncomeFrequency,
} from "@/services/financeTypes";
import { brl } from "@/utils/format";

export type StepProps = {
  profile: FinancialProfile;
  update: (patch: Partial<FinancialProfile>) => void;
};

const uid = () => Math.random().toString(36).slice(2, 9);

/* ---------------------------------- 1. Você --------------------------------- */

export function StepYou({ profile, update }: StepProps) {
  return (
    <StepShell
      eyebrow="Etapa 1 de 7"
      title="Vamos começar por você."
      subtitle="Uso isso só como contexto — nunca para decidir por você."
    >
      <Card className="space-y-5">
        <NumberField
          label="Quantos anos você tem?"
          value={profile.age}
          suffix="anos"
          onValueChange={(age) => update({ age })}
        />
        <div>
          <p className="mb-2 text-[13px] font-medium text-muted-foreground">
            Qual é a sua situação profissional?
          </p>
          <ChoiceGrid
            options={EMPLOYMENT_TYPES}
            value={profile.employmentType}
            onSelect={(v) => update({ employmentType: v as EmploymentType })}
          />
        </div>
        {profile.employmentType === "CLT" ? (
          <div className="animate-rise">
            <p className="mb-2 text-[13px] font-medium text-muted-foreground">
              Há quanto tempo você trabalha como CLT?
            </p>
            <ChoiceGrid
              options={EMPLOYMENT_DURATIONS}
              value={profile.employmentDuration}
              onSelect={(v) => update({ employmentDuration: v as EmploymentDuration })}
            />
          </div>
        ) : null}
      </Card>
    </StepShell>
  );
}

/* --------------------------------- 2. Renda --------------------------------- */

export function StepIncome({ profile, update }: StepProps) {
  const total = totalNetIncome(profile);
  const gross =
    profile.knowsGross && profile.grossIncome
      ? profile.grossIncome
      : estimateGrossFromNet(profile.netIncome);
  const fgtsMonthly = calculateEstimatedFGTSMonthly(gross);
  const isCLT = profile.employmentType === "CLT";

  return (
    <StepShell
      eyebrow="Etapa 2 de 7"
      title="Quanto entra na sua conta por mês?"
      subtitle="Considere o valor que realmente chega até você depois dos descontos."
    >
      <Card className="space-y-5">
        <MoneyField
          label="Renda líquida mensal"
          value={profile.netIncome}
          onValueChange={(netIncome) => update({ netIncome })}
        />
        <NumberField
          label="Que dia seu dinheiro costuma cair?"
          hint="Ex.: dia 5. Uso isso para entender em que ponto do mês você está."
          value={profile.salaryDay}
          suffix="do mês"
          onValueChange={(salaryDay) =>
            update({ salaryDay: salaryDay ? Math.min(salaryDay, 31) : null })
          }
        />
      </Card>

      <Card className="space-y-4">
        <p className="text-[15px] font-medium tracking-tight">
          Você recebe algum dinheiro além do salário?
        </p>
        <div className="flex flex-wrap gap-2">
          {INCOME_SOURCE_SUGGESTIONS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() =>
                update({
                  incomeSources: [
                    ...profile.incomeSources,
                    { id: uid(), name, amount: 0, frequency: "Mensal", payDay: null },
                  ],
                })
              }
              className="rounded-full border border-border bg-surface px-3 py-2 text-[13px] font-medium active:scale-[0.98]"
            >
              + {name}
            </button>
          ))}
        </div>

        {profile.incomeSources.map((source) => (
          <div key={source.id} className="rounded-2xl border border-border/70 bg-muted/40 p-3">
            <div className="flex items-center justify-between gap-2">
              <TextField
                label="Fonte"
                value={source.name}
                onValueChange={(name) =>
                  update({
                    incomeSources: profile.incomeSources.map((s) =>
                      s.id === source.id ? { ...s, name } : s,
                    ),
                  })
                }
              />
              <button
                type="button"
                aria-label="Remover fonte"
                onClick={() =>
                  update({
                    incomeSources: profile.incomeSources.filter((s) => s.id !== source.id),
                  })
                }
                className="mt-6 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface text-muted-foreground"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 space-y-3">
              <MoneyField
                label="Valor médio mensal"
                value={source.amount}
                onValueChange={(amount) =>
                  update({
                    incomeSources: profile.incomeSources.map((s) =>
                      s.id === source.id ? { ...s, amount } : s,
                    ),
                  })
                }
              />
              <SelectField
                label="Frequência"
                value={source.frequency}
                options={["Mensal", "Quinzenal", "Semanal", "Variável", "Anual"]}
                onValueChange={(frequency) =>
                  update({
                    incomeSources: profile.incomeSources.map((s) =>
                      s.id === source.id
                        ? { ...s, frequency: frequency as IncomeFrequency }
                        : s,
                    ),
                  })
                }
              />
            </div>
          </div>
        ))}

        <div className="rounded-2xl bg-muted/60 p-4">
          <p className="text-[12px] uppercase tracking-[0.08em] text-muted-foreground">
            Renda líquida total
          </p>
          <p className="mt-1 text-[26px] font-semibold tracking-[-0.03em]">{brl(total)}</p>
        </div>
      </Card>

      <Card className="space-y-4">
        <p className="text-[15px] font-medium tracking-tight">
          Você sabe aproximadamente qual é o seu salário bruto?
        </p>
        <ChoiceGrid
          options={["Sim", "Não tenho certeza"]}
          value={profile.knowsGross === null ? null : profile.knowsGross ? "Sim" : "Não tenho certeza"}
          onSelect={(v) => update({ knowsGross: v === "Sim" })}
        />
        {profile.knowsGross ? (
          <MoneyField
            label="Salário bruto"
            value={profile.grossIncome ?? 0}
            onValueChange={(grossIncome) => update({ grossIncome })}
          />
        ) : profile.knowsGross === false ? (
          <div className="rounded-2xl border border-accent/25 bg-accent/6 p-4">
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-accent">
              Estimativa de salário bruto
            </p>
            <p className="mt-1 text-[24px] font-semibold tracking-[-0.03em]">
              {brl(estimateGrossFromNet(profile.netIncome))}
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
              Esse valor é aproximado. Para maior precisão, confira seu holerite.
            </p>
          </div>
        ) : null}
      </Card>

      {isCLT ? (
        <Card className="space-y-4">
          <Pill>FGTS</Pill>
          <MoneyField
            label="Quanto você tem hoje no seu FGTS?"
            hint="Pode consultar esse valor no aplicativo FGTS."
            value={profile.fgtsBalance}
            onValueChange={(fgtsBalance) => update({ fgtsBalance })}
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-muted/60 p-3">
              <p className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
                Estimativa de novos depósitos
              </p>
              <p className="mt-1 text-[18px] font-semibold tracking-tight">
                {brl(fgtsMonthly)}/mês
              </p>
            </div>
            <div className="rounded-2xl bg-muted/60 p-3">
              <p className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
                Projeção em 12 meses
              </p>
              <p className="mt-1 text-[18px] font-semibold tracking-tight">
                {brl(profile.fgtsBalance + fgtsMonthly * 12)}
              </p>
            </div>
          </div>
          <p className="text-[12px] leading-relaxed text-muted-foreground">
            Estimativa baseada em 8% do salário bruto, sem considerar rendimentos. O FGTS
            possui regras específicas para movimentação, então não trato ele como dinheiro
            disponível para o dia a dia.
          </p>
        </Card>
      ) : null}
    </StepShell>
  );
}

/* ------------------------------ 3. Seu dinheiro ----------------------------- */

export function StepMoney({ profile, update }: StepProps) {
  const liquidity = totalLiquidity(profile.liquidAssets);
  const essential = essentialTotal(profile.essentialExpenses);

  return (
    <StepShell
      eyebrow="Etapa 3 de 7"
      title="Quanto dinheiro você tem disponível hoje?"
      subtitle="O FGTS não entra nessa soma — ele tem regras próprias."
    >
      <Card className="space-y-4">
        {LIQUID_FIELDS.map(({ key, label }) => (
          <MoneyField
            key={key}
            label={label}
            value={profile.liquidAssets[key]}
            onValueChange={(v) =>
              update({ liquidAssets: { ...profile.liquidAssets, [key]: v } })
            }
          />
        ))}
        <div className="rounded-2xl bg-muted/60 p-4">
          <p className="text-[12px] uppercase tracking-[0.08em] text-muted-foreground">
            Dinheiro que você consegue acessar agora
          </p>
          <p className="mt-1 text-[26px] font-semibold tracking-[-0.03em]">{brl(liquidity)}</p>
        </div>
      </Card>

      <Card className="space-y-4">
        <p className="text-[15px] font-medium tracking-tight">
          Quanto você gasta por mês com o que é essencial para viver?
        </p>
        {ESSENTIAL_FIELDS.map(({ key, label }) => (
          <MoneyField
            key={key}
            label={label}
            value={profile.essentialExpenses[key]}
            onValueChange={(v) =>
              update({ essentialExpenses: { ...profile.essentialExpenses, [key]: v } })
            }
          />
        ))}
        <div className="rounded-2xl bg-muted/60 p-4">
          <p className="text-[12px] uppercase tracking-[0.08em] text-muted-foreground">
            Seu custo essencial mensal
          </p>
          <p className="mt-1 text-[26px] font-semibold tracking-[-0.03em]">{brl(essential)}</p>
        </div>
      </Card>
    </StepShell>
  );
}

/* ------------------------------- 4. Cartões --------------------------------- */

export function StepCards({ profile, update }: StepProps) {
  const totals = cardTotals(profile.creditCards);

  function addCard() {
    update({
      creditCards: [
        ...profile.creditCards,
        {
          id: uid(),
          name: "",
          brand: "Visa",
          issuer: "Nubank",
          currentBill: 0,
          limit: 0,
          committed: 0,
          dueDay: 10,
          bestDay: 1,
        },
      ],
    });
  }

  function patchCard(id: string, patch: Partial<(typeof profile.creditCards)[number]>) {
    update({
      creditCards: profile.creditCards.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  }

  return (
    <StepShell
      eyebrow="Etapa 4 de 7"
      title="Quantos cartões de crédito você usa?"
      subtitle="Crédito não é vilão. Só preciso saber quanto do seu futuro já está comprometido."
    >
      {profile.creditCards.map((card, i) => (
        <Card key={card.id} className="space-y-4">
          <div className="flex items-center justify-between">
            <Pill>Cartão {i + 1}</Pill>
            <button
              type="button"
              aria-label="Remover cartão"
              onClick={() =>
                update({ creditCards: profile.creditCards.filter((c) => c.id !== card.id) })
              }
              className="grid h-10 w-10 place-items-center rounded-full bg-muted text-muted-foreground"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <TextField
            label="Nome do cartão"
            placeholder="Ex.: Nubank"
            value={card.name}
            onValueChange={(name) => patchCard(card.id, { name })}
          />
          <SelectField
            label="Bandeira"
            value={card.brand}
            options={CARD_BRANDS}
            onValueChange={(brand) => patchCard(card.id, { brand: brand as CardBrand })}
          />
          <SelectField
            label="Banco/instituição"
            value={card.issuer}
            options={CARD_ISSUERS}
            onValueChange={(issuer) => patchCard(card.id, { issuer })}
          />
          <MoneyField
            label="Quanto está sua fatura atual?"
            value={card.currentBill}
            onValueChange={(currentBill) => patchCard(card.id, { currentBill })}
          />
          <MoneyField
            label="Qual é o limite?"
            value={card.limit}
            onValueChange={(limit) => patchCard(card.id, { limit })}
          />
          <MoneyField
            label="Quanto desse limite já está comprometido?"
            value={card.committed}
            onValueChange={(committed) => patchCard(card.id, { committed })}
          />
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="Dia de vencimento"
              value={card.dueDay}
              onValueChange={(v) => patchCard(card.id, { dueDay: Math.min(v ?? 1, 31) })}
            />
            <NumberField
              label="Melhor dia de compra"
              value={card.bestDay}
              onValueChange={(v) => patchCard(card.id, { bestDay: Math.min(v ?? 1, 31) })}
            />
          </div>
        </Card>
      ))}

      <Action variant="outline" onClick={addCard}>
        <Plus className="mr-2 h-4 w-4" /> Adicionar cartão
      </Action>

      {profile.creditCards.length > 0 ? (
        <Card className="space-y-3">
          <p className="text-[15px] font-medium tracking-tight">Seus cartões</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-muted/60 p-3">
              <p className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
                Fatura atual
              </p>
              <p className="mt-1 text-[19px] font-semibold tracking-tight">
                {brl(totals.bills)}
              </p>
            </div>
            <div className="rounded-2xl bg-muted/60 p-3">
              <p className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
                Limite total
              </p>
              <p className="mt-1 text-[19px] font-semibold tracking-tight">
                {brl(totals.limits)}
              </p>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-[13px] text-muted-foreground">
              <span>Comprometido</span>
              <span>{(totals.utilization * 100).toFixed(0)}%</span>
            </div>
            <Progress className="mt-2" value={totals.utilization} />
          </div>
          {totals.nextDueCard ? (
            <p className="text-[12px] text-muted-foreground">
              Próximo vencimento: {totals.nextDueCard.name || "cartão"} em{" "}
              {totals.nextDueInDays} dias.
            </p>
          ) : null}
        </Card>
      ) : null}
    </StepShell>
  );
}

/* ------------------------------- 5. Objetivos ------------------------------- */

function futureMonth(monthsAhead: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsAhead);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/* ─── Componente de inteligência FGTS para compra de imóvel ─── */

function FgtsHomeIntelligence({
  profile,
  goal,
  onUpdateGoal,
}: {
  profile: FinancialProfile;
  goal: Goal;
  onUpdateGoal: (id: string, patch: Partial<Goal>) => void;
}) {
  const gross = profile.knowsGross && profile.grossIncome
    ? profile.grossIncome
    : estimateGrossFromNet(profile.netIncome);
  const fgtsMonthly = calculateEstimatedFGTSMonthly(gross);
  const analysis = analyzeFgtsHomePurchase(
    profile.fgtsBalance,
    totalNetIncome(profile),
    profile.liquidAssets,
    profile.essentialExpenses,
    goal.homeDetails?.propertyValue || undefined,
  );

  const isCLT = profile.employmentType === "CLT";
  const propertyValue = goal.homeDetails?.propertyValue ?? analysis.recommendedRange.max;
  const useFgts = goal.homeDetails?.useFgts ?? true;
  const additionalDownPayment = goal.homeDetails?.additionalDownPayment ?? 0;

  return (
    <div className="space-y-4">
      {/* Cabeçalho da inteligência FGTS */}
      <div className="rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/8 to-accent/3 p-4">
        <div className="flex items-center gap-2">
          <Home className="h-5 w-5 text-accent" />
          <span className="text-[13px] font-semibold tracking-tight text-accent">
            Inteligência Imobiliária DeBoa
          </span>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
          {analysis.message}
        </p>
      </div>

      {/* Seletor de valor do imóvel */}
      <div>
        <p className="mb-2 text-[13px] font-medium text-muted-foreground">
          Qual o valor do imóvel que você deseja?
        </p>
        <MoneyField
          label="Valor do imóvel"
          value={propertyValue}
          onValueChange={(v) =>
            onUpdateGoal(goal.id, {
              target: v,
              homeDetails: {
                ...goal.homeDetails!,
                propertyValue: v,
              },
            })
          }
        />
      </div>

      {/* Grid de indicadores */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-muted/60 p-3">
          <p className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
            Entrada total
          </p>
          <p className="mt-1 text-[18px] font-semibold tracking-tight text-accent">
            {brl(analysis.downPayment)}
          </p>
          <p className="text-[10px] text-muted-foreground">
            FGTS {brl(profile.fgtsBalance)} + poupança
          </p>
        </div>
        <div className="rounded-2xl bg-muted/60 p-3">
          <p className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
            % de entrada
          </p>
          <p className="mt-1 text-[18px] font-semibold tracking-tight">
            {(analysis.downPaymentPercent * 100).toFixed(0)}%
          </p>
          <p className="text-[10px] text-muted-foreground">
            {analysis.downPaymentPercent >= 0.2 ? "✅ Ideal (≥20%)" : "📈 Abaixo do ideal"}
          </p>
        </div>
        <div className="rounded-2xl bg-muted/60 p-3">
          <p className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
            Prestação estimada
          </p>
          <p className="mt-1 text-[18px] font-semibold tracking-tight">
            {brl(analysis.estimatedMonthlyPayment)}/mês
          </p>
          <p className="text-[10px] text-muted-foreground">
            SAC • 35 anos • {(analysis.incomeCommitmentPercent * 100).toFixed(0)}% da renda
          </p>
        </div>
        <div className="rounded-2xl bg-muted/60 p-3">
          <p className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
            Viabilidade
          </p>
          <p className="mt-1 text-[18px] font-semibold tracking-tight">
            {analysis.viabilityScore}/100
          </p>
          <Progress
            className="mt-1"
            value={analysis.viabilityScore / 100}
          />
        </div>
      </div>

      {/* Faixa recomendada */}
      <div className="rounded-2xl border border-border/70 bg-surface p-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-accent" />
          <span className="text-[12px] font-medium text-muted-foreground">
            Faixa de imóvel recomendada para você
          </span>
        </div>
        <p className="mt-1 text-[16px] font-semibold tracking-tight">
          {brl(analysis.recommendedRange.min)} – {brl(analysis.recommendedRange.max)}
        </p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() =>
              onUpdateGoal(goal.id, {
                target: analysis.recommendedRange.min,
                homeDetails: {
                  ...goal.homeDetails!,
                  propertyValue: analysis.recommendedRange.min,
                },
              })
            }
            className="rounded-full border border-border bg-muted px-3 py-1.5 text-[11px] font-medium active:scale-[0.98]"
          >
            Usar {brl(analysis.recommendedRange.min)}
          </button>
          <button
            type="button"
            onClick={() =>
              onUpdateGoal(goal.id, {
                target: analysis.recommendedRange.max,
                homeDetails: {
                  ...goal.homeDetails!,
                  propertyValue: analysis.recommendedRange.max,
                },
              })
            }
            className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-[11px] font-medium text-accent active:scale-[0.98]"
          >
            Usar {brl(analysis.recommendedRange.max)}
          </button>
        </div>
      </div>

      {/* Projeção FGTS */}
      {isCLT ? (
        <div className="rounded-2xl bg-muted/50 p-3">
          <p className="text-[11px] font-medium text-muted-foreground">
            Projeção do seu FGTS
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[12px] font-semibold">{brl(fgtsMonthly)}</p>
              <p className="text-[9px] text-muted-foreground">Depósito/mês</p>
            </div>
            <div>
              <p className="text-[12px] font-semibold">{brl(profile.fgtsBalance + fgtsMonthly * 12)}</p>
              <p className="text-[9px] text-muted-foreground">Em 1 ano</p>
            </div>
            <div>
              <p className="text-[12px] font-semibold">{brl(profile.fgtsBalance + fgtsMonthly * 60)}</p>
              <p className="text-[9px] text-muted-foreground">Em 5 anos</p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Recomendação personalizada */}
      <div className="rounded-2xl border border-accent/20 bg-accent/6 p-4">
        <div className="flex items-start gap-2">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <div>
            <p className="text-[12px] font-semibold text-accent">Recomendação DeBoa</p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
              {analysis.viabilityScore >= 70
                ? `Seu momento é excelente! Com ${brl(analysis.downPayment)} de entrada, você pode financiar um imóvel de até ${brl(analysis.maxPropertyValue)}. A prestação de ${brl(analysis.estimatedMonthlyPayment)} cabe no seu orçamento.`
                : analysis.viabilityScore >= 40
                  ? `Você está no caminho certo! Faltam pequenos ajustes. Continue usando o FGTS como alavanca — ele já representa ${brl(profile.fgtsBalance)} de entrada.`
                  : `Comece fortalecendo sua entrada. Com ${brl(profile.fgtsBalance)} de FGTS, você já tem uma base. Junte mais ${brl(Math.max(0, Math.round(analysis.recommendedRange.max * 0.2 - analysis.downPayment)))} para dar o próximo passo.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Caixinha de objetivo editável ─── */

function GoalBox({
  goal,
  onUpdate,
  onRemove,
  capacity,
  profile,
}: {
  goal: Goal;
  onUpdate: (id: string, patch: Partial<Goal>) => void;
  onRemove: (id: string) => void;
  capacity: number;
  profile: FinancialProfile;
}) {
  const [editing, setEditing] = useState(false);
  const math = goalMath(goal);
  const gap = math.monthlyRequiredContribution - capacity;
  const isHome = goal.kind === "home";
  const useFgts = goal.homeDetails?.useFgts ?? true;

  return (
    <Card className="space-y-4 overflow-hidden">
      {/* Header da caixinha */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setEditing(!editing)}
          className="flex items-center gap-2"
        >
          <Pill className={isHome ? "border-accent/25 bg-accent/10 text-accent" : ""}>
            {goal.emoji} {goal.name}
          </Pill>
          {!editing ? (
            <span className="text-[11px] text-muted-foreground underline underline-offset-2">
              editar
            </span>
          ) : null}
        </button>
        <button
          type="button"
          aria-label="Remover objetivo"
          onClick={() => onRemove(goal.id)}
          className="grid h-10 w-10 place-items-center rounded-full bg-muted text-muted-foreground active:scale-[0.98]"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Progresso (sempre visível) */}
      <div>
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-muted-foreground">Progresso</span>
          <span className="font-medium">
            {brl(goal.saved)} / {brl(goal.target)}
          </span>
        </div>
        <Progress className="mt-2" value={goal.target ? goal.saved / goal.target : 0} />
        <p className="mt-1 text-[11px] text-muted-foreground">
          {math.monthlyRequiredContribution > 0
            ? `${brl(math.monthlyRequiredContribution)}/mês · ${math.monthsRemaining} meses restantes`
            : "Meta já atingida 🎉"}
        </p>
      </div>

      {/* Inteligência FGTS para objetivo de casa */}
      {isHome && !editing ? (
        <FgtsHomeIntelligence profile={profile} goal={goal} onUpdateGoal={onUpdate} />
      ) : null}

      {/* Modo de edição */}
      {editing ? (
        <div className="animate-rise space-y-4 border-t border-border/50 pt-4">
          <TextField
            label="Nome do objetivo"
            value={goal.name}
            onValueChange={(name) => onUpdate(goal.id, { name })}
          />
          <MoneyField
            label="Valor desejado"
            value={goal.target}
            onValueChange={(target) => onUpdate(goal.id, { target })}
          />
          <MoneyField
            label="Valor já guardado"
            value={goal.saved}
            onValueChange={(saved) => onUpdate(goal.id, { saved })}
          />
          <label className="block">
            <span className="text-[13px] font-medium text-muted-foreground">Prazo</span>
            <input
              type="month"
              value={goal.deadline}
              onChange={(e) => onUpdate(goal.id, { deadline: e.target.value })}
              className="mt-2 min-h-13 w-full rounded-2xl border border-border bg-surface px-4 text-[16px] outline-none"
            />
          </label>
          <div>
            <p className="mb-2 text-[13px] font-medium text-muted-foreground">Prioridade</p>
            <ChoiceGrid
              options={["Alta", "Média", "Baixa"]}
              value={goal.priority}
              onSelect={(v) => onUpdate(goal.id, { priority: v as GoalPriority })}
            />
          </div>

          {/* Para objetivo de casa, mostra configurações FGTS */}
          {isHome ? (
            <div className="space-y-3 rounded-2xl border border-accent/15 bg-accent/5 p-3">
              <p className="text-[12px] font-medium text-accent">Configurações do FGTS</p>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-muted-foreground">Usar FGTS na entrada</span>
                <button
                  type="button"
                  onClick={() =>
                    onUpdate(goal.id, {
                      homeDetails: {
                        ...goal.homeDetails!,
                        useFgts: !useFgts,
                      },
                    })
                  }
                  className={`h-6 w-11 rounded-full transition-colors ${
                    useFgts ? "bg-accent" : "bg-border"
                  }`}
                >
                  <span
                    className={`block h-5 w-5 rounded-full bg-white transition-transform ${
                      useFgts ? "translate-x-5.5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
              <MoneyField
                label="Entrada adicional (poupança)"
                value={goal.homeDetails?.additionalDownPayment ?? 0}
                onValueChange={(v) =>
                  onUpdate(goal.id, {
                    homeDetails: {
                      ...goal.homeDetails!,
                      additionalDownPayment: v,
                    },
                  })
                }
              />
            </div>
          ) : null}

          <div className="rounded-2xl bg-muted/60 p-4">
            <p className="text-[13px] leading-relaxed">
              Para chegar lá nesse prazo, você precisaria guardar aproximadamente{" "}
              <strong>{brl(math.monthlyRequiredContribution)}</strong> por mês (
              {math.monthsRemaining} meses).
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Hoje você consegue guardar aproximadamente <strong>{brl(capacity)}</strong>.
            </p>
            {gap > 0 ? (
              <p className="mt-2 text-[13px] leading-relaxed text-accent">
                Temos uma diferença de {brl(gap)}. Posso te ajudar a encontrar pequenos
                ajustes para aproximar esse objetivo.
              </p>
            ) : (
              <p className="mt-2 text-[13px] leading-relaxed text-accent">
                Esse ritmo cabe no seu momento atual.
              </p>
            )}
          </div>

          <Action variant="outline" onClick={() => setEditing(false)}>
            Fechar edição
          </Action>
        </div>
      ) : null}
    </Card>
  );
}

/* ─── Componente principal StepGoals ─── */

export function StepGoals({ profile, update }: StepProps) {
  const range = emergencyRange(profile.essentialExpenses, profile.employmentType);
  const capacity = Math.max(monthlySavingCapacity(profile), 0);
  const emergency = profile.goals.find((g) => g.kind === "emergency");
  const isCLT = profile.employmentType === "CLT";

  function patchGoal(id: string, patch: Partial<Goal>) {
    update({ goals: profile.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) });
  }

  function removeGoal(id: string) {
    update({ goals: profile.goals.filter((g) => g.id !== id) });
  }

  function addGoal(template: (typeof GOAL_TEMPLATES)[number]) {
    const isHome = template.kind === "home";
    const homeDetails = isHome
      ? {
          propertyValue: template.target,
          useFgts: true,
          additionalDownPayment: 0,
        }
      : null;

    update({
      goals: [
        ...profile.goals,
        {
          id: uid(),
          emoji: template.emoji,
          name: template.name,
          target: template.target,
          saved: 0,
          deadline: futureMonth(isHome ? 60 : 18),
          priority: isHome ? "Alta" as GoalPriority : "Média" as GoalPriority,
          kind: isHome ? "home" as const : "custom" as const,
          homeDetails,
        },
      ],
    });
  }

  return (
    <StepShell
      eyebrow="Etapa 5 de 7"
      title="Por que você quer organizar melhor seu dinheiro?"
      subtitle="Objetivo é o que dá sentido a cada decisão. Escolha quantos quiser."
    >
      {/* Grid de templates */}
      <div className="grid grid-cols-2 gap-2">
        {GOAL_TEMPLATES.map((t) => (
          <button
            key={t.name}
            type="button"
            onClick={() => addGoal(t)}
            className="min-h-16 rounded-2xl border border-border bg-surface p-3 text-left text-[13px] font-medium leading-snug transition-all active:scale-[0.98] hover:border-accent/30"
          >
            <span className="block text-[16px]">{t.emoji}</span>
            {t.name}
            {t.kind === "home" && isCLT ? (
              <span className="ml-1 text-[10px] text-accent">FGTS</span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Reserva de emergência */}
      {emergency ? (
        <Card className="space-y-3 border-accent/25 bg-accent/6">
          <Pill className="border-accent/25 bg-accent/10 text-accent">
            Reserva de emergência
          </Pill>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Seu custo essencial é <strong>{brl(range.essential)}</strong>/mês. Pelo seu
            perfil, uma boa faixa de reserva seria entre{" "}
            <strong>{brl(range.min)}</strong> e <strong>{brl(range.max)}</strong> (
            {range.minMonths}–{range.maxMonths} meses de despesas essenciais).
          </p>
          <MoneyField
            label="Meta da sua reserva"
            value={emergency.target}
            onValueChange={(target) => patchGoal(emergency.id, { target })}
          />
          {range.min > 0 ? (
            <Action
              variant="outline"
              onClick={() => patchGoal(emergency.id, { target: Math.round(range.min) })}
            >
              Usar sugestão de {brl(range.min)}
            </Action>
          ) : null}
          <MoneyField
            label="Quanto você já guardou"
            value={emergency.saved}
            onValueChange={(saved) => patchGoal(emergency.id, { saved })}
          />
          <div>
            <div className="flex items-center justify-between text-[13px] text-muted-foreground">
              <span>Seu progresso</span>
              <span>
                {brl(emergency.saved)} / {brl(emergency.target)}
              </span>
            </div>
            <Progress
              className="mt-2"
              value={emergency.target ? emergency.saved / emergency.target : 0}
            />
          </div>
        </Card>
      ) : null}

      {/* Caixinhas de objetivos (não emergenciais) */}
      {profile.goals
        .filter((g) => g.kind !== "emergency")
        .map((goal) => (
          <GoalBox
            key={goal.id}
            goal={goal}
            onUpdate={patchGoal}
            onRemove={removeGoal}
            capacity={capacity}
            profile={profile}
          />
        ))}

      {/* Sumário das caixinhas */}
      {profile.goals.length > 0 ? (
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-medium tracking-tight">Suas caixinhas</p>
            <span className="text-[12px] text-muted-foreground">
              {profile.goals.length} {profile.goals.length === 1 ? "ativa" : "ativas"}
            </span>
          </div>
          <p className="text-[12px] text-muted-foreground">
            Metas virtuais — nada de dinheiro real é movimentado aqui.
          </p>
          {profile.goals.map((g) => {
            const pct = g.target ? Math.round((g.saved / g.target) * 100) : 0;
            return (
              <div key={g.id} className="rounded-2xl border border-border/70 p-3 transition-all hover:border-accent/20">
                <div className="flex items-center justify-between text-[14px]">
                  <span className="font-medium tracking-tight">
                    {g.emoji} {g.name}
                    {g.kind === "home" ? (
                      <span className="ml-1.5 rounded-full bg-accent/10 px-1.5 py-0.5 text-[9px] text-accent">
                        FGTS
                      </span>
                    ) : null}
                  </span>
                  <span className="text-muted-foreground">{pct}%</span>
                </div>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  {brl(g.saved)} / {brl(g.target)}
                </p>
                <Progress className="mt-2" value={g.target ? g.saved / g.target : 0} />
              </div>
            );
          })}
        </Card>
      ) : null}
    </StepShell>
  );
}

/* -------------------------------- 6. Hábitos -------------------------------- */

export function StepHabits({ profile, update }: StepProps) {
  const total = profile.habits.reduce((s, h) => s + habitMonthlyCost(h), 0);

  function patchHabit(id: string, patch: Partial<Habit>) {
    update({ habits: profile.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)) });
  }

  return (
    <StepShell
      eyebrow="Etapa 6 de 7"
      title="Como seu dinheiro costuma escapar?"
      subtitle="Sem julgamento. Só quero enxergar os padrões junto com você."
    >
      <div className="flex flex-wrap gap-2">
        {HABIT_CATALOG.filter(
          (h) => !profile.habits.some((existing) => existing.key === h.key),
        ).map((h) => (
          <button
            key={h.key}
            type="button"
            onClick={() =>
              update({
                habits: [
                  ...profile.habits,
                  {
                    id: uid(),
                    key: h.key,
                    emoji: h.emoji,
                    label: h.label,
                    frequency: h.frequency,
                    unitCost: h.unitCost,
                    period: h.period,
                  },
                ],
              })
            }
            className="rounded-full border border-border bg-surface px-3 py-2 text-[13px] font-medium active:scale-[0.98]"
          >
            {h.emoji} {h.label}
          </button>
        ))}
      </div>

      {profile.habits.map((habit) => (
        <Card key={habit.id} className="space-y-4">
          <div className="flex items-center justify-between">
            <Pill>
              {habit.emoji} {habit.label}
            </Pill>
            <button
              type="button"
              aria-label="Remover hábito"
              onClick={() =>
                update({ habits: profile.habits.filter((h) => h.id !== habit.id) })
              }
              className="grid h-10 w-10 place-items-center rounded-full bg-muted text-muted-foreground"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="Frequência"
              value={habit.frequency}
              suffix="x"
              onValueChange={(v) => patchHabit(habit.id, { frequency: v ?? 0 })}
            />
            <SelectField
              label="Período"
              value={habit.period === "week" ? "Por semana" : "Por mês"}
              options={["Por semana", "Por mês"]}
              onValueChange={(v) =>
                patchHabit(habit.id, { period: v === "Por semana" ? "week" : "month" })
              }
            />
          </div>
          <MoneyField
            label="Gasto médio por vez"
            value={habit.unitCost}
            onValueChange={(unitCost) => patchHabit(habit.id, { unitCost })}
          />
          <p className="rounded-2xl bg-muted/60 p-3 text-[13px] leading-relaxed">
            Você pode estar gastando aproximadamente{" "}
            <strong>{brl(Math.round(habitMonthlyCost(habit)))}/mês</strong> com{" "}
            {habit.label.toLowerCase()}.
          </p>
        </Card>
      ))}

      {profile.habits.length > 0 ? (
        <Card className="border-accent/25 bg-accent/6">
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-accent">
            Total estimado
          </p>
          <p className="mt-1 text-[26px] font-semibold tracking-[-0.03em]">
            {brl(Math.round(total))}/mês
          </p>
        </Card>
      ) : null}
    </StepShell>
  );
}

/* --------------------------------- 7. Plano --------------------------------- */

export function StepPlan({ profile, update }: StepProps) {
  const reading = financialInsightEngine(profile);
  const [created, setCreated] = useState<string[]>(profile.pacts.map((p) => p.id));

  return (
    <StepShell
      eyebrow="Etapa 7 de 7"
      title="Se eu estivesse no seu lugar, começaria por aqui."
      subtitle="No máximo três combinados. Nada de mudar sua vida inteira de uma vez."
    >
      {reading.smallWins.length === 0 ? (
        <Card>
          <p className="text-[14px] leading-relaxed text-muted-foreground">
            Ainda não tenho hábitos suficientes para sugerir combinados. Volte à etapa de
            hábitos e me conte um pouco mais.
          </p>
        </Card>
      ) : null}

      {reading.smallWins.map((win, i) => {
        const goal = profile.goals.find((g) => g.id === win.goalId) ?? null;
        const yearly = win.monthlySaving * 12;
        const done = created.includes(`pact-${win.id}`);
        return (
          <Card key={win.id} className="space-y-3">
            <Pill>Combinado #{i + 1}</Pill>
            <p className="text-[17px] font-medium leading-snug tracking-tight">
              {win.emoji} {win.title}
            </p>
            <p className="text-[13px] leading-relaxed text-muted-foreground">{win.detail}</p>
            <div className="rounded-2xl bg-muted/60 p-3">
              <p className="text-[12px] uppercase tracking-[0.06em] text-muted-foreground">
                Economia estimada
              </p>
              <p className="mt-1 text-[22px] font-semibold tracking-[-0.03em]">
                {brl(win.monthlySaving)}/mês
              </p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                ≈ {brl(yearly)}/ano
                {goal && goal.target > 0
                  ? ` · ${Math.min(Math.round((yearly / goal.target) * 100), 100)}% da meta “${goal.name}”`
                  : ""}
              </p>
            </div>
            <Action
              variant={done ? "outline" : "accent"}
              disabled={done}
              onClick={() => {
                const id = `pact-${win.id}`;
                update({
                  pacts: [
                    {
                      id,
                      title: win.title,
                      detail: win.detail,
                      monthlySaving: win.monthlySaving,
                      goalId: win.goalId ?? null,
                      createdAt: new Date().toISOString(),
                    },
                    ...profile.pacts.filter((p) => p.id !== id),
                  ],
                });
                setCreated((prev) => [...prev, id]);
              }}
            >
              {done ? "Combinado criado" : "Criar esse combinado"}
            </Action>
          </Card>
        );
      })}

      {reading.totalSmallWins > 0 ? (
        <Card className="border-accent/25 bg-accent/6">
          <p className="text-[13px] leading-relaxed">
            Você não precisa mudar sua vida financeira inteira. Essas mudanças podem liberar
            aproximadamente <strong>{brl(reading.totalSmallWins)}</strong> por mês —{" "}
            <strong>{brl(reading.totalSmallWins * 12)}</strong> por ano.
          </p>
        </Card>
      ) : null}
    </StepShell>
  );
}
