import { supabase } from "@/lib/supabase/client";
import type { PluggySnapshot } from "@/services/pluggyTypes";

/**
 * Fala com as Edge Functions, nunca com a Pluggy.
 *
 * O segredo da conta Pluggy fica no servidor. Daqui só sai o token da sessão
 * do usuário, para a função saber quem está pedindo.
 */

const FUNCTIONS = `${import.meta.env["VITE_SUPABASE_URL"] ?? "https://hmasenjcnpajirpeushg.supabase.co"}/functions/v1`;

export class PluggyError extends Error {
  constructor(
    message: string,
    /** Código cru, para a interface decidir o que dizer. */
    readonly code: string,
  ) {
    super(message);
    this.name = "PluggyError";
  }
}

async function call<T>(fn: string, body: Record<string, unknown> = {}): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new PluggyError("Você precisa entrar na sua conta antes de conectar o banco.", "auth");
  }

  const res = await fetch(`${FUNCTIONS}/${fn}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = (await res.json().catch(() => ({}))) as { error?: string };
    throw new PluggyError(messageFor(detail.error, res.status), detail.error ?? String(res.status));
  }

  return (await res.json()) as T;
}

function messageFor(code: string | undefined, status: number): string {
  switch (code) {
    case "unauthorized":
      return "Sua sessão expirou. Entre de novo e tente outra vez.";
    case "still_updating":
      return "Seu banco ainda está enviando os dados. Tente de novo em um minuto.";
    case "needs_reconnect":
      return "O banco pediu uma nova autorização. Conecte novamente.";
    case "pluggy_error":
      return "O provedor de Open Finance recusou o pedido.";
    default:
      return `Não consegui falar com o servidor agora (${status}).`;
  }
}

/** Token curto que o widget usa para abrir a lista de bancos. */
export async function connectToken(itemId?: string): Promise<string> {
  const { accessToken } = await call<{ accessToken: string }>(
    "pluggy-connect-token",
    itemId ? { itemId } : {},
  );
  return accessToken;
}

/** Contas e extrato de um banco já conectado. */
export function sync(itemId: string): Promise<PluggySnapshot> {
  return call<PluggySnapshot>("pluggy-sync", { itemId });
}

const ITEM_KEY = "deboa.pluggyItemId";

/** Guarda qual banco está conectado, para poder atualizar depois. */
export function rememberItem(itemId: string): void {
  try {
    window.localStorage.setItem(ITEM_KEY, itemId);
  } catch {
    /* modo privado */
  }
}

export function connectedItem(): string | null {
  try {
    return window.localStorage.getItem(ITEM_KEY);
  } catch {
    return null;
  }
}

export function forgetItem(): void {
  try {
    window.localStorage.removeItem(ITEM_KEY);
  } catch {
    /* modo privado */
  }
}
