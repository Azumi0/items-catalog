# ADR-005: Świadome Odstępstwa od Handoffu Icon Picker

* **Status:** Zaakceptowany (Accepted)
* **Data:** 2026-08-29
* **Autor:** Przemysław Wrzeszcz & Claude Opus 5

---

## 1. Kontekst i Problem

Paczka `docs/design_handoff_icon_picker/` zastąpiła w formularzu kategorii
siatkę ośmiu zahardkodowanych ikon wyborem z całej biblioteki
`@tabler/icons-react` (~6250 glifów): przycisk podglądu, modal z wyszukiwarką,
wirtualizowana siatka, polskie aliasy wyszukiwania.

Handoff jest wysokiej wierności i został odtworzony niemal 1:1. Sześć miejsc
świadomie się od niego różni, a wszystkie sześć dotyczy czegoś, czego prototyp
nie mógł zobaczyć: ładował całą bibliotekę z `window`, więc **nie miał bundla**,
nie miał telefonu i nie miał React-owego Suspense.

Ten ADR zamyka listę tych odstępstw, tak jak ADR-004 zrobił to dla handoffu
mobile-first. Bez zapisu każda kolejna recenzja oznaczy je jako rozbieżność ze
specyfikacją, a któraś „naprawi" je z powrotem do litery dokumentu.

---

## 2. Rozważane Opcje

1. **Opcja A: Dosłowna zgodność z handoffem.**
   - Zaleta: zerowa rozbieżność wobec dokumentu.
   - Wada: siatka 8 × 60 px nie mieści się na telefonie 360 px, a statyczny
     import biblioteki dokłada 2,6 MB do ekranu startowego katalogu.
2. **Opcja B: Zgodność co do intencji, z zapisem różnic.** ← **wybrana**
   - Wartości, kopie, geometria kafelków i zachowanie pozostają z handoffu;
     ustępuje tylko to, co na prawdziwym urządzeniu lub w prawdziwym buildzie
     dawało wynik gorszy od zamierzonego.

---

## 3. Podjęta Decyzja

### 3.1. Liczba kolumn siatki dostosowuje się do szerokości (4–8), zamiast stałych 8

`README.md` §„Wydajność" podaje `COLS = 8`, `COL_W = 60`. To wymaga 480 px
szerokości treści. Panel modala to `width: 100%; max-width: 560px` z 16 px
marginesu i 16 px paddingu, więc na telefonie 360 px zostaje ~296 px — siatka
wystawałaby poza obszar przewijania o prawie 200 px.

Drugą drogą byłoby zmniejszenie kafelków, ale handoff podaje 52 px i §„Dostępność"
wprost zabrania schodzenia niżej („Nie zmniejszaj go dalej"). Ustępuje więc
liczba kolumn, a nie rozmiar celu dotykowego:
`columnsForWidth()` w `src/lib/iconPicker.ts`, zmierzone renderem —
360 px → 4 kolumny, 390 px → 5, 768 px i 1280 px → **8, czyli dokładnie siatka
z handoffu**. Geometria (`ROW_H`, `COL_W`, `VIEW_H`, `OVERSCAN`, kafelek 52 px)
jest nietknięta.

### 3.2. Walidacja nazwy ikony siedzi w warstwie serwisu, nie w Server Action

`IMPLEMENTATION_PROMPT.md` etap 2 mówi: „Server Action kategorii: waliduj icon".
W tym repo Server Actions sprawdzają wyłącznie obecność pól i zamieniają wyjątek
na `{ error }`; niezmienniki domenowe (unikalność nazwy, nazwa niepusta) należą
do `src/lib/services/categories.ts`. Walidacja ikony jest takim samym
niezmiennikiem.

Umieszczenie jej w serwisie daje trzy rzeczy naraz: obowiązuje dla **każdego**
wywołującego, nie tylko dla formularza; komunikat błędu trafia do użytkownika tą
samą drogą co „Kategoria już istnieje"; i jest testowalna dokładnie tam, gdzie
brief każe ją testować — w `tests/categories.test.ts`, bez atrapy `next/headers`.

### 3.3. Nieznana ikona jest gaszona przy odczycie, a nie przy renderze

Handoff §„Bezpieczeństwo i walidacja" opisuje `const Cmp = TablerIcons[category.icon]`
w miejscu renderu i zejście do kolejnego kroku fallbacku, gdy wyjdzie `undefined`.

Zrobienie tego w renderze wymagałoby tablicy 6250 komponentów **po stronie
klienta**, tylko po to, by odpowiedzieć na pytanie „czy ta nazwa istnieje" — i to
zanim będzie wiadomo, co narysować. `getCategories()` / `getCategory()` zerują
więc nazwę, której ten build nie zna (`withRenderableIcon`). Efekt jest ten sam,
decyzja zapada synchronicznie na serwerze, a `src/lib/categoryVisual.ts` —
którego brief kazał nie ruszać — pozostaje nietknięty: kategoria bez ikony to
kategoria bez ikony.

### 3.4. `labelFor` mieszka w `iconPicker.ts`, nie w `tablerIcons.ts`

Brief umieszcza w jednym module listę nazw, lookup komponentu **i** `labelFor`.
Te trzy rzeczy mają jednak różne ceny: pierwsze dwie wymagają `import * as`
całej biblioteki (~2,6 MB), a `labelFor` to jedno wywołanie `replace`.

Trzymanie ich razem wciągałoby bibliotekę wszędzie tam, gdzie potrzebna jest
sama etykieta — łącznie z linkiem „Usuń (Device Laptop)" w formularzu — czyli
niweczyłoby cel, dla którego ten sam brief każe ładować modal przez
`next/dynamic`. Moduł `tablerIcons.ts` zachowuje nazwę i obie ciężkie funkcje;
logika czysta (etykiety, wyszukiwanie, matematyka siatki) siedzi obok, w
`iconPicker.ts`. `labelFor` **nie jest** z `tablerIcons.ts` re-eksportowane —
jeden wygodny re-eksport wróciłby dokładnie do problemu.

### 3.5. Glify są dzielone na osobny chunk także na ścieżce renderu, nie tylko w modalu

Brief prosi o `next/dynamic` dla modala, „żeby koszt ponosił tylko formularz
kategorii", i nie mówi nic o kafelkach katalogu — bo prototyp nie miał bundla.
Zmierzone na tym repo:

| Wariant | Chunki wejściowe | Chunk ładowany na żądanie |
| --- | --- | --- |
| przed zmianą | 1,52 MB | — |
| statyczny import w `CategoryIcon` | **4,17 MB** | — |
| wersja wdrożona | 1,58 MB | 2,57 MB (498 KB po kompresji) |

Statyczny import trafiał do chunków ekranu `/` i `/categories`, czyli na
pierwszy ekran aplikacji. `CategoryIcon` ładuje więc `TablerGlyph` przez
`next/dynamic`. Chunk idzie z `/_next/static`, więc przeglądarka trzyma go w
zwykłym cache HTTP (`immutable`, rok) — **nie** cache'uje go service worker:
`public/sw.js` jest świadomie przelotowy i nie cache'uje niczego (ADR-001 §2.1).

Ładowanie chunku jest opóźnione, ale nie jest „na żądanie użytkownika": pobiera
go każdy ekran, który faktycznie rysuje ikonę, oraz sam formularz kategorii —
podgląd wyboru montuje się od razu (patrz §4). To jest dokładnie ten koszt,
który brief pozwala ponieść formularzowi kategorii.

Koszt: przy pierwszym wejściu kafelek z ikoną jest przez chwilę pusty (kwadrat
i tak jest rysowany, więc nie ma przeskoku układu). Uznane za tańsze niż
2,6 MB blokujące ekran startowy.

### 3.6. Wirtualizacja własna zamiast `@tanstack/react-virtual`

Brief dopuszcza jedno albo drugie („Użyj `@tanstack/react-virtual` […] albo
algorytmu z README"). Wybrany algorytm z README: sześć linii arytmetyki
w `iconGridWindow()`, bez nowej zależności, w całości pokryte testami
jednostkowymi — czego biblioteka nie ułatwia.

---

## 4. Konsekwencje

### Pozytywne

- Ekran startowy katalogu nie urósł (1,52 MB → 1,58 MB chunków wejściowych)
  mimo że wybór ikon urósł z 8 do 6250 pozycji.
- Modal działa na 360 px bez poziomego przewijania, z celami dotykowymi 52 px.
- Nazwa ikony przeżywa aktualizację `@tabler/icons-react`: przy zapisie jest
  odrzucana, gdy nie istnieje, a przy odczycie gaszona, gdy przestała istnieć.

### Negatywne / Koszty

- Przy pierwszym wejściu ikony kategorii pojawiają się z opóźnieniem (§3.5).
- Dzielenie na chunki wprowadza tryb awarii, którego wcześniej nie było: pobranie
  chunku może się nie udać (zerwana sieć, redeploy podmieniający nazwy plików),
  a odrzucony `import()` leci jako wyjątek renderu. `CategoryIcon` opakowuje
  więc glif własną granicą błędu — kafelek zostaje bez ikony, zamiast zabrać ze
  sobą cały ekran katalogu do korzenia drzewa błędów Next.js.
- **Podgląd wybranej ikony w formularzu jest montowany od razu, także gdy nie ma
  czego rysować** (`<CategoryIcon name={value} …>` z `value === null`). To nie
  jest przeoczenie: React dławi ujawnienie granicy Suspense o ~300 ms, więc
  granica, która zawiesza się dopiero w chwili wyboru, zostawia kwadrat pusty
  przez jedną trzecią sekundy po zamknięciu modala. Zmierzone: 303 ms przed,
  4 ms po. Nie „upraszczać" tego z powrotem do `{value && …}`.
- Sześć miejsc różni się od dokumentu i wymaga tego zapisu, żeby recenzje
  przestały je zgłaszać.
