# Prompt dla Claude Code

Skopiuj tę paczkę do repo (np. `docs/design_handoff_mobile_first/`), otwórz Claude Code
w katalogu projektu i wklej poniższy prompt.

---

```
Przebuduj UI aplikacji na mobile-first zgodnie z docs/design_handoff_mobile_first/README.md.
Zrzuty ekranu w docs/design_handoff_mobile_first/screenshots/ pokazują docelowy wygląd —
odtwórz go 1:1, ale komponentami Mantine i wzorcami tego repo (Server Actions,
useActionRunner, notifications). Pliki .dc.html w design/ to referencje prototypowe,
nie przenoś z nich kodu.

Zasady na cały czas pracy:
- nie zmieniaj src/theme.ts ani ImageLightboxModal.tsx,
- interfejs po polsku, kopie dokładnie takie jak w README,
- minimalny cel dotykowy 44 px, pola formularzy font-size 16px,
- kolory tylko przez zmienne Mantine, żadnych własnych hexów,
- brak breakpointów tam, gdzie wystarczy auto-fill minmax(),
- każdy etap: osobny commit + `pnpm vitest run` na zielono.

Etap 1 — dane
Dodaj categories.icon (text null) i categories.main_image (text null) + migracja Drizzle.
Rozszerz CategoryWithCount o firstItemImage (main_image najnowszego przedmiotu w kategorii).
Testy w tests/categories.test.ts.

Etap 2 — reguła prezentacji kategorii
Helper src/lib/categoryVisual.ts z fallbackiem mainImage → icon → firstItemImage → monogram
(dyskryminowana unia). Testy jednostkowe dla każdej gałęzi.

Etap 3 — katalog dwuekranowy
Nowy ekran kafelków kategorii jako "/", lista przedmiotów na /categories/[id]/items
BEZ Selecta kategorii (zostają wyszukiwarka i sortowanie). Ekran 01 i 02 z README.

Etap 4 — powłoka
AppLayout: górny pasek (wstecz, tytuł+podtytuł kontekstowy, nazwa użytkownika,
przełącznik motywu, wylogowanie) oraz dolna nawigacja z FAB-em OBOK paska po prawej.
FAB kontekstowy: Katalog→nowy przedmiot, Kategorie→nowa kategoria, Użytkownicy→nowy
użytkownik; aria-label i title zmieniają się razem z akcją. Na ekranach formularzy
pasek i FAB ukryte.

Etap 5 — zarządzanie
CategoriesManager i UsersManager: Table → listy kart (ekrany 05 i 07).
Formularze (kategoria, użytkownik, zmiana hasła, przedmiot) jako pełne ekrany/trasy
ze sticky paskiem akcji, wybór kategorii chipsami zamiast Selecta.
Potwierdzenia usunięcia jako bottom sheet (Drawer position="bottom"), ekran 08.
Zachowaj blokady: nie można usunąć siebie ani jedynego konta.

Etap 6 — szczegóły przedmiotu i lightbox
Ekran 03: zdjęcie 4:3, miniatury, badge kategorii, opis, metryka, Edytuj + usuwanie.
Klik w zdjęcie główne lub miniaturę otwiera istniejący ImageLightboxModal:
images=[mainImage, ...additionalImages], initialIndex=klikniętego, title=opis.
Nie zmieniaj kodu lightboxa.

Etap 7 — auth i motyw
Ekrany 13/14: logowanie i pierwsze uruchomienie w jednej kolumnie max-width 420px.
Motyw ciemny/jasny przez useMantineColorScheme + ColorSchemeScript, stan trwały.

Na koniec: przejrzyj wszystkie ekrany na 360/390/768/1280 px, popraw przycięcia,
zaktualizuj README repo i uruchom /design-sync, żeby odświeżyć design system.
```

---

## Jeśli pracujesz etapami w osobnych sesjach

Wklej tylko nagłówek („Zasady na cały czas pracy”) + wybrany etap i dopisz:
`Przeczytaj docs/design_handoff_mobile_first/README.md, sekcje dotyczące tego etapu,
oraz odpowiedni zrzut ekranu.`
