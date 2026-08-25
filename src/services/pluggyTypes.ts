/**
 * As formas que a Pluggy devolve, recortadas ao que o DeBoa usa.
 *
 * Copiadas do pacote oficial `pluggy-sdk` (v0.90) em vez de escritas de
 * memória — mas só os campos que consumimos, para não carregar um SDK inteiro
 * no bundle do celular por causa de tipos.
 *
 * Datas chegam como string no JSON, mesmo o SDK declarando `Date`: o que
 * atravessa a rede é texto.
 */

export type PluggyAccountType = "BANK" | "CREDIT";
export type PluggyAccountSubtype = "SAVINGS_ACCOUNT" | "CHECKING_ACCOUNT" | "CREDIT_CARD";

export type PluggyCreditData = {
  brand: string | null;
  balanceCloseDate: string | null;
  balanceDueDate: string | null;
  availableCreditLimit: number | null;
  creditLimit: number | null;
  minimumPayment: number | null;
};

export type PluggyAccount = {
  id: string;
  itemId: string;
  type: PluggyAccountType;
  subtype: PluggyAccountSubtype;
  name: string;
  marketingName: string | null;
  /** Saldo atual. Em conta de crédito costuma vir negativo: é dívida. */
  balance: number;
  currencyCode: string;
  creditData: PluggyCreditData | null;
};

export type PluggyTransaction = {
  id: string;
  accountId: string;
  /** ISO. */
  date: string;
  description: string;
  descriptionRaw: string | null;
  /** DEBIT sai, CREDIT entra. */
  type: "DEBIT" | "CREDIT";
  /**
   * Magnitude do movimento. O sinal varia por instituição, então em toda
   * conta usamos `type` para a direção e o valor absoluto para o tamanho.
   */
  amount: number;
  /** Descrição da categoria atribuída pela Pluggy, quando houve. */
  category: string | null;
  categoryId: string | null;
  merchant?: { name?: string; businessName?: string; category?: string } | undefined;
};

/** O que a Edge Function devolve depois de falar com a Pluggy. */
export type PluggySnapshot = {
  itemId: string;
  /** Nome da instituição, para a interface poder dizer de onde veio. */
  connectorName: string | null;
  accounts: PluggyAccount[];
  transactions: PluggyTransaction[];
  /** ISO do momento em que a Pluggy atualizou o item. */
  lastUpdatedAt: string | null;
};
