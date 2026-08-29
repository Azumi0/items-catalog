---
category: Layout
---

# EmptyState

The bordered "there is nothing here" panel: `48px 24px` of padding, centred, a
bold line naming what is missing and a dimmed 14px line saying what to do
about it. The category tiles, the category item list and the category
management screen all render it, so the three empty screens read alike.

```jsx
<EmptyState title="Brak przedmiotów" message="Nie znaleziono przedmiotów spełniających kryteria." />
```
