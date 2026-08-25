import { apiKey, cors, get, json, requireUser } from "../_shared/pluggy.ts";

/**
 * Busca contas e extrato de um item conectado.
 *
 * Devolve os dados crus. A tradução para o modelo do DeBoa acontece no app,
 * em `services/pluggyMapping.ts`, por dois motivos: dá para testar de verdade
 * ali, e o resultado é uma proposta que a pessoa confirma — o que é uma
 * decisão de produto, não de servidor.
 *
 * São os dados bancários da própria pessoa, os mesmos que ela vê no app do
 * banco. O que nunca atravessa é o segredo da API.
 */

const MONTHS_OF_HISTORY = 4;
const PAGE_SIZE = 500;

type Page<T> = { results: T[]; page: number; totalPages: number };

Deno.serve(async (req) => {
  const headers = cors(req.headers.get("Origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405, headers);

  try {
    await requireUser(req);
  } catch {
    return json({ error: "unauthorized" }, 401, headers);
  }

  const { itemId } = (await req.json().catch(() => ({}))) as { itemId?: string };
  if (!itemId) return json({ error: "missing_item_id" }, 400, headers);

  try {
    const key = await apiKey();

    const item = await get<{
      id: string;
      status: string;
      lastUpdatedAt: string | null;
      connector?: { name?: string };
    }>(key, `items/${itemId}`);

    // Um item ainda sincronizando devolveria um retrato pela metade, e a
    // pessoa veria números errados sem saber por quê.
    if (item.status === "UPDATING" || item.status === "MERGING") {
      return json({ error: "still_updating", status: item.status }, 202, headers);
    }
    if (item.status === "LOGIN_ERROR" || item.status === "WAITING_USER_INPUT") {
      return json({ error: "needs_reconnect", status: item.status }, 409, headers);
    }

    const accountsPage = await get<Page<unknown>>(key, "accounts", { itemId });
    const accounts = accountsPage.results ?? [];

    const from = new Date();
    from.setMonth(from.getMonth() - MONTHS_OF_HISTORY);
    const fromDate = from.toISOString().slice(0, 10);

    const transactions: unknown[] = [];
    for (const account of accounts as { id: string }[]) {
      let page = 1;
      // Um teto: extrato longo não melhora a proposta e a função tem tempo.
      while (page <= 6) {
        const result = await get<Page<unknown>>(key, "transactions", {
          accountId: account.id,
          from: fromDate,
          pageSize: PAGE_SIZE,
          page,
        });
        transactions.push(...(result.results ?? []));
        if (page >= (result.totalPages ?? 1)) break;
        page += 1;
      }
    }

    return json(
      {
        itemId,
        connectorName: item.connector?.name ?? null,
        lastUpdatedAt: item.lastUpdatedAt ?? null,
        accounts,
        transactions,
      },
      200,
      headers,
    );
  } catch (error) {
    console.error("pluggy-sync:", error instanceof Error ? error.message : error);
    return json({ error: "internal" }, 500, headers);
  }
});
