import { describe, it, expect } from 'vitest';
import {
  canFollowIosInstructions,
  INSTALLED_DISPLAY_MODES,
  isIosDevice,
  resolveInstallPrompt,
  type InstallPromptInput,
} from '@/lib/installPrompt';

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const IPAD_SAFARI =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15';
const MAC_SAFARI =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15';
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';
const FACEBOOK_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/468.0.0.0.0]';

/** A phone in a browser, over https, with nothing captured and nothing said. */
const BASE: InstallPromptInput = {
  userAgent: IPHONE_SAFARI,
  secureContext: true,
  runningStandalone: false,
  navigatorStandalone: false,
  maxTouchPoints: 5,
  installed: false,
  dismissed: false,
  deferredPrompt: false,
};

const input = (overrides: Partial<InstallPromptInput>): InstallPromptInput => ({
  ...BASE,
  ...overrides,
});

describe('isIosDevice', () => {
  it('recognises the devices that name themselves', () => {
    expect(isIosDevice(IPHONE_SAFARI, 5)).toBe(true);
  });

  it('recognises an iPad behind its Macintosh user agent', () => {
    expect(isIosDevice(IPAD_SAFARI, 5)).toBe(true);
  });

  it('leaves a real Mac alone', () => {
    // Same string as the iPad's — only the touch points tell them apart.
    expect(isIosDevice(MAC_SAFARI, 0)).toBe(false);
    expect(isIosDevice(MAC_SAFARI, 1)).toBe(false);
  });

  it('says nothing about Android', () => {
    expect(isIosDevice(ANDROID_CHROME, 5)).toBe(false);
  });
});

describe('canFollowIosInstructions', () => {
  it('accepts Safari, and Chrome and Firefox on iOS with it', () => {
    const chromeIos = IPHONE_SAFARI.replace('Safari/604.1', 'CriOS/126.0.0.0 Mobile/15E148 Safari/604.1');
    const firefoxIos = IPHONE_SAFARI.replace('Safari/604.1', 'FxiOS/127.0 Mobile/15E148 Safari/605.1.15');

    expect(canFollowIosInstructions(IPHONE_SAFARI, 5)).toBe(true);
    expect(canFollowIosInstructions(chromeIos, 5)).toBe(true);
    expect(canFollowIosInstructions(firefoxIos, 5)).toBe(true);
  });

  it('rejects in-app webviews, which have no share sheet to point at', () => {
    const instagram = `${IPHONE_SAFARI} Instagram 300.0.0.0`;
    const line = `${IPHONE_SAFARI} Line/13.0.0`;

    expect(canFollowIosInstructions(FACEBOOK_IOS, 5)).toBe(false);
    expect(canFollowIosInstructions(instagram, 5)).toBe(false);
    expect(canFollowIosInstructions(line, 5)).toBe(false);
  });

  it('does not mistake a word ending in "line" for the Line browser', () => {
    expect(canFollowIosInstructions(`${IPHONE_SAFARI} Streamline/2.0`, 5)).toBe(true);
  });
});

describe('INSTALLED_DISPLAY_MODES', () => {
  it('covers every mode a launcher may start the installed app in', () => {
    // The caller ORs these into `runningStandalone`; missing one would show
    // an install offer inside the installed app.
    expect([...INSTALLED_DISPLAY_MODES]).toEqual([
      'standalone',
      'fullscreen',
      'minimal-ui',
      'window-controls-overlay',
    ]);
  });
});

describe('resolveInstallPrompt', () => {
  it('offers the native install once an event is captured', () => {
    expect(
      resolveInstallPrompt(input({ userAgent: ANDROID_CHROME, deferredPrompt: true }))
    ).toEqual({ kind: 'native' });
  });

  it('falls back to instructions on iOS, which has no such event', () => {
    expect(resolveInstallPrompt(input({}))).toEqual({ kind: 'ios' });
  });

  it('prefers the native install when both would apply', () => {
    expect(resolveInstallPrompt(input({ deferredPrompt: true }))).toEqual({ kind: 'native' });
  });

  it('says nothing where installation is not on offer at all', () => {
    // Desktop Firefox: no beforeinstallprompt, no iOS share sheet.
    const firefox =
      'Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0';

    expect(resolveInstallPrompt(input({ userAgent: firefox, maxTouchPoints: 0 }))).toEqual({
      kind: 'hidden',
    });
  });

  it('stays silent on iOS outside a secure context', () => {
    // Over plain http on the LAN, "Add to Home Screen" makes a bookmark.
    expect(resolveInstallPrompt(input({ secureContext: false }))).toEqual({ kind: 'hidden' });
  });

  it('still offers the native install without an explicit secure context', () => {
    // beforeinstallprompt only fires in one, so holding the event is proof
    // enough and the flag is not consulted.
    expect(
      resolveInstallPrompt(
        input({ userAgent: ANDROID_CHROME, secureContext: false, deferredPrompt: true })
      )
    ).toEqual({ kind: 'native' });
  });

  it('stays silent once the app is running installed', () => {
    // iOS Safari's only signal, and everyone else's.
    expect(resolveInstallPrompt(input({ navigatorStandalone: true }))).toEqual({ kind: 'hidden' });
    expect(
      resolveInstallPrompt(
        input({ userAgent: ANDROID_CHROME, runningStandalone: true, deferredPrompt: true })
      )
    ).toEqual({ kind: 'hidden' });
  });

  it('stays silent after appinstalled, before any display mode has changed', () => {
    // Installing from an Android tab leaves that tab a browser tab.
    expect(
      resolveInstallPrompt(
        input({ userAgent: ANDROID_CHROME, installed: true, deferredPrompt: true })
      )
    ).toEqual({ kind: 'hidden' });
  });

  it('stays silent once dismissed, in either form', () => {
    expect(
      resolveInstallPrompt(input({ userAgent: ANDROID_CHROME, dismissed: true, deferredPrompt: true }))
    ).toEqual({ kind: 'hidden' });
    expect(resolveInstallPrompt(input({ dismissed: true }))).toEqual({ kind: 'hidden' });
  });

  it('stays silent in an in-app webview even though the device is an iPhone', () => {
    expect(resolveInstallPrompt(input({ userAgent: FACEBOOK_IOS }))).toEqual({ kind: 'hidden' });
  });
});
