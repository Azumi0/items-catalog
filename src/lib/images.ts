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
