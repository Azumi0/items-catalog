# Wdrożenie Home Item Catalog na Synology Container Manager

> Przewodnik wdrożeniowy. Pliki, do których się odwołuje: [`docker-compose.synology.yml`](../docker-compose.synology.yml), [`README.md`](../README.md), [`docs/adr/ADR-001-item-catalog-pwa-architecture.md`](adr/ADR-001-item-catalog-pwa-architecture.md).

Ścieżka: build obrazu na PC → eksport do `.tar` → import w Container Manager → projekt docker-compose → autostart → HTTPS przez reverse proxy DSM.

---

## Zanim zaczniesz — trzy rzeczy specyficzne dla tego projektu

Wynikają z kodu, nie z dokumentacji, i każda potrafi zablokować wdrożenie:

**1. Logowanie zadziała dopiero po HTTPS.** W `src/lib/auth.ts` ciasteczko sesji ma `secure: process.env.NODE_ENV === 'production'`. W kontenerze `NODE_ENV=production`, więc przeglądarka odrzuci ciasteczko wysłane po `http://IP:3000` — zobaczysz nieskończoną pętlę powrotu na `/login`. Reverse proxy z certyfikatem nie jest tu kosmetyką, tylko warunkiem działania. Wyjątek: `http://localhost:3000` na tej samej maszynie działa, bo `localhost` jest traktowany jako secure origin — to przydaje się do testu na PC.

**2. Zmienna to `DATA_DIR`, nie `DATA_PATH`.** Wcześniejsze wersje `README.md` i przykładowego compose podawały `DATA_PATH` — ta nazwa nie występuje nigdzie w kodzie (`src/lib/storage.ts`, `src/db/index.ts` czytają `DATA_DIR`). Oba pliki są już poprawione; gdybyś napotkał `DATA_PATH` w starszej kopii, to literówka, nie alias.

**3. `SESSION_SECRET` ma wbudowany fallback.** Bez tej zmiennej aplikacja użyje stałego sekretu zapisanego w repozytorium — każdy, kto zna kod, może podrobić ciasteczko sesji. Wygeneruj własny.

---

## Etap 1 — Build obrazu na PC

Docker Desktop, PowerShell w katalogu projektu:

```powershell
cd C:\work\priv\items-catalog
docker build -t home-item-catalog:1.0.0 -t home-item-catalog:latest .
```

Build trwa zwykle 5–15 minut — kompiluje natywnie `better-sqlite3` i `sharp`, stąd `python3 make g++` w warstwie bazowej.

Wersja Node w obrazie jest związana z wersją pnpm: `package.json` przypina `pnpm@11.15.1`, a pnpm 11 korzysta z wbudowanego modułu `node:sqlite` i wymaga Node ≥ 22.13 — stąd `node:22-alpine`. Dockerfile robi samo `corepack enable` (bez `pnpm@latest`), więc obraz zawsze bierze dokładnie wersję z pola `packageManager`. Podnosząc pnpm, sprawdź jednocześnie wymagane Node.

**Jeśli build wywali się na `pnpm exec esbuild`** (`esbuild: not found`): `esbuild` jest tylko zależnością przechodnią `drizzle-kit`, a pnpm nie linkuje binarek zależności przechodnich do `node_modules/.bin`. Napraw raz w repo:

```powershell
pnpm add -D esbuild
docker build -t home-item-catalog:1.0.0 -t home-item-catalog:latest .
```

Potwierdź architekturę — musi być `amd64`:

```powershell
docker image inspect home-item-catalog:1.0.0 --format "{{.Os}}/{{.Architecture}}"
```

### Test lokalny (warto, oszczędza rundę przez NAS)

```powershell
docker run --rm -p 3000:3000 -v ${PWD}\data-test:/data -e SESSION_SECRET=test-test-test-test-test-test-32 home-item-catalog:1.0.0
```

Otwórz `http://localhost:3000` → powinno przekierować na `/setup`. Załóż konto, dodaj przedmiot ze zdjęciem — sprawdzasz od razu ścieżkę `sharp` i zapis na wolumen. Potem `Ctrl+C` i skasuj `data-test`.

---

## Etap 2 — Eksport obrazu do pliku

```powershell
docker save home-item-catalog:1.0.0 -o C:\work\priv\items-catalog\home-item-catalog-1.0.0.tar
```

Spodziewaj się 400–700 MB. Nie pakuj do `.tar.gz` — Container Manager oczekuje surowego `.tar`.

---

## Etap 3 — Import obrazu w Container Manager

To ekran, który już masz otwarty: **Container Manager → Obraz → Akcja → Importuj → Dodaj z pliku**.

Dwa warianty, wybierz jeden:

| Wariant | Kiedy | Jak |
| --- | --- | --- |
| **Z urządzenia lokalnego** | plik < ~500 MB, dobre połączenie | wskazujesz `.tar` bezpośrednio z dysku PC, upload leci przez przeglądarkę |
| **Z tego systemu DSM** | duży plik, pewniejsze | najpierw File Station → wgraj `.tar` do `/docker/items-catalog/`, potem wskaż go z DSM |

Import trwa kilka minut. Po zakończeniu na liście **Obraz** pojawi się `home-item-catalog:1.0.0` obok istniejącego `jacobalberty/unifi`. Plik `.tar` możesz wtedy skasować.

---

## Etap 4 — Foldery i uprawnienia na NAS

W File Station utwórz strukturę (folder współdzielony `docker` zwykle już istnieje):

```
/docker/items-catalog/
├── docker-compose.yml
└── data/
```

Katalog `data/` zostaw pusty — `entrypoint.sh` sam utworzy w nim `uploads/originals` i `uploads/thumbs`, a migracja Drizzle założy `app.db`.

### Ustal PUID i PGID

Panel sterowania → Terminal i SNMP → włącz SSH. Potem z PowerShella:

```powershell
ssh twoj_login@IP_NAS
id
```

Wynik w stylu `uid=1026(twoj_login) gid=100(users)` — te dwie liczby wpisujesz do compose. Jeśli wychodzi coś innego niż 1026/100, popraw wartości. SSH możesz potem wyłączyć.

W File Station nadaj też swojemu użytkownikowi pełne uprawnienia do `items-catalog` (prawy klik → Właściwości → Uprawnienia → zastosuj do podfolderów).

---

## Etap 5 — Projekt docker-compose

**Container Manager → Projekt → Utwórz**

| Pole | Wartość |
| --- | --- |
| Nazwa projektu | `items-catalog` (tylko małe litery, cyfry, myślnik) |
| Ścieżka | `/docker/items-catalog` |
| Źródło | *Utwórz docker-compose.yml* i wklej treść poniżej |

Plik `docker-compose.synology.yml` jest już w Twoim repozytorium — możesz go po prostu wkleić stąd:

```yaml
services:
  item-catalog:
    image: home-item-catalog:1.0.0
    container_name: item-catalog
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:3000"
    volumes:
      - ./data:/data
    environment:
      - NODE_ENV=production
      - DATA_DIR=/data
      - PUID=1026
      - PGID=100
      - SESSION_SECRET=WKLEJ-TU-WLASNY-LOSOWY-CIAG
```

Wygeneruj sekret na PC i podmień ostatnią wartość:

```powershell
-join ((48..57)+(97..122) | Get-Random -Count 48 | % {[char]$_})
```

### Dlaczego port na `127.0.0.1`

Mapowanie `127.0.0.1:3000:3000` wystawia port wyłącznie na pętlę zwrotną NAS-a. Odwrotny serwer proxy DSM to nginx działający na hoście, więc dosięgnie `localhost:3000` bez przeszkód — ale z LAN-u port 3000 po prostu nie istnieje. Jedyną drogą do aplikacji jest HTTPS przez proxy, czyli dokładnie to, czego chcesz.

Cena: nie podejrzysz aplikacji po `http://192.168.1.100:3000` nawet do szybkiego sprawdzenia. Jeśli w etapie 6 coś nie zagra i będziesz chciał zobaczyć, czy serwer w ogóle odpowiada, zmień mapowanie tymczasowo na `"3000:3000"` albo sprawdź przez SSH: `curl -I http://localhost:3000/login`.

### Dlaczego nie ma sekcji `logging:`

Kusi, żeby dopisać `logging: driver: json-file` z `max-size`/`max-file` — to standardowy sposób na rotację logów i na zwykłym Dockerze jest słuszny. Na DSM ma jednak skutek uboczny, który kosztuje godzinę diagnozy: demon Dockera na Synology używa własnego sterownika logów (`db`), a zakładka **Dziennik** w Container Managerze czyta właśnie z tej bazy. Jawne nadpisanie sterownika przekierowuje strumienie kontenera do pliku `*-json.log` na wolumenie i GUI pokazuje wtedy **„Brak dostępnych dzienników"** — mimo że kontener działa poprawnie i normalnie loguje.

Dlatego compose powyżej nie ustawia sterownika. Zostajesz z rotacją, którą prowadzi Synology, w zamian za działający podgląd logów w GUI. Ta aplikacja loguje kilka linii na starcie plus żądania HTTP, więc rozmiar logu nie jest tu realnym zagrożeniem.

### Dlaczego nie plik z repo

`docker-compose.yml` w repozytorium ma sekcję `build:`. Gdybyś go użył, Container Manager próbowałby zbudować Next.js na NAS-ie — kilkadziesiąt minut i realne ryzyko OOM przy kompilacji `sharp`. Wersja z `image:` tylko uruchamia gotowy obraz.

Dalej → ekran Web Station pomiń → Gotowe. Projekt sam wykona „Kompiluj" (tu: tylko `up -d`) i wystartuje kontener.

**Jeśli zobaczysz błąd `pull access denied`** — Container Manager próbuje pobrać obraz z rejestru zamiast użyć lokalnego. Sprawdź, czy tag w compose dokładnie odpowiada temu z listy Obraz (włącznie z `:1.0.0`), a jeśli tak, dodaj do usługi linię `pull_policy: never`.

## Etap 6 — Weryfikacja pierwszego startu

**Container Manager → Kontener → item-catalog → Dziennik.** Oczekiwany przebieg:

```
Starting Home Item Catalog...
Using PUID: 1026, PGID: 100
Running database migrations...
Migrations completed successfully.
Starting server...
▲ Next.js 15.x  - Local: http://0.0.0.0:3000
```

W File Station w `/docker/items-catalog/data/` powinny pojawić się `app.db`, `app.db-wal` i katalog `uploads/`.

Portu 3000 nie ma z czego sprawdzić przeglądarką — jest przypięty do pętli zwrotnej. Dziennik kontenera plus obecność `app.db` to komplet dowodów, że aplikacja wstała. Jeśli chcesz twardego potwierdzenia, przez SSH:

```bash
curl -I http://localhost:3000/login
```

### Typowe problemy

| Objaw | Przyczyna | Naprawa |
| --- | --- | --- |
| kontener gaśnie od razu, `no such file or directory` | `entrypoint.sh` z końcami linii CRLF — jądro szuka interpretera `/bin/sh\r` | `.gitattributes` w repo wymusza `eol=lf`; przy starszym klonie `git add --renormalize .` i odświeżenie working copy, potem przebuduj obraz |
| `EACCES` / `permission denied` przy `/data` | PUID/PGID nie pasuje do właściciela folderu | popraw wartości z `id`, uprawnienia folderu w File Station |
| kontener restartuje w pętli | błąd migracji albo brak `/data` | dziennik kontenera pokaże dokładny wyjątek |
| `port is already allocated` | 3000 zajęty na loopbacku przez inną usługę | zmień na `"127.0.0.1:3100:3000"` i popraw port docelowy w reverse proxy |
| logowanie wraca na `/login` | dostęp po HTTP | dokończ etap 8 — to nie jest błąd aplikacji |
| zakładka **Dziennik** pusta („Brak dostępnych dzienników"), choć kontener działa | w compose ustawiony `logging: driver: json-file` — logi omijają bazę, z której czyta GUI DSM | usuń sekcję `logging:` i przebuduj projekt; doraźnie logi zobaczysz przez SSH: `sudo docker logs item-catalog` |

Zakładanie pierwszego konta zostaw na etap 9, po skonfigurowaniu HTTPS. Setup po HTTP przeszedłby technicznie (POST się wykona), ale sesja się nie zapisze i utkniesz na `/login` z już zajętą nazwą użytkownika.

## Etap 7 — Autostart po restarcie NAS-a

Główny mechanizm to `restart: unless-stopped` w compose — po restarcie DSM demon Docker sam podnosi kontener. Dwa warunki, żeby faktycznie zadziałał:

- **Nie zatrzymuj projektu ręcznie.** `unless-stopped` zapamiętuje ręczne zatrzymanie i po restarcie go nie wznowi. Jeśli kiedyś zatrzymasz projekt, musisz go potem wystartować ręcznie.
- **Pakiet Container Manager musi startować automatycznie.** Centrum pakietów → Container Manager → Akcja → sprawdź, czy autostart jest włączony.

### Opcjonalny pas bezpieczeństwa

Przydaje się, gdy wolumen jest szyfrowany albo Docker startuje zanim zamontuje się `/volume1` — kontener wtedy pada na starcie i `unless-stopped` go nie uratuje.

Panel sterowania → Harmonogram zadań → Utwórz → **Zadanie wyzwalane**:

- Zadanie: `items-catalog autostart`
- Użytkownik: `root`
- Zdarzenie: `Uruchamianie`
- Skrypt:

```bash
sleep 120
/usr/local/bin/docker compose -f /volume1/docker/items-catalog/docker-compose.yml up -d
```

Ścieżkę do binarki potwierdź przez SSH (`which docker`) — na DSM 7.2 to zwykle `/usr/local/bin/docker`.

---

## Etap 8 — HTTPS przez reverse proxy DSM

### 8a. Nazwa hosta

Panel sterowania → Dostęp zewnętrzny → DDNS → Dodaj → dostawca **Synology** → np. `mojdom.synology.me`. Alternatywnie własna domena z rekordem A na IP NAS-a (lub rekordem lokalnym, jeśli aplikacja ma być tylko w LAN).

### 8b. Certyfikat

Panel sterowania → Bezpieczeństwo → Certyfikat → Dodaj → **Uzyskaj certyfikat z Let's Encrypt**.

- Wariant z dostępem z internetu: wymaga przekierowania portu 80 na NAS na czas weryfikacji.
- Wariant tylko-LAN: użyj Synology DDNS i poproś o certyfikat wildcard (`*.mojdom.synology.me`) — Synology przeprowadza wtedy weryfikację DNS-01 i nie musisz otwierać żadnego portu na routerze.

### 8c. Reguła reverse proxy

Panel sterowania → Portal logowania → Zaawansowane → **Odwrotny serwer proxy** → Utwórz.

**Źródło**

| Pole | Wartość |
| --- | --- |
| Protokół | HTTPS |
| Nazwa hosta | `katalog.mojdom.synology.me` |
| Port | 443 |
| Włącz HSTS | tak |

**Miejsce docelowe**

| Pole | Wartość |
| --- | --- |
| Protokół | HTTP |
| Nazwa hosta | `localhost` |
| Port | 3000 |

**Zakładka „Nagłówek niestandardowy"** → Utwórz → wybierz gotowy zestaw **WebSocket** (dodaje `Upgrade` i `Connection`), a następnie dopisz ręcznie:

| Nazwa | Wartość |
| --- | --- |
| X-Forwarded-Proto | `https` |
| X-Forwarded-For | `$proxy_add_x_forwarded_for` |

### 8d. Przypisz certyfikat

Panel sterowania → Bezpieczeństwo → Certyfikat → **Ustawienia** → przy nowo utworzonej usłudze reverse proxy wybierz certyfikat z kroku 8b. Bez tego DSM poda certyfikat domyślny i przeglądarka zgłosi niezgodność nazwy.

### 8e. Jeśli wgrywanie zdjęć zwróci 413

`next.config.mjs` dopuszcza Server Actions do 20 MB, ale nginx DSM ma własny limit body. Gdy zobaczysz `413 Request Entity Too Large` przy zdjęciach z telefonu, przez SSH jako root:

```bash
echo 'client_max_body_size 50m;' | sudo tee /usr/local/etc/nginx/conf.d/items-catalog.conf
sudo synosystemctl restart nginx
```

Ustawienie przeżywa restart NAS-a, ale może zostać skasowane przy większej aktualizacji DSM — warto zapamiętać, że to tu.

---

## Etap 9 — Pierwsze konto i instalacja PWA

Wejdź na `https://katalog.mojdom.synology.me` → przekierowanie na `/setup` → załóż pierwsze konto administratora.

Na telefonie: otwórz ten sam adres w Chrome lub Safari → menu → **Dodaj do ekranu głównego**. Manifest (`public/manifest.json`) ustawia `display: standalone`, więc aplikacja otworzy się bez paska adresu. Dopiero teraz, po HTTPS, zadziała też dostęp do aparatu przy dodawaniu zdjęć.

---

## Etap 10 — Backup

Hyper Backup → nowe zadanie na folder `/docker/items-catalog/data`. To jedyne miejsce ze stanem aplikacji — cała reszta odtwarza się z obrazu.

Uwaga o spójności: SQLite pracuje w trybie WAL (`journal_mode = WAL` w `src/db/index.ts`). Kopia zrobiona „na żywo" może złapać bazę w połowie transakcji. Dwa bezpieczne warianty: zatrzymać projekt na czas backupu, albo backupować migawkę wolumenu (Snapshot Replication, jeśli masz Btrfs).

---

## Aktualizacja aplikacji w przyszłości

1. Na PC: `docker build -t home-item-catalog:1.1.0 .`
2. `docker save home-item-catalog:1.1.0 -o home-item-catalog-1.1.0.tar`
3. Import w Container Manager (jak etap 3)
4. Projekt → `items-catalog` → Akcja → Edytuj → zmień `image:` na `1.1.0` → Zapisz → Kompiluj

Trzymanie wersjonowanych tagów zamiast samego `latest` daje darmowy rollback: gdy coś się posypie, wracasz zmieniając jedną linię compose na poprzedni tag. Stare obrazy kasuj dopiero po kilku dniach spokojnego działania.
