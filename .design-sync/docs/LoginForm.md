---
category: Auth
---

# LoginForm

The sign-in form: login, password, a 52px full-width submit button and an
inline `Alert` for a failed attempt. Fields are 52px with 16px text — under
16px, iOS Safari zooms the page when a field takes focus.

It is only the form; `AuthScreen` supplies the logo, title and column:

```jsx
<AuthScreen title="Katalog Domowy" subtitle="Zaloguj się, żeby przeglądać i dodawać przedmioty.">
  <LoginForm />
</AuthScreen>
```

Takes no props. It renders outside `AppLayout` — a signed-out visitor has no
navigation, no tab and no user to name.
