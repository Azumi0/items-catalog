import { ConfirmSheet } from 'home-item-catalog';

const noop = () => {};

/** Deleting a category takes its items and their photos with it. */
export const DeleteCategory = () => (
  <ConfirmSheet
    opened
    onClose={noop}
    onConfirm={noop}
    title="Usunąć kategorię?"
    message="Kategoria „Narzędzia” zniknie razem z 7 przedmiotów i ich zdjęciami. Tej operacji nie da się cofnąć."
  />
);

/** Deleting an account leaves what it added in the catalog. */
export const DeleteUser = () => (
  <ConfirmSheet
    opened
    onClose={noop}
    onConfirm={noop}
    title="Usunąć konto?"
    message="Konto „piotr” straci dostęp do katalogu. Dodane przez nie przedmioty zostaną w katalogu."
  />
);

/** Mid-request: both buttons lock and the confirm button spins. */
export const Deleting = () => (
  <ConfirmSheet
    opened
    loading
    onClose={noop}
    onConfirm={noop}
    title="Usunąć przedmiot?"
    message="Przedmiot zniknie z katalogu razem ze zdjęciami. Tej operacji nie da się cofnąć."
  />
);
