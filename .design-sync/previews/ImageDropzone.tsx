import { ImageDropzone } from 'home-item-catalog';

const noop = () => {};

/** The main-photo zone as ItemForm shows it — the camera glyph, 180px tall. */
export const MainPhoto = () => (
  <ImageDropzone
    onDrop={noop}
    idleIcon="camera"
    capture
    title="Zrób zdjęcie lub wybierz z galerii"
    hint="JPG, PNG — maks. 10 MB"
  />
);

/** The category picture zone: a caption, no title, 140px tall. */
export const CategoryPhoto = () => (
  <ImageDropzone
    onDrop={noop}
    idleIcon="photo"
    iconSize={28}
    minHeight={140}
    hint="Zdjęcie ma pierwszeństwo przed ikoną"
  />
);

/** The bare "+" square that sits in the additional-photos grid. */
export const AddTile = () => (
  <div style={{ width: 88 }}>
    <ImageDropzone onDrop={noop} idleIcon="plus" iconSize={22} variant="tile" />
  </div>
);

/** Disabled while a save is in flight. */
export const Disabled = () => (
  <ImageDropzone
    onDrop={noop}
    disabled
    idleIcon="camera"
    title="Trwa zapisywanie przedmiotu…"
    hint="Dodawanie zdjęć będzie możliwe po zapisaniu"
  />
);
