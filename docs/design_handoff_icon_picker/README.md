# Handoff: Formularz kategorii — wybór ikony z pełnej biblioteki Tabler

## Overview
Zmiana dotyczy **jednego pola** w formularzu kategorii (`/categories/new`,
`/categories/[id]/edit`). Dotychczasowa siatka 8 zahardkodowanych ikon zostaje
zastąpiona **pojedynczym przyciskiem podglądu + modalem z wyszukiwarką po całej
bibliotece `@tabler/icons-react`** (ok. 5900 ikon).

Powód: 8 ikon nie pokrywa realnych kategorii domowego katalogu (rowery, AGD,
ogród, dokumenty, zabawki…), a rozbudowa listy do kilkudziesięciu pozycji zamieniłaby
formularz w ścianę ikon. Wyszukiwarka skaluje się bez limitu i nie rośnie w pionie.

Reszta formularza kategorii (nazwa, dropzone zdjęcia, sticky pasek akcji) oraz reguła
prezentacji kategorii (`mainImage → icon → firstItemImage → monogram`) **pozostają
bez zmian** — patrz poprzedni handoff `design_handoff_mobile_first`, sekcje 06 i
„Reguła prezentacji kategorii”.

## About the Design Files
Plik w `design/` to **referencja projektowa napisana w HTML** — prototyp pokazujący
docelowy wygląd i zachowanie, nie kod produkcyjny do wklejenia. Zadanie polega na
**odtworzeniu tego ekranu w istniejącym środowisku repo**: React 18 + Next.js App
Router + Mantine 7 + Tabler Icons, z zachowaniem obecnych wzorców (Server Actions,
`useActionRunner`, `notifications.show()`).

Stylowanie w prototypie jest celowo inline i surowe (`div` + `style`), bo prototyp nie
ma dostępu do buildu repo. W aplikacji zbuduj to z komponentów Mantine — mapowanie
podane niżej w każdej sekcji.

## Fidelity
**High-fidelity.** Kolory, typografia, odstępy, rozmiary siatki i zachowanie są
ostateczne. Wszystkie kolory pochodzą ze zmiennych Mantine — **nie wprowadzaj własnych
hexów**. Wartości px podane niżej to docelowy render; jeśli prop Mantine daje ten sam
efekt (`radius="md"`, `shadow="xs"`), użyj propa.

---

## Model danych
**Bez zmian w schemacie.** Kolumna `categories.icon` (`text`, nullable) z poprzedniego
etapu wystarcza — trzyma nazwę eksportu Tabler, np. `IconDeviceLaptop`.

Jedyna różnica: dotychczas wartość mogła pochodzić wyłącznie z 8-elementowej stałej,
teraz może być **dowolną nazwą ikony Tabler**. To wymusza walidację przy renderowaniu
(patrz „Bezpieczeństwo i walidacja”).

---

## Ekran 1 — Pole „Ikona” w formularzu kategorii

Zastępuje siatkę `repeat(auto-fill, minmax(56px, 1fr))` z ekranu 06 poprzedniego
handoffu.

- **Etykieta:** „Ikona”, 13 px / 600, `margin-bottom: 2px`.
- **Podpis:** 12 px `dimmed`, „Opcjonalna. Wybierz z pełnej biblioteki ikon Tabler.”,
  `margin-bottom: 8px`.
- **Wiersz kontrolek:** `flex`, `align-items: center`, `gap: 12px`.

### Przycisk podglądu (lewy)
`ActionIcon variant="default" size={56}` lub `Paper withBorder`:
- 56 × 56 px, `flex: none`, `radius: md`, `cursor: pointer`,
  `1px solid --mantine-color-default-border`, tło `--mantine-color-body`.
- Stan **z ikoną**: wybrana ikona Tabler, `size={28}`, kolor odziedziczony (`dimmed`).
- Stan **bez ikony**: `IconPlus` `size={24}` w `--mantine-color-dimmed`.
- Klik otwiera modal. `aria-label="Wybierz ikonę"`.

### Kolumna przycisków (prawa)
`flex-direction: column`, `gap: 6px`.
- **Przycisk główny:** `Button variant="default" size="sm"` — wysokość 36 px,
  `padding: 0 14px`, 13 px / 600, `radius: md`. Tekst zależny od stanu:
  „Wybierz ikonę” (brak ikony) / „Zmień ikonę” (ikona wybrana). Otwiera ten sam modal.
- **Link czyszczący** (tylko gdy ikona wybrana): `Anchor` / `Button variant="subtle"`,
  wysokość 20 px, 12 px, `dimmed`, `text-decoration: underline`, wyrównany do lewej.
  Tekst: `Usuń (<Etykieta ikony>)`, np. „Usuń (Device Laptop)”.
  Ustawia `icon = null`.

---

## Ekran 2 — Modal wyboru ikony

Mantine `Modal` (`size="md"`, `radius="lg"`, `centered`) lub `Drawer position="bottom"`
na mobile. Wartości docelowe:

- **Overlay:** `rgba(0, 0, 0, .45)`, `position: fixed`, `inset: 0`,
  **`z-index: 2000`** — musi być nad dolną nawigacją i FAB-em z `AppLayout`.
  W Mantine użyj `--mantine-z-index-modal`; nie zostawiaj domyślnego z-indexu
  własnego overlaya, bo FAB (z-index 25) przebija się przez niższe wartości.
  Klik w overlay zamyka modal (klik w panel — `stopPropagation`).
- **Panel:** `width: 100%`, `max-width: 560px`, `max-height: 82vh`,
  `display: flex; flex-direction: column`, tło `--mantine-color-body`,
  `radius: lg`, `box-shadow: 0 24px 60px rgba(0,0,0,.35)`, `overflow: hidden`,
  margines zewnętrzny 16 px.

### Nagłówek
`padding: 16px 16px 12px`, dolna krawędź `default-border`,
`space-between`, `gap: 12px`.
- Tytuł „Wybierz ikonę”, 16 px / 700.
- `ActionIcon` 32 × 32, `variant="subtle"`, `IconX` 18 px `dimmed`,
  `aria-label="Zamknij"`.

### Pasek wyszukiwania
`padding: 12px 16px`, dolna krawędź `default-border`.
- `TextInput` z `leftSection={<IconSearch size={18} />}` (`dimmed`, offset 12 px).
- Wysokość 44 px, **`font-size: 15–16px`** (blokada zoomu na iOS),
  `padding-left: 38px`, tło `--mantine-color-gray-light`,
  `1px solid default-border`, `radius: md`.
- Placeholder: „Szukaj ikony… np. lampa, dom, rower”.
- `autoFocus` przy otwarciu; zmiana zapytania resetuje `scrollTop` do 0.

### Siatka ikon
Obszar przewijany: **`height: 420px`**, `overflow-y: auto`, `padding: 14px 16px`.
- Siatka **8 kolumn × 60 px** (`COL_W = 60`, `ROW_H = 60`), kafelek 52 × 52 px.
- Kafelek: `ActionIcon variant="default"` 52 × 52, `radius: md`,
  `1px solid default-border`, tło `--mantine-color-body`, ikona 22 px `dimmed`.
  - **Hover:** tło `--mantine-color-gray-light`.
  - `title` **i** `aria-label` = czytelna etykieta ikony (patrz „Etykiety”).
  - Klik: ustawia `icon` i **zamyka modal** (bez osobnego „Zatwierdź”).
- **Stan pusty:** `padding: 32px 8px`, wyśrodkowany, 13 px `dimmed`,
  `Brak ikon dla „<zapytanie>”`.

### Stopka
`padding: 10px 16px`, górna krawędź `default-border`, 12 px `dimmed`:
- bez filtra: `Biblioteka: <N> ikon Tabler.`
- z filtrem: `Znaleziono <M> z <N> ikon Tabler.`

---

## Wydajność — wirtualizacja jest wymagana

Renderowanie ~5900 przycisków SVG naraz zawiesza wątek na kilka sekund i zjada
setki MB. Prototyp implementuje **wirtualizację okna przewijania** i produkcja musi
zrobić to samo (najprościej: `@tanstack/react-virtual`, tryb wierszowy).

Parametry z prototypu:

| Parametr | Wartość |
| --- | --- |
| `COLS` | 8 |
| `ROW_H` | 60 px |
| `COL_W` | 60 px |
| `VIEW_H` | 420 px |
| `OVERSCAN` | 6 wierszy |

Algorytm:
```
totalRows  = ceil(pool.length / COLS)
contentHeight = max(totalRows * ROW_H, VIEW_H)
startRow = max(0, floor(scrollTop / ROW_H) - OVERSCAN)
endRow   = min(totalRows, ceil((scrollTop + VIEW_H) / ROW_H) + OVERSCAN)
```
Renderowane są wyłącznie indeksy `startRow*COLS … endRow*COLS`, każdy
`position: absolute` na `top = row * ROW_H`, `left = col * COL_W`, wewnątrz
kontenera `position: relative; height: contentHeight`.

**Uwaga:** `height`, `top` i `left` to jedyne wartości wyliczane w runtime —
wszystko inne jest literałem. Zachowaj ten podział.

Dodatkowo:
- **Nie importuj** całego `@tabler/icons-react` statycznie do bundla klienta.
  W repo (Next.js) użyj dynamicznego dostępu przez mapę nazw + `next/dynamic`
  albo `experimental.optimizePackageImports` z lazy lookupem — inaczej bundle
  rośnie o kilka MB. Alternatywa: `import * as TablerIcons` w komponencie modala
  ładowanym leniwie (`dynamic(() => import(...), { ssr: false })`), żeby koszt
  ponosił tylko formularz kategorii.
- Etykiety cache'uj w `Map` (prototyp: `this._cache`) — `replace` na 5900 nazwach
  przy każdym renderze jest zauważalny.

---

## Etykiety i wyszukiwanie

Nazwa eksportu → etykieta czytelna dla użytkownika:
```
label = name.replace(/^Icon/, '').replace(/([a-z0-9])([A-Z])/g, '$1 $2')
// IconDeviceLaptop → "Device Laptop"
// IconToolsKitchen2 → "Tools Kitchen2"
```

Filtrowanie: `label.toLowerCase().includes(query.trim().toLowerCase())`.

**Do rozważenia przy wdrożeniu (prototyp tego nie ma):** nazwy Tabler są angielskie,
a interfejs polski — placeholder sugeruje „lampa, dom, rower”, które nic nie znajdą.
Dwie opcje:
1. Dopisać słownik aliasów PL → EN dla 50–100 najczęstszych pojęć domowych
   (`lampa → lamp bulb`, `rower → bike`, `dom → home`, `narzędzia → tool`,
   `kuchnia → kitchen`, `książka → book`, `auto → car`…) i szukać po sumie
   `label + aliasy`.
2. Zmienić placeholder na angielskie przykłady („np. laptop, book, bike”).

Opcja 1 jest wyraźnie lepsza dla użytkownika końcowego (aplikacja jest dla domowników,
nie dla programistów) — zalecana. Zapytaj właściciela produktu przed pominięciem.

### Ikony wyróżnione (curated)
Przy **pustym** zapytaniu pierwsze 8 pozycji to dotychczasowy zestaw, w tej kolejności:
```
IconDeviceLaptop, IconTool, IconBook, IconToolsKitchen2,
IconPlant, IconBallFootball, IconArmchair, IconBike
```
Reszta biblioteki leci po nich, w kolejności eksportów. Dzięki temu użytkownik, który
wcześniej wybierał z 8 ikon, nadal widzi je od razu — bez wpisywania czegokolwiek.
Przy niepustym zapytaniu curated nie ma znaczenia (zwykłe filtrowanie).

---

## Bezpieczeństwo i walidacja
- `categories.icon` przyjmuje teraz dowolny string z klienta. **Waliduj w Server
  Action**: nazwa musi pasować do `/^Icon[A-Za-z0-9]+$/` **i** istnieć w mapie
  eksportów Tabler. Odrzuć inaczej.
- Renderowanie: `const Cmp = TablerIcons[category.icon]` — jeśli `undefined`
  (ikona usunięta w nowszej wersji paczki), **zejdź do następnego kroku reguły
  fallbacku** (`firstItemImage` → monogram), nie renderuj pustego kwadratu.
  To realny scenariusz przy aktualizacji `@tabler/icons-react`.

---

## Stan
```ts
name: string
icon: string | null          // nazwa eksportu Tabler
pickerOpen: boolean
search: string
scrollTop: number            // tylko do wirtualizacji
```
Przejścia:
- `openPicker` → `pickerOpen = true`, `search = ''`, `scrollTop = 0`
- wybór kafelka → `icon = <nazwa>`, `pickerOpen = false`
- `clearIcon` → `icon = null`
- zmiana `search` → `scrollTop = 0` (również na elemencie DOM, nie tylko w stanie)

Zapis: istniejąca Server Action formularza kategorii + `useActionRunner` +
`notifications.show()`. Modal **nie** zapisuje niczego samodzielnie — tylko ustawia
pole w stanie formularza.

## Dostępność
- Fokus: `autoFocus` na wyszukiwarce po otwarciu; po zamknięciu fokus wraca na
  przycisk, który modal otworzył. Mantine `Modal` robi to za Ciebie — jeśli budujesz
  własny overlay, zaimplementuj focus trap i `Escape` ręcznie.
- `Escape` zamyka modal.
- Każdy kafelek ma `aria-label` z etykietą ikony (SVG same nie mają tekstu).
- Cele dotykowe: kafelki 52 px, `ActionIcon` zamknięcia 32 px w obszarze 44 px klikalnym
  (dodaj padding), przycisk podglądu 56 px, przycisk „Zmień ikonę” 36 px —
  ten ostatni jest pod minimum 44 px, ale leży obok przycisku 56 px pełniącego tę samą
  funkcję, więc jest akceptowalny. Nie zmniejszaj go dalej.
- Wirtualizowana lista: rozważ `role="grid"` z `aria-rowcount`, albo pozostaw
  zwykłe przyciski (prostsze, wystarczające przy wyszukiwarce).

## Design tokens
Wszystkie ze zmiennych Mantine — bez nowych wartości względem poprzedniego handoffu:

- `--mantine-color-body` — tło panelu, kafelków, przycisku podglądu
- `--mantine-color-text` — tytuły, tekst przycisków
- `--mantine-color-dimmed` — podpisy, ikony w kafelkach, stopka, placeholder
- `--mantine-color-default-border` — wszystkie krawędzie 1 px
- `--mantine-color-gray-light` — tło wyszukiwarki, hover kafelka
- `--mantine-color-teal-filled` — ikona w dropzonie zdjęcia (bez zmian)
- `--mantine-radius-sm / md / lg` — 32 px close / kafelki i pola / panel modala
- `--mantine-z-index-modal` — overlay (prototyp: 2000)
- Cień panelu: `0 24px 60px rgba(0, 0, 0, .35)`
- Overlay: `rgba(0, 0, 0, .45)`
- Typografia: 16/700 (tytuł modala), 15–16/400 (wyszukiwarka), 13/600 (etykieta pola
  i „Zmień ikonę”), 12/400 (podpisy, stopka, „Usuń”)
- Odstępy: 2 / 6 / 8 / 12 / 14 / 16 px

**Motyw ciemny** działa automatycznie — wszystkie powierzchnie idą przez zmienne.
Warunek: `data-mantine-color-scheme` musi być na `<html>` (`MantineProvider` +
`ColorSchemeScript`). Mantine definiuje paletę na `:root`, więc ustawienie atrybutu
na wewnętrznym `div` **nie zadziała** — zmienne pozostaną niezdefiniowane i modal
wyjdzie przezroczysto-czarny. To był realny błąd w prototypie.

## Assets
Brak nowych assetów. Nowe ikony użyte w tym ekranie: `IconX`, `IconSearch`, `IconPlus`
(`IconPhoto` już jest). Plus **cała biblioteka `@tabler/icons-react`** jako źródło
wyboru — patrz uwagi o bundlu w sekcji „Wydajność”.

## Files
- `design/CategoryForm.dc.html` — prototyp pola „Ikona” + modal (główna referencja;
  otwiera się w przeglądarce, wymaga rodzeństwa `support.js` i `ds-base.js`).
- `design/CategoryForm.standalone.html` — ta sama referencja jako **jeden plik offline**,
  z wbudowanym design systemem. Otwórz ten, jeśli chcesz tylko zobaczyć działający
  prototyp (wyszukiwarka i modal działają na pełnej bibliotece ikon).
- `IMPLEMENTATION_PROMPT.md` — gotowy prompt dla Claude Code.

## Zakres poza tą zmianą
Nie ruszaj: `src/theme.ts`, `ImageLightboxModal.tsx`, dropzone zdjęcia kategorii,
reguły prezentacji kategorii, pozostałych formularzy. Ten handoff dotyczy wyłącznie
pola „Ikona”.
