---
category: Media
---

# ImageLightboxModal

The full-screen photo viewer: a zoom/pan surface (`react-zoom-pan-pinch`) with
previous/next navigation, a counter, and keyboard support. `ItemDetailView`
opens it when a photo is clicked, so most designs get it through that component
rather than mounting it directly.

```jsx
<ImageLightboxModal
  opened
  onClose={() => setOpened(false)}
  images={['wiertarka.jpg', 'wiertarka-2.jpg']}
  initialIndex={0}
  title="Wiertarka udarowa Bosch"
/>
```

`images` holds stored filenames, not URLs — the component resolves each through
the app's originals route. Being an overlay, it renders over the whole viewport
when `opened`; preview cards for it use a fixed viewport so the open state stays
inside the card.
