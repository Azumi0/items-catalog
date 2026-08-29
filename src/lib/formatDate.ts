/**
 * `dd.MM.yyyy` in Polish — the only date format the interface shows.
 *
 * It appeared verbatim at five call sites (the item card, the item detail and
 * its page title, the category card, the user card), each re-spelling the same
 * options object. Accepts what the database hands back: a Date, or the number
 * or string it deserialises to when a Server Component passes a row to a
 * Client Component.
 */
export function formatDate(value: Date | number | string): string {
  return new Date(value).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** First letter of a name, uppercased — the avatar and monogram rule. */
export function monogram(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed[0].toUpperCase() : '?';
}
