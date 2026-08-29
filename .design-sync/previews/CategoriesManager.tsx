import { CategoriesManager } from 'home-item-catalog';

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

/** Every category as a card: visual, name, meta, edit and delete. */
export const Categories = () => <CategoriesManager initialCategories={categories} />;

/** The empty state, before the first category is created. */
export const NoCategories = () => <CategoriesManager initialCategories={[]} />;
