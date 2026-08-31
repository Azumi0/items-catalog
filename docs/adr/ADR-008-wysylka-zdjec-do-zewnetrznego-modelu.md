# ADR-008: Wysyłka Zdjęć Przedmiotów do Zewnętrznego Modelu Multimodalnego

* **Status:** Zaakceptowany (Accepted)
* **Data:** 2026-08-31
* **Autor:** Przemysław Wrzeszcz

---

## 1. Kontekst i Problem

Opis przedmiotu jest polem, którego nikt nie chce wypełniać. Katalog domowy powstaje seriami — dziesięć rzeczy z jednej szuflady, jedna po drugiej — i to opis jest miejscem, w którym ta seria się urywa. Zdjęcie już jest zrobione; pytanie brzmi, czy da się z niego wyprowadzić pierwszą wersję opisu, którą użytkownik poprawi zamiast pisać od zera.

Odpowiedź „tak" wymaga jednak zrobienia czegoś, czego ta aplikacja do tej pory konsekwentnie nie robiła.

### 1.1. Projekt miał dotąd zasadę: żadnego ruchu na zewnątrz

Zasada nie była nigdzie zapisana jako decyzja, ale była egzekwowana i uzasadniana w kodzie. Komentarz przy `placeholderSvg` w `src/lib/images.ts` odrzuca pobranie obrazka zastępczego z CDN, bo:

> the app is self-hosted on a NAS and reached through the DSM reverse proxy, so an outbound request is both an availability dependency on a third party and a leak of browsing activity to it.

`next.config.mjs` przypina `connect-src 'self'`. Ikony Tablera są w bundlu. Czcionki nie są ładowane z zewnątrz. Jedyny route handler serwuje pliki z `/data`. Cała aplikacja, raz zbudowana, działa bez internetu — poza samym dostępem przeglądarki do NAS-a.

Ta funkcja to łamie, i to nie symbolicznie. Wysyłamy do Google **fotografię wnętrza czyjegoś mieszkania**: co ktoś ma, w jakim stanie, czasem z widocznym adresem na przesyłce albo numerem seryjnym na tabliczce. To znacznie więcej niż „leak of browsing activity", którego odmówiliśmy CDN-owi z jednym plikiem SVG.

### 1.2. Sprzeczność, której nie da się zostawić bez komentarza

Gdyby zostawić to bez zapisu, przyszły czytelnik zobaczyłby w jednym pliku komentarz odmawiający pobrania obrazka z CDN ze względów prywatności, a w drugim wywołanie wysyłające zdjęcia do Google. Nie wiedziałby, która zasada obowiązuje — a to jest dokładnie ten rodzaj niejasności, przez który ktoś „porządkuje" jedno albo drugie.

---

## 2. Rozważane Opcje

### 2.1. Czy w ogóle wychodzić na zewnątrz

1. **Opcja A (Wybrana): wywołanie zewnętrznego API, wyłącznie na jawne żądanie użytkownika, wyłączone domyślnie.**
2. **Opcja B: model lokalny na NAS-ie.** Odrzucone. Synology w domowej konfiguracji nie ma GPU, a model multimodalny zdolny przeczytać drobny napis na tabliczce znamionowej nie zmieści się w budżecie CPU i RAM, który ta aplikacja dzieli z resztą DSM. Czas odpowiedzi liczony w minutach nie jest funkcją, tylko jej pozorem.
3. **Opcja C: nie robić tego wcale.** Realna opcja, bo zasada z §1.1 ma wartość. Odrzucona, bo koszt jest ograniczalny (§2.2, §2.3), a korzyść dotyczy jedynego etapu, na którym katalogowanie faktycznie się zatrzymuje.

### 2.2. Jak ograniczyć zakres tego, co wychodzi

Wybrane granice, wszystkie egzekwowane w kodzie:

* **Tylko zdjęcie główne.** Zdjęcia dodatkowe nie opuszczają NAS-a nigdy.
* **Tylko na kliknięcie.** Nie ma generowania przy zapisie, przy uploadzie ani w tle. Jedno kliknięcie to jedno zdjęcie.
* **Domyślnie wyłączone.** Bez `GEMINI_API_KEY` przycisk **nie renderuje się w ogóle** — nie jest wyszarzony, nie ma go w drzewie. Istniejące instalacje po aktualizacji nie zaczynają nic wysyłać.
* **Nic się nie zapisuje samo.** Wynik trafia do pola formularza jako propozycja. Użytkownik akceptuje ją, zapisując przedmiot — dokładnie tak samo jak tekst, który wpisałby sam. `CONTEXT.md` nazywa to **Generated Description** właśnie po to, żeby odróżnić propozycję od zapisanego `Item.description`.

### 2.3. Co nie trafia do logów

Ciało żądania to fotografia mieszkania, a odpowiedź to opis jego zawartości. Kontener loguje do sterownika Synology, który nie podlega tym samym rygorom co wolumen `/data`. Dlatego `src/lib/gemini.ts` **nie loguje ani base64 obrazu, ani treści odpowiedzi modelu** — wyłącznie kod statusu HTTP, bo `401`, który nie zostawia śladu, to zgłoszenie serwisowe, na które nikt nie umie odpowiedzieć. Ten zakaz ma test (`tests/gemini.test.ts`, „logging discipline"), bo inaczej pierwsze `console.error(err)` dorzucone przy debugowaniu cicho by go cofnęło.

### 2.4. Klucz API

Czytany wyłącznie z `process.env.GEMINI_API_KEY` po stronie serwera. Do klienta przechodzi **jedynie boolean** `aiEnabled`, wyliczony przez `isAiConfigured()` w komponencie serwerowym. Klucz nie trafia do żadnej odpowiedzi HTTP ani do bundla.

Nazwa modelu żyje w `GEMINI_MODEL` (domyślnie `gemini-3.5-flash-lite`) i jest czytana w czasie żądania, więc podmiana modelu to restart kontenera, nie przebudowa obrazu.

### 2.5. Czy limitować liczbę wywołań

1. **Opcja A (Wybrana): brak własnego limitu.** Akcja jest za `requireAuth()`, więc dosięgają jej wyłącznie domownicy. Twardy sufit i tak istnieje po stronie Google i jest mapowany na czytelny komunikat (`429` → „Przekroczono limit zapytań do AI").
2. **Opcja B: licznik dzienny w SQLite.** Odrzucone: migracja i nowa tabela pod problem, którego w gospodarstwie domowym nie ma.

Świadomie polegamy tu na granicy uwierzytelnienia. Gdyby katalog kiedykolwiek dostał konta o mniejszym zaufaniu, ta decyzja wymaga rewizji — to jedyne miejsce, w którym zalogowany użytkownik wydaje cudze pieniądze u zewnętrznego dostawcy.

### 2.6. Identyfikator przedmiotu czy same bajty zdjęcia

Endpoint przyjmuje **obraz**, nigdy `itemId`. Formularz pozwala podmienić zdjęcie główne bez zapisu — nie tylko na ekranie dodawania, ale i na edycji, gdzie `newMain.file` przykrywa `keptMain` w podglądzie. Wariant z identyfikatorem opisywałby wtedy zdjęcie z bazy, czyli **to, którego użytkownik nie widzi na ekranie**, i robiłby to bez żadnego błędu. Klient wysyła to, co faktycznie renderuje: `mainImage` (świeży plik) albo `storedFilename` (oryginał już na dysku). Ten drugi przechodzi przez `path.basename()`, tak samo jak w route handlerze obrazków.

Skutek uboczny, dla którego to i tak byłoby warte wyboru: znika przypadek brzegowy „zdjęcie nie jest jeszcze zapisane na serwerze". Nie ma go, bo zapis nigdy nie był warunkiem.

### 2.7. Własny klient HTTP czy oficjalne SDK

Pierwsza wersja tego modułu budowała żądanie ręcznie przez `fetch`, pod hasłem „bez nowych zależności". Ta decyzja została **odwrócona** i warto zapisać dlaczego, bo `@google/genai` jest jedyną zależnością w tym projekcie, która nie jest ani frameworkiem, ani biblioteką UI, ani sterownikiem bazy.

Powód jest empiryczny, nie estetyczny. Pisanie tego modułu ręcznie dało trzy błędy w kształcie API w jednym podejściu:

1. `thinking_level` umieszczony na górnym poziomie żądania zamiast w `generation_config`;
2. rozdzielczość obrazu pod kluczem `media_resolution` zamiast `resolution`;
3. **założenie, że odpowiedź REST zawiera `output_text`** — nie zawiera. To pole jest dodawane przez SDK. Surowy REST zwraca historię `steps[]`, z której tekst trzeba wyjąć samemu.

Trzeci z nich jest tu istotny, bo **nie zgłasza błędu**. Kod z takim założeniem nie wyrzuca wyjątku ani nie loguje niczego — po prostu nie zwraca opisu, dla każdego zdjęcia, aż ktoś to zauważy na produkcji. Dwa pierwsze wyszły z czytania dokumentacji; trzeci też, ale wyłącznie dlatego, że akurat sprawdzono referencję zasobu `Interaction`.

Struktura `steps[]`, po której chodził ręczny parser, **nie jest udokumentowana w referencji REST** — udokumentowana jest właśnie ta wygodna właściwość SDK. Utrzymywanie własnego parsera nieudokumentowanej struktury nie jest oszczędnością; to dług z odroczonym terminem płatności, a terminem jest dowolna zmiana po stronie Google.

**Koszt, przyjęty świadomie:** ~30 MB i ok. 25 paczek tranzytywnie (`protobufjs`, `google-auth-library`, `ws`, `web-streams-polyfill`). W kontekście: `.next/standalone` w tym projekcie waży już ok. 250 MB, głównie przez `sharp` i Next, a do artefaktu trafia wyłącznie to, co Next wytrasuje. Wszystko jest czystym JS, więc Alpine i `linux/amd64` niczego tu nie komplikują. Nowa zależność wchodzi natomiast w procedurę z `docs/agents/dependency-upgrades.md`.

**Co przestało istnieć:** przypięcie `Api-Revision` we własnym nagłówku. Tę rolę przejmuje wersja paczki w `pnpm-lock.yaml`, która i tak jest przypięta dokładnie.

**Czego SDK nie rozwiązuje.** Publicznie eksportuje wyłącznie klasę bazową `ApiError`; konkretne klasy (`RateLimitError`, `AuthenticationError`, `APIConnectionTimeoutError`) nie są w eksportach. Mapowanie błędów opiera się więc na `statusCode` i `name`, a nie na `instanceof` — czyli na danych, które SDK udostępnia, a nie na prywatnych klasach, które może przemianować.

**Pakowanie do obrazu.** SDK celowo **nie** trafia do `serverExternalPackages` w `next.config.mjs`: nie ma natywnego bindingu, więc wchodzi w chunk serwera, a pozostawienie go zbundlowanym omija udokumentowaną tam regresję Next 16 + pnpm (brak symlinków dla pakietów zewnętrznych), która wymagałaby ręcznego trasowania całego drzewa tranzytywnego. Zweryfikowane: w bundlu **CJS**, czyli w formie, jaką Next emituje dla serwera, `interactions.create` działa. W bundlu **ESM** nie działa — `google-auth-library` robi dynamiczne `require('child_process')`. Gdyby przyszła wersja Next zaczęła emitować serwer w ESM, to jest pierwsza rzecz do sprawdzenia.

**Skrypty instalacyjne są wyłączone** (`allowBuilds` w `pnpm-workspace.yaml`, oba na `false`). Sprawdzone: `postinstall` w `protobufjs` tylko drukuje ostrzeżenie o schemacie wersji, a skrypt `prepare` z `@google/genai` nie istnieje w opublikowanej paczce. SDK działa bez nich — zweryfikowane wywołaniem przeciwko lokalnemu serwerowi HTTP. Trzymanie ich na `false` nie wpuszcza obcych skryptów do budowania obrazu.

### 2.8. Ponawianie żądań i budżet czasu

Wszystkie liczby poniżej są **zmierzone** przeciwko lokalnemu serwerowi HTTP, nie wzięte z dokumentacji — dokumentacja nie podaje żadnej z nich.

#### `timeout_ms` liczy się na próbę, nie na całe wywołanie

To jest fakt, który przewraca intuicję, i jedyny powód, dla którego reszta tej sekcji istnieje. `timeout_ms` ogranicza **pojedynczą próbę**. Przy domyślnej polityce SDK i `timeout_ms: 30_000` zawieszony endpoint potrzebuje **156,4 s**, żeby pokazać użytkownikowi błąd — pięć prób po 30 s plus backoff. Preloader kręci się dwie i pół minuty przy budżecie nazwanym „30 sekund".

#### Domyślna polityka SDK

| Status | Prób | Czas |
| --- | --- | --- |
| 400, 401, 403 | 1 | natychmiast |
| 408, 429, 500, 502, 503 | **5** | ~6,6–7,0 s (backoff 450 → 900 → 1800 → 3900 ms) |

Dwie rzeczy są w tym nie do przyjęcia. Po pierwsze, **429 jest ponawiane**, czyli dobijamy limit, który gospodarstwo już wyczerpało — wprost przeciw §2.5, gdzie limit Google uznajemy za nasz jedyny sufit. Po drugie, **payload leci w całości przy każdej próbie**: zmierzone 49 KB → 244 KB, dokładnie pięciokrotnie. Przy realnym obrazie 2–4 MB (§3) to **10–20 MB wysłane z NAS-a na jedno nieudane kliknięcie**, po łączu, którego pasmo w górę jest wąskie.

#### Przyjęta konfiguracja

```ts
timeout_ms: ATTEMPT_TIMEOUT_MS,          // 29 750 ms, wyliczone
retries: {
  strategy: 'attempt-count-backoff',
  maxRetries: 1,
  retryConnectionErrors: true,
},
retry_codes: ['5XX', '408'],
```

* **Budżet całkowity 60 s**, jedna próba ponowna. Wartość na próbę jest **wyliczana** z `TOTAL_BUDGET_MS`, `MAX_RETRIES` i zmierzonego backoffu, a nie wpisana obok — dzięki temu podniesienie jednej liczby bez drugiej nie może po cichu przekroczyć budżetu. Pilnuje tego test.
* **`retry_codes` bez 429.** Limit nie zwalnia się po 450 ms, a jedyną ponowną próbę warto wydać na coś, co może się udać.
* **`retryConnectionErrors: true`** — domyślnie **wyłączone**, i to nie jest szczegół. Bez tego ponowna próba obejmowałaby 5xx od Google, ale **nie** zerwane czy zawieszone połączenie, które przy NAS-ie za domowym łączem jest awarią bardziej prawdopodobną. To także jest to, co nadaje budżetowi 60 s sens: z wyłączonymi błędami połączenia zwis kończył się po jednej próbie i połowa budżetu nigdy nie była używana.

Zweryfikowane zachowanie końcowe:

| Przypadek | Prób | Czas | Wysłano |
| --- | --- | --- | --- |
| 429 (limit) | 1 | 0,0 s | 1× |
| 401 (zły klucz) | 1 | 0,0 s | 1× |
| 503 (przejściowy) | 2 | 0,4 s | 2× |
| zwis (najgorszy przypadek) | 2 | **59,9 s** | 2× |

#### Odrzucone

* **Ponawianie wyłączone całkowicie** (`strategy: 'none'`) — pierwotna decyzja, zmieniona. Przejściowe 5xx i zerwane połączenia naprawiają się przy drugiej próbie, a przerzucanie tego na użytkownika jako kolejne kliknięcie jest gorsze niż zapłacenie za jedną ponowną próbę.
* **Domyślna polityka SDK** — 156 s przed komunikatem i pięciokrotny transfer.
* **Utrzymanie budżetu 30 s przy jednej próbie ponownej** — wymagałoby zejścia do ~14,75 s na próbę, a generowanie opisu z obrazu 9,4 Mpix bywa wolniejsze. Zamieniałoby to udane generowania w timeouty: pewna szkoda na ścieżce właściwej za niepewny zysk na awaryjnej. Dlatego rozluźniony został budżet całkowity, a nie budżet pojedynczej próby.

---

## 3. Rozmiar Wysyłanego Obrazu

Obraz jest skalowany przed wysyłką do progu **powierzchni**, nie dłuższego boku: `MAX_IMAGE_PIXELS = 9 437 184` px (`src/lib/gemini.ts`).

Próg liczony powierzchnią, bo próg na dłuższym boku zachowuje się różnie dla kadru poziomego i pionowego — to samo zdjęcie obrócone o ćwierć obrotu dostawałoby inny budżet, a kadr 4:3 w poziomie przekraczałby zamierzony sufit. 9 437 184 px to dokładnie 4096 × 2304 przy 16:9 i 3547 × 2660 przy 4:3.

**Czego to nie oszczędza: tokenów.** Gemini 3 liczy obraz ryczałtem zależnym od `resolution` (`high` = 1120 tokenów), a nie od liczby pikseli. Zdjęcie 12 Mpix i to samo zdjęcie w 1024 px kosztują tyle samo. Pierwotne uzasadnienie „mniej tokenów" było nietrafne i nie jest powodem, dla którego ta stała istnieje.

**Co to naprawdę kupuje:** czytelność drobnych napisów, których prompt każe nie zgadywać, tylko przepisać dosłownie. Etykieta czytelna w oryginale przestaje być czytelna po zejściu do 1024 px, a wtedy `resolution: high` nie ma czego czytać.

**Co to kosztuje:** czas uploadu z domowego łącza — przy 9,4 Mpix i JPEG q85 rzędu 2–4 MB na kliknięcie, przy budżecie 60 s na całość (§2.8). Google i tak zredukuje obraz do własnego budżetu tokenowego, a dokumentacja **nie ujawnia**, przy jakiej rozdzielczości to robi — więc korzyść powyżej pewnego progu jest niepotwierdzona, a koszt realny.

Dlatego stała jest stałą z nazwą, a nie liczbą wklejoną w wywołanie: **jeśli czas oczekiwania okaże się za długi, obniża się ją w jednym miejscu**, bez dotykania niczego innego.

Ta sama logika dotyczy `DESCRIPTION_PROMPT`, wyeksportowanego z `src/lib/gemini.ts`. Prompt jest pokrętłem, które na pewno będzie kręcone, gdy opisy zaczną wracać nie takie, jakich oczekujemy — trzymanie go jako literału wewnątrz budowania żądania byłoby złym kształtem dla rzeczy przewidzianej do strojenia.

---

## 4. Decyzje Techniczne Warte Zapamiętania

* **`thinking_level: 'low'`.** Rodzina Gemini 3 domyślnie myśli na poziomie `high`, celowanym w planowanie wieloetapowe i generowanie kodu — nie w trzy zdania o zdjęciu. Google nie publikuje wskazówek dla opisywania obrazów ani OCR, a w opublikowanych benchmarkach wizyjnych głębsze myślenie nie wygrywa w sposób pewny. Co robi pewnie, to opóźnia pierwszy token, podczas gdy użytkownik stoi przed preloaderem.
* **Structured output z JSON Schema**, nie parsowanie wolnego tekstu. Odpowiedź tekstowa przychodzi opakowana w to, co modelowi przyjdzie do głowy („Oto opis:", płotek markdown, oferta rozwinięcia), a każde takie opakowanie trzeba by zdejmować regexem, który będzie zły dla następnej wersji modelu.
* **`Api-Revision: 2026-05-20`** przypięte w nagłówku, z tego samego powodu, dla którego `Dockerfile` przypina `node:24.18.0-alpine` zamiast `node:24-alpine`: kształty, które ten moduł buduje i parsuje, są kontraktem, a kontrakt zmieniający się pod działającym kontenerem to awaria, której nikt nie odtworzy.
* **`.rotate()` przed pomiarem i skalowaniem**, a wymiary czytane z `metadata().autoOrient`, nie z `width`/`height`. Te ostatnie opisują piksele zapisane w pliku, czyli dla zdjęcia z telefonu — leżące na boku. Budowanie z nich ramki skalowania zmniejszało zdjęcie pionowe do połowy dozwolonych pikseli; złapał to test, nie recenzja.
* **`Api-Revision` / ręczny `fetch` — usunięte** na rzecz `@google/genai`; uzasadnienie w §2.7, wyłączenie ponawiania w §2.8.
* **Skalowanie nadal na `sharp`**, który był już w projekcie. SDK odpowiada wyłącznie za warstwę HTTP i kształt żądania.

---

## 5. Konsekwencje

**Pozytywne:**

* Opis, czyli jedyne pole, na którym katalogowanie realnie się zatrzymuje, ma teraz punkt startowy.
* Funkcja jest w pełni opcjonalna i wyłączona domyślnie; instalacja bez klucza zachowuje dotychczasową właściwość „działa bez internetu".
* Wyjątek od zasady z §1.1 jest zapisany, więc przestaje wyglądać na przeoczenie.

**Negatywne / zaakceptowane koszty:**

* Zdjęcia opuszczają NAS. Nie da się tego ograniczyć poniżej „jedno zdjęcie na kliknięcie" bez rezygnacji z funkcji.
* Powstaje zależność dostępnościowa od Google dla tej jednej ścieżki. Reszta katalogu jest od niej niezależna, a każdy tryb awarii ma własny komunikat zamiast „coś poszło nie tak".
* Model potrafi się mylić. Prompt zakazuje zgadywania marki, pochodzenia, materiału i wartości właśnie dlatego, że zmyślone obserwacje czytają się identycznie jak prawdziwe — ale zakaz w promptcie to nie gwarancja. Ostatnią instancją jest użytkownik, który musi zapisać formularz sam; dlatego generowanie **nigdy** nie zapisuje.

---

## 6. Powiązane Dokumenty

* `docs/adr/ADR-001-item-catalog-pwa-architecture.md` — architektura, w tym decyzja o Server Actions zamiast REST API, której ta funkcja się trzyma.
* `docs/adr/ADR-003-page-level-authorization-invariant.md` — `requireAuth()` w każdej Server Action; `generateDescriptionAction` nie jest wyjątkiem.
* `docs/adr/ADR-006-hartowanie-pod-dostep-z-internetu.md` — kontekst „ta aplikacja jest w internecie", z którego wynika §2.5.
* `src/lib/images.ts` — komentarz przy `placeholderSvg`, czyli zasada, od której ten ADR jest wyjątkiem.
