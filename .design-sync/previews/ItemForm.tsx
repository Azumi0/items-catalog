import { ItemForm } from 'home-item-catalog';

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

const drill = {
  id: 'i-1',
  categoryId: 'c-2',
  categoryName: 'Narzędzia',
  description:
    'Wiertarka udarowa Bosch GSB 13 RE, 600 W. Walizka, komplet wierteł do betonu i drewna. Piwnica, regał przy warsztacie.',
  mainImage: 'wiertarka.jpg',
  additionalImages: ['wiertarka-walizka.jpg', 'wiertarka-wiertla.jpg'],
  createdById: 'u-1',
  createdByName: 'piotr',
  createdAt: now,
  updatedAt: now,
};

/** `/items/new` — an empty form, the camera dropzone waiting for a photo. */
export const Add = () => <ItemForm categories={categories} />;

/** Adding from inside a category: that chip starts selected. */
export const AddInCategory = () => (
  <ItemForm categories={categories} initialCategoryId="c-2" />
);

/** `/items/[id]/edit` — photos already on disk, ready to be dropped or kept. */
export const Edit = () => <ItemForm categories={categories} item={drill} />;
