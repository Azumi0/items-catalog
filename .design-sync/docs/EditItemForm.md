---
category: Item forms
---

# EditItemForm

The edit screen behind `/items/<id>/edit`. Same shape as `NewItemForm` but
pre-filled from `item`, with the existing photos shown as replaceable
thumbnails and its dropzones in `compact` mode for the denser layout.

```jsx
<EditItemForm
  item={{
    id: 'i-1', categoryId: 'c-1', categoryName: 'Narzędzia',
    description: 'Wiertarka udarowa Bosch, walizka i komplet wierteł',
    mainImage: 'wiertarka.jpg', additionalImages: ['wiertarka-2.jpg'],
    createdById: 'u-1', createdByName: 'kasia',
    createdAt: new Date(), updatedAt: new Date(),
  }}
  categories={[{ id: 'c-1', name: 'Narzędzia', itemCount: 5, createdAt: new Date(), updatedAt: new Date() }]}
/>
```

`item.categoryId` must match one of `categories` or the `Select` opens with
nothing chosen.
