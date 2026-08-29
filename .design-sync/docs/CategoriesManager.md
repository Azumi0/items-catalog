---
category: Management
---

# CategoriesManager

The category management screen: a card per category on
`repeat(auto-fill, minmax(320px, 1fr))`, each showing its `CategoryVisual` as a
52px square, the name, `"N przedmiotów · utworzono dd.MM.yyyy"`, and two 44×44
actions. Edit is a link to the category's form screen; delete opens a
`ConfirmSheet` naming how many items go with it. With an empty
`initialCategories` it renders the "Brak kategorii" state.

```jsx
<CategoriesManager
  initialCategories={[{
    id: 'c-1', name: 'Elektronika', icon: 'IconDeviceLaptop', mainImage: null,
    itemCount: 12, newestItemImage: null,
    createdAt: new Date(), updatedAt: new Date(),
  }]}
/>
```

Its own page is `AppLayout` wrapping this component — compose it that way for a
full-screen design. Creating and renaming happen on `CategoryForm`, not here.
Delete is a no-op in a design; it still shows its notification and closes the
sheet.
