import { ItemDetailView } from 'home-item-catalog';

const created = new Date('2025-12-06T11:30:00Z');
const updated = new Date('2026-03-02T14:10:00Z');

const drill = {
  id: 'i-1',
  categoryId: 'c-2',
  categoryName: 'Narzędzia',
  description:
    'Wiertarka udarowa Bosch GSB 13 RE, 600 W. Walizka, komplet wierteł do betonu i drewna, zapasowy uchwyt boczny. Przechowywana w piwnicy, na regale przy warsztacie.',
  mainImage: 'wiertarka.jpg',
  additionalImages: ['wiertarka-walizka.jpg', 'wiertarka-wiertla.jpg'],
  createdById: 'u-2',
  createdByName: 'piotr',
  createdAt: created,
  updatedAt: updated,
};

/** An item with several photos: main image, thumbnail strip, metadata and actions. */
export const ItemWithPhotos = () => <ItemDetailView item={drill} />;

/** An item with one photo and no description — the sparsest record the catalog allows. */
export const MinimalItem = () => (
  <ItemDetailView
    item={{
      ...drill,
      id: 'i-9',
      categoryId: 'c-3',
      categoryName: 'Kuchnia',
      description: null,
      mainImage: 'sokowirowka.jpg',
      additionalImages: [],
      createdByName: 'kasia',
    }}
  />
);
