---
category: Auth
---

# AuthScreen

The shell behind `/login` and `/setup`: a 420px column centred vertically,
opening with a 64px `teal-light` square holding the app's box glyph, then a
24px/700 title and a dimmed subtitle. No app shell — there is no user yet to
name, no tab to be on and nothing to navigate back to.

```jsx
<AuthScreen title="Katalog Domowy" subtitle="Zaloguj się, żeby przeglądać i dodawać przedmioty.">
  <LoginForm />
</AuthScreen>
```
