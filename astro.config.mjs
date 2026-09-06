// @ts-check
import { defineConfig, envField } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Site URL: GitHub Pages project site by default.
// Override via SITE_URL env var (set as a repo variable in CI).
const site = process.env.SITE_URL || 'https://chhayangpatel.github.io/MenuProject/';

// Static output. We do NOT install @astrojs/cloudflare here because the
// adapter pulls node:fs and node:path into a "prerender" environment that
// breaks the GitHub Pages build. Cloudflare Pages serves the static
// dist/client/MenuProject output directly without needing the adapter.
export default defineConfig({
  site,
  base: '/MenuProject',
  output: 'static',
  // Declare the worker URL so it gets inlined into the client bundle
  // from process.env (populated by CI from repo variables) and from
  // .env in local dev. Throws at build time if missing in production.
  env: {
    schema: {
      VITE_WORKER_URL: envField.string({
        context: 'client',
        access: 'public',
      }),
    },
  },
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});

