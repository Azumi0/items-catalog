---
category: Media
---

# RemovableImage

A photo the user has chosen, with a red remove button in its top-right corner
— the item form's main and additional photos and the category form's picture.
It takes a URL, so a stored thumbnail and a local `URL.createObjectURL()`
preview render identically, and it carries the app's "Brak zdjęcia" fallback
for a file that has gone missing.

`variant="hero"` is the 4:3 main photo with a medium button; the default
`square` is a 1:1 grid cell with a small one. Pass `w` for a square that sizes
itself instead of filling a grid cell.

```jsx
<RemovableImage
  variant="hero"
  src={preview}
  alt="Zdjęcie główne"
  removeLabel="Usuń zdjęcie główne"
  onRemove={clear}
/>
```
