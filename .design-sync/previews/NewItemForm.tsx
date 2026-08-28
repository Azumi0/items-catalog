import { NewItemForm } from 'home-item-catalog';

const now = new Date('2026-03-14T10:20:00Z');

const categories = [
  { id: 'c-1', name: 'Elektronika', itemCount: 12, createdAt: now, updatedAt: now },
  { id: 'c-2', name: 'Narzędzia', itemCount: 7, createdAt: now, updatedAt: now },
  { id: 'c-3', name: 'Kuchnia', itemCount: 9, createdAt: now, updatedAt: now },
  { id: 'c-4', name: 'Książki', itemCount: 23, createdAt: now, updatedAt: now },
];

/** The empty add-item form: category, description and both photo dropzones. */
export const AddItem = () => <NewItemForm categories={categories} />;

/** Before any category exists — the Select has nothing to offer yet. */
export const NoCategoriesYet = () => <NewItemForm categories={[]} />;
