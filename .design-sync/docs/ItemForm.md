---
category: Catalog
---

# ItemForm

Adding and editing an item are the same screen: main photo, additional photos,
category, description. The main-photo dropzone leads with a camera glyph and
hints the rear camera on mobile; the additional photos are an
`minmax(88px, 1fr)` grid of squares ending in a dashed "+" tile. The category
is chosen with 44px pill chips rather than a select, so it is one tap and
always visible.

Pass `item` for the edit variant — its photos start on disk and the main one
may be left untouched. Pass `initialCategoryId` when the screen was opened
from inside a category, and that chip starts selected.

```jsx
<ItemForm categories={categories} initialCategoryId="c-2" />
```
