import { ImageDropzone } from 'home-item-catalog';

const noop = () => {};

/** The main-photo zone as NewItemForm shows it. */
export const MainPhoto = () => (
  <ImageDropzone
    onDrop={noop}
    title="Przeciągnij zdjęcie główne lub kliknij, aby wybrać plik"
    hint="Obsługiwane formaty: PNG, JPEG, WebP, GIF, HEIC"
  />
);

/** The add-more zone, which uses the plus glyph instead of the photo one. */
export const AdditionalPhotos = () => (
  <ImageDropzone
    onDrop={noop}
    idleIcon="plus"
    title="Dodaj zdjęcia dodatkowe (przeciągnij lub kliknij)"
    hint="Możesz wybrać wiele plików jednocześnie"
  />
);

/** Compact mode: tighter spacing and smaller copy, used by the edit form. */
export const Compact = () => (
  <ImageDropzone
    onDrop={noop}
    compact
    title="Podmień zdjęcie główne (przeciągnij lub kliknij)"
    hint="Obsługiwane formaty: PNG, JPEG, WebP, GIF, HEIC"
  />
);

/** Disabled while an upload is in flight. */
export const Disabled = () => (
  <ImageDropzone
    onDrop={noop}
    disabled
    title="Trwa zapisywanie przedmiotu…"
    hint="Dodawanie zdjęć będzie możliwe po zapisaniu"
  />
);
