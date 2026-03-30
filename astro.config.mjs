// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  adapter: vercel(),
  site: "https://www.unleft.space",
  integrations: [
    react(),
    sitemap({
      filter: (page) => {
        try {
          const { pathname } = new URL(page);
          return pathname !== "/checkout" && pathname !== "/checkout/";
        } catch {
          return !/\/checkout\/?$/.test(page);
        }
      },
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": "/src",
      },
    },
  },
});
