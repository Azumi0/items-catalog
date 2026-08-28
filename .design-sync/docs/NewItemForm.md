---
category: Item forms
---

# NewItemForm

The add-item screen behind `/items/new`: a category `Select`, a description
field, one `ImageDropzone` for the main photo and a second for additional
photos, with live previews of everything dropped and a submit/cancel pair.

```jsx
<NewItemForm categories={[
  { id: 'c-1', name: 'Elektronika', itemCount: 12, createdAt: new Date(), updatedAt: new Date() },
  { id: 'c-2', name: 'Narzędzia', itemCount: 5, createdAt: new Date(), updatedAt: new Date() },
]} />
```

`categories` takes the same objects as the rest of the app; the component maps
them to Mantine `Select` options itself. Image previews come from object URLs
built in the browser, so they work in a design — submitting does not.
