# Building with this design system

This is **Mantine 7** wearing the Katalog theme, plus the eighteen screen and
control components of the Home Item Catalog app. `window.HomeItemCatalog`
carries all of it — every `@mantine/core` component and hook,
`@mantine/notifications`, `@mantine/dropzone`, every `@tabler/icons-react`
icon, the app's `theme` object, and the eighteen components documented under
`components/`.

So you are not limited to those cards: reach for `Container`, `Paper`,
`Stack`, `Group`, `Card`, `Badge`, `Drawer`, `TextInput`, `Textarea`,
`Button`, `ActionIcon`, `UnstyledButton`, `SegmentedControl`, `Title`, `Text`
and any Tabler icon (`IconPlus`, `IconTrash`, …) directly from the same global.

## The app is mobile-first

Design the 390px column first; the desktop is the same code, wider. Two rules
carry most of it:

- **No breakpoints where `auto-fill` will do.** Every grid is
  `repeat(auto-fill, minmax(min(<n>px, 100%), 1fr))` — 150px for category
  tiles, 260px for item cards, 320px for management cards, 88px for photo
  squares, 72px for detail thumbnails. They reflow on width alone. The main
  column caps at 1120px, the bottom bar at 600px, forms and the item detail at
  640px, the auth screens at 420px.
- **Touch targets:** at least 44×44 for any action, 52px for primary buttons,
  fields and nav entries, 64px for the FAB. Form fields are 16px text — under
  16px, iOS Safari zooms the page when a field takes focus.

## Wrapping — required

Nothing is styled outside `MantineProvider`, and the teal brand comes from the
app's own `theme`. Both are on the global; always pass the theme, or you get
stock Mantine blue:

```jsx
const { MantineProvider, Notifications, theme, AppLayout } = window.HomeItemCatalog;

<MantineProvider theme={theme} defaultColorScheme="light">
  <Notifications position="top-right" zIndex={1000} />
  <AppLayout user={{ id: 'u-1', username: 'kasia' }}>{screen}</AppLayout>
</MantineProvider>
```

`Notifications` is only needed if something calls `notifications.show()` — the
management screens and every form do, on each create, rename and delete.

## Styling idiom — props and tokens, never utility classes

Mantine has **no utility-class vocabulary**. Do not invent one and do not write
bespoke class names: style through component props, and reach for CSS variables
only inside `style={{…}}`.

- **Spacing**: `p`, `px`, `py`, `m`, `mb`, `mt`, `gap` take scale tokens
  `xs | sm | md | lg | xl` or a number of px — `<Stack gap="md">`,
  `<Paper p={30}>`, `<Container py={80}>`.
- **Colour**: `c` for text, `bg` for background — `<Text c="dimmed">`. Named
  colours resolve through the theme, so `c="teal"` is the brand.
- **Surface**: `withBorder`, `shadow="md"`, `radius="md"` on `Paper` / `Card`.
- **Type**: `<Title order={2}>`, `size="sm"`, `fw={600}`, `ta="center"`.
- **Layout**: `Group` for a row (`justify="space-between"`, `align="center"`),
  `Stack` for a column, `maw` to bound width.
- **Tokens**, when a prop cannot express it:
  `var(--mantine-color-teal-filled)`, `var(--mantine-color-teal-light)`,
  `var(--mantine-primary-color-filled)`, `var(--mantine-spacing-md)`,
  `var(--mantine-radius-md)`, `var(--mantine-color-body)`.

The theme sets `primaryColor: 'teal'` and `defaultRadius: 'md'`, so an
unadorned `<Button>` is already teal with medium corners — do not restate it.
The font is the system UI stack; no webfont ships or is wanted.

Radii beyond the default: `radius="sm"` for thumbnails, `20` for the bottom
nav and the confirmation sheet, `999` for pills and chips, `'50%'` for the FAB
and avatars.

## Where the truth lives

`_ds/<folder>/styles.css` and its imports are the full compiled stylesheet
(Mantine core, notifications and dropzone) — read it before inventing a colour
or a scale. Per-component API and examples are in
`components/<group>/<Name>/<Name>.prompt.md` and `<Name>.d.ts`.

## Building a page

Every route in this app is `AppLayout` wrapping exactly one screen component,
and that is how to build a new one:

```jsx
const { AppLayout, CategoryTiles } = window.HomeItemCatalog;

<AppLayout user={{ id: 'u-1', username: 'kasia' }} title="Katalog" subtitle="Wybierz kategorię" tab="catalog">
  <CategoryTiles categories={categories} />
</AppLayout>
```

`title` and `subtitle` are the screen's context, `tab` lights a nav entry and
decides what the FAB does, and `backHref` adds the chevron on a nested screen.
A **form** screen passes `chrome={false}` and ends its `<form>` with
`FormActionBar` instead of relying on the FAB.

All nine existing pages are previewed on `AppLayout` as `HomePage`,
`CategoryItemsPage`, `ItemPage`, `CategoriesPage`, `UsersPage`, `AddItemPage`,
`NewCategoryPage`, `NewUserPage` and `ChangePasswordPage`. `LoginForm` and
`SetupForm` sit outside the shell, inside `AuthScreen`.

## Two things that do not work in a design, by construction

- **Writes are no-ops.** The screens' Server Actions are stubbed, so creating,
  renaming or deleting shows its notification and closes its modal but persists
  nothing. Design around the optimistic result, not around failure states.
- **Photos do not resolve.** Image props take stored filenames, never URLs, and
  the app's image route does not exist here. `ItemsCatalog` and
  `ItemDetailView` degrade to their own "Brak zdjęcia" placeholder; the
  lightbox and the edit form show alt text. That is the real fallback, not a
  bug to work around.

## Copy

The interface is **Polish** throughout ("Katalog Przedmiotów", "Dodaj
przedmiot", "Zarządzanie Kategoriami"). Write new copy in Polish.
