# ADR-003: Autoryzacja Egzekwowana na Poziomie Strony (`requireAuthPage`)

* **Status:** Zaakceptowany (Accepted)
* **Data:** 2026-08-28
* **Autor:** Przemysław Wrzeszcz

---

## 1. Kontekst i Problem

Prompt założycielski (`docs/initial-prompt.md`, §3.1) wymaga:

> „Middleware / check sprawdzający liczbę kont w tabeli `users`. Jeśli w bazie jest 0 użytkowników, aplikacja **natychmiast** przekierowuje na `/setup`."

Implementacja rozkłada ten wymóg na dwie warstwy:

- `src/middleware.ts` — sprawdza wyłącznie **obecność** ciasteczka sesji i przekierowuje na `/login`. Nie odpytuje bazy.
- `src/lib/session.ts` → `requireAuthPage()` — sprawdza liczbę użytkowników (`getUserCount()`) i przekierowuje na `/setup`, a następnie weryfikuje sesję i przekierowuje na `/login`.

Middleware Next.js działa w środowisku Edge, które **nie ma dostępu do `better-sqlite3`** — natywny moduł nie da się tam załadować. Przeniesienie sprawdzenia liczby kont do middleware jest więc niewykonalne bez wprowadzenia dodatkowego kanału (ciasteczko-znacznik albo wewnętrzny endpoint), co oznaczałoby drugie źródło prawdy o stanie instalacji.

Skutkiem obecnego podziału jest to, że **`requireAuthPage()` jest jedynym realnym strażnikiem dostępu**. Middleware odsiewa tylko oczywiste przypadki braku ciasteczka. Strona, która pominie wywołanie `requireAuthPage()`, jest w praktyce publiczna — middleware przepuści każde żądanie z jakimkolwiek ciasteczkiem sesji, nawet nieważnym, ponieważ nie deszyfruje go ani nie waliduje.

---

## 2. Rozważane Opcje

1. **Opcja A (Wybrana): Utrzymać sprawdzenie w warstwie strony i zapisać je jako twardy, udokumentowany inwariant.**
   - Jedno źródło prawdy (baza danych), brak stanu do zsynchronizowania.
   - Koszt: przekierowanie przy pustej bazie wykonuje dwa skoki (`/` → `/login` → `/setup`) zamiast jednego.

2. **Opcja B: Ciasteczko-znacznik `setup_complete` ustawiane przy tworzeniu pierwszego konta, czytane przez middleware.**
   - Daje przekierowanie „natychmiast", zgodne z dosłownym brzmieniem §3.1.
   - *Wady:* wprowadza drugie źródło prawdy, które może się rozjechać z bazą (przywrócenie kopii zapasowej `app.db`, wyczyszczenie ciasteczek w przeglądarce, dostęp z nowego urządzenia). Znacznik po stronie klienta jest sterowalny przez użytkownika, więc i tak nie może być traktowany jako źródło decyzji o dostępie — sprawdzenie w warstwie strony musiałoby zostać.

3. **Opcja C: Przeniesienie middleware na runtime Node.js.**
   - *Wady:* wymaga odpytania bazy przy każdym żądaniu, w tym o zasoby statyczne; kosztowne na NAS-ie i tak czy inaczej zdublowane z warstwą strony.

---

## 3. Podjęta Decyzja

Wybrano **Opcję A**. Obowiązuje inwariant:

> **Każdy `page.tsx` renderujący treść chronioną MUSI w pierwszej kolejności wywołać `await requireAuthPage()`.**

Wyjątki są zamknięte i wymienione z nazwy: `/login` oraz `/setup`. Wynikają one wprost z §3.1 promptu — muszą być osiągalne bez sesji, inaczej nie dałoby się utworzyć pierwszego konta ani zalogować.

Stan zgodności w chwili podjęcia decyzji — wszystkie sześć stron chronionych spełnia inwariant:

| Strona | Wywołuje `requireAuthPage()` |
| --- | --- |
| `src/app/page.tsx` | tak |
| `src/app/items/new/page.tsx` | tak |
| `src/app/items/[id]/page.tsx` | tak |
| `src/app/items/[id]/edit/page.tsx` | tak |
| `src/app/categories/page.tsx` | tak |
| `src/app/users/page.tsx` | tak |
| `src/app/login/page.tsx` | nie — publiczna z założenia |
| `src/app/setup/page.tsx` | nie — publiczna z założenia |

Analogicznie po stronie mutacji: **każda Server Action MUSI wywołać `requireAuth()`**, z wyjątkiem akcji z `src/app/actions/auth.ts` obsługujących samo logowanie i konfigurację pierwszego konta.

Rola `src/middleware.ts` jest świadomie ograniczona do taniej ścieżki szybkiej, która oszczędza renderowanie strony przy oczywistym braku ciasteczka. **Middleware nie jest granicą bezpieczeństwa** i nie wolno na nim polegać przy dodawaniu nowych tras.

---

## 4. Konsekwencje

### Pozytywne:
- Jedno źródło prawdy o stanie instalacji i o sesji — baza danych.
- Brak stanu po stronie klienta, który mógłby się rozjechać z bazą po odtworzeniu kopii zapasowej.
- Sprawdzenie działa w runtime Node.js, gdzie `better-sqlite3` jest dostępne.

### Negatywne / Koszty:
- Przekierowanie przy pustej bazie wykonuje dwa skoki zamiast jednego. Rozbieżność ze słowem „natychmiast" w §3.1 jest świadoma i zaakceptowana — dotyczy wyłącznie pierwszego uruchomienia instancji.
- Inwariant jest egzekwowany przez recenzję kodu i ten dokument, a nie przez typy czy lintera. Nowa strona bez `requireAuthPage()` nie zostanie odrzucona automatycznie — to najsłabszy punkt tej decyzji i pierwszy kandydat do automatyzacji, jeśli liczba tras urośnie.
