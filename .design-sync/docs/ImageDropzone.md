---
category: Media
---

# ImageDropzone

The photo drop target used by both item forms — a dashed area with an icon, a
bold `title`, a dimmed `hint`, and accept/reject styling from
`@mantine/dropzone`. The only genuinely reusable component in the set: it takes
its whole appearance from props.

```jsx
<ImageDropzone
  title="Przeciągnij zdjęcie główne"
  hint="lub kliknij, aby wybrać plik (JPG, PNG, WebP)"
  onDrop={(files) => setFiles(files)}
/>
```

- `idleIcon` picks the resting glyph: `photo` for a first image, `plus` to add
  more.
- `compact` tightens spacing and shrinks the copy — what `EditItemForm` uses.
- `minHeight`, `iconSize` and `mb` size the target; `disabled` greys it out.
- `maxFiles` bounds a multi-photo zone.

Drag states cannot be shown statically — a design renders the idle, disabled or
compact state.
