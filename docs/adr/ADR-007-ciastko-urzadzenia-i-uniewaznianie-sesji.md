# ADR-007: Ciastko Urządzenia, Unieważnianie Sesji i Ochrona przed CSRF

* **Status:** Zaakceptowany (Accepted)
* **Data:** 2026-08-30
* **Autor:** Przemysław Wrzeszcz

---

## 1. Kontekst i Problem

`ADR-006` zahartował logowanie pod publikację w internecie i zamknął pięć dziur. Przy okazji **zapisał jednak koszt, którego nie umiał wtedy uniknąć**, oraz zostawił dwie rzeczy nierozpoznane. Ten dokument zajmuje się trzema sprawami.

### 1.1. Blokada per-login jest zdalnym wyłącznikiem katalogu

Drabina blokad z `ADR-006` liczy nieudane próby osobno dla nazwy użytkownika i dla adresu klienta. Kubełek `user:` jest wypełniany przez **kogokolwiek**, kto zna nazwę konta — a w instalacji jednoosobowej nazwa konta to zwykle imię właściciela. Pięć błędnych haseł z dowolnego miejsca na świecie i gospodarstwo domowe nie wchodzi do własnego katalogu przez kwadrans. `ADR-006` §4 nazwał to „świadomie zaakceptowane; alternatywą jest brak ochrony". Alternatywa jednak istnieje.

Kubełek `ip:` ma bliźniaczy problem, mniej oczywisty. Polscy operatorzy komórkowi stosują CGNAT — tysiące abonentów dzieli jeden publiczny adres IPv4. Właściciel sprawdzający katalog w sklepie może trafić na blokadę wywołaną przez zupełnie obcą osobę za tym samym adresem.

### 1.2. Sesji nie da się unieważnić

`getCurrentUser` czytał wyłącznie zaszyfrowane ciastko `iron-session` i nigdy bazy. Ciastko jest samowystarczalne: raz wydane, jest ważne przez tydzień i **żadna czynność po stronie serwera nie mogła go cofnąć**. Wynikały z tego dwie rzeczy:

1. **Usunięte konto działało dalej.** `deleteUser` kasował wiersz, ale nikt do wierszy nie zaglądał. Usunięty użytkownik przeglądał katalog jeszcze do tygodnia — a że każdy zalogowany może zarządzać kontami, mógł po prostu założyć sobie nowe.
2. **Zmiana hasła nie wyrzucała nikogo.** To jest odruch, po który sięga się przy podejrzeniu wycieku, i dla usługi w internecie musi coś znaczyć. Nie znaczyła nic.

### 1.3. CSRF nie było ani zweryfikowane, ani opisane

Wszystkie mutacje w aplikacji to Server Actions; jedyny route handler to `GET /api/images`. Next 16 porównuje przy każdym wywołaniu akcji nagłówek `Origin` z `Host`/`X-Forwarded-Host` i przerywa przy niezgodności. Ochrona więc **była**, ale nic jej nie testowało i nigdzie nie było zapisane, że jest — a brak zabezpieczenia wygląda identycznie jak zabezpieczenie zapomniane.

---

## 2. Rozważane Opcje

### 2.1. Jak odróżnić domownika od atakującego przy tej samej nazwie konta

1. **Opcja A (Wybrana): ciastko urządzenia wg OWASP** (Authentication Cheat Sheet, „Slow Down Online Guessing Attacks with Device Cookies"). Po udanym logowaniu serwer wydaje podpisane `{login, nonce}`. Próba z ważnym ciastkiem dla tego konta jest liczona w kubełku prywatnym dla urządzenia; każda inna trafia do kubełków wspólnych.
   - Atakujący z zewnątrz ciastka nie zdobędzie, bo warunkiem jego wydania jest **poprawne** hasło — czyli dokładnie to, co drabina blokad czyni beznadziejnym.
2. **Opcja B: ciastko jako trzeci kubełek obok `user:` i `ip:`.** Odrzucone. Kubełek kluczowany wartością, którą w całości kontroluje klient, nie ogranicza nikogo: atakujący nie wysyła ciastka albo losuje nowe przy każdym żądaniu. Jedynym realnym skutkiem byłoby częstsze blokowanie domownika.
3. **Opcja C: nie robić nic** i zostać przy koszcie z `ADR-006`.

**Zaufana próba omija także kubełek `ip:`, nie tylko `user:`.** Pozostawienie adresu w mocy otwierałoby tę samą dziurę od drugiej strony — patrz CGNAT w §1.1. Skoro posiadanie ciastka uznajemy za dowód wcześniejszego poprawnego uwierzytelnienia, trzymanie nad tym samym żądaniem kubełka adresowego byłoby niekonsekwencją.

### 2.2. Co robić, gdy zaufane urządzenie zacznie zgadywać

1. **Opcja A (Wybrana): spalenie nonce.** Po pięciu błędnych hasłach nonce trafia na czarną listę, kubełek urządzenia znika, a klient spada na ścieżkę wspólną. Złodziej ciastka kupuje sobie pięć prób, jednorazowo.
2. **Opcja B: zwykła drabina blokad w kubełku urządzenia.** Odrzucone: pozwala złodziejowi wracać co 15 minut w nieskończoność.
3. **Opcja C: brak limitu na zaufanym urządzeniu.** Odrzucone wprost — zamieniałoby zabezpieczenie w obejście.

Koszt opcji A: złodziej ciastka może je celowo spalić i **zdegradować** właściciela z powrotem do blokady per-login. Wymaga to jednak uprzedniej kradzieży, a stan po degradacji jest tożsamy ze stanem sprzed tego ADR-a.

### 2.3. Gdzie żyje stan ciastka urządzenia

1. **Opcja A (Wybrana): walidacja bezstanowa.** Ciastko jest uszczelnione (`iron-session`) kluczem wyprowadzonym z `SESSION_SECRET` przez HKDF; serwer nie trzyma listy ważnych nonce'ów. W pamięci procesu żyją tylko liczniki i czarna lista, dokładnie tak jak liczniki z `ADR-006` §2.1.
2. **Opcja B: lista ważnych nonce'ów w pamięci.** Odrzucone: każdy restart kontenera — wdrożenie, reboot NAS-a, aktualizacja DSM — unieważniałby wszystkie urządzenia i cała korzyść parowałaby po każdym deployu.
3. **Opcja C: czarna lista w SQLite.** Rozważane serio. Argument z `ADR-006` §2.1 („atakujący rozdmucha `app.db`") tutaj **nie obowiązuje**, bo wpis powstaje wyłącznie po udanym logowaniu albo po spaleniu istniejącego ciastka — zapisy są ograniczone liczbą urządzeń, nie ruchem atakującego. Odłożone: przy trzech urządzeniach w gospodarstwie migracja i nowa tabela są ceną wyższą niż utrata czarnej listy przy restarcie.

Konsekwencją opcji A jest to, że **kopia ciastka pozostaje ważna** aż do spalenia lub wygaśnięcia. Dlatego świadomie **nie ma rotacji przy każdym logowaniu**: bez stanu serwerowego wymiana ciastka nie unieważnia poprzedniego, więc wyglądałaby na ochronę, nie będąc nią. Nowe ciastko powstaje tylko wtedy, gdy żądanie przyszło bez używalnego.

### 2.4. Czy dokładać własne tokeny CSRF

1. **Opcja A (Wybrana): oprzeć się na wbudowanym sprawdzeniu `Origin` w Next** i **przetestować je**.
2. **Opcja B: tokeny double-submit w każdym formularzu** (`csrf-csrf`, `@edge-csrf/nextjs` albo własne). Odrzucone: biblioteki te celują w Express i route handlery, których tu praktycznie nie ma, a ręczne przewleczenie ukrytego pola przez sześć formularzy i odczyt w każdej akcji to nowa powierzchnia błędu w zamian za drugi zamek w tych samych drzwiach.

---

## 3. Podjęta Decyzja

| Zmiana | Plik |
| --- | --- |
| Ciastko urządzenia `{login, nonce}`, uszczelnione kluczem z HKDF; 400 dni, `httpOnly`, `sameSite: strict` | `src/lib/deviceCookie.ts` |
| Osobna księga liczników dla zaufanego urządzenia; spalanie nonce po 5 porażkach | `src/lib/loginThrottle.ts` |
| Wydanie ciastka po udanym logowaniu i po założeniu pierwszego konta | `src/app/actions/auth.ts` |
| `session_version` na `users`, inkrementowana przy zmianie hasła | `src/db/schema.ts`, `drizzle/0002_lovely_mandarin.sql` |
| Weryfikacja sesji względem bazy w jednym punkcie dławienia | `src/lib/session.ts` |
| `allowedOrigins` z `PUBLIC_ORIGIN` (argument **budowania**) + test e2e sfałszowanego `Origin` | `next.config.mjs`, `Dockerfile`, `e2e/csrf.spec.ts` |
| Log wejścia w blokadę, z podłogą 1 linia / 10 s | `src/lib/loginThrottle.ts` |
| Ciastko sesji `sameSite` z `lax` na `strict` | `src/lib/auth.ts` |

Cztery decyzje szczegółowe warte zapisania, bo każda jest łatwa do odwrócenia „poprawką":

**Ciastko urządzenia nie jest poświadczeniem.** Nikogo nie uwierzytelnia i niczego nie otwiera — decyduje wyłącznie o tym, na który licznik zapisać próbę. Kto je ukradnie, wciąż musi znać hasło. Traktowanie go kiedykolwiek jako dowodu tożsamości byłoby zamianą hamulca w klucz.

**Weryfikacja sesji zawodzi zamknięta.** Gdy baza rzuci wyjątkiem, `getCurrentUser` zwraca `null`. Cisza z SQLite nie jest dowodem, że ciastko jest nadal ważne, a to jedyne drzwi do aplikacji.

**Ciastko bez pola `sessionVersion` czytamy jako wersję 0.** Ciastka wydane przed tą zmianą są jeszcze w obiegu, a każde istniejące konto startuje z zera — dzięki temu samo wdrożenie nie wylogowuje gospodarstwa.

**`PUBLIC_ORIGIN` jest argumentem budowania, nie zmienną kontenera.** Next serializuje `next.config.mjs` do `.next/standalone/server.js`, więc wpis w pliku compose nie zostałby przez nic odczytany. Zmiana publikowanej nazwy hosta wymaga przebudowania obrazu.

---

## 4. Konsekwencje

### Pozytywne:

- Atakujący znający nazwę konta **nie wyłącza już katalogu właścicielowi**. Koszt zapisany w `ADR-006` §4 jako nieunikniony przestaje obowiązywać dla urządzeń, z których kiedykolwiek udało się zalogować.
- Blokada wywołana przez obcą osobę za tym samym adresem CGNAT przestaje dotyczyć domownika.
- „Zmień hasło" znowu coś znaczy: unieważnia wszystkie sesje wydane pod starym hasłem, zostawiając zalogowaną tę przeglądarkę, w której zmiana nastąpiła.
- Usunięcie konta odbiera dostęp natychmiast, także do zdjęć przez `/api/images`.
- Odrzucanie żądań z obcego `Origin` jest przypięte testem, więc regresja się zgłosi.
- Wejście w blokadę zostawia ślad, którego DSM nie zostawi — jego automatyczne blokowanie tych żądań nie widzi.

### Negatywne / Koszty:

- **Kopia ciastka urządzenia pozostaje ważna** do spalenia lub wygaśnięcia; nie ma listy do odwołania. Awaryjna dźwignia to zmiana etykiety `v1` w `getDeviceCookieSecret`, która unieważnia wszystkie naraz.
- **Restart kontenera zeruje czarną listę** spalonych nonce'ów. Wykorzystanie tego wymaga posiadania skradzionego ciastka i trafienia na restart.
- **Każde uwierzytelnione żądanie kosztuje jeden odczyt z bazy** po kluczu głównym. Ten sam rząd wielkości co `getUserCount`, które `requireAuthPage` i tak wykonywało na każdej stronie.
- **`sameSite: strict` psuje jeden scenariusz:** wejście do katalogu z linku klikniętego w cudzej witrynie albo w komunikatorze przychodzi bez ciastka i ląduje na `/login`, skąd wraca dopiero po nawigacji wewnątrz serwisu. Zakładki, adres wpisany ręcznie i zainstalowana PWA działają bez zmian — przeglądarki wysyłają dla nich ciastka `strict`.
- **Zmiana `PUBLIC_ORIGIN` wymaga przebudowania obrazu**, a nie edycji pliku compose.

### Czego to nie rozwiązuje:

- **Zmiana hasła nadal nie wymaga podania starego** i przyjmuje dowolne `userId` z formularza (`src/app/actions/users.ts`). Przejęta sesja — odblokowany telefon, XSS — wciąż pozwala zmienić hasło każdego konta bez ponownego uwierzytelnienia. Świadomie poza zakresem tej zmiany. Różnica względem stanu sprzed niej jest taka, że ofiara ma teraz narzędzie: zmiana hasła faktycznie wyrzuca intruza.
- **Nie ma drugiego składnika uwierzytelniania.** Passkey (WebAuthn) pozostaje otwartym tematem na osobny ADR i jest przy dostępie z internetu największym pojedynczym zyskiem, jaki został.
- **Ciastko wiąże jedno konto.** Jedna przeglądarka, w której logują się dwie osoby, jest zaufana tylko dla tej, która logowała się ostatnia.
- **Ograniczenie prób nadal nie przeżywa wielu procesów** — jak w `ADR-006`.
- **Ruch nieuwierzytelniony nie jest ograniczany co do rozmiaru ani tempa.** Next parsuje ciało żądania Server Action zanim wykona się `requireAuth()`, więc kolejność należy do frameworka, nie do naszego kodu. Jedyne miejsce, gdzie da się to ograniczyć, to nginx DSM — patrz `docs/deployment-synology.md`, etap 8e.
- **CSP nadal dopuszcza `'unsafe-inline'`** w `script-src` — dług zapisany w `ADR-006` §4, nietknięty.
