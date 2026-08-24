import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  // Capacitor serves from the WebView root, so "/" is the default. GitHub
  // Pages serves a project site under /<repo>/, and sets PUBLIC_BASE to match.
  base: process.env["PUBLIC_BASE"] ?? "/",
  plugins: [
    TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  // __root.tsx renders a whole <html> document for the TanStack Start server
  // entry. This build has no server: it mounts into <div id="root"> in
  // index.html, so that document must not be rendered again. See RootShell.
  define: {
    "import.meta.env.VITE_STANDALONE_SPA": JSON.stringify("1"),
  },
  build: {
    outDir: "dist-capacitor",
    emptyOutDir: true,
  },
  server: {
    port: 8080,
    strictPort: true,
  },
});