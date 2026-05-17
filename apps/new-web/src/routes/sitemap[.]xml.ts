import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const paths = [
          "/",
          "/results",
          "/cars/uae", "/cars/uae/dubai",
          "/cars/uk", "/cars/uk/london",
          "/cars/canada", "/cars/canada/toronto",
          "/cars/spain", "/cars/spain/barcelona",
          "/cars/usa", "/cars/usa/new-york",
          "/legal/terms", "/legal/privacy", "/legal/cookies",
          "/legal/refunds", "/legal/rental-conditions",
        ];
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths
          .map((p) => `  <url><loc>${BASE_URL}${p}</loc><changefreq>weekly</changefreq></url>`)
          .join("\n")}\n</urlset>`;
        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
