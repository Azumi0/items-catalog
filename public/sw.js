// Minimal service worker: pass-through only, no caching.
//
// ADR-001 §2.1 deliberately declines offline support — the catalog is useless
// without its images and database, and a stale cache on a NAS-hosted app is
// worse than a connection error. But Chromium will not offer the install
// prompt unless a registered worker has a fetch handler, and the spec
// (docs/initial-prompt.md §1) asks for installability.
//
// So this handles fetch and does nothing else. Adding caching here would
// contradict ADR-001; amend the ADR first if that ever becomes desirable.

self.addEventListener('install', () => {
  // Take over without waiting for existing tabs to close.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // Intentionally empty: no respondWith, so every request goes to the network
  // exactly as it would without a worker.
});
