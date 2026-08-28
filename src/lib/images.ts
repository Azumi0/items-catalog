// CONTEXT.md names "Original Image" and "Thumbnail" as domain concepts. They
// were previously hand-built as template literals at six call sites, so the
// route shape was duplicated across components that have nothing else in
// common. Building them here keeps the URL contract in one place, next to the
// route handler it has to agree with (src/app/api/images/[type]/[filename]).
//
// eslint.config.mjs bans the raw literal so new call sites come through here.

const IMAGES_ROUTE = '/api/images';

/** URL of the optimised WebP thumbnail generated for a stored image. */
export function thumbUrl(filename: string): string {
  return `${IMAGES_ROUTE}/thumbs/${encodeURIComponent(filename)}`;
}

/** URL of the uncompressed original photo as uploaded. */
export function originalUrl(filename: string): string {
  return `${IMAGES_ROUTE}/originals/${encodeURIComponent(filename)}`;
}

/**
 * Shown when an image fails to load. Inlined as a data URI rather than fetched
 * from a placeholder CDN: the app is self-hosted on a NAS and reached through
 * the DSM reverse proxy, so an outbound request is both an availability
 * dependency on a third party and a leak of browsing activity to it. A broken
 * image should not need the internet to render.
 */
function placeholderSvg(width: number, height: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Brak zdjęcia"><rect width="${width}" height="${height}" fill="#e9ecef"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${Math.round(height / 12)}" fill="#868e96">Brak zdjęcia</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** Placeholder sized for a catalog grid tile. */
export const THUMB_PLACEHOLDER = placeholderSvg(400, 300);

/** Placeholder sized for the item detail view's main image. */
export const DETAIL_PLACEHOLDER = placeholderSvg(600, 400);
