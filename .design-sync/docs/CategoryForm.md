---
category: Management
---

# CategoryForm

A full screen, not a modal: the category name, an optional icon picked from a
`minmax(56px, 1fr)` grid of eight Tabler glyphs, and an optional picture on a
dashed dropzone. Pressing the selected icon again clears it — the field is
optional and there is nowhere else to say "no icon". The picture wins over the
icon, which the dropzone caption says out loud.

Pass `category` to render the edit variant; omit it for create. The form ends
with `FormActionBar`, and the screen that hosts it passes `chrome={false}` to
`AppLayout` so the bottom bar and FAB stay out of the way.

```jsx
<CategoryForm category={{ id: 'c-1', name: 'Elektronika', icon: 'IconDeviceLaptop', mainImage: null }} />
```
