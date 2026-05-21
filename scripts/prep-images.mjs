#!/usr/bin/env node
/**
 * Prepare camera-original photos for the website.
 *
 * Camera files are huge (~5 MB+) and carry EXIF/GPS. Never commit those.
 * This script makes a web "display version" of each image:
 *   - auto-rotates per EXIF orientation
 *   - resizes so the long edge is at most 2400px (no upscaling)
 *   - strips all metadata (incl. GPS location)
 *   - re-encodes as a quality-88 sRGB JPEG (typically 300–800 KB)
 *
 * The output goes into src/content/photos/_media/ by default — that's the
 * folder the photo markdown references with `image: ./_media/<name>.jpg`.
 * Astro then optimizes it further (WebP, responsive sizes) at build time.
 *
 * Usage:
 *   node scripts/prep-images.mjs <file|glob> [<file> ...] [options]
 *   npm run prep -- ~/Desktop/raw/*.jpg
 *   npm run prep -- ~/Desktop/raw/*.jpg --prefix letters --out src/content/series/_media
 *
 * Options:
 *   --out <dir>      output directory (default: src/content/photos/_media)
 *   --prefix <slug>  prepend to every output filename, e.g. "letters" ->
 *                    letters-01.jpg, letters-02.jpg ...
 *   --max <px>       max long edge (default: 2400)
 *   --quality <n>    JPEG quality 1-100 (default: 88)
 */

import sharp from 'sharp';
import { mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// ── parse args ──────────────────────────────────────────────────────
const args = process.argv.slice(2);
const opts = {
  out: 'src/content/photos/_media',
  prefix: '',
  max: 2400,
  quality: 88,
};
const inputs = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--out') opts.out = args[++i];
  else if (a === '--prefix') opts.prefix = args[++i];
  else if (a === '--max') opts.max = Number(args[++i]);
  else if (a === '--quality') opts.quality = Number(args[++i]);
  else if (a.startsWith('--')) {
    console.error(`Unknown option: ${a}`);
    process.exit(1);
  } else inputs.push(a);
}

if (inputs.length === 0) {
  console.error('No input files. Usage: npm run prep -- <file> [<file> ...] [--prefix slug]');
  process.exit(1);
}

// ── helpers ─────────────────────────────────────────────────────────
function slugify(s) {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const pad = (n) => String(n).padStart(2, '0');

// ── run ─────────────────────────────────────────────────────────────
const outDir = resolve(ROOT, opts.out);
await mkdir(outDir, { recursive: true });

const results = [];
let index = 0;

for (const input of inputs) {
  const inPath = resolve(input);
  if (!existsSync(inPath)) {
    console.error(`  skip (not found): ${input}`);
    continue;
  }
  index++;

  const base = basename(input, extname(input));
  const name = opts.prefix
    ? `${slugify(opts.prefix)}-${pad(index)}`
    : slugify(base) || `photo-${pad(index)}`;
  const outName = `${name}.jpg`;
  const outPath = join(outDir, outName);

  try {
    const img = sharp(inPath, { failOn: 'none' }).rotate(); // auto-orient
    const meta = await img.metadata();
    const longEdge = Math.max(meta.width ?? 0, meta.height ?? 0);

    await img
      .resize({
        width: meta.width >= meta.height ? opts.max : undefined,
        height: meta.height > meta.width ? opts.max : undefined,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toColorspace('srgb')
      .jpeg({ quality: opts.quality, mozjpeg: true })
      // .toFormat strips metadata by default (no withMetadata call = GPS gone)
      .toFile(outPath);

    const { size } = await stat(outPath);
    const outMeta = await sharp(outPath).metadata();
    results.push({
      out: outName,
      kb: Math.round(size / 1024),
      dims: `${outMeta.width}x${outMeta.height}`,
      shrunk: longEdge > opts.max,
    });
  } catch (err) {
    console.error(`  error processing ${input}: ${err.message}`);
  }
}

// ── report ──────────────────────────────────────────────────────────
if (results.length === 0) {
  console.error('Nothing processed.');
  process.exit(1);
}

const totalKb = results.reduce((s, r) => s + r.kb, 0);
console.log(`\n  ${results.length} image(s) -> ${opts.out}\n`);
for (const r of results) {
  console.log(`  ${r.out.padEnd(28)} ${r.dims.padEnd(11)} ${String(r.kb).padStart(5)} KB`);
}
console.log(`  ${''.padEnd(28)} ${'total'.padEnd(11)} ${String(totalKb).padStart(5)} KB\n`);

console.log('  Next: in a photo markdown file (src/content/photos/<name>.md) set:');
console.log(`    image: "./_media/${results[0].out}"`);
console.log('  (Astro generates WebP + responsive sizes from it at build time.)\n');
