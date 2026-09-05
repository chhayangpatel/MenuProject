// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Site URL: GitHub Pages project site by default.
// Override via SITE_URL env var (set as a repo variable in CI).
const site = process.env.SITE_URL || 'https://chhayangpatel.github.io/MenuProject/';

// https://astro.build/config
export default defineConfig({
  site,
  output: 'static',
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});