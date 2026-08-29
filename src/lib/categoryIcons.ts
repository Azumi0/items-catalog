import {
  IconArmchair,
  IconBallFootball,
  IconBike,
  IconBook,
  IconCategory,
  IconDeviceLaptop,
  IconPlant,
  IconTool,
  IconToolsKitchen2,
  type Icon,
} from '@tabler/icons-react';

/**
 * The glyphs a category can be given, keyed by the name stored in
 * `categories.icon`. Storing the name rather than the component keeps the
 * column readable and lets the picker and every render site agree on one set.
 *
 * Rendering falls back to IconCategory for a name that is no longer in the set,
 * so dropping an entry here degrades an old row instead of crashing it.
 */
export const CATEGORY_ICONS: Record<string, Icon> = {
  IconDeviceLaptop,
  IconTool,
  IconBook,
  IconToolsKitchen2,
  IconPlant,
  IconBallFootball,
  IconArmchair,
  IconBike,
};

/** Picker order — the order the icon grid in the category form shows them in. */
export const CATEGORY_ICON_NAMES = Object.keys(CATEGORY_ICONS);

/** Polish names for the icon buttons' aria-labels. */
const CATEGORY_ICON_LABELS: Record<string, string> = {
  IconDeviceLaptop: 'Elektronika',
  IconTool: 'Narzędzia',
  IconBook: 'Książki',
  IconToolsKitchen2: 'Kuchnia',
  IconPlant: 'Ogród',
  IconBallFootball: 'Sport',
  IconArmchair: 'Meble',
  IconBike: 'Rowery',
};

export function categoryIconComponent(name: string): Icon {
  return CATEGORY_ICONS[name] ?? IconCategory;
}

export function categoryIconLabel(name: string): string {
  return CATEGORY_ICON_LABELS[name] ?? name;
}
