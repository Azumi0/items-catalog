'use client';

import { useEffect } from 'react';

/**
 * Registers /sw.js so the browser will offer to install the app.
 *
 * The worker itself does nothing but handle fetch — see public/sw.js for why
 * that is deliberate rather than unfinished.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Registration failing is not worth surfacing to the user: the app works
    // fine without it, only installability is lost.
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  }, []);

  return null;
}
