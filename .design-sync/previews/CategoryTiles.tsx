import { CategoryTiles } from 'home-item-catalog';

const created = new Date("2026-01-12T09:15:00Z");
const now = new Date("2026-03-14T10:20:00Z");

const cat = (
  id: string,
  name: string,
  icon: string | null,
  mainImage: string | null,
  itemCount: number,
  newestItemImage: string | null,
) => ({ id, name, icon, mainImage, itemCount, newestItemImage, createdAt: created, updatedAt: now });

const categories = [
  cat("c-1", "Elektronika", "IconDeviceLaptop", null, 12, "laptop.jpg"),
  cat("c-2", "Narzędzia", null, "narzedzia-hero.jpg", 7, "wiertarka.jpg"),
  cat("c-3", "Książki", null, null, 23, "atlas.jpg"),
  cat("c-4", "Kuchnia", "IconToolsKitchen2", null, 9, null),
  cat("c-5", "Ogród", null, null, 1, null),
  cat("c-6", "Sport", null, null, 0, null),
];

/** The catalog entry screen: every category, each drawn by the fallback rule. */
export const Tiles = () => <CategoryTiles categories={categories} />;

/** All four arms of the fallback side by side: image, icon, derived, monogram. */
export const EveryFallback = () => (
  <CategoryTiles categories={[categories[1], categories[0], categories[2], categories[5]]} />
);

/** What a fresh install shows before the first category exists. */
export const NoCategories = () => <CategoryTiles categories={[]} />;
