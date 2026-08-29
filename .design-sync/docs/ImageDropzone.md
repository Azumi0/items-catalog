---
category: Media
---

# ImageDropzone

The photo drop target used by the item and category forms: a `2px dashed`
rectangle on `gray-light`, glyph over copy, centred, with accept/reject styling
from `@mantine/dropzone`. It takes its whole appearance from props.

```jsx
<ImageDropzone
  idleIcon="camera"
  title="Zrób zdjęcie lub wybierz z galerii"
  hint="JPG, PNG — maks. 10 MB"
  onDrop={(files) => setFiles(files)}
/>
```

- `idleIcon` picks the resting glyph: `camera` for an item's main photo,
  `photo` for a category picture, `plus` to add more.
- `title` is optional — omit it for a caption-only target, as the category
  picture field does.
- `variant="tile"` drops the background and copy and makes the target a bare
  square, which is the "+" cell at the end of the additional-photos grid.
- `capture` hints the rear camera on mobile, but *replaces* the picker rather
  than pre-selecting a tab in it, so the gallery becomes unreachable. No
  screen sets it; see ADR-004.
- `minHeight`, `iconSize` and `mb` size the target; `disabled` greys it out.
- `maxFiles` bounds a multi-photo zone.

Drag states cannot be shown statically — a design renders the idle or disabled
state.
