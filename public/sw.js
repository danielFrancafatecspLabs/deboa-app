/**
 * Service worker do DeBoa.
 *
 * Duas estratégias, escolhidas para nunca servir uma versão velha do app:
 *
 * - Navegação (o documento HTML): rede primeiro. Assim um deploy novo é
 *   pego na próxima abertura. Só cai no cache se estiver sem conexão.
 * - Assets em /assets/: cache primeiro. O Vite coloca hash no nome de cada
 *   arquivo, então um nome que já existe nunca muda de conteúdo — cachear
 *   para sempre é seguro, e um build novo gera nomes novos.
 *
 * Qualquer falha aqui cai de volta para a rede: um service worker quebrado
 * não pode derrubar o app.
 */

const VERSION = "v1";
const DOCS = `deboa-docs-${VERSION}`;
const ASSETS = `deboa-assets-${VERSION}`;
const KEEP = [DOCS, ASSETS];

self.addEventListener("install", () => {
  // Assume o controle sem esperar as abas antigas fecharem.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((n) => !KEEP.includes(n)).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Só interessam GETs da mesma origem. O resto (Supabase, fontes) passa direto.
  if (request.method !== "GET") return;
  if (new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(DOCS);
          cache.put(request, fresh.clone());
          return fresh;
        } catch {
          // Offline: serve o documento guardado, seja a rota pedida ou a raiz.
          const cache = await caches.open(DOCS);
          return (
            (await cache.match(request)) ??
            (await cache.match(new URL("./", self.location).toString())) ??
            Response.error()
          );
        }
      })(),
    );
    return;
  }

  if (request.url.includes("/assets/")) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ASSETS);
        const hit = await cache.match(request);
        if (hit) return hit;
        const fresh = await fetch(request);
        if (fresh.ok) cache.put(request, fresh.clone());
        return fresh;
      })(),
    );
  }
});
