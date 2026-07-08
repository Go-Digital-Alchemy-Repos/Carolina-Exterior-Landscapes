import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const isReplit = process.env.REPL_ID !== undefined;

function preambleFixPlugin(): Plugin {
  return {
    name: "preamble-fix",
    enforce: "post",
    apply: "serve",
    transform(code, id) {
      if (id.includes("node_modules") || !code.includes("can't detect preamble")) return;
      return code.replace(
        /if\s*\(!window\.\$RefreshReg\$\)\s*\{[^}]*can't detect preamble[^}]*\}/s,
        `if (!window.$RefreshReg$) { window.$RefreshReg$ = () => {}; window.$RefreshSig$ = () => (t) => t; }`
      );
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    preambleFixPlugin(),
    ...(isReplit && process.env.NODE_ENV !== "production"
      ? [
          await import("@replit/vite-plugin-runtime-error-modal").then((m) =>
            m.default(),
          ),
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, "/");
          if (!normalizedId.includes("/node_modules/")) return undefined;

          if (
            normalizedId.includes("/node_modules/react/") ||
            normalizedId.includes("/node_modules/react-dom/") ||
            normalizedId.includes("/node_modules/scheduler/") ||
            normalizedId.includes("/node_modules/use-sync-external-store/")
          ) {
            return "react";
          }

          if (normalizedId.includes("/node_modules/@tanstack/")) {
            return "query";
          }

          if (
            normalizedId.includes("/node_modules/@radix-ui/") ||
            normalizedId.includes("/node_modules/@floating-ui/") ||
            normalizedId.includes("/node_modules/cmdk/") ||
            normalizedId.includes("/node_modules/vaul/") ||
            normalizedId.includes("/node_modules/sonner/")
          ) {
            return "ui-primitives";
          }

          if (normalizedId.includes("/node_modules/lucide-react/")) {
            return "icons";
          }

          if (
            normalizedId.includes("/node_modules/leaflet/") ||
            normalizedId.includes("/node_modules/react-leaflet/") ||
            normalizedId.includes("/node_modules/@react-leaflet/")
          ) {
            return undefined;
          }

          if (normalizedId.includes("/node_modules/@tiptap/")) {
            return "tiptap";
          }

          if (
            normalizedId.includes("/node_modules/prosemirror-") ||
            normalizedId.includes("/node_modules/orderedmap/") ||
            normalizedId.includes("/node_modules/rope-sequence/")
          ) {
            return "prosemirror";
          }

          if (normalizedId.includes("/node_modules/recharts/")) {
            return "charts";
          }

          if (normalizedId.includes("/node_modules/embla-carousel")) {
            return "carousel";
          }

          return "vendor";
        },
      },
    },
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
