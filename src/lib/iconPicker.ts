/**
 * The icon picker's logic, with no icons in it.
 *
 * Everything here works on export *names* — strings — so it stays out of the
 * client bundle's way. @/lib/tablerIcons is the module that actually holds
 * 6250 React components, and importing it costs ~2.6 MB; this one costs a few
 * hundred bytes and is what the form, the search and the tests import.
 */
import { expandQuery, foldPolish } from './iconAliases';

/**
 * Grid geometry, from the handoff. These are the only numbers the modal
 * computes anything from — every other dimension in it is a literal.
 */
export const ICON_GRID = {
  /** Columns at the width the handoff draws — see columnsForWidth(). */
  COLS: 8,
  /** Tile pitch down the grid, in px. */
  ROW_H: 60,
  /** Tile pitch across the grid, in px. */
  COL_W: 60,
  /** Height of the scrolling viewport, in px. */
  VIEW_H: 420,
  /** Rows kept rendered above and below the viewport. */
  OVERSCAN: 6,
  /** Fewer than this and the grid stops reading as a grid. */
  MIN_COLS: 4,
} as const;

/**
 * How many columns fit the space actually available.
 *
 * The handoff draws a fixed 8 × 60 px grid, which needs 480 px of content
 * width — more than a 360 px phone has once the modal's own margins and
 * padding are off. Shrinking the tiles instead would put them under the 44 px
 * touch target, so the column count gives way and the tiles keep their size.
 * At the width the handoff was drawn for this returns 8.
 */
export function columnsForWidth(width: number): number {
  if (!width) return ICON_GRID.COLS;

  return Math.min(ICON_GRID.COLS, Math.max(ICON_GRID.MIN_COLS, Math.floor(width / ICON_GRID.COL_W)));
}

/**
 * The eight icons the form used to offer as its whole selection, shown first
 * while the search box is empty. Someone who has been picking from these
 * eight still finds them without typing.
 */
export const CURATED_ICON_NAMES = [
  'IconDeviceLaptop',
  'IconTool',
  'IconBook',
  'IconToolsKitchen2',
  'IconPlant',
  'IconBallFootball',
  'IconArmchair',
  'IconBike',
] as const;

const CURATED = new Set<string>(CURATED_ICON_NAMES);

/** What `categories.icon` is allowed to hold, shape-wise. */
const ICON_NAME_PATTERN = /^Icon[A-Za-z0-9]+$/;

/**
 * A first gate on a stored icon name — cheap, and it does not need the
 * library loaded. Passing this does not mean the icon exists; see
 * isTablerIconName() in @/lib/tablerIcons for that half.
 */
export function isIconNameShaped(name: string): boolean {
  return ICON_NAME_PATTERN.test(name);
}

/** Wide enough that a term's rank always outweighs its position in the query. */
const TERM_RANK = 1000;

const labels = new Map<string, string>();
const searchable = new Map<string, string[]>();

/**
 * The name as a person reads it: `IconDeviceLaptop` → `Device Laptop`.
 *
 * Cached because the search runs this over the whole library on every
 * keystroke, and 6250 regex replacements per character is measurable.
 */
export function labelFor(name: string): string {
  const cached = labels.get(name);
  if (cached !== undefined) return cached;

  const label = name.replace(/^Icon/, '').replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  labels.set(name, label);
  return label;
}

/** The label folded for matching, split into words. Cached for the same reason. */
function wordsOf(name: string): string[] {
  const cached = searchable.get(name);
  if (cached !== undefined) return cached;

  const words = foldPolish(labelFor(name)).split(' ');
  searchable.set(name, words);
  return words;
}

/**
 * How well a name answers one search term. Ranking matters more here than in
 * a normal filter: „auto" expands to `car`, and a plain substring match buries
 * Car under Cardboards, Carousel and thirty other words that merely start
 * with those three letters. The icon *named* for the term wins outright, or
 * „dom" leads with Brand Google Home rather than Home.
 */
function scoreOf(name: string, term: string): number {
  const words = wordsOf(name);

  if (words.length === 1 && words[0] === term) return 4;
  if (words.some((word) => word === term)) return 3;
  if (words.some((word) => word.startsWith(term))) return 2;
  if (words.join(' ').includes(term)) return 1;
  return 0;
}

/**
 * The icons to show, in the order to show them.
 *
 * Empty query: curated eight first, then the library in export order. Otherwise
 * every icon matching the query — directly or through its Polish alias — best
 * match first. Array#sort is stable, so equally good matches keep the library's
 * own alphabetical order.
 */
export function iconPool(allNames: readonly string[], query: string): string[] {
  const terms = expandQuery(query);

  if (terms.length === 0) {
    const curated = CURATED_ICON_NAMES.filter((name) => allNames.includes(name));
    return [...curated, ...allNames.filter((name) => !CURATED.has(name))];
  }

  const scored: { name: string; score: number }[] = [];
  for (const name of allNames) {
    let best = 0;
    for (const [index, term] of terms.entries()) {
      const score = scoreOf(name, term);
      // Earlier terms are the better reading of the query — the word as typed
      // first, then the alias table's own order, which lists the plainest
      // translation first. Without this „lampa" leads with Bulb over Lamp.
      if (score > 0 && score * TERM_RANK - index > best) best = score * TERM_RANK - index;
    }
    if (best > 0) scored.push({ name, score: best });
  }

  return scored.sort((a, b) => b.score - a.score).map((hit) => hit.name);
}

export interface IconGridWindow {
  /** Height the scroll canvas must claim for the full pool. */
  contentHeight: number;
  /** First index to render. */
  startIndex: number;
  /** One past the last index to render. */
  endIndex: number;
}

/**
 * Which slice of the pool is worth rendering at this scroll offset.
 *
 * Drawing 6250 SVG buttons at once locks the main thread for seconds and eats
 * hundreds of MB, so the grid renders roughly two screens of them and leans on
 * an empty div of the right height for the scrollbar.
 */
export function iconGridWindow(
  count: number,
  scrollTop: number,
  cols: number = ICON_GRID.COLS
): IconGridWindow {
  const { ROW_H, VIEW_H, OVERSCAN } = ICON_GRID;

  const totalRows = Math.ceil(count / cols);
  const startRow = Math.max(0, Math.floor(scrollTop / ROW_H) - OVERSCAN);
  const endRow = Math.min(totalRows, Math.ceil((scrollTop + VIEW_H) / ROW_H) + OVERSCAN);

  return {
    contentHeight: Math.max(totalRows * ROW_H, VIEW_H),
    startIndex: startRow * cols,
    endIndex: Math.min(count, endRow * cols),
  };
}

/** Where the tile at this index sits inside the scroll canvas. */
export function iconTilePosition(
  index: number,
  cols: number = ICON_GRID.COLS
): { top: number; left: number } {
  const { ROW_H, COL_W } = ICON_GRID;

  return {
    top: Math.floor(index / cols) * ROW_H,
    left: (index % cols) * COL_W,
  };
}
