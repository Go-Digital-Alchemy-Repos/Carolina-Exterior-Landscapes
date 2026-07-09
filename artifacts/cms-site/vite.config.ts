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
          if (!id.includes("node_modules")) return undefined;

          if (/\/node_modules\/(react|react-dom|react-is|scheduler|use-sync-external-store)\//.test(id)) {
            return "react-core";
          }

          if (id.includes("/wouter/")) {
            return "routing";
          }

          if (id.includes("/@tanstack/")) {
            return "query";
          }

          if (id.includes("/lucide-react/")) {
            return "icons";
          }

          if (
            id.includes("/@radix-ui/") ||
            id.includes("/@floating-ui/") ||
            id.includes("/react-remove-scroll") ||
            id.includes("/react-style-singleton/") ||
            id.includes("/aria-hidden/") ||
            id.includes("/cmdk/") ||
            id.includes("/vaul/") ||
            id.includes("/input-otp/")
          ) {
            return "ui-primitives";
          }

          if (
            id.includes("/react-hook-form/") ||
            id.includes("/@hookform/") ||
            id.includes("/zod/") ||
            id.includes("/zod-validation-error/")
          ) {
            return "forms";
          }

          if (id.includes("/framer-motion/")) {
            return "motion";
          }

          if (id.includes("/@tiptap/")) {
            return "tiptap";
          }

          if (
            id.includes("/prosemirror-") ||
            id.includes("/orderedmap/") ||
            id.includes("/rope-sequence/")
          ) {
            return "prosemirror";
          }

          if (id.includes("/embla-carousel")) {
            return "carousel";
          }

          return undefined;
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
