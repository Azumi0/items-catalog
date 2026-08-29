---
category: Catalog
---

# ItemDetailView

The single-item screen behind `/items/<id>`, as one 640px column: a 4:3 main
photo, a `minmax(72px, 1fr)` grid of the additional ones, the category as a
teal pill, the description at 16px, a bordered two-row metric box ("Dodał(a)",
"Data dodania"), and finally "Edytuj" beside a square 52px delete button.

Clicking the main photo or any thumbnail opens `ImageLightboxModal` at the
right index — index 0 is the main photo, so thumbnails start at 1. That wiring
is internal, so a design gets it for free.

```jsx
<ItemDetailView item={{
  id: 'i-1', categoryId: 'c-2', categoryName: 'Narzędzia',
  description: 'Wiertarka udarowa Bosch, walizka i komplet wierteł',
  mainImage: 'wiertarka.jpg', additionalImages: ['wiertarka-2.jpg'],
  createdById: 'u-1', createdByName: 'kasia',
  createdAt: new Date(), updatedAt: new Date(),
}} />
```

Delete opens a `ConfirmSheet`. In a design the underlying action is a no-op:
the sheet closes and a success notification appears, but nothing is removed.
