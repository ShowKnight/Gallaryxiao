/**
 * Volcano Engine veImageX URL helpers.
 *
 * In veImageX you upload an original, then access it via:
 *   https://{IMAGE_HOST}/{key}~{template}.{format}
 *
 * Templates (e.g. "tplv-display-large") are configured in the console:
 *   Console → 服务 → 模板管理 → 新建图片模板
 *
 * Recommended templates to create:
 *   tplv-display-large  : long edge 2400, AVIF, q=80   ← single-photo page hero
 *   tplv-display-medium : long edge 1600, AVIF, q=80   ← series grid, journal cover
 *   tplv-thumb-square   : 800x800 cover (face-aware), AVIF, q=78
 *
 * If the image source is NOT a veImageX URL (e.g. a temporary picsum
 * placeholder) we return it unchanged.
 */

const HOST = import.meta.env.PUBLIC_IMAGE_HOST || 'tos-cn-i-XXXX.volccdn.com';

export type ImagePreset = 'display-large' | 'display-medium' | 'thumb-square';

export interface ImageOptions {
  preset?: ImagePreset;
  /** Override format. Default 'avif'. */
  format?: 'avif' | 'webp' | 'jpg';
}

const TPL: Record<ImagePreset, string> = {
  'display-large': 'tplv-display-large',
  'display-medium': 'tplv-display-medium',
  'thumb-square': 'tplv-thumb-square',
};

/**
 * Build a delivery URL.
 *
 * Accepts either:
 *   - a bare object key (e.g. "letters/2024-03-window.jpg"), or
 *   - a full https URL.
 *
 * For non-veImageX hosts (picsum / unsplash / arbitrary CDN), the URL is
 * returned as-is. This lets us migrate progressively.
 */
export function imageUrl(src: string, opts: ImageOptions = {}): string {
  if (!src) return src;

  // Already a full URL: only transform if it's on our veImageX host.
  if (/^https?:\/\//i.test(src)) {
    try {
      const u = new URL(src);
      if (u.hostname !== HOST) return src;
      const key = u.pathname.replace(/^\//, '');
      return buildVeUrl(key, opts);
    } catch {
      return src;
    }
  }

  // Bare key.
  return buildVeUrl(src, opts);
}

function buildVeUrl(key: string, opts: ImageOptions): string {
  const preset = opts.preset ?? 'display-large';
  const format = opts.format ?? 'avif';
  // veImageX URL convention: {origin}~{template}.{format}
  return `https://${HOST}/${key}~${TPL[preset]}.${format}`;
}

/**
 * Build a srcset for responsive <img>.
 * Used by display-large preset for the single-photo page.
 */
export function imageSrcset(src: string, presets: ImagePreset[] = ['display-medium', 'display-large']): string {
  // veImageX templates already encode width; we map them to descriptors.
  const widths: Record<ImagePreset, number> = {
    'thumb-square': 800,
    'display-medium': 1600,
    'display-large': 2400,
  };
  return presets
    .map((p) => `${imageUrl(src, { preset: p })} ${widths[p]}w`)
    .join(', ');
}
