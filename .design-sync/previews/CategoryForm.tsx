import { CategoryForm } from 'home-item-catalog';

/** `/categories/new` — name, the optional icon grid, the optional picture. */
export const Create = () => <CategoryForm />;

/** `/categories/[id]/edit` — the same form with an icon already chosen. */
export const Edit = () => (
  <CategoryForm
    category={{ id: 'c-1', name: 'Elektronika', icon: 'IconDeviceLaptop', mainImage: null }}
  />
);
