/**
 * Notificações do sistema.
 *
 * O que dá e o que não dá, para não prometermos o impossível na interface:
 *
 * - Mostrar uma notificação agora, com o app aberto ou recém-aberto: dá, e é
 *   o que este arquivo faz. No iOS só funciona com o app instalado na tela de
 *   início (iOS 16.4+); no Safari em aba, não existe.
 * - Notificação agendada ("me lembra em 7 dias") ou enviada pelo servidor:
 *   precisa de Web Push com chaves VAPID e um serviço que dispare. O navegador
 *   sozinho não guarda um alarme. Ver docs/interceptacao.md.
 */

export type NotificationState = "unsupported" | "default" | "granted" | "denied";

export function notificationState(): NotificationState {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission as NotificationState;
}

/**
 * Só pode ser chamado a partir de um gesto do usuário — os navegadores
 * ignoram (ou negam de vez) um pedido que aparece sozinho.
 */
export async function askForNotifications(): Promise<NotificationState> {
  if (notificationState() === "unsupported") return "unsupported";
  try {
    return (await Notification.requestPermission()) as NotificationState;
  } catch {
    return notificationState();
  }
}

/**
 * Mostra uma notificação. Vai pelo service worker quando existe: no Android é
 * a única forma que sobrevive ao app sair da frente, e `new Notification()`
 * simplesmente não é suportado lá.
 *
 * Retorna false quando não foi possível mostrar, para a interface poder dizer
 * a verdade em vez de fingir que apareceu.
 */
export async function notify(
  title: string,
  options: NotificationOptions = {},
): Promise<boolean> {
  if (notificationState() !== "granted") return false;

  const body: NotificationOptions = {
    icon: `${import.meta.env.BASE_URL}icon-192.png`,
    badge: `${import.meta.env.BASE_URL}icon-192.png`,
    lang: "pt-BR",
    ...options,
  };

  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification(title, body);
        return true;
      }
    }
    new Notification(title, body);
    return true;
  } catch {
    return false;
  }
}
