import { RemovableImage } from 'home-item-catalog';

const noop = () => {};

/** The item form's main photo: 4:3, with room for a bigger remove button. */
export const Hero = () => (
  <RemovableImage
    variant="hero"
    src="wiertarka.jpg"
    alt="Zdjęcie główne"
    removeLabel="Usuń zdjęcie główne"
    onRemove={noop}
  />
);

/** One cell of the additional-photos grid. */
export const Square = () => (
  <div style={{ width: 88 }}>
    <RemovableImage
      src="wiertarka-2.jpg"
      alt="Zdjęcie dodatkowe"
      removeLabel="Usuń zdjęcie"
      onRemove={noop}
    />
  </div>
);

/** The category picture, which sizes itself rather than a grid cell. */
export const Fixed = () => (
  <RemovableImage
    src="narzedzia-hero.jpg"
    alt="Zdjęcie kategorii"
    removeLabel="Usuń zdjęcie kategorii"
    onRemove={noop}
    w={140}
  />
);
