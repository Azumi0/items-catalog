---
category: Auth
---

# SetupForm

The first-run form that creates the first administrator: login, password,
"Powtórz hasło", a teal note explaining that further household members are
added from the Users tab, the primary button, and a text link back to sign-in
for anyone who lands here with accounts already in the database. An inline
`Alert` covers a mismatch. Reached only while the database has no users at all.

Like `LoginForm` it is the form alone — `AuthScreen` supplies the surroundings:

```jsx
<AuthScreen title="Konfiguracja katalogu" subtitle="Utwórz pierwsze konto, żeby zacząć spisywać rzeczy w domu.">
  <SetupForm />
</AuthScreen>
```

Takes no props, and renders outside `AppLayout`.
