/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { EMPTY_PROFILE } from "@/data/financeSeed";
import { breakdown, isLumped } from "./spending";
import type { FinancialProfile } from "./financeTypes";

const base = (over: Partial<FinancialProfile> = {}): FinancialProfile => ({
  ...EMPTY_PROFILE,
  netIncome: 5000,
  goals: [],
  ...over,
});

const essentials = (over: Partial<FinancialProfile["essentialExpenses"]>) => ({
  ...EMPTY_PROFILE.essentialExpenses,
  ...over,
});

describe("breakdown", () => {
  test("separa essencial de não essencial", () => {
    const b = breakdown(
      base({
        essentialExpenses: essentials({ housing: 1500, utilities: 300, food: 600 }),
        subscriptions: [{ id: "s1", emoji: "📺", name: "Streaming", amount: 55, dueDay: 10 }],
        habits: [
          { id: "h1", key: "cafe", emoji: "☕", label: "Café", frequency: 5, unitCost: 10, period: "week" },
        ],
      }),
    );
    expect(b.essential).toBe(2400);
    expect(b.subscriptions).toBe(55);
    expect(b.habits).toBe(217); // 5 × 10 × 4,33 arredondado
    expect(b.nonEssential).toBe(272);
  });

  test("ordena as linhas da maior para a menor", () => {
    const b = breakdown(
      base({ essentialExpenses: essentials({ housing: 1500, utilities: 300, food: 600 }) }),
    );
    expect(b.lines.map((l) => l.label)).toEqual(["Moradia", "Mercado", "Contas de casa"]);
    expect(b.biggest?.amount).toBe(1500);
  });

  test("categoria zerada não vira linha", () => {
    const b = breakdown(base({ essentialExpenses: essentials({ housing: 1500 }) }));
    expect(b.lines).toHaveLength(1);
    expect(b.unfilled).toBe(6);
  });
});

describe("vale-refeição", () => {
  test("abate o mercado, e só até onde o mercado vai", () => {
    const b = breakdown(
      base({
        essentialExpenses: essentials({ housing: 1500, food: 600 }),
        benefits: { mealVoucher: 800, transportVoucher: 0 },
      }),
    );
    // Sobra de vale não vira dinheiro: cobre 600, não 800.
    expect(b.coveredByVoucher).toBe(600);
    expect(b.essential).toBe(2100);
    expect(b.essentialFromSalary).toBe(1500);
  });

  test("sem mercado informado, o vale não abate nada", () => {
    const b = breakdown(
      base({
        essentialExpenses: essentials({ housing: 1500 }),
        benefits: { mealVoucher: 800, transportVoucher: 0 },
      }),
    );
    expect(b.coveredByVoucher).toBe(0);
    expect(b.essentialFromSalary).toBe(1500);
  });

  test("benefício nunca é contado como renda", () => {
    const b = breakdown(
      base({ benefits: { mealVoucher: 800, transportVoucher: 200 } }),
    );
    expect(b.income).toBe(5000);
    expect(b.benefits).toBe(1000);
  });
});

describe("isLumped", () => {
  test("verdadeiro quando só moradia tem valor", () => {
    expect(isLumped(base({ essentialExpenses: essentials({ housing: 2400 }) }))).toBe(true);
  });

  test("falso assim que qualquer outra categoria é preenchida", () => {
    expect(
      isLumped(base({ essentialExpenses: essentials({ housing: 1500, food: 500 }) })),
    ).toBe(false);
  });

  test("falso quando nada foi informado", () => {
    expect(isLumped(base())).toBe(false);
  });
});
