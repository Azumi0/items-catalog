---
category: Catalog
---

# ItemsCatalog

The home screen: a responsive grid of item cards over a filter bar — search by
description, a category `Select`, and a newest/oldest sort toggle. Filtering is
client-side over `initialItems`, so a design renders real results as soon as
the props carry data. Each card links to `/items/<id>` and shows the thumbnail,
category badge, description and author snapshot; an empty result set renders a
"nothing found" state instead of the grid.

```jsx
<ItemsCatalog
  initialCategories={[{ id: 'c-1', name: 'Elektronika', itemCount: 12, createdAt: new Date(), updatedAt: new Date() }]}
  initialItems={[{
    id: 'i-1', categoryId: 'c-1', categoryName: 'Elektronika',
    description: 'Wiertarka udarowa Bosch, walizka i komplet wierteł',
    mainImage: 'wiertarka.jpg', additionalImages: [],
    createdById: 'u-1', createdByName: 'kasia',
    createdAt: new Date(), updatedAt: new Date(),
  }]}
/>
```

Image filenames are resolved through the app's own image route, so a name that
does not exist on the server falls back to the built-in placeholder rather than
a broken image. Pass plain filenames, never URLs.
