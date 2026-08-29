---
category: Layout
---

# ConfirmSheet

Destructive confirmations, as a bottom sheet rather than a centred modal: on a
phone the buttons land under the thumb instead of halfway up the screen. A
40px `red-light` circle with a warning glyph, the question as a 17px/700
title, then what actually disappears in dimmed 14px, then two 52px buttons.

The panel is capped at 520px with a 20px radius, so it reads as a sheet on a
phone and as a card on a desktop. `confirmLabel` defaults to "Usuń".

```jsx
<ConfirmSheet
  opened
  onClose={close}
  onConfirm={remove}
  title="Usunąć kategorię?"
  message="Kategoria „Narzędzia” zniknie razem z 7 przedmiotów i ich zdjęciami. Tej operacji nie da się cofnąć."
/>
```
