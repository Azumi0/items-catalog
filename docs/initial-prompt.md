Jesteś starszym inżynierem Full-Stack i architektem systemów kontenerowych. Twoim zadaniem jest stworzenie kompletnej, gotowej do wdrożenia na produkcji aplikacji PWA do katalogowania przedmiotów domowych ("Home Item Catalog"), działającej w kontenerze Docker na Synology NAS.

Aplikacja musi zostać zaimplementowana w całości: bez pomijania kodu, bez komentarzy typu "// TODO: implement later", bez skrótów i z zachowaniem najwyższych standardów TypeScript, Next.js App Router i Mantine UI v7.

---

### 1. STACK TECHNOLOGICZNY I WYMAGANIA

- **Framework:** Next.js (App Router, TypeScript, React 19/18, `output: 'standalone'`).
- **UI Library:** Mantine UI v7 (`@mantine/core`, `@mantine/hooks`, `@mantine/notifications`, `@tabler/icons-react`, Mantine Emotion / PostCSS).
- **Baza Danych & ORM:** SQLite (`better-sqlite3`) z `Drizzle ORM` (`drizzle-kit`). Baza zlokalizowana w `/data/app.db`.
- **Przetwarzanie Obrazów:** Biblioteka `sharp` – zapis oryginałów w `/data/uploads/originals/` oraz generowanie zoptymalizowanych miniaturek WebP w `/data/uploads/thumbs/`.
- **Autoryzacja:** Szyfrowane ciasteczka `httpOnly` przez `iron-session`, haszowanie haseł za pomocą `bcryptjs`.
- **PWA:** Web App Manifest (`public/manifest.json`), meta tagi standalone, obsługa instalowalności.
- **Wdrożenie:** Multi-stage `Dockerfile` (Node 20 Alpine) + `entrypoint.sh` obsługujący zmienne `PUID`/`PGID` dla Synology DSM + `docker-compose.yml`.

---

### 2. ARCHITEKTURA DANYCH I STRUKTURA KATALOGÓW

Wolumen montowany w kontenerze pod ścieżką `/data`:

- `/data/app.db` - plik bazy danych SQLite
- `/data/uploads/originals/` - oryginalne pliki zdjęć
- `/data/uploads/thumbs/` - wygenerowane miniaturki WebP (max 400x400px)

#### Schemat Bazy Danych Drizzle (`src/db/schema.ts`):

1. `users`: `id` (UUID PK), `username` (text unique), `passwordHash` (text), `createdAt` (timestamp).
2. `categories`: `id` (UUID PK), `name` (text unique), `createdAt` (timestamp), `updatedAt` (timestamp).
3. `items`: `id` (UUID PK), `categoryId` (text references categories.id onDelete cascade), `description` (text nullable), `mainImage` (text filename), `additionalImages` (JSON array of strings), `createdById` (text references users.id), `createdByName` (text), `createdAt` (timestamp), `updatedAt` (timestamp).

---

### 3. REGUŁY BIZNESOWE I ZACHOWANIE APLIKACJI

1. **Onboarding / Setup:**

   - Middleware / check sprawdzający liczbę kont w tabeli `users`. Jeśli w bazie jest 0 użytkowników, aplikacja natychmiast przekierowuje na `/setup` (formularz rejestracji pierwszego administratora).
   - Jeśli istnieje co najmniej 1 użytkownik, wszystkie podstrony wymagają logowania (`/login`).
   - Płaski model uprawnień: każdy zalogowany użytkownik ma pełne uprawnienia do wszystkich funkcji.

2. **Zarządzanie Użytkownikami (`/users` lub dedykowany modal/panel):**

   - Dodawanie nowego użytkownika (login, hasło).
   - Zmiana hasła dla wybranego użytkownika.
   - Usuwanie użytkownika z twardymi blokadami:
     * Użytkownik nie może usunąć samego siebie.
     * Nie można usunąć ostatniego istniejącego konta w systemie.

3. **Zarządzanie Kategoriami:**

   - Dodawanie nowej kategorii.
   - Zmiana nazwy istniejącej kategorii.
   - Usuwanie kategorii: Wymaga modala potwierdzającego z ostrzeżeniem "Czy na pewno usunąć tę kategorię wraz ze wszystkimi przypisanymi do niej przedmiotami?". Po potwierdzeniu wykonywane jest usunięcie kaskadowe w bazie oraz FIZYCZNE USUNIĘCIE powiązanych plików (oryginałów i miniaturek) z dysku `/data/uploads`.

4. **Katalog Przedmiotów:**

   - **Widok Listy (`/`):**
     * Komponent wyboru kategorii (Tabs lub SegmentedControl / Select).
     * Pole wyszukiwania Live Search filtrujące przedmioty w czasie rzeczywistym po tekście opisu.
     * Przełącznik sortowania (Najnowsze / Najstarsze).
     * Siatka kafelków (Mantine SimpleGrid/Card) wykorzystująca miniaturki WebP.
     * Przycisk szybkiego dodawania nowego przedmiotu.
   - **Dodawanie Przedmiotu (`/items/new`):**
     * Dedykowana podstrona z formularzem: wybór kategorii, pole opisu (Textarea), pole uploadu zdjęcia głównego (Dropzone lub FileInput z podglądem), pole uploadu wielu zdjęć dodatkowych.
     * Zapis oryginałów i generowanie miniaturek przez `sharp`.
     * Automatyczne przypisanie nazwy aktualnie zalogowanego użytkownika jako autora.
   - **Szczegóły Przedmiotu (`/items/[id]`):**
     * Pełny podgląd zdjęcia głównego oraz galeria/lightbox dla zdjęć dodatkowych z opcją powiększania.
     * Wyświetlenie opisu, nazwy kategorii, autora oraz daty utworzenia/edycji.
     * Przyciski: "Edytuj" oraz "Usuń".
     * Usunięcie przedmiotu: modal potwierdzający, usunięcie rekordu z bazy oraz fizyczne skasowanie wszystkich powiązanych plików zdjęć z `/data/uploads`.
   - **Edycja Przedmiotu (`/items/[id]/edit`):**
     * Możliwość zmiany kategorii i opisu.
     * Możliwość podmiany zdjęcia głównego (usunięcie starego pliku z dysku).
     * Możliwość dodania nowych zdjęć lub usunięcia wybranych istniejących zdjęć dodatkowych (z fizycznym usunięciem skasowanych z dysku).

5. **Serwowanie Obrazów (`/api/images/[type]/[filename]`):**

   - Route Handler weryfikujący sesję użytkownika.
   - Jeśli brak aktywnej sesji -> status 401.
   - Jeśli plik istnieje w `/data/uploads/originals` lub `/data/uploads/thumbs` -> streamowanie z odpowiednim `Content-Type` i nagłówkami `Cache-Control: private, max-age=86400`.

6. **Interfejs Mantine UI & PWA:**

   - Responsywny layout `AppShell` (Header z logo, przełącznikiem motywu Dark/Light, informacją o zalogowanym użytkowniku, przyciskiem wylogowania oraz burger menu otwierającym Drawer na urządzeniach mobilnych).
   - Wdrożenie `@mantine/notifications` do obsługi komunikatów sukcesu/błędu po operacjach CRUD.
   - Konfiguracja `manifest.json` z ikonami, `theme_color`, `background_color` oraz `display: "standalone"`.

---

### 4. DOCKER, UPRAWNIENIA SYNOLOGY I ENTRYPOINT

Stwórz kompletne pliki konfiguracyjne dla Dockera:

1. **`entrypoint.sh`:**

   - Odczytuje zmienne `PUID` (domyślnie 1000) i `PGID` (domyślnie 1000).
   - Tworzy katalogi `/data/uploads/originals` i `/data/uploads/thumbs` jeśli nie istnieją.
   - Wykonuje `chown -R $PUID:$PGID /data` oraz `chmod -R 775 /data`.
   - Uruchamia migracje/inicjalizację schematu Drizzle (`node dist/migrate.js` lub `npx drizzle-kit push`).
   - Uruchamia właściwą aplikację Next.js (`exec su-exec nodejs node server.js` lub `exec node server.js`).

2. **`Dockerfile` (Multi-stage):**

   - `base`: `node:20-alpine`, instalacja `libc6-compat`, `su-exec`.
   - `deps`: instalacja zależności (w tym `better-sqlite3`, `sharp`).
   - `builder`: budowanie aplikacji Next.js (`output: 'standalone'`).
   - `runner`: minimalny obraz produkcyjny, kopiowanie plików standalone, kopiowanie `entrypoint.sh`, eksponowanie portu 3000.

3. **`docker-compose.yml`:**

   - Usługa `item-catalog`.
   - Mapowanie portu `3000:3000`.
   - Wolumen `./data:/data`.
   - Zmienne środowiskowe: `PUID=1026`, `PGID=100`, `NODE_ENV=production`, `SESSION_SECRET=super-tajny-losowy-klucz-minimum-32-znaki`.
   - Polityka restartu: `unless-stopped`.

---

### 5. STRUKTURA PLIKÓW PROJEKTU DO WYGENEROWANIA

Wygeneruj kompletny kod dla poniższych plików:

- `package.json` & `tsconfig.json`
- `next.config.mjs` (z włączonym `output: 'standalone'`)
- `postcss.config.cjs` (konfiguracja Mantine PostCSS)
- `drizzle.config.ts`
- `src/db/index.ts` & `src/db/schema.ts` & `src/db/migrate.ts`
- `src/lib/session.ts` (obsługa `iron-session`)
- `src/lib/storage.ts` (obsługa zapisu/usuwania plików i generowania miniaturek przez `sharp`)
- `src/app/layout.tsx` (MantineProvider, Notifications, Theme)
- `src/app/manifest.json/route.ts` lub `public/manifest.json`
- `src/app/login/page.tsx` & `src/app/setup/page.tsx`
- `src/app/page.tsx` (główny katalog, wybór kategorii, wyszukiwarka, siatka)
- `src/app/items/new/page.tsx` (formularz dodawania)
- `src/app/items/[id]/page.tsx` (szczegóły i galeria)
- `src/app/items/[id]/edit/page.tsx` (edycja)
- `src/app/users/page.tsx` (zarządzanie użytkownikami)
- `src/app/categories/page.tsx` (zarządzanie kategoriami)
- `src/app/api/images/[type]/[filename]/route.ts` (serwowanie zdjęć)
- `src/app/actions/...` (Server Actions dla autoryzacji, kategorii, przedmiotów i użytkowników)
- `Dockerfile`, `entrypoint.sh`, `docker-compose.yml`, `.dockerignore`

Wygeneruj pełny, w 100% działający kod bez żadnych uproszczeń.