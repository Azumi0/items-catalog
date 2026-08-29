import { EmptyState } from 'home-item-catalog';

/** The catalog before anything has been added. */
export const NoCategories = () => (
  <EmptyState
    title="Brak kategorii"
    message="Dodaj pierwszą kategorię przyciskiem „+”."
  />
);

/** A category whose search turned up nothing. */
export const NoItems = () => (
  <EmptyState
    title="Brak przedmiotów"
    message="Nie znaleziono przedmiotów spełniających kryteria."
  />
);
