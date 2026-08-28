import { ItemsCatalog } from 'home-item-catalog';

const now = new Date('2026-03-14T10:20:00Z');
const earlier = new Date('2026-01-08T18:05:00Z');

const categories = [
  { id: 'c-1', name: 'Elektronika', itemCount: 12, createdAt: earlier, updatedAt: now },
  { id: 'c-2', name: 'Narzędzia', itemCount: 7, createdAt: earlier, updatedAt: now },
  { id: 'c-3', name: 'Kuchnia', itemCount: 9, createdAt: earlier, updatedAt: now },
  { id: 'c-4', name: 'Książki', itemCount: 23, createdAt: earlier, updatedAt: now },
];

const item = (
  id: string,
  categoryId: string,
  categoryName: string,
  description: string,
  createdByName: string,
) => ({
  id,
  categoryId,
  categoryName,
  description,
  mainImage: `${id}.jpg`,
  additionalImages: [],
  createdById: 'u-1',
  createdByName,
  createdAt: now,
  updatedAt: now,
});

const items = [
  item('i-1', 'c-2', 'Narzędzia', 'Wiertarka udarowa Bosch GSB 13 RE, walizka i komplet wierteł do betonu', 'piotr'),
  item('i-2', 'c-1', 'Elektronika', 'Router TP-Link Archer C6, zasilacz i kabel ethernet w pudełku', 'kasia'),
  item('i-3', 'c-3', 'Kuchnia', 'Robot kuchenny Bosch MUM5, końcówka do ciasta i blender kielichowy', 'kasia'),
  item('i-4', 'c-4', 'Książki', 'Encyklopedia PWN, komplet dwunastu tomów w oprawie twardej', 'piotr'),
  item('i-5', 'c-1', 'Elektronika', 'Zapasowy telewizor Samsung 32 cale z pilotem, w kartonie na strychu', 'piotr'),
  item('i-6', 'c-2', 'Narzędzia', 'Kosiarka spalinowa NAC, kanister na paliwo i zapasowe noże', 'kasia'),
];

/** The catalog as the household sees it: filter bar over a grid of items. */
export const Catalog = () => (
  <ItemsCatalog initialCategories={categories} initialItems={items} />
);

/** What a fresh install shows before the first item is added. */
export const EmptyCatalog = () => (
  <ItemsCatalog initialCategories={categories} initialItems={[]} />
);
