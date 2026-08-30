/**
 * Whether to offer installing the app, and in which of the two forms.
 *
 * Everything here is a pure function of values read off `window` and
 * `navigator` by the caller. The whole difficulty of the feature is the
 * decision table — iOS × in-app webview × secure context × display mode ×
 * dismissal — and none of it is React, so it lives where `vitest` can reach
 * it without jsdom. @/components/InstallPrompt is the thin wrapper that reads
 * the browser and renders the result.
 *
 * See ADR-001 §2.1 for why the prompt stays silent outside a secure context.
 */

/**
 * Display modes that mean "already installed". The manifest asks for
 * `standalone`, but the launcher may hand out any of these, and the app is
 * installed in all four cases.
 */
export const INSTALLED_DISPLAY_MODES = [
  'standalone',
  'fullscreen',
  'minimal-ui',
  'window-controls-overlay',
] as const;

/** Where the permanent "Nie pokazuj więcej" lives. Per-origin, per-browser. */
export const INSTALL_PROMPT_DISMISSED_KEY = 'catalog:install-prompt-dismissed';

/**
 * `hidden` — say nothing; `native` — a captured `beforeinstallprompt` can do
 * the install in one click; `ios` — no such event exists, only instructions.
 */
export type InstallPromptState =
  | { kind: 'hidden' }
  | { kind: 'native' }
  | { kind: 'ios' };

export interface InstallPromptInput {
  userAgent: string;
  /** `window.isSecureContext`. */
  secureContext: boolean;
  /** Any of INSTALLED_DISPLAY_MODES matches right now. */
  runningStandalone: boolean;
  /** `navigator.standalone` — only iOS Safari defines it at all. */
  navigatorStandalone?: boolean;
  /** `navigator.maxTouchPoints`; the only thing separating an iPad from a Mac. */
  maxTouchPoints: number;
  /** `appinstalled` fired during this page's lifetime. */
  installed: boolean;
  /** The prompt was closed at some point, per localStorage. */
  dismissed: boolean;
  /** A `beforeinstallprompt` event is captured and not yet spent. */
  deferredPrompt: boolean;
}

/** iPhone and iPod name themselves. iPadOS 13+ does not — see isIosDevice(). */
const IOS_DEVICE = /iPhone|iPod|iPad/;

/**
 * Embedded browsers that carry an iOS-shaped user agent but have no share
 * sheet to add anything to a home screen. Telling their users to open a menu
 * that is not there is the one case where the prompt would simply be a lie.
 *
 * `Line/` keeps its slash so the token cannot match a word ending in "line".
 */
const IN_APP_BROWSER = /FBAN|FBAV|FB_IAB|Instagram|Line\/|Twitter|MicroMessenger/;

/**
 * iPadOS 13 and later report themselves as `Macintosh`, deliberately and with
 * no version marker. A touch-capable "Mac" is an iPad; a real Mac reports at
 * most one touch point.
 */
export function isIosDevice(userAgent: string, maxTouchPoints: number): boolean {
  if (IOS_DEVICE.test(userAgent)) return true;

  return userAgent.includes('Macintosh') && maxTouchPoints > 1;
}

/**
 * True where the "Udostępnij → Dodaj do ekranu początkowego" instruction is
 * actually followable.
 *
 * Chrome and Firefox on iOS are Safari underneath and their share menus have
 * carried the same entry since iOS 16.4, so they are included on purpose:
 * the wording holds, only the path to the menu differs slightly.
 */
export function canFollowIosInstructions(
  userAgent: string,
  maxTouchPoints: number
): boolean {
  return isIosDevice(userAgent, maxTouchPoints) && !IN_APP_BROWSER.test(userAgent);
}

/**
 * The decision itself, in priority order.
 *
 * A `native` verdict does not check `secureContext`: `beforeinstallprompt`
 * only fires in one, so holding the event is already proof. The `ios` branch
 * has no such evidence and must check for itself — over plain http on the LAN
 * "Dodaj do ekranu początkowego" makes a bookmark, not an installed app.
 */
export function resolveInstallPrompt(input: InstallPromptInput): InstallPromptState {
  if (input.dismissed) return { kind: 'hidden' };
  if (input.installed) return { kind: 'hidden' };

  // Already launched from the home screen: there is nothing left to install.
  if (input.navigatorStandalone === true) return { kind: 'hidden' };
  if (input.runningStandalone) return { kind: 'hidden' };

  if (input.deferredPrompt) return { kind: 'native' };

  if (input.secureContext && canFollowIosInstructions(input.userAgent, input.maxTouchPoints)) {
    return { kind: 'ios' };
  }

  // Desktop Firefox, an insecure origin, an in-app webview: installation is
  // not on offer, so neither is the prompt.
  return { kind: 'hidden' };
}
