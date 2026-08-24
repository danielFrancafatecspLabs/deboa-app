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
  build: {
    outDir: "dist-capacitor",
    emptyOutDir: true,
  },
  server: {
    port: 8080,
    strictPort: true,
  },
});