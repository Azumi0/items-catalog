# ADR-004: Świadome Odstępstwa od Handoffu Mobile-First

* **Status:** Zaakceptowany (Accepted)
* **Data:** 2026-08-29
* **Autor:** Przemysław Wrzeszcz & Claude Opus 5

---

## 1. Kontekst i Problem

Przebudowa interfejsu na mobile-first (etapy 1–7) była prowadzona według paczki
`docs/design_handoff_mobile_first/`:

- `README.md` — specyfikacja ekran po ekranie; źródło prawdy dla układu, wartości
  liczbowych, kopii i reguły prezentacji kategorii,
- `IMPLEMENTATION_PROMPT.md` — brief etapowy wraz z regułami obowiązującymi przez
  cały czas pracy („kopie dokładnie takie jak w README", „minimalny cel dotykowy
  44 px", „kolory tylko przez zmienne Mantine" itd.),
- `design/*.dc.html` — prototypy referencyjne,
- `screenshots/*.png` — docelowy render.

Handoff jest wysokiej wierności i w zdecydowanej większości został odtworzony
1:1. W kilku miejscach dosłowne zastosowanie specyfikacji dałoby jednak wynik
gorszy od zamierzonego albo wprost nieosiągalny — prototypy nie miały bazy
danych, plików na dysku ani routingu Next.js, więc pewne stany po prostu w nich
nie występowały.

Recenzja dwuosiowa (`/code-review`, osie Standards i Spec) prawidłowo oznaczyła
te miejsca jako rozbieżności ze specyfikacją. Bez zapisu decyzji każda kolejna
recenzja — ludzka czy agentowa — oznaczy je ponownie, a któraś „naprawi" je z
powrotem do litery handoffu.

Ten ADR zamyka listę tych odstępstw i uzasadnia każde z nich.

---

## 2. Rozważane Opcje

1. **Opcja A: Dosłowna zgodność z handoffem.**
   - Zaleta: zerowa rozbieżność wobec dokumentu, trywialna recenzja.
   - Wady: w opisanych niżej przypadkach prowadzi do martwych kontrolek, stanów
     nieosiągalnych przez użytkownika i osieroconych plików na dysku.

2. **Opcja B (Wybrana): Odtworzyć handoff 1:1 wszędzie, gdzie jest wykonalny, a
   każde odstępstwo uzasadnić i zapisać w ADR.**
   - Zaleta: interfejs zgodny z projektem tam, gdzie to ma znaczenie, bez
     przenoszenia do produkcji ograniczeń prototypu.
   - Koszt: wymaga utrzymywania tego dokumentu w zgodzie z kodem.

3. **Opcja C: Odstąpić od handoffu tam, gdzie wydawał się niewygodny, bez zapisu.**
   - Odrzucona wprost: rozbieżność bez uzasadnienia jest nieodróżnialna od błędu.

---

## 3. Podjęta Decyzja

Wybrano **Opcję B**. Poniżej zamknięta lista odstępstw. **Każda pozycja jest
świadoma. Nie „naprawiaj" jej bez ponownego otwarcia tej decyzji.**

### 3.1. Aparat jest osobnym przyciskiem obok dropzone'u, a nie atrybutem `capture` na nim

*Zrewidowane 2026-08-30 po zgłoszeniu z urządzenia. Pierwotne brzmienie tej
pozycji opierało się na założeniu, które okazało się nieprawdziwe — zapis
poniżej opisuje, na czym polegał błąd, żeby nie wrócił.*

`IMPLEMENTATION_PROMPT.md`, etap 5, wymaga: „Wykorzystaj istniejący
`ImageDropzone`, z `capture` dla kamery na mobile."

**Czego nie robimy i dlaczego:** `capture` na `<input type="file">` nie zaznacza
aparatu jako domyślnej zakładki w systemowym oknie wyboru — on to okno
**zastępuje**. Włączony na dropzonie odciąłby galerię, a katalogowanie domu
zwykle polega na sfotografowaniu kilku rzeczy i wprowadzeniu ich później. Ta
część pierwotnej decyzji zostaje w mocy.

**Co było błędem:** pierwotny zapis dopowiadał, że „bez `capture` systemowe okno
wyboru i tak proponuje aparat", i na tej podstawie zostawiał pole z jednym
wejściem. To jest nieprawda na Androidzie. Chrome oddaje `accept`
zawierające wyłącznie typy obrazów systemowemu **Photo Pickerowi**, który
otwiera się prosto na galerii i nie ma migawki; osobno znany jest przypadek,
w którym samo podanie listy konkretnych typów MIME zamiast `image/*` gasi
intencję aparatu (zob. issuetracker.google.com/issues/317289301). W obu
wariantach efekt jest ten sam i dokładnie taki, jak zgłoszony: pole zdjęcia
umie sięgnąć wyłącznie po zdjęcia już zrobione. Etykieta pola brzmiała przy tym
„Zrób zdjęcie **lub wybierz z galerii**" — obiecywała dwie drogi, a dawała
jedną. Tyle że odwrotnie, niż zakładał pierwotny zapis.

**Decyzja:** pole zdjęcia ma **dwa wejścia**, bo jeden atrybut nie potrafi
obsłużyć obu dróg naraz:

| ścieżka | kontrolka | `accept` | `capture` |
| --- | --- | --- | --- |
| galeria | `ImageDropzone` | pełna lista MIME (z HEIC/HEIF z iPhone'a) | brak |
| aparat | `CameraButton` | `image/*` | `environment` |

`CameraButton` (`src/components/CameraButton.tsx`) trzyma własny ukryty
`<input>` i podaje zdjęcie do tego samego `onDrop`/`onCapture`, co dropzone,
więc podgląd i wysyłka mają jedną ścieżkę. `accept="image/*"` zamiast listy
typów jest tam celowy — to druga rzecz, która potrafi zgasić aparat, a zdjęcie
prosto z aparatu i tak jest JPEG-iem.

Konsekwencje w kopii: dropzone mówi teraz „Wybierz zdjęcie z galerii", a
obietnica aparatu przeniosła się na przycisk („Zrób zdjęcie", w siatce zdjęć
dodatkowych „Zrób kolejne zdjęcie"). Pole zdjęcia kategorii, które wcześniej
miało sam podpis, dostało ten sam układ.

Prop `capture` zniknął z `ImageDropzone` — nie ma już wywołania, które mogłoby
go sensownie ustawić, bo aparat mieszka we własnej kontrolce.

Pilnują tego `tests/photoCapture.test.ts` (atrybuty obu wejść — to one
decydują, który selektor otworzy telefon) oraz `e2e/catalog.spec.ts`
(„…can take a photo, not only pick one" — na prawdziwych ekranach, w mobilnym
Chromium, wraz ze sprawdzeniem, że zdjęcie z aparatu trafia do tego samego
podglądu).

### 3.2. Ekran logowania nie ma przełącznika trybu

`README.md` §13/14 wymaga pod przyciskiem głównym tekstowego przycisku
przełączającego tryb: „Pierwsze uruchomienie — załóż konto" ↔ „Mam już konto —
zaloguj się".

Zaimplementowany jest **wyłącznie kierunek `/setup` → `/login`**
(`src/app/setup/SetupForm.tsx`). Kierunku `/login` → `/setup` **nie ma**.

Powód: obie strony pilnują się nawzajem przez liczbę kont.

```
src/app/login/page.tsx    if (count === 0) redirect('/setup')
src/app/setup/page.tsx    if (count > 0)   redirect(user ? '/' : '/login')
```

Zobaczenie `/login` dowodzi więc, że `count >= 1`; zobaczenie `/setup` dowodzi,
że `count === 0`. Kluczowa jest przy tym **monotoniczność licznika**: istnieje
dokładnie jedna ścieżka usuwania konta (`src/lib/services/users.ts`,
`deleteUser`) i jest ona strzeżona przez `if (totalUsers <= 1) throw`. Liczba
kont przechodzi zatem 0 → ≥1 i **nigdy nie wraca do zera**.

Stąd asymetria:

- **`/login` → `/setup`: martwy na zawsze.** Jesteśmy na `/login` tylko przy
  `count >= 1`, a ta wartość nie może już spaść. Przycisk nigdy, w żadnym
  uruchomieniu aplikacji, nie mógłby nic zrobić — przekierowanie odesłałoby
  użytkownika natychmiast tam, skąd kliknął.
- **`/setup` → `/login`: nieaktywny teraz, ale osiągalny.** Jesteśmy na `/setup`
  przy `count === 0`, ale inny domownik może w tym czasie założyć pierwsze konto
  na innym urządzeniu. Wtedy link działa dokładnie tak, jak zaprojektowano. Wąski
  scenariusz, ale realny — i to jest właśnie sytuacja „kilka osób, jeden NAS",
  dla której ta aplikacja powstała.

Przełącznik w prototypie (`AuthScreens.dc.html`) był stanem lokalnym
(`switchAuth`), bez wiedzy o liczbie kont — tam oba kierunki miały sens.
Kontrolka, która wygląda na nawigację, a w praktyce zwraca użytkownika na ten
sam ekran, jest gorsza niż jej brak.

### 3.3. Kopie stanów pustych dla kategorii są dopisane

`README.md` §02 definiuje stan pusty tylko dla listy przedmiotów („Brak
przedmiotów" / „Nie znaleziono przedmiotów spełniających kryteria."). Ekran
kafelków (`/`) i lista zarządzania (`/categories`) też muszą coś wyrenderować,
gdy kategorii nie ma — a to jest stan **pierwszego uruchomienia**, więc
nieunikniony.

Dopisano najkrótszą kopię w tonie zadanego stanu: „Brak kategorii" / „Dodaj
pierwszą kategorię przyciskiem «+»." Renderuje ją wspólny
`src/components/EmptyState.tsx`, więc zmiana brzmienia to zmiana w jednym
miejscu. Prototyp nigdy nie pokazywał tego stanu, bo jego fixture miał na sztywno
sześć kategorii.

### 3.4. Cykl życia plików zdjęć kategorii

Etap 1 briefu mówi wyłącznie o dodaniu dwóch kolumn i migracji. Zaimplementowano
dodatkowo kasowanie plików (`src/lib/services/categories.ts`):

- przy podmianie zdjęcia kategorii usuwany jest poprzedni plik,
- przy usunięciu kategorii usuwane jest również jej własne zdjęcie.

Powód: bez tego każda podmiana zdjęcia zostawia w `/data/uploads` plik, do
którego nic już nie prowadzi, a usunięcie kategorii zostawia jej zdjęcie, mimo
że zdjęcia jej przedmiotów są poprawnie kasowane dwie linie wyżej. To nie jest
nowa polityka — to polityka, którą `updateItem`/`deleteItem` stosują od początku,
rozszerzona na nową kolumnę. ADR-001 opiera trwałość na jednym wolumenie `/data`
kopiowanym przez Hyper Backup; osierocone oryginały wraz z miniaturami
rosłyby w kopii zapasowej bez końca.

**Kolejność jest istotna:** plik jest odłączany dopiero po tym, jak wiersz
przestał na niego wskazywać. Odwrotna kolejność zostawiłaby przy nieudanym
zapisie kategorię wskazującą na zdjęcie, którego już nie ma.

Uwaga dla recenzji: `discardUploads()` (obecnie `src/lib/storage.ts`) **nie jest
nowym zachowaniem**. Istniał wcześniej jako prywatna funkcja w
`src/app/actions/items.ts`; został przeniesiony i wyeksportowany, żeby akcja
kategorii mogła go użyć. W samym `git diff` przeniesienie wygląda jak dodanie.

### 3.5. Kafelek ikony kategorii odznacza się ponownym kliknięciem

`README.md` §06 opisuje siatkę ikon i stan wybrany, ale nie mówi, jak wybór
cofnąć. Siatka ma osiem kafelków i nie ma kafelka „bez ikony".

Pole `categories.icon` jest jawnie opcjonalne („Opcjonalna", kolumna nullable),
a reguła prezentacji z §„Reguła prezentacji kategorii" ma krok 3
(`newestItemImage`, §3.7). Gdyby wyboru nie dało się cofnąć, kategoria, która raz
dostała ikonę, miałaby ją **na zawsze**, a krok 3 stałby się dla niej
nieosiągalny. Jedynym wyjściem byłoby usunięcie kategorii razem z jej
przedmiotami.

Ponowne kliknięcie wybranej ikony ustawia więc `icon` na `null`
(`src/components/CategoryForm.tsx`). To nie jest dodatkowa funkcja, tylko jedyna
droga do stanu, którego wymaga specyfikacja.

> **Nieaktualne od 2026-08-29 — potrzeba zaspokojona wprost przez specyfikację.**
> Handoff `docs/design_handoff_icon_picker/` zastąpił siatkę ośmiu kafelków
> przyciskiem podglądu i modalem z wyszukiwarką po całej bibliotece Tabler, i
> **sam** przewiduje jawny sposób cofnięcia wyboru: link „Usuń (<Etykieta>)"
> pod przyciskiem „Zmień ikonę" (`src/components/IconPickerField.tsx`).
> Odznaczanie ponownym kliknięciem zniknęło razem z siatką — nie było już
> czego klikać ponownie, a krok 3 reguły prezentacji pozostaje osiągalny.
> Wpis zostaje w tym ADR, bo wyjaśnia, dlaczego pole „Ikona" w ogóle musi mieć
> drogę powrotu do stanu pustego; sam mechanizm nie jest już odstępstwem.

### 3.6. Przycisk czyszczenia wyszukiwarki

`README.md` §02 opisuje wyszukiwarkę bez przycisku czyszczenia. `ActionIcon`
z `IconX` w `rightSection` (`src/components/CategoryItemsList.tsx`) został
**przeniesiony z poprzedniego `ItemsCatalog`**, a nie wymyślony. Usunięcie go w
imię wierności projektowi byłoby cichą regresją funkcjonalną. Pojawia się
dopiero po wpisaniu treści, więc w stanie spoczynku nie zmienia wyglądu pola.

### 3.7. Pole nazywa się `newestItemImage`, a nie `firstItemImage`

`README.md` §„Model danych" zadaje nazwę wprost: „`CategoryWithCount` […]
dostaje dodatkowo `firstItemImage: string | null`". W kodzie pole nazywa się
**`newestItemImage`** (`src/lib/services/categories.ts`). To jedyne odstępstwo
z tej listy dotyczące nazewnictwa, a nie zachowania.

**Nazwa z handoffu nie jest błędna — jest niejednoznaczna.** Sam handoff używa
obu słów o tym samym polu, jeden akapit od siebie:

- linia 49: „`main_image` **najnowszego** przedmiotu w kategorii",
- linia 56: „3. `category.firstItemImage` → zdjęcie **pierwszego** przedmiotu".

Prototyp mówi to samo — etykieta diagnostyczna tej gałęzi to „źródło:
**1. przedmiot**", a stojący za nią kod to `own[0].image` nad tablicą ułożoną od
najnowszego. Oba słowa są synonimami przy założeniu, że „pierwszy" znaczy
„pierwszy na liście", a lista przedmiotów sortuje się domyślnie od najnowszych
(`getItems({ sortOrder: 'newest' })`, `useState('newest')`). W tej ramie nazwa
z handoffu jest poprawna.

Powód zmiany jest węższy i dotyczy trwałości tego założenia: **`first` opisuje
pozycję w porządku, który użytkownik może odwrócić.** Po kliknięciu
„Najstarsze" pierwszym przedmiotem na ekranie jest najstarszy — a pole nadal
zwraca najnowszy, i słusznie, bo kafelek kategorii nie ma zmieniać zdjęcia przez
przełącznik sortowania. Nazwa opisywałaby więc pozycję w widoku domyślnym,
podczas gdy wartość realizuje stałą regułę świeżości. `newestItemImage` nazywa
regułę, a nie widok, i jest zgodna z bogatszym z dwóch sformułowań handoffu
(linia 49 wyróżnia „najnowszego" pogrubieniem).

Koszt zmiany jest zerowy: to alias wyliczany w `SELECT`, a nie kolumna w
schemacie — żadnej migracji, pięć wystąpień w `src/`.

**Świadomy koszt uboczny:** `CategoryWithCount` trafia do design systemu jako
generowany `.d.ts` (`cfg.dtsPropsFor` dla `CategoryTiles`, `CategoriesManager`,
`CategoryVisual` i `ItemForm`), więc projektant czytający handoff i API
komponentu zobaczy w tym jednym miejscu dwie różne nazwy. Rozbieżność jest
zamierzona i odnotowana tutaj oraz w JSDoc przy polu; gdyby handoff był
kiedyś aktualizowany, to jego linia 49 jest tą, za którą warto pójść.

---

## 4. Konsekwencje

### Pozytywne:
- Rozbieżności wobec handoffu są policzalne i uzasadnione. Recenzja może je
  odhaczyć zamiast zgłaszać w kółko.
- Żadne z odstępstw nie zmienia układu, kolorystyki ani typografii — wszystkie
  dotyczą zachowań, których prototyp nie mógł mieć.
- Zapisany jest niesymetryczny argument o liczbie kont (§3.2), który inaczej
  trzeba by wyprowadzać od nowa przy każdej analizie ekranów autoryzacji.

### Negatywne / Koszty:
- Ten dokument jest kolejnym miejscem, które trzeba aktualizować. Jeśli któreś
  odstępstwo zostanie cofnięte, jego sekcja musi zniknąć razem z kodem.
- §3.2 opiera się na inwariancie „liczba kont nigdy nie wraca do zera".
  Dopuszczenie usunięcia ostatniego konta — albo dodanie drugiej ścieżki
  usuwania, która ominie `deleteUser()` — unieważnia to rozumowanie i wymaga
  ponownego rozważenia obu przełączników.
- §3.1 świadomie nie realizuje litery briefu. Jeśli kiedyś powstanie osobne pole
  „zrób zdjęcie", to ono ma dostać `capture`, a nie to.
