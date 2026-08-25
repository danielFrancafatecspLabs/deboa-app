import { StrictMode } from "react";
import { QueryClient } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import {
  RouterProvider,
  createRouter,
  createMemoryHistory,
  createBrowserHistory,
} from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import "./styles.css";

// Detect if running inside Capacitor (native WebView)
const isCapacitor = typeof (window as any).Capacitor !== "undefined";

// Use memory history for Capacitor (no URL bar), browser history for web
const history = isCapacitor
  ? createMemoryHistory({ initialEntries: ["/"] })
  : createBrowserHistory();

// When served from a subpath (GitHub Pages project site), the router has to
// strip it from URLs or every route resolves to a 404. Vite injects the value
// the app was built with; it is "/" everywhere else, which the router ignores.
const basepath = import.meta.env.BASE_URL;

// __root.tsx is a createRootRouteWithContext route that reads queryClient
// out of router context and hands it to QueryClientProvider. The TanStack
// Start server entry supplies that context; this standalone SPA entry has to
// supply it too, or the provider mounts `undefined` and the app dies on load.
const queryClient = new QueryClient();

const router = createRouter({
  routeTree,
  history,
  context: { queryClient },
  defaultPreload: !isCapacitor,
  ...(basepath && basepath !== "/" ? { basepath } : {}),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// O service worker só faz sentido na web: dentro do Capacitor os arquivos já
// vêm do próprio aparelho. Registrado depois do load para não competir com a
// primeira renderização.
if (!isCapacitor && import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const url = `${import.meta.env.BASE_URL}sw.js`;
    navigator.serviceWorker.register(url, { scope: import.meta.env.BASE_URL }).catch(() => {
      // Sem service worker o app funciona igual, só perde o modo offline.
    });
  });
}

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );

  // A marca em index.html sai assim que há algo para ver no lugar dela.
  requestAnimationFrame(() => {
    const splash = document.getElementById("splash");
    if (!splash) return;
    splash.classList.add("out");
    window.setTimeout(() => splash.remove(), 400);
  });
}