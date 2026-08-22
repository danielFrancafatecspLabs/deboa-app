import { StrictMode } from "react";
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

const router = createRouter({
  routeTree,
  history,
  defaultPreload: !isCapacitor,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}