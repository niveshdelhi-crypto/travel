import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    // TanStack Router file-based routing (must come first)
    TanStackRouterVite({
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        // Chunk splitting for better caching
        manualChunks: {
          vendor:  ["react", "react-dom"],
          router:  ["@tanstack/react-router"],
          query:   ["@tanstack/react-query"],
          ui:      ["lucide-react", "recharts"],
          store:   ["zustand"],
        },
      },
    },
  },
  server: {
    port: 8080,
    host: true,
    proxy: apiProxy(),
  },
  preview: {
    port: 8080,
    host: true,
    proxy: apiProxy(),
  },
});

function apiProxy() {
  return {
    "/api": {
      // Use IPv4 explicitly — some Windows setups resolve `localhost` to ::1 while Nest binds IPv4-only.
      target: "http://127.0.0.1:4000",
      changeOrigin: true,
    },
  };
}
