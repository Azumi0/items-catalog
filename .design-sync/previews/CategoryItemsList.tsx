import { CategoryItemsList } from 'home-item-catalog';

const now = new Date('2026-03-14T10:20:00Z');

const item = (id: string, description: string, createdByName: string, day: number) => ({
  id,
  categoryId: 'c-2',
  categoryName: 'Narzędzia',
  description,
  mainImage: `${id}.jpg`,
  additionalImages: [],
  createdById: 'u-1',
  createdByName,
  createdAt: new Date(2026, 2, day),
  updatedAt: now,
});

const items = [
  item('i-1', 'Wiertarka udarowa Bosch GSB 13 RE, walizka i komplet wierteł do betonu', 'piotr', 28),
  item('i-2', 'Klucze nasadowe 1/2", zestaw 24 szt. w walizce', 'kasia', 19),
  item('i-3', 'Kosiarka spalinowa NAC, kanister na paliwo i zapasowe noże', 'kasia', 11),
  item('i-4', 'Szlifierka kątowa 125 mm, tarcze do metalu i kamienia', 'piotr', 5),
];

/** The items of one category, under the search field and the sort control. */
export const Items = () => <CategoryItemsList items={items} />;

/** A single item — the grid collapses to one column below 260px of width. */
export const OneItem = () => <CategoryItemsList items={[items[0]]} />;

/** Nothing matches, or the category is empty. */
export const Empty = () => <CategoryItemsList items={[]} />;
