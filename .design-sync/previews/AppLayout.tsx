// AppLayout is where the app's pages live as previews. Every route is
// `AppLayout` wrapping exactly one screen component, and Mantine's AppShell
// header is fixed-positioned — so a page composition escapes a grid cell and
// can only be presented as a single card (cfg.overrides.AppLayout). Keeping
// all six inside this one component leaves every other card free to show its
// own component's states in the normal grid; each page here stays addressable
// as ?story=<CellName>.

import {
  AppLayout,
  CategoriesManager,
  EditItemForm,
  ItemDetailView,
  ItemsCatalog,
  NewItemForm,
  UsersManager,
} from 'home-item-catalog';

const created = new Date('2025-11-02T09:15:00Z');
const now = new Date('2026-03-14T10:20:00Z');

const kasia = { id: 'u-1', username: 'kasia' };
const piotr = { id: 'u-2', username: 'piotr' };

const categories = [
  { id: 'c-1', name: 'Elektronika', itemCount: 12, createdAt: created, updatedAt: now },
  { id: 'c-2', name: 'Narzędzia', itemCount: 7, createdAt: created, updatedAt: now },
  { id: 'c-3', name: 'Kuchnia', itemCount: 9, createdAt: created, updatedAt: now },
  { id: 'c-4', name: 'Książki', itemCount: 23, createdAt: created, updatedAt: now },
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

const drill = {
  ...items[0],
  description:
    'Wiertarka udarowa Bosch GSB 13 RE, 600 W. Walizka, komplet wierteł do betonu i drewna, zapasowy uchwyt boczny. Przechowywana w piwnicy, na regale przy warsztacie.',
  additionalImages: ['wiertarka-walizka.jpg', 'wiertarka-wiertla.jpg'],
};

const users = [
  { id: 'u-1', username: 'kasia', createdAt: created },
  { id: 'u-2', username: 'piotr', createdAt: created },
  { id: 'u-3', username: 'mama', createdAt: now },
  { id: 'u-4', username: 'tata', createdAt: now },
];

/** `/` — the catalog. src/app/page.tsx. */
export const HomePage = () => (
  <AppLayout user={kasia}>
    <ItemsCatalog initialCategories={categories} initialItems={items} />
  </AppLayout>
);

/** `/categories` — category management. src/app/categories/page.tsx. */
export const CategoriesPage = () => (
  <AppLayout user={kasia}>
    <CategoriesManager initialCategories={categories} />
  </AppLayout>
);

/** `/users` — household members. src/app/users/page.tsx. */
export const UsersPage = () => (
  <AppLayout user={kasia}>
    <UsersManager initialUsers={users} currentUserId="u-1" />
  </AppLayout>
);

/** `/items/[id]` — a single item. src/app/items/[id]/page.tsx. */
export const ItemPage = () => (
  <AppLayout user={kasia}>
    <ItemDetailView item={drill} />
  </AppLayout>
);

/** `/items/new` — adding an item. src/app/items/new/page.tsx. */
export const AddItemPage = () => (
  <AppLayout user={piotr}>
    <NewItemForm categories={categories} />
  </AppLayout>
);

/** `/items/[id]/edit` — editing an item. src/app/items/[id]/edit/page.tsx. */
export const EditItemPage = () => (
  <AppLayout user={piotr}>
    <EditItemForm item={drill} categories={categories} />
  </AppLayout>
);
