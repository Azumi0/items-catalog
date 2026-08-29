---
category: Management
---

# UsersManager

The household-member screen: a card per account on
`repeat(auto-fill, minmax(320px, 1fr))` — a 52px monogram circle, the login
with a "To Ty" pill on the signed-in row, `"dołączył(a) dd.MM.yyyy"`, and two
44×44 actions. The key links to that account's password screen; the bin opens
a `ConfirmSheet`.

The bin is disabled on the signed-in row ("Nie możesz usunąć samego siebie")
and on the last remaining account ("Nie można usunąć jedynego konta w
systemie"), with the reason in both `aria-label` and `title`. Pass
`currentUserId` matching one of the rows so a design shows the first state,
and a single-row list for the second.

```jsx
<UsersManager
  currentUserId="u-1"
  initialUsers={[
    { id: 'u-1', username: 'kasia', createdAt: new Date() },
    { id: 'u-2', username: 'piotr', createdAt: new Date() },
  ]}
/>
```

`initialUsers` never carries `passwordHash` — the page strips it before the
component sees it, so a design should pass `id`, `username` and `createdAt`
only.
