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

### 3.1. Atrybut `capture` nie jest włączony na dropzonie zdjęcia głównego

`IMPLEMENTATION_PROMPT.md`, etap 5, wymaga: „Wykorzystaj istniejący
`ImageDropzone`, z `capture` dla kamery na mobile."

Prop `capture` **istnieje** w `src/components/ImageDropzone.tsx` i działa
(`inputProps={{ capture: 'environment' }}`), ale **żaden ekran go nie ustawia**.

Powód: `capture` na `<input type="file">` nie zaznacza aparatu jako
domyślnej zakładki w systemowym oknie wyboru — on to okno **zastępuje**. iOS
Safari i Android Chrome otwierają wtedy bezpośrednio aparat, bez dostępu do
galerii i do Plików. Tymczasem kopia tego samego pola, wprost zadana przez
`README.md` §10, brzmi „Zrób zdjęcie **lub wybierz z galerii**". Włączony
`capture` sprawia, że etykieta obiecuje dwie drogi, a pole udostępnia jedną.

Bez `capture` systemowe okno wyboru i tak proponuje aparat jako pierwszą opcję,
więc nie tracimy niczego, a galeria wraca. Koszt pomyłki jest niesymetryczny:
bez `capture` użytkownik nadal może zrobić zdjęcie, z `capture` nie może sięgnąć
po zdjęcia już zrobione — a katalogowanie domu zwykle polega na sfotografowaniu
kilku rzeczy i wprowadzeniu ich później.

Prop zostaje w komponencie na wypadek pola, którego kopia obiecuje wyłącznie
aparat. Zobacz komentarz przy wywołaniu w `src/components/ItemForm.tsx`.

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
(`firstItemImage`). Gdyby wyboru nie dało się cofnąć, kategoria, która raz
dostała ikonę, miałaby ją **na zawsze**, a krok 3 stałby się dla niej
nieosiągalny. Jedynym wyjściem byłoby usunięcie kategorii razem z jej
przedmiotami.

Ponowne kliknięcie wybranej ikony ustawia więc `icon` na `null`
(`src/components/CategoryForm.tsx`). To nie jest dodatkowa funkcja, tylko jedyna
droga do stanu, którego wymaga specyfikacja.

### 3.6. Przycisk czyszczenia wyszukiwarki

`README.md` §02 opisuje wyszukiwarkę bez przycisku czyszczenia. `ActionIcon`
z `IconX` w `rightSection` (`src/components/CategoryItemsList.tsx`) został
**przeniesiony z poprzedniego `ItemsCatalog`**, a nie wymyślony. Usunięcie go w
imię wierności projektowi byłoby cichą regresją funkcjonalną. Pojawia się
dopiero po wpisaniu treści, więc w stanie spoczynku nie zmienia wyglądu pola.

### 3.7. Nazwa `firstItemImage` zostaje, mimo że czyta się myląco

Pole zwraca `main_image` **najnowszego** przedmiotu w kategorii (podzapytanie
`order by created_at desc limit 1`), więc nazwa sugerująca „pierwszy" jest
myląca — recenzja Standards słusznie zaproponowała `newestItemImage`.

Nazwa zostaje, ponieważ `README.md` zadaje ją wprost („`CategoryWithCount` […]
dostaje dodatkowo `firstItemImage: string | null`"), a handoff jest źródłem
prawdy dla nazewnictwa kontraktu. Semantykę opisuje JSDoc przy polu oraz hasło
**Category Visual** w `CONTEXT.md`.

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
