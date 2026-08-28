---
category: Layout
---

# AppLayout

The application shell every authenticated page renders inside: a fixed header
with the "Katalog Domowy" brand, desktop navigation, a light/dark toggle, the
signed-in username and a logout button — plus a burger-triggered `Drawer` for
the navigation on small screens. Page content goes in `children`, inside a
`Container`.

Every page in the app is `AppLayout` wrapping exactly one screen component, so
a full-page design is built the same way:

```jsx
<AppLayout user={{ id: 'u-1', username: 'kasia' }}>
  <ItemsCatalog initialCategories={categories} initialItems={items} />
</AppLayout>
```

The nav highlights the current route via `usePathname()`. In a design that hook
returns `/`, so the "Katalog" entry renders active — build alternate-page
designs knowing the active marker stays on the first entry.

Every page of the app is previewed on this component, one story each:
`HomePage`, `CategoriesPage`, `UsersPage`, `ItemPage`, `AddItemPage` and
`EditItemPage`. The shell's header is fixed-positioned, so the card shows one
page at a time; the rest are addressable individually.

The interface is Polish throughout; keep new copy in Polish.
