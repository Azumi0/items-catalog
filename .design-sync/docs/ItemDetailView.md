---
category: Catalog
---

# ItemDetailView

The single-item screen behind `/items/<id>`: the main photo with a thumbnail
strip, the category badge, description, author snapshot and timestamps, plus
edit and delete actions. Clicking a photo opens `ImageLightboxModal` for the
zoomable full-size view — that wiring is internal, so a design gets it for free.

```jsx
<ItemDetailView item={{
  id: 'i-1', categoryId: 'c-1', categoryName: 'Narzędzia',
  description: 'Wiertarka udarowa Bosch, walizka i komplet wierteł',
  mainImage: 'wiertarka.jpg', additionalImages: ['wiertarka-2.jpg'],
  createdById: 'u-1', createdByName: 'kasia',
  createdAt: new Date(), updatedAt: new Date(),
}} />
```

Delete opens a confirmation modal. In a design the underlying action is a
no-op: the modal closes and a success notification appears, but nothing is
removed.
