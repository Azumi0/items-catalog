import { EditItemForm } from 'home-item-catalog';

const created = new Date('2025-12-06T11:30:00Z');
const updated = new Date('2026-03-02T14:10:00Z');

const categories = [
  { id: 'c-1', name: 'Elektronika', itemCount: 12, createdAt: created, updatedAt: updated },
  { id: 'c-2', name: 'Narzędzia', itemCount: 7, createdAt: created, updatedAt: updated },
  { id: 'c-3', name: 'Kuchnia', itemCount: 9, createdAt: created, updatedAt: updated },
];

const drill = {
  id: 'i-1',
  categoryId: 'c-2',
  categoryName: 'Narzędzia',
  description:
    'Wiertarka udarowa Bosch GSB 13 RE, 600 W. Walizka, komplet wierteł do betonu i drewna, zapasowy uchwyt boczny.',
  mainImage: 'wiertarka.jpg',
  additionalImages: ['wiertarka-walizka.jpg'],
  createdById: 'u-2',
  createdByName: 'piotr',
  createdAt: created,
  updatedAt: updated,
};

/** The edit form pre-filled from an existing item, with its photos shown as replaceable. */
export const EditItem = () => (
  <EditItemForm item={drill} categories={categories} />
);

/** Editing an item that was catalogued without a description. */
export const WithoutDescription = () => (
  <EditItemForm
    item={{ ...drill, description: null, additionalImages: [] }}
    categories={categories}
  />
);
