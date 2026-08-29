# ADR-006: Hartowanie Aplikacji pod Dostęp z Internetu

* **Status:** Zaakceptowany (Accepted)
* **Data:** 2026-08-29
* **Autor:** Przemysław Wrzeszcz

---

## 1. Kontekst i Problem

Do tej pory katalog był projektowany pod jeden scenariusz: NAS w domu, przeglądarka w tej samej sieci. `ADR-001` opisuje aplikację jako prywatną instalację domową, a próg wejścia dla atakującego był w praktyce równy dostępowi do LAN-u.

Scenariusz się zmienił. Wymaganie brzmi: przedmioty dodaję w domu, ale chcę je **odczytywać będąc poza domem** — na przykład w sklepie, żeby nie kupić figurki, którą już mam. Realizacja to przekierowanie portu 443 na routerze i publikacja `https://katalog.<ddns>.synology.me` w internecie (etap 8 w `docs/deployment-synology.md`).

To przesuwa granicę zaufania: formularz logowania staje się jedynym zamkiem, a stoi przed nim cały internet, nie domownik. Przegląd kodu przed publikacją znalazł pięć rzeczy, które w LAN-ie były akceptowalne, a po wystawieniu przestają być:

1. **Brak jakiegokolwiek ograniczenia liczby prób logowania.** `loginAction` przyjmował nieskończenie wiele zgadywań. Jedynym hamulcem był koszt bcrypt (10 rund, ~80 ms), co daje atakującemu kilkanaście prób na sekundę — tempo wystarczające, by przejść słownik popularnych haseł w kilka dni.
2. **Minimalna długość hasła równa 4 znakom.** Przestrzeń czterech znaków mieści się w słowniku w całości.
3. **Wyciek listy istniejących kont przez czas odpowiedzi.** `authenticateUser` zwracał `null` natychmiast, gdy nazwa użytkownika nie istniała, a dopiero dla istniejącej płacił pełne bcrypt. Różnica jest mierzalna przez sieć i zamienia formularz w wyrocznię „czy takie konto istnieje" — istotne, bo jedyne konto w tej instalacji nazywa się zwykle jak jego właściciel.
4. **Brak nagłówków bezpieczeństwa.** Żadnego CSP, `X-Frame-Options`, `nosniff` ani `Referrer-Policy`.
5. **`image/svg+xml` na liście typów MIME trasy `/api/images`.** Nieosiągalne w praktyce (`saveImage` przyjmuje tylko rozszerzenia rastrowe), ale SVG serwowany z tego samego origin wykonuje skrypt z uprawnieniami sesji.

Osobno warto odnotować, czego **nie** rozwiązuje warstwa systemowa: automatyczne blokowanie DSM reaguje na nieudane logowania do usług Synology. Logowania do tej aplikacji przechodzą przez odwrotny serwer proxy do procesu Node i nie są DSM-owi w ogóle raportowane. Nie ma więc zewnętrznego mechanizmu, na którym można by się oprzeć — ograniczenie prób musi żyć w aplikacji.

---

## 2. Rozważane Opcje

### 2.1. Gdzie trzymać stan licznika prób

1. **Opcja A (Wybrana): mapa w pamięci procesu.**
   - Aplikacja działa jako pojedynczy proces Node w jednym kontenerze, więc mapa jest wystarczająca.
   - Ścieżka logowania pozostaje wolna od zapisów do bazy.
   - *Koszt:* restart kontenera wybacza wszystkie zapamiętane porażki.

2. **Opcja B: tabela w SQLite.**
   - Przeżywa restart.
   - *Wady:* daje nieuwierzytelnionemu atakującemu możliwość rozdmuchania `app.db` na wolumenie NAS-a bez ograniczeń — zamienia problem z logowaniem na problem z dyskiem. Dokłada też zapis do bazy na każdą nieudaną próbę, czyli dokładnie tam, gdzie atakujący ma najwięcej ruchu.

Koszt opcji A jest akceptowalny, ponieważ restart kontenera nie jest zdarzeniem, które atakujący z zewnątrz potrafi wywołać.

### 2.2. Blokada czasowa czy opóźnianie odpowiedzi

1. **Opcja A (Wybrana): rosnąca blokada czasowa** — 5 błędnych haseł, potem kolejno 60 s, 120 s, 300 s, 900 s.
2. **Opcja B: sztuczne opóźnienie każdej odpowiedzi** — nie wymaga blokady, ale trzyma otwarte żądanie po stronie serwera, co samo w sobie jest wektorem wyczerpania zasobów na sprzęcie NAS-a.

Każdy schemat blokady pozwala atakującemu, który zna nazwę użytkownika, zablokować prawowitego właściciela. Tutaj gospodarstwo domowe jest jedno, więc skutek jest odczuwalny. Dlatego drabina **zatrzymuje się na 15 minutach** zamiast piąć się do godziny: pięć prób na kwadrans czyni zgadywanie online beznadziejnym, a jednocześnie najgorszy przypadek — właściciel w sklepie trafiający na cudzy atak — to kwadrans czekania, nie stracony wieczór.

### 2.3. Czy Content-Security-Policy z nonce

1. **Opcja A (Wybrana): CSP z `script-src 'self' 'unsafe-inline'`.**
2. **Opcja B: CSP oparte na nonce**, przekazywanym z `proxy.ts` do każdego punktu wejścia.

Next.js wstawia własne skrypty inline (bootstrap, strumień RSC), więc bez nonce `'unsafe-inline'` jest konieczne. Opcja B jest ściślejsza, ale to zmiana znacznie większa niż całość tego ADR-a i łatwo ją zepsuć w sposób niewidoczny do czasu, aż coś przestanie się renderować w telefonie. Wybrane CSP mimo tej dziury nadal odcina ładowanie z obcych origin, zabija clickjacking (`frame-ancestors 'none'`), blokuje przekierowanie formularza na cudzy zbieracz (`form-action 'self'`) i pozbawia wstrzyknięty skrypt miejsca, dokąd mógłby cokolwiek wysłać (`connect-src 'self'`).

---

## 3. Podjęta Decyzja

Pięć zmian, wszystkie po stronie aplikacji:

| Zmiana | Plik |
| --- | --- |
| Ograniczenie prób logowania: 5 błędnych haseł → blokada 60 s, eskalująca do 15 min; osobne liczniki dla nazwy użytkownika i adresu klienta | `src/lib/loginThrottle.ts`, `src/app/actions/auth.ts` |
| Adres klienta czytany z **prawej** strony `X-Forwarded-For` | `src/lib/requestIp.ts` |
| `MIN_PASSWORD_LENGTH` z 4 na 12 | `src/lib/services/users.ts` |
| Porównanie z hashem-wabikiem, gdy konto nie istnieje | `src/lib/auth.ts`, `src/lib/services/users.ts` |
| Nagłówki bezpieczeństwa (CSP, `nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`), brak `X-Powered-By` | `next.config.mjs` |
| Usunięcie `image/svg+xml` z listy typów MIME i `nosniff` na odpowiedzi | `src/app/api/images/[type]/[filename]/route.ts` |

Dwie decyzje szczegółowe warte zapisania, bo obie są łatwe do odwrócenia „poprawką":

**Adres klienta bierzemy z prawej, nie z lewej strony `X-Forwarded-For`.** Odwrotny serwer proxy DSM jest skonfigurowany (etap 8c przewodnika) na `$proxy_add_x_forwarded_for`, czyli **dopisuje** rzeczywistego rozmówcę do tego, co przysłał klient. Skrajnie lewy wpis jest w całości sterowany przez klienta — czytanie go pozwoliłoby podać nowy adres przy każdym żądaniu i przejść obok licznika. Skrajnie prawy to jedyna wartość w tym nagłówku, której nadawca nie może podrobić.

**`Strict-Transport-Security` celowo nie jest ustawiany w aplikacji.** Dodaje go odwrotny serwer proxy DSM (widoczny w odpowiedzi jako `max-age=15768000`). Drugi egzemplarz z aplikacji oznaczałby dwie sprzeczne wartości `max-age` w jednej odpowiedzi.

---

## 4. Konsekwencje

### Pozytywne:

- Zgadywanie hasła online przestaje być opłacalne: po piątej próbie tempo spada do 5 prób na kwadrans.
- Formularz logowania nie zdradza już, które nazwy kont istnieją.
- Skompromitowany lub złośliwy skrypt na stronie nie ma dokąd wysłać danych ani skąd dociągnąć ładunku.
- Katalog nie da się osadzić w ramce na cudzej stronie.

### Negatywne / Koszty:

- **Atakujący znający nazwę użytkownika może zablokować właściciela** na maksymalnie 15 minut. Świadomie zaakceptowane; alternatywą jest brak ochrony.
- **Restart kontenera zeruje liczniki.** Akceptowalne, bo restart nie jest w zasięgu atakującego.
- **Hasła krótsze niż 12 znaków przestają przechodzić** przy zakładaniu konta i zmianie hasła. Konta założone wcześniej działają dalej — walidacja obowiązuje tylko przy zapisie.
- **CSP dopuszcza `'unsafe-inline'` w `script-src`.** Ochrona przed XSS jest więc częściowa; pełną daje dopiero wariant z nonce, świadomie odłożony.
- **Ograniczenie prób nie przeżywa wielu procesów.** Gdyby aplikacja kiedykolwiek działała w więcej niż jednej replice, licznik przestanie być wspólny i trzeba wrócić do tej decyzji.

### Czego to nie rozwiązuje:

- Nie ma drugiego składnika uwierzytelniania. Przy wystawieniu na internet jedynym sekretem pozostaje hasło.
- Wszyscy zalogowani użytkownicy mają te same uprawnienia, łącznie z zarządzaniem kontami (`src/app/actions/users.ts`). Dla instalacji jednoosobowej to bez znaczenia, ale nie jest to model ról.
- Bezpieczeństwo warstwy sieciowej (zapora DSM, ograniczenie geograficzne, przekierowanie portu) leży poza aplikacją i jest opisane w `docs/deployment-synology.md`.
