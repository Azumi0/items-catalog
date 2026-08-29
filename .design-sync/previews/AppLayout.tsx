// AppLayout is where the app's pages live as previews. Every route is
// `AppLayout` wrapping exactly one screen component, and the shell's top bar
// is sticky while its bottom bar is fixed — so a page composition escapes a
// grid cell and can only be presented as a single card
// (cfg.overrides.AppLayout). Keeping all of them inside this one component
// leaves every other card free to show its own component's states in the
// normal grid; each page here stays addressable as ?story=<CellName>.

import {
  AppLayout,
  CategoriesManager,
  CategoryForm,
  CategoryItemsList,
  CategoryTiles,
  ItemDetailView,
  ItemForm,
  PasswordForm,
  UserForm,
  UsersManager,
} from 'home-item-catalog';

const created = new Date('2026-01-12T09:15:00Z');
const now = new Date('2026-03-14T10:20:00Z');

const kasia = { id: 'u-1', username: 'kasia' };
const piotr = { id: 'u-2', username: 'piotr' };

const cat = (
  id: string,
  name: string,
  icon: string | null,
  mainImage: string | null,
  itemCount: number,
  newestItemImage: string | null,
) => ({ id, name, icon, mainImage, itemCount, newestItemImage, createdAt: created, updatedAt: now });

const categories = [
  cat('c-1', 'Elektronika', 'IconDeviceLaptop', null, 12, 'laptop.jpg'),
  cat('c-2', 'Narzędzia', null, 'narzedzia-hero.jpg', 7, 'wiertarka.jpg'),
  cat('c-3', 'Książki', null, null, 23, 'atlas.jpg'),
  cat('c-4', 'Kuchnia', 'IconToolsKitchen2', null, 9, null),
  cat('c-5', 'Ogród', null, null, 1, null),
  cat('c-6', 'Sport', null, null, 0, null),
];

const item = (id: string, description: string, createdByName: string, day: number) => ({
  id,
  categoryId: 'c-2',
  categoryName: 'Narzędzia',
  description,
  mainImage: `${id}.jpg`,
  additionalImages: [] as string[],
  createdById: 'u-1',
  createdByName,
  createdAt: new Date(2026, 2, day),
  updatedAt: now,
});

const items = [
  item('i-1', 'Wiertarka udarowa Bosch GSB 13 RE, walizka i komplet wierteł do betonu', 'piotr', 28),
  item('i-2', 'Klucze nasadowe 1/2", zestaw 24 szt. w walizce', 'kasia', 19),
  item('i-3', 'Kosiarka spalinowa NAC, kanister na paliwo i zapasowe noże', 'kasia', 11),
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
];

/** `/` — the category tiles. src/app/page.tsx. */
export const HomePage = () => (
  <AppLayout user={kasia} title="Katalog" subtitle="Wybierz kategorię" tab="catalog">
    <CategoryTiles categories={categories} />
  </AppLayout>
);

/** `/categories/[id]/items` — one category's items. Back goes to the tiles. */
export const CategoryItemsPage = () => (
  <AppLayout
    user={kasia}
    title="Narzędzia"
    subtitle="7 przedmiotów"
    backHref="/"
    tab="catalog"
    fabHref="/items/new?categoryId=c-2"
  >
    <CategoryItemsList items={items} />
  </AppLayout>
);

/** `/items/[id]` — a single item. src/app/items/[id]/page.tsx. */
export const ItemPage = () => (
  <AppLayout user={kasia} title="Przedmiot" subtitle="28.03.2026" backHref="/categories/c-2/items" tab="catalog">
    <ItemDetailView item={drill} />
  </AppLayout>
);

/** `/categories` — category management. src/app/categories/page.tsx. */
export const CategoriesPage = () => (
  <AppLayout user={kasia} title="Kategorie" subtitle="Zarządzanie kategoriami" tab="categories">
    <CategoriesManager initialCategories={categories} />
  </AppLayout>
);

/** `/users` — household members. src/app/users/page.tsx. */
export const UsersPage = () => (
  <AppLayout user={kasia} title="Użytkownicy" subtitle="Zarządzanie dostępem" tab="users">
    <UsersManager initialUsers={users} currentUserId="u-1" />
  </AppLayout>
);

/** `/items/new` — a form screen: no bottom bar, no FAB. */
export const AddItemPage = () => (
  <AppLayout
    user={piotr}
    title="Nowy przedmiot"
    subtitle="Narzędzia"
    backHref="/categories/c-2/items"
    tab="catalog"
    chrome={false}
  >
    <ItemForm categories={categories} initialCategoryId="c-2" />
  </AppLayout>
);

/** `/categories/new` — name, icon grid, picture. */
export const NewCategoryPage = () => (
  <AppLayout
    user={kasia}
    title="Nowa kategoria"
    subtitle="Nazwa, ikona lub zdjęcie"
    backHref="/categories"
    tab="categories"
    chrome={false}
  >
    <CategoryForm />
  </AppLayout>
);

/** `/users/new` — a login and its first password. */
export const NewUserPage = () => (
  <AppLayout
    user={kasia}
    title="Nowy użytkownik"
    subtitle="Login i hasło początkowe"
    backHref="/users"
    tab="users"
    chrome={false}
  >
    <UserForm />
  </AppLayout>
);

/** `/users/[id]/password` — one field, over a note saying whose. */
export const ChangePasswordPage = () => (
  <AppLayout
    user={kasia}
    title="Zmiana hasła"
    subtitle="piotr"
    backHref="/users"
    tab="users"
    chrome={false}
  >
    <PasswordForm user={{ id: 'u-2', username: 'piotr' }} />
  </AppLayout>
);
