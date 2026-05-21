// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
// Replace SITE_URL via env. Defaults target GitHub Pages (project site).
// For a custom domain set SITE_URL=https://example.com and BASE_PATH=/.
const SITE_URL = process.env.SITE_URL || 'https://showknight.github.io';

// Sub-path the site is served under. GitHub Pages project sites live at
// /<repo>/ — and the path is CASE-SENSITIVE, so it must match the repo
// name exactly ("Gallaryxiao"). A custom domain should set BASE_PATH=/.
const BASE_PATH = process.env.BASE_PATH || '/Gallaryxiao/';

// CDN host for the photographs (Volcano veImageX). Override per-env via env var.
const IMAGE_HOST = process.env.IMAGE_HOST || 'tos-cn-i-XXXX.volccdn.com';

export default defineConfig({
  site: SITE_URL,
  base: BASE_PATH,
  integrations: [mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  image: {
    // Hosts we are allowed to reference from <Image> / <Picture>.
    domains: ['picsum.photos', 'images.unsplash.com', IMAGE_HOST],
  },
});
