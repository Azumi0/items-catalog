import { CategoryVisual } from 'home-item-catalog';

const created = new Date("2026-01-12T09:15:00Z");
const now = new Date("2026-03-14T10:20:00Z");

const cat = (
  id: string,
  name: string,
  icon: string | null,
  mainImage: string | null,
  itemCount: number,
  firstItemImage: string | null,
) => ({ id, name, icon, mainImage, itemCount, firstItemImage, createdAt: created, updatedAt: now });

const categories = [
  cat("c-1", "Elektronika", "IconDeviceLaptop", null, 12, "laptop.jpg"),
  cat("c-2", "Narzędzia", null, "narzedzia-hero.jpg", 7, "wiertarka.jpg"),
  cat("c-3", "Książki", null, null, 23, "atlas.jpg"),
  cat("c-4", "Kuchnia", "IconToolsKitchen2", null, 9, null),
  cat("c-5", "Ogród", null, null, 1, null),
  cat("c-6", "Sport", null, null, 0, null),
];

const Row = ({ variant }: { variant: 'tile' | 'thumb' }) => (
  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', width: variant === 'tile' ? 640 : undefined }}>
    {[categories[1], categories[0], categories[2], categories[5]].map((c) => (
      <div key={c.id} style={{ width: variant === 'tile' ? 150 : 52 }}>
        <CategoryVisual category={c} variant={variant} />
      </div>
    ))}
  </div>
);

/** Tile size — the square media area of a catalog tile. */
export const Tile = () => <Row variant="tile" />;

/** Thumb size — the 52px square in a management card. */
export const Thumb = () => <Row variant="thumb" />;
