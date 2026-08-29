# Handoff: Katalog Domowy — redesign mobile-first

## Overview
Przebudowa aplikacji **items-catalog** (Next.js + Mantine 7, interfejs po polsku)
na podejście **mobile-first**. Zakres:

1. Kategorie zyskują własną ikonę lub zdjęcie główne, z regułą fallbacku do zdjęcia
   pierwszego przedmiotu.
2. Katalog staje się dwuekranowy: kafelki kategorii → lista przedmiotów (bez selecta
   kategorii w pasku wyszukiwania).
3. Tabele w zarządzaniu kategoriami i użytkownikami zastąpione listami kart;
   modale zastąpione ekranami pełnymi i bottom sheetami; nawigacja przeniesiona
   na dolny pasek z kontekstowym przyciskiem „+”.

## About the Design Files
Pliki w `design/` to **referencje projektowe napisane w HTML** (prototypy pokazujące
wygląd i zachowanie), a nie kod produkcyjny do wklejenia. Zadanie polega na
**odtworzeniu tych ekranów w istniejącym środowisku repo** — React 18 + Next.js App
Router + Mantine 7 + Tabler Icons, z zachowaniem obecnych wzorców (Server Actions,
`useActionRunner`, `notifications.show()`), a nie na przenoszeniu HTML-a.

Prototyp używa prawdziwego motywu aplikacji (teal, `defaultRadius: 'md'`) i prawdziwego
komponentu `ImageLightboxModal` z biblioteki — te elementy zostają bez zmian.

## Fidelity
**High-fidelity.** Kolory, typografia, odstępy, hierarchia i interakcje są ostateczne.
Odtwórz układy 1:1, ale buduj je z komponentów Mantine (`Paper`, `Card`, `Stack`,
`Group`, `SimpleGrid`, `Drawer`, `TextInput`, `Textarea`, `Chip`, `ActionIcon`,
`Button`, `Badge`) zamiast surowych `div`-ów z prototypu. Wartości podane niżej to
docelowy render — jeśli prop Mantine daje ten sam efekt, użyj propa.

Placeholdery w paski z monospace’owym podpisem (np. `wiertarka.jpg`) **nie są elementem
designu** — to zastępniki zdjęć, których prototyp nie potrafi rozwiązać. W aplikacji
w tych miejscach są prawdziwe zdjęcia z trasy obrazków (`thumbUrl` / originals),
z istniejącym fallbackiem „Brak zdjęcia”.

---

## Model danych — wymagane zmiany

`src/db/schema.ts`, tabela `categories` — dwie nowe kolumny (nullable, migracja Drizzle):

| Kolumna | Typ | Znaczenie |
| --- | --- | --- |
| `icon` | `text`, null | nazwa ikony Tabler, np. `IconDeviceLaptop` |
| `main_image` | `text`, null | nazwa pliku zdjęcia (jak `items.main_image`), nie URL |

`CategoryWithCount` w `src/lib/services/categories.ts` dostaje dodatkowo
`firstItemImage: string | null` — `main_image` **najnowszego** przedmiotu w kategorii
(podzapytanie / LEFT JOIN z `ORDER BY created_at DESC LIMIT 1`).

### Reguła prezentacji kategorii (jedna funkcja, używana wszędzie)
```
1. category.mainImage        → zdjęcie kategorii
2. category.icon            → ikona Tabler, kolor teal-filled na tle teal-light
3. category.firstItemImage  → zdjęcie pierwszego przedmiotu
4. brak wszystkiego         → monogram: pierwsza litera nazwy, gray-light / dimmed
```
Zaimplementuj jako helper (np. `src/lib/categoryVisual.ts`) zwracający dyskryminowaną
unię `{ kind: 'image' | 'icon' | 'derived' | 'monogram', value: string }`, żeby wszystkie
miejsca renderujące kategorię (kafelki, lista zarządzania, chipsy w formularzu)
korzystały z tej samej logiki.

---

## Ekrany

Numery odpowiadają plikom w `screenshots/`. Zrzuty pokazują kolumnę 390 px
(iPhone 14) wyśrodkowaną na szerszym płótnie — projekt jest jednokolumnowy.

### 01 — Katalog: kafelki kategorii (`/`)
- **Cel:** wejście do aplikacji; wybór kategorii zamiast globalnej listy przedmiotów.
- **Układ:** `SimpleGrid` / CSS grid `repeat(auto-fill, minmax(150px, 1fr))`, `gap: 12px`,
  kontener `max-width: 1120px`, `padding: 16px`. Na 390 px wychodzą 2 kolumny,
  na desktopie 6–7 — bez breakpointów.
- **Kafelek:** `Card withBorder radius="md" shadow="xs"`, cały klikalny (link do listy
  przedmiotów kategorii), `overflow: hidden`, `text-align: left`.
  - Media: kwadrat `aspect-ratio: 1/1`.
    - wariant *ikona*: tło `teal-light`, w środku koło 64 px w kolorze tła strony,
      ikona Tabler 32 px w `teal-filled`;
    - wariant *zdjęcie*: `object-fit: cover`;
    - wariant *monogram*: tło `gray-light`, litera 34 px / 700 w `dimmed`.
  - Stopka kafelka: `padding: 10px 12px 12px`; nazwa 15 px / 600, jedna linia z ellipsis;
    pod nią licznik 12 px `dimmed` — `„1 przedmiot” / „N przedmiotów”`.
- **Opcjonalny debug (nie wdrażać):** monospace’owy podpis „źródło: …” w prototypie
  służył do weryfikacji reguły fallbacku.

### 02 — Lista przedmiotów w kategorii (`/categories/[id]/items`)
- **Cel:** przeglądanie przedmiotów wybranej kategorii.
- **Pasek filtrów:** `flex-wrap`, `gap: 8px`.
  - Wyszukiwarka: wysokość 48 px, `flex: 1 1 220px`, ikona `IconSearch` 18 px `dimmed`,
    `font-size: 16px` (blokuje zoom na iOS), placeholder „Szukaj po opisie…”.
  - Sortowanie: `SegmentedControl` (Najnowsze / Najstarsze), wysokość 40 px w
    kontenerze `gray-light` z `padding: 4px`; aktywny segment na tle strony
    z `shadow-xs`, nieaktywny — tekst `dimmed`.
  - **Selecta kategorii NIE MA** — usunięty świadomie, kategorię wybiera kafelek.
- **Karta przedmiotu:** wiersz `flex`, `gap: 12px`, `padding: 10px`, `withBorder`,
  `radius: md`, `shadow-xs`; miniatura 88×88 `radius: sm`; po prawej opis
  14 px / 500, `-webkit-line-clamp: 2`; w stopce karty 12 px `dimmed`: autor i data
  (`dd.MM.yyyy`, `pl-PL`). Siatka kart: `repeat(auto-fill, minmax(260px, 1fr))`, `gap: 12px`.
- **Stan pusty:** ramka `radius: md`, `padding: 48px 24px`, tytuł 700 „Brak przedmiotów”
  + 14 px `dimmed` „Nie znaleziono przedmiotów spełniających kryteria.”

### 03 — Szczegóły przedmiotu (`/items/[id]`)
Kolumna `max-width: 640px`, `gap: 16px`:
1. Zdjęcie główne `aspect-ratio: 4/3`, `radius: md`, `cursor: zoom-in`.
2. Miniatury: grid `repeat(auto-fill, minmax(72px, 1fr))`, `gap: 8px`, kwadraty `radius: sm`.
3. Badge kategorii: pill `padding: 4px 12px`, 12 px / 600, `teal-light` / `teal-filled`.
4. Opis 16 px, `line-height: 1.5`, `text-wrap: pretty`.
5. Metryka: ramka `radius: md`, `padding: 12px`, dwa wiersze `space-between` 13 px —
   „Dodał(a)” / autor (600), „Data dodania” / data (600).
6. Akcje: „Edytuj” (`flex: 2`, wys. 52 px, teal filled, ikona `IconEdit` 20 px + tekst)
   oraz kwadratowy 52 px przycisk usuwania (`red-light` tło, `red-filled` ikona).

### 04 — Lightbox (bez zmian)
Klik w zdjęcie główne **lub** dowolną miniaturę otwiera istniejący
`ImageLightboxModal`:
```tsx
<ImageLightboxModal
  opened={lightboxIndex !== null}
  onClose={() => setLightboxIndex(null)}
  images={[item.mainImage, ...item.additionalImages]}
  initialIndex={lightboxIndex ?? 0}
  title={item.description ?? ''}
/>
```
Zachowanie, wygląd, zoom/pan, licznik „Zdjęcie X z N”, strzałki i obsługa klawiatury
zostają dokładnie takie jak dziś — **nie modyfikuj tego komponentu**.

### 05 — Kategorie: lista kart (`/categories`)
`Table` **usunięta**. Karta: `flex`, `align-items: center`, `gap: 12px`, `padding: 12px`,
`withBorder`, `radius: md`, `shadow-xs`; siatka `repeat(auto-fill, minmax(320px, 1fr))`.
- Lewa strona: kwadrat 52 px `radius: md` z wizualizacją kategorii (ta sama reguła
  fallbacku; w prototypie monogram na `teal-light`).
- Środek: nazwa 15 px / 600 (ellipsis) + meta 12 px `dimmed`:
  `„N przedmiotów · utworzono dd.MM.yyyy”`.
- Prawa strona: dwa `ActionIcon` 44×44 — edycja (`IconEdit`, `teal-light`/`teal-filled`)
  i usuwanie (`IconTrash`, `red-light`/`red-filled`).

### 06 — Formularz kategorii (pełny ekran)
Kolumna `max-width: 640px`, `gap: 20px`, etykiety 13 px / 600:
- „Nazwa kategorii” — input 48 px, `font-size: 16px`, placeholder „np. Elektronika, Narzędzia”.
- „Ikona” — podpis 12 px `dimmed`: „Opcjonalna. Bez ikony i zdjęcia użyjemy zdjęcia
  pierwszego przedmiotu.”; siatka `repeat(auto-fill, minmax(56px, 1fr))`, kafelki 56 px
  z ikoną 24 px; wybrany: obwódka `teal-filled` + tło `teal-light`.
- „Zdjęcie kategorii” — dropzone `2px dashed`, min. 140 px, `IconPhoto` 28 px,
  podpis „Zdjęcie ma pierwszeństwo przed ikoną”.
- Sticky pasek akcji na dole: „Anuluj” (outline, `flex: 1`) + akcja główna
  (teal filled, `flex: 2`, 700), oba min. 52 px; pasek ma górną krawędź i tło strony.

### 07 — Użytkownicy: lista kart (`/users`)
Ta sama anatomia karty co kategorie; awatar to koło 52 px (`gray-light`, monogram 18 px / 700).
Nazwa + pill „To Ty” (11 px / 600, teal-light) dla bieżącego konta; meta 12 px `dimmed`
„dołączył(a) dd.MM.yyyy”. Akcje 44×44: `IconKey` (zmiana hasła) i `IconTrash`;
dla własnego konta kosz jest wyłączony (tło `gray-light`, `cursor: not-allowed`,
`aria-label` „Nie możesz usunąć samego siebie”) — zachowaj też blokadę usunięcia
jedynego konta.

### 08 — Potwierdzenie usunięcia (bottom sheet)
Zamiast centrowanego `Modal` → `Drawer position="bottom"` (lub `Modal` z
`fullScreen={false}` i dolnym wyrównaniem): overlay `rgba(0,0,0,.45)`, panel
`max-width: 520px`, `margin: 12px`, `border-radius: 20px`, `padding: 20px 20px 24px`.
Nagłówek: koło 40 px `red-light` z `IconAlertTriangle` 22 px + tytuł 17 px / 700.
Treść 14 px `dimmed`. Dwa przyciski 52 px: „Anuluj” (outline) i „Usuń” (red filled).
Teksty: „Usunąć kategorię?” — „Kategoria „X” zniknie razem z N przedmiotami i ich
zdjęciami. Tej operacji nie da się cofnąć.”; „Usunąć konto?” — „Konto „X” straci
dostęp do katalogu. Dodane przez nie przedmioty zostaną w katalogu.”

### 09 — Formularz użytkownika / zmiany hasła
Login (input 48 px, placeholder „np. mama, tata, piotr”) + „Hasło początkowe”
(`PasswordInput`, „Minimum 4 znaki”). Wariant zmiany hasła: pasek informacyjny
`teal-light` „Zmiana hasła dla: <login>” + jedno pole „Nowe hasło”. Ten sam sticky
pasek akcji.

### 10 — Formularz przedmiotu (nowy / edycja)
- „Zdjęcie główne” — dropzone min. 180 px, `2px dashed`, `IconCamera` 32 px teal,
  tytuł 14 px / 600 „Zrób zdjęcie lub wybierz z galerii”, podpis 12 px `dimmed`
  „JPG, PNG — maks. 10 MB”. Wykorzystaj istniejący `ImageDropzone`, z `capture`
  dla kamery na mobile.
- „Zdjęcia dodatkowe” — grid `minmax(88px, 1fr)`, kwadraty + kafelek „+” z `2px dashed`.
- „Kategoria” — **chipsy** (pill, min. 44 px, `padding: 0 16px`) zamiast `Select`;
  wybrany: `teal-light` + obwódka `teal-filled` + 600.
- „Opis” — `Textarea` min. 120 px, 16 px, `resize: vertical`,
  placeholder „Co to jest, gdzie leży, stan…”.
- Sticky pasek akcji: „Anuluj” + „Dodaj przedmiot” / „Zapisz zmiany”.

### 11 — Motyw ciemny
Wyłącznie przez `data-mantine-color-scheme` na `<html>` (`useMantineColorScheme`);
żadnych własnych kolorów — wszystkie powierzchnie korzystają z `--mantine-color-body`,
`--mantine-color-default-border`, `--mantine-color-dimmed`, `gray-light`, `teal-light`.

### 12 — Desktop
Ten sam kod, bez osobnych layoutów: siatki `auto-fill minmax()` rozlewają się do
`max-width: 1120px`, dolny pasek nawigacji zostaje wyśrodkowany (`max-width: 600px`).
Jeśli chcesz, od `md` możesz dodatkowo pokazać poziome linki w headerze — ale dolny
pasek pozostaje źródłem prawdy.

### 13 / 14 — Logowanie i pierwsze uruchomienie
Jedna kolumna `max-width: 420px`, wyśrodkowana pionowo, `padding: 24px 16px 40px`.
Nagłówek: kwadrat 64 px `radius: 18px` `teal-light` z `IconBox` 34 px, tytuł 24 px / 700,
podtytuł 14 px `dimmed`. Pola 52 px, przycisk główny 52 px / 700, pod nim tekstowy
przycisk przełączający tryb („Pierwsze uruchomienie — załóż konto” ↔ „Mam już konto —
zaloguj się”). Setup ma dodatkowo „Powtórz hasło” i pasek informacyjny `teal-light`:
„To pierwsze uruchomienie — zakładasz konto administratora katalogu. Kolejnych
domowników dodasz w zakładce Użytkownicy.”

---

## Powłoka aplikacji (AppLayout)

### Górny pasek (sticky, min. 60 px)
`padding: 10px 12px`, tło strony, dolna krawędź `default-border`.
- Lewa: strzałka wstecz 44×44 (`IconChevronLeft`) na ekranach zagnieżdżonych
  (lista przedmiotów, szczegóły, formularze), dalej tytuł 17 px / 700 i podtytuł
  12 px `dimmed` — oba w jednej linii z ellipsis.
  Tytuł/podtytuł zależny od ekranu: „Katalog / Wybierz kategorię”,
  „<Kategoria> / N przedmiotów”, „Przedmiot / data”, „Kategorie / Zarządzanie kategoriami”,
  „Użytkownicy / Zarządzanie dostępem”, „<Nazwa formularza> / kontekst”.
- Prawa: pill z **nazwą zalogowanego użytkownika** (12 px / 600, `teal-light`,
  `max-width: 96px`, ellipsis), przełącznik motywu 44×44 (`IconMoon` / `IconSun`,
  `dimmed`) i wylogowanie 44×44 (`IconLogout`, `red-filled`).

### Dolna nawigacja + FAB
Kontener `position: fixed; left/right: 12px; bottom: 12px`, `max-width: 600px`,
wyśrodkowany, `display: flex; gap: 10px`.
- **Pasek** (`flex: 1`): pill `radius: 20px`, `withBorder`, `shadow-md`, `padding: 6px`,
  trzy pozycje `flex: 1`, min. 52 px, ikona 22 px + etykieta 11 px / 600:
  Katalog (`IconHome`), Kategorie (`IconCategory`), Użytkownicy (`IconUsers`).
  Aktywna: `teal-light` + `teal-filled`, nieaktywna: przezroczysta + `dimmed`.
- **FAB obok paska, po jego prawej stronie** (nie w środku): koło 64 px,
  `teal-filled`, `IconPlus` 28 px biały, `shadow-md`.
- Treść strony ma `padding-bottom: 104px`, żeby pasek nic nie zasłaniał.
- Na ekranach formularzy pasek i FAB są **ukryte** (formularz ma własny pasek akcji).

### FAB jest kontekstowy
| Aktywna zakładka | Akcja | Etykieta (`aria-label` + `title`) |
| --- | --- | --- |
| Katalog (kafelki, lista, szczegóły) | nowy przedmiot; jeśli wchodzimy z listy kategorii — prefill kategorii | „Dodaj przedmiot” |
| Kategorie | nowa kategoria | „Nowa kategoria” |
| Użytkownicy | nowy użytkownik | „Dodaj użytkownika” |

---

## Interakcje i nawigacja
- Kafelek kategorii → lista przedmiotów tej kategorii; strzałka wstecz → kafelki.
- Karta przedmiotu → szczegóły; strzałka wstecz → lista.
- Zdjęcie / miniatura w szczegółach → `ImageLightboxModal` z właściwym `initialIndex`.
- Filtrowanie i sortowanie: klient, nad danymi z serwera (jak dziś w `ItemsCatalog`).
- Zapis/edycja/usuwanie: istniejące Server Actions + `useActionRunner` + `notifications.show()`;
  po sukcesie wracamy na ekran listy właściwej zakładki.
- Anuluj w formularzu = powrót bez zapisu, na ten sam ekran co strzałka wstecz.
- Przełącznik motywu zmienia `colorScheme` natychmiast, stan trwały (cookie/localStorage
  — Mantine `MantineProvider` + `ColorSchemeScript`).

## Stan
`selectedCategoryId` (z URL), `searchQuery`, `sortOrder: 'newest' | 'oldest'`,
`lightboxIndex: number | null`, `confirmTarget: {kind, id, name} | null`,
`colorScheme`. Formularze trzymają własny stan pól; w prototypie routing ekranów
jest stanem lokalnym, w aplikacji ma to być routing Next.js.

## Design tokens
Motyw bez zmian: `primaryColor: 'teal'`, `defaultRadius: 'md'`, font
`system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`.

- Teal (paleta aplikacji): `#e6fcf5, #c3fae8, #96f2d7, #63e6be, #38d9a9, #20c997,
  #12b886, #0ca678, #099268, #087f5b`; w jasnym motywie `teal-filled` = `#12b886`.
- Kolory tylko przez zmienne: `--mantine-color-body`, `--mantine-color-text`,
  `--mantine-color-dimmed`, `--mantine-color-default-border`, `--mantine-color-gray-light`,
  `--mantine-color-gray-1/2`, `--mantine-color-teal-light`, `--mantine-color-teal-filled`,
  `--mantine-color-red-light`, `--mantine-color-red-filled`, `--mantine-color-white`.
- Promienie: `radius-sm` (miniatury), `radius-md` (karty, pola, przyciski),
  `20px` (pasek nawigacji i bottom sheet), `999px` (pille/chipsy), `50%` (FAB, awatary).
- Cienie: `shadow-xs` (karty), `shadow-md` (pasek nawigacji, FAB, sheet).
- Odstępy: 4 / 6 / 8 / 10 / 12 / 16 / 20 px; `gap: 12px` w siatkach kart,
  `gap: 16–20px` w formularzach.
- Typografia: 24/700 (tytuł auth), 17/700 (tytuł paska), 15/600 (nazwa w karcie),
  16/400 (opis, pola), 14/500 (opis w karcie), 13/600 (etykiety pól),
  12/400 (meta, `dimmed`), 11–12/600 (etykiety nawigacji, pille).
- Cele dotykowe: min. 44×44 px (akcje w kartach, ikony w headerze), 52 px (przyciski
  główne i pozycje nawigacji), 64 px (FAB).

## Assets
Brak nowych assetów. Ikony: `@tabler/icons-react` — `IconHome`, `IconCategory`,
`IconUsers`, `IconPlus`, `IconSearch`, `IconChevronLeft`, `IconEdit`, `IconTrash`,
`IconKey`, `IconMoon`, `IconSun`, `IconLogout`, `IconAlertTriangle`, `IconCamera`,
`IconPhoto`, `IconBox` oraz zestaw do wyboru ikony kategorii (`IconDeviceLaptop`,
`IconTool`, `IconBook`, `IconToolsKitchen2`, `IconPlant`, `IconBallFootball`,
`IconArmchair`, `IconBike`).

## Files
- `design/MobileFirst.dc.html` — powłoka, kafelki, lista, szczegóły, listy kart,
  nawigacja, bottom sheet (główna referencja).
- `design/Forms.dc.html` — formularze: przedmiot, kategoria, użytkownik, zmiana hasła.
- `design/AuthScreens.dc.html` — logowanie i pierwsze uruchomienie.
- `IMPLEMENTATION_PROMPT.md` — gotowy, etapowy prompt dla Claude Code.
- `screenshots/*.png` — 14 zrzutów, kolejność jak w sekcji „Ekrany”.

Pliki `.dc.html` otwierają się w przeglądarce, ale ich stylowanie jest inline i celowo
prototypowe — czytaj z nich strukturę, kolejność i wartości, a nie kod do przeniesienia.
