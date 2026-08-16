# ADR-002: Interaktywny Lightbox z Obsługą Zoom i Pan dla Zdjęć Przedmiotów

* **Status:** Zaakceptowany (Accepted)
* **Data:** 2026-08-16
* **Autor:** Przemysław Wrzeszcz & Antigravity

---

## 1. Kontekst i Problem

W widoku szczegółów przedmiotu (`/items/[id]`) użytkownik może powiększyć zdjęcie główne lub dodatkowe w oknie modalnym (lightbox).
Dotychczasowy modal renderował oryginalne zdjęcie o wysokiej rozdzielczości z regułą `maxHeight: '75vh'` i `width: 'auto'`. Powodowało to wychodzenie szerokich zdjęć poza obrys modala i wywoływanie niepożądanego poziomego paska przewijania (horizontal scroll) w oknie przeglądarki.

Ponadto użytkownicy potrzebują możliwości dokładnego zbadania detali przedmiotu (etykiet, numerów seryjnych, uszkodzeń) za pomocą:
- Płynnego przybliżania i oddalania (zoom) kółkiem myszy, gestem zsunięcia/rozsunięcia palców (pinch-to-zoom) na ekranach dotykowych oraz dedykowanymi kontrolkami.
- Przesuwania powiększonego obrazu (pan) metodą przeciągnij-i-upuść (click & hold) lub gestem dwóch palców.
- Domyślnego dopasowania (fit to screen) obrazu wewnątrz modala bez wycieków i pasków przewijania.
- Zachowania spójności z design systemem Mantine UI v7 oraz płynnej nawigacji po galerii wielu zdjęć.

---

## 2. Rozważane Opcje

1. **Opcja A (Wybrana): Integracja `react-zoom-pan-pinch` z komponentami Mantine UI v7 (`ImageLightboxModal`)**
   - Zastosowanie sprawdzonej biblioteki `react-zoom-pan-pinch` do obsługi macierzy transformacji, bezwładności i gestów wielodotykowych.
   - Osadzenie w modalu Mantine (`size="90vw"`, obsługa trybu `fullScreen`), zintegrowanym z pływającym paskiem narzędzi (`ActionIcon.Group`, `Tooltip`, ikony Tabler).
   - Wykorzystanie `removeScrollProps={{ allowPinchZoom: true }}` w Mantine Modal w celu eliminacji blokady gestów dotykowych przez mechanizm scroll-lock.

2. **Opcja B: Zewnętrzny kombajn Lightbox (np. `yet-another-react-lightbox` z wtyczką Zoom)**
   - Gotowy, samodzielny overlay zastępujący Mantine Modal.
   - *Wady:* Odrębny system stylowania, niespójny z motywami i tokenami kolorystycznymi Mantine UI, trudniejsza integracja z resztą aplikacji.

3. **Opcja C: Samodzielna implementacja transformacji CSS i zdarzeń wskaźnika (Pointer Events)**
   - Brak dodatkowych zależności npm.
   - *Wady:* Duży nakład pracy na bezwładność, śledzenie punktu centralnego powiększenia (zoom origin), obsługę gestów pinch na iOS/Android i limity krawędzi (bounding box).

---

## 3. Podjęte Decyzje

### 3.1. Wybór Komponentu i Architektury
Wybrano **Opcję A** poprzez stworzenie dedykowanego, reużywalnego komponentu [`ImageLightboxModal`](file:///home/przemek/work/priv/catalog/src/components/ImageLightboxModal.tsx):
- Obraz renderowany w kontenerze z `overflow: hidden`, `object-fit: contain`, `maxWidth: 100%`, `maxHeight: 100%`, co gwarantuje brak overflow i pasków przewijania.
- `TransformWrapper` z konfiguracją:
  - Skalowanie: `initialScale={1}`, `minScale={1}`, `maxScale={8}`.
  - Limitowanie pozycji do granic kontenera (`limitToBounds={true}`).
  - Płynny zoom kółkiem myszy (`wheel.step = 0.2`), podwójnym kliknięciem (`doubleClick.step = 2.5`) i gestami dotykowymi.
- Dedykowany, półprzezroczysty pasek narzędzi Mantine na dole:
  - Oddalenie (`IconZoomOut`)
  - Reset / Dopasowanie 1:1 (`IconZoomReset`)
  - Przybliżenie (`IconZoomIn`)
- Przełącznik pełnego ekranu (`IconMaximize` / `IconMinimize`, skrót klawiszowy `F`).

### 3.2. Nawigacja po Galerii Wielu Zdjęć
- Gdy przedmiot zawiera więcej niż jedno zdjęcie, modal udostępnia boczne przyciski chevronów oraz obsługę klawiszy strzałek (`ArrowLeft` / `ArrowRight`).
- Każde przełączenie zdjęcia automatycznie resetuje stan powiększenia i przesunięcia do skali początkowej (1.0 - fit), zapobiegając przenoszeniu powiększenia na kolejną fotografię.

---

## 4. Konsekwencje

### Pozytywne:
- Całkowite rozwiązanie problemu poziomego paska przewijania (horizontal scroll) przy przeglądaniu zdjęć w pełnej rozdzielczości.
- Intuicyjna, szybka i responsywna interakcja na urządzeniach stacjonarnych i mobilnych (touch & mouse).
- Zachowanie 100% spójności wizualnej z Mantine UI v7 i systemem motywów (Dark/Light).

### Negatywne / Koszty:
- Dodatkowa zależność w projekcie: `react-zoom-pan-pinch` (~15 kB gzipped).
