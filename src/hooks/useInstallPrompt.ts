'use client';

import { useSyncExternalStore } from 'react';
import {
  INSTALL_PROMPT_DISMISSED_KEY,
  INSTALLED_DISPLAY_MODES,
  resolveInstallPrompt,
  type InstallPromptState,
} from '@/lib/installPrompt';

/**
 * The browser half of the install offer: four unrelated event sources reduced
 * to one value.
 *
 * It is a module-level store read through useSyncExternalStore rather than a
 * pile of effects, for two reasons. The state being tracked is genuinely
 * external — a captured event, two window events, four media queries — and a
 * store gives it one owner instead of a cascade of setStates. And the server
 * snapshot is `hidden` by construction, so the first client render matches the
 * markup that arrived and hydration has nothing to reconcile.
 *
 * The decision itself is @/lib/installPrompt, which knows nothing about the
 * browser and is unit-tested without one.
 */

/** Chromium's install hook; the DOM lib does not declare what only it implements. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const HIDDEN: InstallPromptState = { kind: 'hidden' };

const listeners = new Set<() => void>();

/**
 * Identity matters: useSyncExternalStore re-renders whenever getSnapshot
 * returns something new, so this is replaced only when the verdict changes.
 */
let snapshot: InstallPromptState = HIDDEN;
let started = false;
let deferredEvent: BeforeInstallPromptEvent | null = null;
let installed = false;
let dismissed = false;

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(INSTALL_PROMPT_DISMISSED_KEY) === '1';
  } catch {
    // Storage unreachable (Safari private mode, a locked-down profile). Read
    // it as "not dismissed": the offer still works, it just cannot be
    // silenced for good. Hiding it instead would delete the feature for the
    // whole browser over one exception.
    return false;
  }
}

function recompute(): void {
  const next = resolveInstallPrompt({
    userAgent: navigator.userAgent,
    secureContext: window.isSecureContext,
    runningStandalone: INSTALLED_DISPLAY_MODES.some(
      (mode) => window.matchMedia(`(display-mode: ${mode})`).matches
    ),
    navigatorStandalone: (navigator as Navigator & { standalone?: boolean }).standalone,
    maxTouchPoints: navigator.maxTouchPoints,
    installed,
    dismissed,
    deferredPrompt: deferredEvent !== null,
  });

  if (next.kind === snapshot.kind) return;

  snapshot = next;
  listeners.forEach((listener) => listener());
}

/**
 * Attaches the listeners, once per document.
 *
 * They are never detached. The alternative — tearing down when the last
 * component unmounts — would drop a `beforeinstallprompt` that arrived while
 * the user sat on a form screen, and buys back six listeners.
 */
function start(): void {
  if (started) return;
  started = true;

  dismissed = readDismissed();

  window.addEventListener('beforeinstallprompt', (event) => {
    // Chromium shows its own mini-infobar unless the event is cancelled; the
    // offer belongs in the page, next to an explanation of what it does.
    event.preventDefault();
    deferredEvent = event as BeforeInstallPromptEvent;
    recompute();
  });

  window.addEventListener('appinstalled', () => {
    deferredEvent = null;
    installed = true;
    recompute();
  });

  // Installing from elsewhere can flip the display mode under a tab that is
  // already open; the offer should then retire without a reload.
  for (const mode of INSTALLED_DISPLAY_MODES) {
    window.matchMedia(`(display-mode: ${mode})`).addEventListener('change', recompute);
  }

  recompute();
}

function subscribe(listener: () => void): () => void {
  start();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => snapshot;
/** Nothing about an installed launch is knowable server-side. */
const getServerSnapshot = () => HIDDEN;

/** Hands the offer to the browser's own install flow. */
function install(): void {
  const event = deferredEvent;
  if (!event) return;

  // A captured event can be prompted with exactly once. Dropping it here
  // retires the offer whichever way the native dialog goes: `accepted` brings
  // an `appinstalled` anyway, and `dismissed` writes nothing to storage — the
  // browser sends a fresh event when it is willing to offer again, so an
  // accidental cancel costs the user nothing permanent.
  deferredEvent = null;
  recompute();

  void event.prompt().catch(() => undefined);
}

/** Closes the offer for good, on this device in this browser. */
function dismiss(): void {
  try {
    window.localStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, '1');
  } catch {
    // It closes either way and simply returns on the next visit.
  }

  dismissed = true;
  recompute();
}

export function useInstallPrompt() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return { state, install, dismiss };
}
