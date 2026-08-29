---
category: Catalog
---

# CategoryTiles

The catalog's entry screen. One square tile per category, each a link into
that category's items, laid out on `repeat(auto-fill, minmax(150px, 1fr))` —
two columns on a 390px phone, six or seven at the 1120px maximum, with no
breakpoint anywhere. Each tile's media area is `CategoryVisual`, so what it
shows follows the fallback rule; under it sit the name on one line and the
item count. An empty `categories` array renders the "no categories yet" state
instead of the grid.

```jsx
<CategoryTiles
  categories={[{
    id: 'c-1', name: 'Elektronika', icon: 'IconDeviceLaptop', mainImage: null,
    itemCount: 12, firstItemImage: 'laptop.jpg',
    createdAt: new Date(), updatedAt: new Date(),
  }]}
/>
```
