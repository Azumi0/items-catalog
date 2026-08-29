---
category: Layout
---

# AppLayout

The application shell every authenticated page renders inside.

**Top bar** (sticky, at least 60px): an optional back chevron, then the screen's
`title` on one line with `subtitle` under it — both truncating — and on the
right the signed-in user's name as a teal pill, the theme toggle and logout.
Header actions are 44×44.

**Bottom bar** (fixed, capped at 600px and centred): a pill holding the three
tabs — Katalog, Kategorie, Użytkownicy — with the 64px FAB **beside** it rather
than inside it. The FAB is contextual: its target and its `aria-label`/`title`
follow `tab` (Dodaj przedmiot / Nowa kategoria / Dodaj użytkownika). Pass
`fabHref` to redirect it, which the category items screen does so that adding
from inside a category prefills it.

Every page in the app is `AppLayout` wrapping exactly one screen component, so
a full-page design is built the same way:

```jsx
<AppLayout user={{ id: 'u-1', username: 'kasia' }} title="Katalog" subtitle="Wybierz kategorię" tab="catalog">
  <CategoryTiles categories={categories} />
</AppLayout>
```

Form screens pass `chrome={false}`: the bottom bar and the FAB are hidden,
because the form carries its own `FormActionBar` and a floating "+" over a
half-filled form is an invitation to lose it. The shell reserves the space
under whichever bar is showing.

Every page of the app is previewed on this component, one story each —
`HomePage`, `CategoryItemsPage`, `ItemPage`, `CategoriesPage`, `UsersPage`,
`AddItemPage`, `NewCategoryPage`, `NewUserPage`, `ChangePasswordPage`. The
bars are sticky and fixed, so the card shows one page at a time; the rest are
addressable individually.

The interface is Polish throughout; keep new copy in Polish.
