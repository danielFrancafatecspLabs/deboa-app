import { apiKey, cors, json, requireUser } from "../_shared/pluggy.ts";

/**
 * Devolve um connect token para o widget da Pluggy.
 *
 * O token é curto, amarrado ao usuário e é a única coisa desta integração que
 * pode chegar ao navegador.
 */
Deno.serve(async (req) => {
  const headers = cors(req.headers.get("Origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405, headers);

  let user: { id: string };
  try {
    user = await requireUser(req);
  } catch {
    return json({ error: "unauthorized" }, 401, headers);
  }

  try {
    const key = await apiKey();
    const body = (await req.json().catch(() => ({}))) as { itemId?: string };

    const res = await fetch("https://api.pluggy.ai/connect_token", {
      method: "POST",
      headers: { "X-API-KEY": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        // Com itemId, o widget entra em modo de atualização em vez de criar
        // uma conexão nova.
        itemId: body.itemId,
        options: {
          clientUserId: user.id,
          // Reconectar o mesmo banco não deve gerar um item duplicado —
          // cada item é cobrado.
          avoidDuplicates: true,
        },
      }),
    });

    if (!res.ok) return json({ error: "pluggy_error", status: res.status }, 502, headers);

    const { accessToken } = (await res.json()) as { accessToken?: string };
    if (!accessToken) return json({ error: "no_token" }, 502, headers);

    return json({ accessToken }, 200, headers);
  } catch (error) {
    console.error("connect-token:", error instanceof Error ? error.message : error);
    return json({ error: "internal" }, 500, headers);
  }
});
