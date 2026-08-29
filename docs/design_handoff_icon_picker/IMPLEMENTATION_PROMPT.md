Zastąp siatkę 8 zahardkodowanych ikon w formularzu kategorii wyborem z pełnej
biblioteki Tabler, zgodnie z `docs/design_handoff_icon_picker/README.md`.
Plik `design/CategoryForm.dc.html` to referencja prototypowa — czytaj z niej strukturę
i wartości, nie przenoś kodu. Buduj komponentami Mantine i wzorcami tego repo
(Server Actions, useActionRunner, notifications).

Zasady:

- nie zmieniaj src/theme.ts ani ImageLightboxModal.tsx,
- zakres to WYŁĄCZNIE pole „Ikona” — nie ruszaj dropzone'a, nazwy, paska akcji
  ani reguły prezentacji kategorii,
- interfejs po polsku, kopie dokładnie takie jak w README,
- kolory tylko przez zmienne Mantine, żadnych własnych hexów,
- pola formularzy font-size 16px, cele dotykowe zgodnie z README,
- dostosuj testy do zmian
- dopisz testy do nowego komponentu
- po zakończeniu wszystkich etapów jeden wspólny commit oraz wszystkie testy na zielono

Etap 1 — dostęp do ikon bez rozdmuchania bundla
Moduł src/lib/tablerIcons.ts: lista nazw eksportów pasujących do /^Icon[A-Z0-9]/,
lookup nazwa → komponent, oraz labelFor(name) z cache (Map).
Konwersja etykiety: name.replace(/^Icon/,'').replace(/([a-z0-9])([A-Z])/g,'$1 $2').
Modal ładuj przez dynamic(() => import(...), { ssr: false }), żeby koszt ponosił
tylko formularz kategorii — sprawdź rozmiar bundla przed i po (`pnpm build`).
Testy: labelFor dla IconDeviceLaptop, IconToolsKitchen2, IconX.

Etap 2 — walidacja i odporny render
Server Action kategorii: waliduj icon regexem /^Icon[A-Za-z0-9]+$/ ORAZ obecnością
w mapie eksportów; odrzuć inaczej. W renderze kategorii: nieznana nazwa ikony
(np. po aktualizacji @tabler/icons-react) schodzi do następnego kroku fallbacku
(firstItemImage → monogram), nie renderuje pustego kwadratu.
Testy w tests/categories.test.ts + test fallbacku dla nieistniejącej ikony.

Etap 3 — modal wyboru ikony
IconPickerModal: nagłówek, wyszukiwarka (autoFocus, 44px, font-size 16px,
placeholder „Szukaj ikony… np. lampa, dom, rower”), siatka 8 kolumn po 60px
z kafelkami 52px, stopka z licznikiem, stan pusty.
WIRTUALIZACJA JEST WYMAGANA — ~5900 ikon. Użyj @tanstack/react-virtual w trybie
wierszowym albo algorytmu z README (COLS 8, ROW_H 60, VIEW_H 420, OVERSCAN 6).
Przy pustym zapytaniu pierwsze 8 pozycji to zestaw curated z README, w tej kolejności.
Klik w kafelek ustawia ikonę i zamyka modal. Escape zamyka. Overlay
z --mantine-z-index-modal — musi być nad dolną nawigacją i FAB-em.

Etap 4 — pole w formularzu
Przycisk podglądu 56px (wybrana ikona 28px albo IconPlus 24px), obok kolumna:
„Wybierz ikonę”/„Zmień ikonę” (36px) i link „Usuń (<Etykieta>)” gdy ikona wybrana.
Podpis pola: „Opcjonalna. Wybierz z pełnej biblioteki ikon Tabler.”
Usuń starą stałą z 8 ikonami i jej siatkę.

Etap 5 — polskie wyszukiwanie
Słownik aliasów PL → EN w src/lib/iconAliases.ts, 50–100 najczęstszych pojęć
domowych (lampa→lamp bulb, rower→bike, dom→home, narzędzia→tool, kuchnia→kitchen,
książka→book, auto→car, ogród→garden plant, dokumenty→file folder, zabawki→toy…).
Filtruj po sumie „etykieta + aliasy”. Bez tego polski placeholder nic nie znajduje.
Testy: „rower” zwraca IconBike, „lampa” zwraca ikonę lampy.

Na koniec: sprawdź modal na 360/390/768/1280 px oraz w motywie ciemnym i jasnym,
zmierz czas otwarcia modala (powinien być natychmiastowy), zaktualizuj README repo
i uruchom /design-sync, żeby odświeżyć design system.

## Uwaga o etapie 5

Etap 5 (aliasy PL) to decyzja produktowa, nie techniczna — prototyp jej nie zawiera.
Właściciel produktu woli polskie przykłady w placeholderze. Wyszukiwarka powinna szukać zarówno po polskich aliasach jak i po oryginalnych nazwach angielskich.
