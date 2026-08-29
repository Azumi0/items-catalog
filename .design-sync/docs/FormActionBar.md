---
category: Layout
---

# FormActionBar

How every full-screen form ends: a bar fixed to the bottom of the viewport,
with a page-coloured background and a top border, holding "Anuluj" (outline,
`flex: 1`) and the primary action (teal, `flex: 2`, 700). Both are at least
52px tall, and the pair is capped at 640px to line up with the form above it.

Render it **inside** the `<form>` so the primary button stays a real submit
button. The screen hosting it passes `chrome={false}` to `AppLayout`, which
also reserves the space underneath.

```jsx
<form onSubmit={save}>
  {fields}
  <FormActionBar cancelHref="/categories" submitLabel="Utwórz kategorię" loading={pending} />
</form>
```
