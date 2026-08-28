---
category: Management
---

# UsersManager

The household-member screen: a table of users with a "to Ty" badge on the
signed-in row, an "add user" form, and per-row change-password and delete
actions. The delete button is disabled on the current user's own row, labelled
"Nie możesz usunąć samego siebie" — pass `currentUserId` matching one of the
rows so a design shows that state.

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
