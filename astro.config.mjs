// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
// Replace SITE_URL via env (Cloudflare Pages exposes it via project settings).
// Locally / in PRs the fallback below is used.
const SITE_URL = process.env.SITE_URL || 'https://shellyxiao.com';

// CDN host for the photographs (Volcano veImageX). Override per-env via env var.
const IMAGE_HOST = process.env.IMAGE_HOST || 'tos-cn-i-XXXX.volccdn.com';

export default defineConfig({
  site: SITE_URL,
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
