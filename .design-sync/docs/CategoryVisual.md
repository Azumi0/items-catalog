---
category: Catalog
---

# CategoryVisual

The one place the category fallback becomes pixels. Given a category it picks,
in order:

1. `mainImage` — the picture chosen for the category, `object-fit: cover`;
2. `icon` — a Tabler glyph, teal on `teal-light` (in `tile` size, inside a
   64px circle the colour of the page);
3. `firstItemImage` — the newest item's picture, borrowed;
4. nothing — the first letter of the name as a monogram.

Both image arms carry a stored **filename**, not a URL; the component resolves
it through `thumbUrl()`. Use `variant="tile"` for the square media area of a
catalog tile and `variant="thumb"` for the 52px square in a management card.

```jsx
<CategoryVisual
  category={{ name: 'Elektronika', icon: 'IconDeviceLaptop', mainImage: null, firstItemImage: null }}
  variant="tile"
/>
```
