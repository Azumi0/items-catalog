/**
 * "1 przedmiot" / "N przedmiotów" — the count under a category tile, in the
 * management card meta line and as the items screen's subtitle.
 *
 * The two-form split (rather than Polish's three) is what the design handoff
 * specifies; keeping it in one function keeps the three call sites identical.
 */
export function itemCountLabel(count: number): string {
  return count === 1 ? '1 przedmiot' : `${count} przedmiotów`;
}

/**
 * The same count in the instrumental case, for "zniknie razem z N
 * przedmiotami" — the delete-category sheet is the one sentence that governs
 * the noun rather than just stating it, and the nominative reads as broken
 * Polish there.
 */
export function itemCountInstrumental(count: number): string {
  return count === 1 ? '1 przedmiotem' : `${count} przedmiotami`;
}
