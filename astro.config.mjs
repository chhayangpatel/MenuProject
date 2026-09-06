// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Cloudflare Pages builds expose CF_PAGES=1 and CF_PAGES_URL automatically.
// They serve from the root and know their own URL, so prefer those when set.
const isCloudflarePages = Boolean(process.env.CF_PAGES);

// Site URL: Cloudflare Pages URL when building there, otherwise the GitHub
// Pages project site. SITE_URL env var overrides both.
const site =
  process.env.SITE_URL ||
  (isCloudflarePages && process.env.CF_PAGES_URL
    ? process.env.CF_PAGES_URL
    : 'https://chhayangpatel.github.io/MenuProject/');

// Base path: GitHub Pages serves the site from /MenuProject. Cloudflare
// Pages serves from the root. SITE_BASE env var overrides both.
const base =
  process.env.SITE_BASE || (isCloudflarePages ? '/' : '/MenuProject');

// Worker URL — loaded from .env at config-eval time so it works in both:
//   - Local dev: reads VITE_WORKER_URL from .env  (http://localhost:8787)
//   - CI build:   reads from process.env (repo variable)
const envName = process.env.NODE_ENV ?? 'development';
// Third arg '' = load ALL keys (not just VITE_-prefixed ones)
const env = loadEnv(envName, process.cwd(), '');
const WORKER_URL = process.env.VITE_WORKER_URL ?? env.VITE_WORKER_URL ?? '';

// Static output. We do NOT install @astrojs/cloudflare here because the
// adapter pulls node:fs and node:path into a "prerender" environment that
// breaks the GitHub Pages build. Cloudflare Pages serves the static
// dist/client/MenuProject output directly without needing the adapter.
export default defineConfig({
  site,
  base,
  output: 'static',
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
    define: {
      // Bake the worker URL into the client bundle at build time.
      // In dev, loadEnv reads .env so this picks up localhost:8787.
      // In CI, process.env.VITE_WORKER_URL (repo var) takes priority.
      'import.meta.env.VITE_WORKER_URL': JSON.stringify(WORKER_URL),
    },
  },
});
