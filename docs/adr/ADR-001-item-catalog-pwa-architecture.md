# ADR-001: Architektura, Model Danych i Wdrożenie Aplikacji Katalogu Przedmiotów (PWA) na Synology NAS

* **Status:** Zaakceptowany (Accepted)
* **Data:** 2026-08-16
* **Autor:** Przemysław Wrzeszcz & Grilling Agent

---

## 1. Kontekst i Wymagania Biznesowe

Celem projektu jest stworzenie samohostowanej, domowej aplikacji typu PWA (Progressive Web App) do ewidencjonowania przedmiotów i zarządzania domowym inwentarzem. Aplikacja ma działać w środowisku kontenerowym Docker (Synology Container Manager) na serwerze Synology NAS, wykorzystywać lokalny podmontowany zasób dyskowy do przechowywania bazy danych i plików graficznych oraz gwarantować płynne działanie na urządzeniach mobilnych i desktopowych.

### Główne Założenia Funkcjonalne:
1. **PWA & Responsive UI:** Dostęp mobilny w trybie standalone, responsywny interfejs oparty na Mantine UI v7 z obsługą motywów Light/Dark.
2. **Onboarding & Autoryzacja:** Automatyczne wykrywanie pustej bazy i przekierowanie na ekran rejestracji pierwszego administratora (`/setup`). Brak wielopoziomowych ról – płaski model uprawnień (każdy zalogowany użytkownik ma pełne prawa).
3. **Zarządzanie Użytkownikami:** Prosty panel CRUD (login, hasło) z twardymi blokadami przed samousunięciem oraz usunięciem ostatniego konta.
4. **Zarządzanie Kategoriami:** CRUD kategorii z kaskadowym usuwaniem przypisanych przedmiotów i powiązanych plików z dysku NAS (po potwierdzeniu w modalu ostrzegawczym).
5. **Katalog Przedmiotów:**
   * Lista filtrowana po kategorii z wyszukiwarką live search (po opisie) i sortowaniem chronologicznym.
   * Kafelki listy wykorzystujące zoptymalizowane miniaturki.
   * Dedykowane podstrony dla tworzenia (`/items/new`) oraz edycji (`/items/[id]/edit`).
   * Widok szczegółów przedmiotu (`/items/[id]`) z podglądem w pełnej rozdzielczości, galerią zdjęć (lightbox), metadanymi autora i akcjami edycji/usunięcia.
6. **Magazyn Danych i Plików:** Wszystkie dane (baza SQLite oraz katalogi ze zdjęciami) przechowywane na podmontowanym wolumenie `/data`.

---

## 2. Decyzje Architektoniczne

### 2.1. Framework i Warstwa Frontendowa
* **Decyzja:** Next.js (App Router, TypeScript, React 19/18) w trybie `output: 'standalone'` w połączeniu z Mantine UI v7 (`@mantine/core`, `@mantine/hooks`, `@mantine/notifications`, `@tabler/icons-react`).
* **Uzasadnienie:** Mantine UI v7 oferuje kompletny, responsywny zestaw komponentów z wbudowanym systemem motywów i powiadomień. App Router w Next.js umożliwia ścisłą integrację Server Actions z autoryzowanymi Route Handlerami.
* **PWA:** Implementacja Web App Manifest (`manifest.json`), meta tagów `apple-touch-icon` oraz `display: standalone`. Rezygnacja z Service Workera offline ze względu na pełną zależność danych od lokalnego NAS.

### 2.2. Baza Danych i ORM
* **Decyzja:** SQLite (`better-sqlite3`) zarządzana przez **Drizzle ORM** (`drizzle-kit`).
* **Uzasadnienie:**
  * Drizzle ORM jest niezwykle lekki, w pełni typowany i nie wymaga uruchamiania ciężkich silników binarnych w kontenerze Alpine (w przeciwieństwie do Prisma).
  * Plik bazy danych umieszczony na wolumenie: `/data/app.db`.
  * Automatyczne uruchamianie migracji / inicjalizacji schematu przy starcie kontenera za pomocą dedykowanego skryptu startowego.

### 2.3. Autoryzacja i Zarządzanie Sesją
* **Decyzja:** Szyfrowane ciasteczka sesyjne `httpOnly` (`iron-session`) oraz haszowanie haseł za pomocą `bcryptjs` / `argon2`.
* **Uzasadnienie:**
  * Brak zależności od zewnętrznych serwisów OAuth i ciężkich bibliotek autoryzacyjnych.
  * Pełna kontrola nad logiką przekierowania na `/setup`, gdy liczba użytkowników w bazie wynosi `0`.
  * Zabezpieczenie przed atakami XSS dzięki flagom `httpOnly`, `SameSite=Lax` i szyfrowaniu zawartości ciasteczka.

### 2.4. Przetwarzanie Mediów i Serwowanie Zdjęć
* **Decyzja:**
  * Zapis plików oryginalnych w niezmienionej postaci w `/data/uploads/originals/`.
  * Generowanie zoptymalizowanych miniaturek WebP (np. max 400x400 px) do katalogu `/data/uploads/thumbs/` przy użyciu biblioteki `sharp`.
  * Serwowanie zdjęć przez autoryzowany Route Handler `/api/images/[type]/[filename]`, weryfikujący aktywną sesję użytkownika.
  * Twarde czyszczenie fizycznych plików z dysku (`fs.unlink`) przy usuwaniu przedmiotu, kaskadzie kategorii lub podmianie zdjęć w edycji.
* **Uzasadnienie:** Gwarantuje bezpieczeństwo prywatnych zdjęć (dostęp tylko po zalogowaniu), oszczędza transfer i przyspiesza renderowanie listy na telefonach (miniaturki), jednocześnie zachowując oryginalną jakość detali w widoku głównym.

### 2.5. Konteneryzacja i Specyfika Synology NAS
* **Decyzja:**
  * Multi-stage `Dockerfile` oparty o `node:20-alpine`.
  * Skrypt `entrypoint.sh` obsługujący zmienne środowiskowe `PUID` i `PGID`.
  * Automatyczne dostosowanie uprawnień katalogu `/data` (`chown -R $PUID:$PGID /data`) przed uruchomieniem aplikacji.
  * Gotowy plik `docker-compose.yml` do natychmiastowego wdrożenia w Synology Container Manager.
* **Uzasadnienie:** Eliminuje powszechny problem `Permission Denied` (EACCES) wynikający z różnic UID/GID między kontenerem a systemem DSM Synology.

---

## 3. Schemat Bazy Danych (Drizzle ORM)

```typescript
// users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// categories table
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// items table
export const items = sqliteTable('items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  categoryId: text('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  description: text('description'),
  mainImage: text('main_image').notNull(), // nazwa pliku w uploads
  additionalImages: text('additional_images', { mode: 'json' }).$type<string[]>().notNull().$defaultFn(() => []),
  createdById: text('created_by_id').references(() => users.id, { onDelete: 'set null' }),
  createdByName: text('created_by_name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});
```

---

## 4. Konsekwencje i Korzyści

* **Wydajność:** Lekki obraz kontenera, minimalne zużycie RAM-u (poniżej 150 MB), natychmiastowe ładowanie miniaturek WebP.
* **Bezpieczeństwo:** Izolacja mediów, brak publicznego dostępu do plików bez aktywnej sesji, odporność na błędy uprawnień DSM.
* **Utrzymanie:** Całość danych zamknięta w jednym podmontowanym folderze `/data` (kopia zapasowa sprowadza się do backupu jednego katalogu przez Hyper Backup na Synology).