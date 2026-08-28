---
category: Management
---

# CategoriesManager

The category management screen: a table of categories with item counts and
creation dates, an "add category" form, and per-row edit and delete actions.
Delete warns that removing a category cascades to its items. With an empty
`initialCategories` it renders the "Brak zdefiniowanych kategorii w systemie."
empty state.

```jsx
<CategoriesManager
  initialCategories={[
    { id: 'c-1', name: 'Elektronika', itemCount: 12, createdAt: new Date(), updatedAt: new Date() },
    { id: 'c-2', name: 'Narzędzia', itemCount: 5, createdAt: new Date(), updatedAt: new Date() },
  ]}
/>
```

Its own page is `AppLayout` wrapping this component — compose it that way for a
full-screen design. Create, rename and delete are no-ops in a design; each one
still shows its notification and closes its modal.
