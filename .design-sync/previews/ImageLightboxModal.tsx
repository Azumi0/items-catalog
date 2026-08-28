import { ImageLightboxModal } from 'home-item-catalog';

const noop = () => {};

/**
 * The viewer open on the second of three photos, so the counter and both
 * navigation arrows are visible.
 */
export const Open = () => (
  <ImageLightboxModal
    opened
    onClose={noop}
    images={['wiertarka.jpg', 'wiertarka-walizka.jpg', 'wiertarka-wiertla.jpg']}
    initialIndex={1}
    title="Wiertarka udarowa Bosch GSB 13 RE"
  />
);

/** A single photo: no navigation arrows, no counter. */
export const SingleImage = () => (
  <ImageLightboxModal
    opened
    onClose={noop}
    images={['sokowirowka.jpg']}
    title="Sokowirówka Philips"
  />
);
