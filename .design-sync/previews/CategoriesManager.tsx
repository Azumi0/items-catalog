import { CategoriesManager } from 'home-item-catalog';

const created = new Date('2025-11-02T09:15:00Z');
const updated = new Date('2026-02-27T16:40:00Z');

const categories = [
  { id: 'c-1', name: 'Elektronika', itemCount: 12, createdAt: created, updatedAt: updated },
  { id: 'c-2', name: 'Narzędzia', itemCount: 7, createdAt: created, updatedAt: updated },
  { id: 'c-3', name: 'Kuchnia', itemCount: 9, createdAt: created, updatedAt: updated },
  { id: 'c-4', name: 'Książki', itemCount: 23, createdAt: created, updatedAt: updated },
  { id: 'c-5', name: 'Ogród', itemCount: 4, createdAt: created, updatedAt: updated },
];

/** The category table with item counts and per-row actions. */
export const Categories = () => (
  <CategoriesManager initialCategories={categories} />
);

/** The empty state a household sees before defining any category. */
export const NoCategories = () => <CategoriesManager initialCategories={[]} />;
