/**
 * The whole Tabler library, reachable by name.
 *
 * **This module costs ~2.6 MB in a client bundle.** The namespace import below
 * defeats tree shaking by design — the point is to look icons up by a string
 * read out of the database, which no bundler can narrow. Import it only from:
 *
 *   - server code (the Server Action's validation, where it is just a Map), and
 *   - modules reached through `next/dynamic`, so the chunk downloads when the
 *     picker opens rather than when the catalog does.
 *
 * The pure half of the picker — labels, search, grid maths — lives in
 * @/lib/iconPicker precisely so the form and the tests can have it for free.
 * `labelFor` is deliberately *not* re-exported from here: one convenient
 * re-export would pull the library back into every screen that shows a label.
 */
import * as TablerIcons from '@tabler/icons-react';
import { isIconNameShaped } from './iconPicker';
import type { Icon } from '@tabler/icons-react';

const EXPORTS = TablerIcons as unknown as Record<string, Icon | undefined>;

/**
 * Every icon the installed version exports, in the library's own order —
 * alphabetical, which is what the picker shows behind the curated set.
 *
 * The package also exports `createReactComponent`, `icons`, `iconsList` and a
 * `default`; the pattern keeps those out. Names like `Icon123` and `Icon2fa`
 * are why the second character may be a digit.
 */
export const TABLER_ICON_NAMES: string[] = Object.keys(EXPORTS)
  .filter((name) => /^Icon[A-Z0-9]/.test(name))
  .filter((name) => typeof EXPORTS[name] === 'function' || typeof EXPORTS[name] === 'object');

const AVAILABLE = new Set(TABLER_ICON_NAMES);

/**
 * Both halves of the check a stored icon name has to pass: the right shape,
 * and an icon that this version of the package actually has.
 *
 * The second half is not paranoia about the form — Tabler renames and retires
 * icons between minor versions, so a name written a year ago can stop
 * resolving after a routine `pnpm update`.
 */
export function isTablerIconName(name: string): boolean {
  return isIconNameShaped(name) && AVAILABLE.has(name);
}

/** The component for a name, or null if this version does not have it. */
export function tablerIcon(name: string): Icon | null {
  return isTablerIconName(name) ? EXPORTS[name] ?? null : null;
}
