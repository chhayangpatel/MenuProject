// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Site URL: GitHub Pages project site by default.
// Override via SITE_URL env var (set as a repo variable in CI).
const site = process.env.SITE_URL || 'https://chhayangpatel.github.io/MenuProject/';

// Worker URL: Vite auto-exposes VITE_* env vars via import.meta.env, but
// we also define it explicitly here as a belt-and-suspenders fallback.
// CI passes this from the repo variable; .env provides it locally.
const WORKER_URL = process.env.VITE_WORKER_URL;

if (!WORKER_URL) {
  console.warn(
    '⚠ VITE_WORKER_URL is not set. The admin dashboard will not work in production.',
  );
}

// Static output. We do NOT install @astrojs/cloudflare here because the
// adapter pulls node:fs and node:path into a "prerender" environment that
// breaks the GitHub Pages build. Cloudflare Pages serves the static
// dist/client/MenuProject output directly without needing the adapter.
export default defineConfig({
  site,
  base: '/MenuProject',
  output: 'static',
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
    define: {
      // Force the worker URL into the client bundle at build time.
      // import.meta.env.VITE_WORKER_URL reads this value at runtime.
      'import.meta.env.VITE_WORKER_URL': JSON.stringify(WORKER_URL ?? ''),
    },
  },
});
