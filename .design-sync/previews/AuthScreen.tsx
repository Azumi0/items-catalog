import { AuthScreen, LoginForm, SetupForm } from 'home-item-catalog';

// The shell is only ever seen with one of the two forms inside it, so the
// stories show it that way rather than with stand-in content.

/** `/login` — the shell around the sign-in form. */
export const Login = () => (
  <AuthScreen
    title="Katalog Domowy"
    subtitle="Zaloguj się, żeby przeglądać i dodawać przedmioty."
  >
    <LoginForm />
  </AuthScreen>
);

/** `/setup` — the same shell, first-run wording, three fields. */
export const Setup = () => (
  <AuthScreen
    title="Konfiguracja katalogu"
    subtitle="Utwórz pierwsze konto, żeby zacząć spisywać rzeczy w domu."
  >
    <SetupForm />
  </AuthScreen>
);
