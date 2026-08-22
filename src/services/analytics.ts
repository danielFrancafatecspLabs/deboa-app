import type { ProductEvent, ProductEventName } from "./types";

const KEY = "deboa.events";

export function trackEvent(
  name: ProductEventName,
  payload?: Record<string, unknown>,
) {
  if (typeof window === "undefined") return;
  const event: ProductEvent = { name, payload, at: new Date().toISOString() };
  try {
    const raw = window.localStorage.getItem(KEY);
    const events: ProductEvent[] = raw ? JSON.parse(raw) : [];
    events.push(event);
    window.localStorage.setItem(KEY, JSON.stringify(events.slice(-300)));
  } catch {
    /* storage unavailable */
  }
}

export function getEvents(): ProductEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
