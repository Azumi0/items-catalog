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
