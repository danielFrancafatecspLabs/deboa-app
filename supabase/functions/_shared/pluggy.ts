/**
 * Conversa com a Pluggy. Roda só no servidor.
 *
 * O `clientSecret` fica aqui e em nenhum outro lugar. Um PWA é código no
 * aparelho da pessoa: qualquer segredo que chegue no bundle está publicado.
 * O que o app recebe é um `connectToken`, de vida curta e escopo único.
 *
 * Rotas e formatos conferidos contra o pacote oficial `pluggy-sdk` v0.90.
 */

const BASE = "https://api.pluggy.ai";

export function credentials(): { clientId: string; clientSecret: string } {
  const clientId = Deno.env.get("PLUGGY_CLIENT_ID");
  const clientSecret = Deno.env.get("PLUGGY_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    throw new Error(
      "PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET não estão configurados. " +
        "Rode: supabase secrets set PLUGGY_CLIENT_ID=... PLUGGY_CLIENT_SECRET=...",
    );
  }
  return { clientId, clientSecret };
}

/** Troca as credenciais por uma API key de duas horas. */
export async function apiKey(): Promise<string> {
  const { clientId, clientSecret } = credentials();
  const res = await fetch(`${BASE}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, clientSecret, nonExpiring: false }),
  });
  if (!res.ok) {
    // Nunca ecoar o corpo: a resposta de erro pode repetir o que foi enviado.
    throw new Error(`Pluggy recusou as credenciais (HTTP ${res.status}).`);
  }
  const body = (await res.json()) as { apiKey?: string };
  if (!body.apiKey) throw new Error("Pluggy não devolveu apiKey.");
  return body.apiKey;
}

export async function get<T>(
  key: string,
  path: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T> {
  const url = new URL(`${BASE}/${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, { headers: { "X-API-KEY": key } });
  if (!res.ok) throw new Error(`Pluggy ${path} respondeu HTTP ${res.status}.`);
  return (await res.json()) as T;
}

/** Cabeçalhos de CORS. O app roda em outra origem. */
export function cors(origin: string | null): Record<string, string> {
  const allowed = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  // Sem lista configurada, nada de curinga: melhor falhar visível do que
  // deixar qualquer site chamar a função com o token de alguém.
  const allow = origin && allowed.includes(origin) ? origin : (allowed[0] ?? "");
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

/**
 * Só usuário autenticado passa. Sem isto, qualquer um na internet gera
 * connect tokens na sua conta Pluggy — e você paga por item conectado.
 */
export async function requireUser(req: Request): Promise<{ id: string }> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) throw new Error("unauthorized");

  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !anon) throw new Error("Supabase não configurado no ambiente da função.");

  const res = await fetch(`${url}/auth/v1/user`, {
    headers: { Authorization: auth, apikey: anon },
  });
  if (!res.ok) throw new Error("unauthorized");
  const user = (await res.json()) as { id?: string };
  if (!user.id) throw new Error("unauthorized");
  return { id: user.id };
}

export function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}
