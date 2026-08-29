---
category: Catalog
---

# CategoryItemsList

The items of one category, under a filter bar holding a 48px search field and
a Najnowsze/Najstarsze segmented control. Both filter and sort run client-side
over `items`, so a design renders real results as soon as the props carry
data.

There is deliberately **no category select**: the category was chosen by the
tile that led here, and the shell's back chevron changes it. Cards are a
horizontal row — an 88px thumbnail, a two-line description, then author and
date — on `minmax(260px, 1fr)`. An empty result renders "Brak przedmiotów".

```jsx
<CategoryItemsList
  items={[{
    id: 'i-1', categoryId: 'c-2', categoryName: 'Narzędzia',
    description: 'Wiertarka udarowa Bosch, walizka i komplet wierteł',
    mainImage: 'wiertarka.jpg', additionalImages: [],
    createdById: 'u-1', createdByName: 'piotr',
    createdAt: new Date(), updatedAt: new Date(),
  }]}
/>
```
