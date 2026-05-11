import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

// ── Series (curated bodies of work, IBASHO-style) ─────────────────────────
const series = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/series' }),
  schema: z.object({
    title_zh: z.string(),
    title_en: z.string(),
    year_start: z.number().int(),
    year_end: z.number().int().nullable().optional(), // null = ongoing
    intro_zh: z.string().optional(),
    intro_en: z.string().optional(),
    cover: z.string().url().or(z.string().startsWith('/')), // CDN URL or local path
    cover_alt_zh: z.string().optional(),
    cover_alt_en: z.string().optional(),
    photos: z.array(reference('photos')).default([]), // ordered photo references
    featured: z.boolean().default(false), // appears on home
    order: z.number().default(100), // sort order, lower = first
    draft: z.boolean().default(false),
  }),
});

// ── Photos (atomic units; referenced by series & journal) ─────────────────
const photos = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/photos' }),
  schema: z.object({
    image: z.string().url().or(z.string().startsWith('/')),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    alt_zh: z.string(),
    alt_en: z.string(),
    caption_zh: z.string().optional(),
    caption_en: z.string().optional(),
    // body of the .md file holds the long story (zh by default; for en, see story_en)
    story_en: z.string().optional(), // optional override; long stories live in body
    date: z.coerce.date().optional(),
    location_zh: z.string().optional(),
    location_en: z.string().optional(),
    series: reference('series').optional(),
    tags: z.array(z.string()).default([]),
    camera: z.string().optional(),
    film: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

// ── Journal (date-stamped entries; archive view) ──────────────────────────
const journal = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/journal' }),
  schema: z.object({
    title_zh: z.string(),
    title_en: z.string(),
    date: z.coerce.date(),
    location_zh: z.string().optional(),
    location_en: z.string().optional(),
    photos: z.array(reference('photos')).default([]),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { series, photos, journal };
