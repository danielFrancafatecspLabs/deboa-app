/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { EMPTY_PROFILE } from "@/data/financeSeed";
import { applyProposal, classify, proposeFromSnapshot } from "./pluggyMapping";
import type { PluggyAccount, PluggySnapshot, PluggyTransaction } from "./pluggyTypes";

/**
 * O extrato é a entrada menos controlável do produto: cada banco descreve as
 * coisas do seu jeito. Estes casos são os formatos que a Pluggy documenta,
 * mais os jeitos em que instituições brasileiras costumam variar.
 */

const HOJE = new Date("2026-09-15T12:00:00Z");

const tx = (over: Partial<PluggyTransaction>): PluggyTransaction => ({
  id: Math.random().toString(36).slice(2),
  accountId: "acc-1",
  date: "2026-08-10T00:00:00.000Z",
  description: "",
  descriptionRaw: null,
  type: "DEBIT",
  amount: 100,
  category: null,
  categoryId: null,
  ...over,
});

const bankAccount = (over: Partial<PluggyAccount> = {}): PluggyAccount => ({
  id: "acc-1",
  itemId: "item-1",
  type: "BANK",
  subtype: "CHECKING_ACCOUNT",
  name: "Conta Corrente",
  marketingName: null,
  balance: 2800,
  currencyCode: "BRL",
  creditData: null,
  ...over,
});

const snapshot = (over: Partial<PluggySnapshot> = {}): PluggySnapshot => ({
  itemId: "item-1",
  connectorName: "Banco Teste",
  lastUpdatedAt: "2026-09-15T09:00:00.000Z",
  accounts: [bankAccount()],
  transactions: [],
  ...over,
});

describe("classify", () => {
  test("reconhece as categorias em inglês, como a Pluggy costuma devolver", () => {
    expect(classify(tx({ category: "Rent" }))).toBe("housing");
    expect(classify(tx({ category: "Groceries" }))).toBe("food");
    expect(classify(tx({ category: "Utilities" }))).toBe("utilities");
    expect(classify(tx({ category: "Salary", type: "CREDIT" }))).toBe("renda");
  });

  test("reconhece em português, com e sem acento", () => {
    expect(classify(tx({ category: "Aluguel" }))).toBe("housing");
    expect(classify(tx({ category: "Condomínio" }))).toBe("housing");
    expect(classify(tx({ category: "Condominio" }))).toBe("housing");
    expect(classify(tx({ category: "Água e luz" }))).toBe("utilities");
    expect(classify(tx({ category: "Farmácia" }))).toBe("health");
  });

  test("cai para a descrição quando a categoria vem vazia", () => {
    expect(classify(tx({ category: null, description: "NETFLIX.COM" }))).toBe("assinatura");
    expect(classify(tx({ category: null, description: "POSTO IPIRANGA" }))).toBe("transport");
  });

  test("usa a categoria do estabelecimento quando existe", () => {
    expect(
      classify(tx({ category: null, description: "PAG*3821", merchant: { category: "Supermercado" } })),
    ).toBe("food");
  });

  test("transferência não é gasto", () => {
    expect(classify(tx({ category: "Transfers", description: "PIX ENVIADO" }))).toBe(
      "transferencia",
    );
  });

  test("devolve null em vez de chutar", () => {
    expect(classify(tx({ category: null, description: "DEB VISA ELECTRON 4471" }))).toBeNull();
  });
});

describe("contas", () => {
  test("separa conta corrente de poupança", () => {
    const p = proposeFromSnapshot(
      snapshot({
        accounts: [
          bankAccount({ id: "a", balance: 2800 }),
          bankAccount({ id: "b", subtype: "SAVINGS_ACCOUNT", balance: 5000 }),
        ],
      }),
      HOJE,
    );
    expect(p.checking).toBe(2800);
    expect(p.savings).toBe(5000);
  });

  test("saldo negativo não vira dinheiro disponível", () => {
    const p = proposeFromSnapshot(
      snapshot({ accounts: [bankAccount({ balance: -320 })] }),
      HOJE,
    );
    expect(p.checking).toBe(0);
  });

  test("cartão: fatura negativa é dívida, e o limite comprometido é o que sumiu", () => {
    const p = proposeFromSnapshot(
      snapshot({
        accounts: [
          {
            ...bankAccount(),
            id: "cc",
            type: "CREDIT",
            subtype: "CREDIT_CARD",
            name: "Cartão Platinum",
            marketingName: "Platinum",
            balance: -1240,
            creditData: {
              brand: "MASTERCARD",
              balanceCloseDate: "2026-09-03T00:00:00.000Z",
              balanceDueDate: "2026-09-12T00:00:00.000Z",
              availableCreditLimit: 4100,
              creditLimit: 6000,
              minimumPayment: 180,
            },
          },
        ],
      }),
      HOJE,
    );
    const card = p.creditCards[0]!;
    expect(card.currentBill).toBe(1240);
    expect(card.limit).toBe(6000);
    expect(card.committed).toBe(1900);
    expect(card.dueDay).toBe(12);
    expect(card.bestDay).toBe(3);
    expect(card.brand).toBe("Mastercard");
    expect(card.id.startsWith("pluggy-")).toBe(true);
  });
});

describe("renda", () => {
  test("usa a mediana dos meses, não a soma", () => {
    const p = proposeFromSnapshot(
      snapshot({
        transactions: [
          tx({ type: "CREDIT", category: "Salary", amount: 5200, date: "2026-06-05T00:00:00Z" }),
          tx({ type: "CREDIT", category: "Salary", amount: 5200, date: "2026-07-05T00:00:00Z" }),
          // Mês do 13º: não pode virar a renda mensal.
          tx({ type: "CREDIT", category: "Salary", amount: 10400, date: "2026-08-05T00:00:00Z" }),
        ],
      }),
      HOJE,
    );
    expect(p.netIncome).toBe(5200);
    expect(p.salaryDay).toBe(5);
  });

  test("sem salário reconhecido, não inventa renda", () => {
    const p = proposeFromSnapshot(
      snapshot({ transactions: [tx({ type: "CREDIT", amount: 300, description: "PIX RECEBIDO" })] }),
      HOJE,
    );
    expect(p.netIncome).toBeNull();
  });
});

describe("gastos", () => {
  test("tira a média por mês, não soma os meses", () => {
    const p = proposeFromSnapshot(
      snapshot({
        transactions: [
          tx({ category: "Rent", amount: 1400, date: "2026-07-05T00:00:00Z" }),
          tx({ category: "Rent", amount: 1400, date: "2026-08-05T00:00:00Z" }),
        ],
      }),
      HOJE,
    );
    expect(p.months).toBe(2);
    expect(p.essentialExpenses.housing).toBe(1400);
  });

  test("ignora o mês corrente, que está pela metade", () => {
    const p = proposeFromSnapshot(
      snapshot({
        transactions: [
          tx({ category: "Rent", amount: 1400, date: "2026-08-05T00:00:00Z" }),
          tx({ category: "Rent", amount: 60, date: "2026-09-02T00:00:00Z" }),
        ],
      }),
      HOJE,
    );
    expect(p.months).toBe(1);
    expect(p.essentialExpenses.housing).toBe(1400);
  });

  test("transferência não entra em categoria nenhuma", () => {
    const p = proposeFromSnapshot(
      snapshot({ transactions: [tx({ category: "Transfers", amount: 900 })] }),
      HOJE,
    );
    expect(Object.keys(p.essentialExpenses)).toHaveLength(0);
    expect(p.unclassified).toHaveLength(0);
  });

  test("o que não foi reconhecido aparece, com o quanto pesa", () => {
    const p = proposeFromSnapshot(
      snapshot({
        transactions: [
          tx({ description: "LOJA XYZ 4471", amount: 220, date: "2026-07-11T00:00:00Z" }),
          tx({ description: "LOJA XYZ 4471", amount: 180, date: "2026-08-11T00:00:00Z" }),
        ],
      }),
      HOJE,
    );
    expect(p.unclassified[0]?.label).toContain("LOJA XYZ");
    expect(p.unclassified[0]?.monthly).toBe(200);
  });
});

describe("assinaturas", () => {
  test("mesmo nome, mesmo valor, todo mês", () => {
    const p = proposeFromSnapshot(
      snapshot({
        transactions: [
          tx({ description: "NETFLIX.COM", amount: 55, date: "2026-07-08T00:00:00Z" }),
          tx({ description: "NETFLIX.COM", amount: 55, date: "2026-08-08T00:00:00Z" }),
        ],
      }),
      HOJE,
    );
    const sub = p.subscriptions.find((s) => /NETFLIX/i.test(s.name));
    expect(sub?.amount).toBe(55);
    expect(sub?.dueDay).toBe(8);
  });

  test("valor que varia muito não é assinatura", () => {
    const p = proposeFromSnapshot(
      snapshot({
        transactions: [
          tx({ description: "MERCADO DIA", amount: 90, date: "2026-07-08T00:00:00Z" }),
          tx({ description: "MERCADO DIA", amount: 420, date: "2026-08-08T00:00:00Z" }),
        ],
      }),
      HOJE,
    );
    expect(p.subscriptions.find((s) => /MERCADO/i.test(s.name))).toBeUndefined();
  });

  test("um mês só de histórico não prova recorrência", () => {
    const p = proposeFromSnapshot(
      snapshot({ transactions: [tx({ description: "SPOTIFY", amount: 22, date: "2026-08-08T00:00:00Z" })] }),
      HOJE,
    );
    expect(p.subscriptions).toHaveLength(0);
  });
});

describe("applyProposal", () => {
  const proposal = proposeFromSnapshot(
    snapshot({
      accounts: [bankAccount({ balance: 2800 })],
      transactions: [
        tx({ type: "CREDIT", category: "Salary", amount: 5200, date: "2026-07-05T00:00:00Z" }),
        tx({ type: "CREDIT", category: "Salary", amount: 5200, date: "2026-08-05T00:00:00Z" }),
        tx({ category: "Rent", amount: 1400, date: "2026-07-05T00:00:00Z" }),
        tx({ category: "Rent", amount: 1400, date: "2026-08-05T00:00:00Z" }),
      ],
    }),
    HOJE,
  );

  test("aplica só o que foi aceito", () => {
    const patch = applyProposal(EMPTY_PROFILE, proposal, new Set(["renda"]));
    expect(patch.netIncome).toBe(5200);
    expect(patch.salaryDay).toBe(5);
    expect(patch.essentialExpenses).toBeUndefined();
    expect(patch.liquidAssets).toBeUndefined();
  });

  test("nada aceito não muda nada além da origem dos dados", () => {
    const patch = applyProposal(EMPTY_PROFILE, proposal, new Set());
    expect(Object.keys(patch)).toEqual(["financialDataSource"]);
    expect(patch.financialDataSource).toBe("open_finance");
  });

  test("categoria aceita não apaga as outras", () => {
    const profile = {
      ...EMPTY_PROFILE,
      essentialExpenses: { ...EMPTY_PROFILE.essentialExpenses, food: 500 },
    };
    const patch = applyProposal(profile, proposal, new Set(["essencial:housing"]));
    expect(patch.essentialExpenses?.housing).toBe(1400);
    expect(patch.essentialExpenses?.food).toBe(500);
  });

  test("reconectar o banco não apaga cartão digitado à mão", () => {
    const manual = {
      id: "meu-cartao",
      name: "Cartão do banco X",
      brand: "Visa" as const,
      issuer: "X",
      currentBill: 300,
      limit: 2000,
      committed: 300,
      dueDay: 5,
      bestDay: 1,
    };
    const withCard = { ...EMPTY_PROFILE, creditCards: [manual] };
    const withPluggyCard = proposeFromSnapshot(
      snapshot({
        accounts: [
          {
            ...bankAccount(),
            id: "cc",
            type: "CREDIT",
            subtype: "CREDIT_CARD",
            balance: -100,
            creditData: {
              brand: "Visa",
              balanceCloseDate: null,
              balanceDueDate: null,
              availableCreditLimit: 900,
              creditLimit: 1000,
              minimumPayment: null,
            },
          },
        ],
      }),
      HOJE,
    );
    const patch = applyProposal(withCard, withPluggyCard, new Set(["cartoes"]));
    expect(patch.creditCards).toHaveLength(2);
    expect(patch.creditCards?.some((c) => c.id === "meu-cartao")).toBe(true);
  });
});
