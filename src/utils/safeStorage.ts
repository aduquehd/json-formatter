/**
 * `localStorage` that cannot take the page down.
 *
 * Reading or writing `window.localStorage` throws a `SecurityError` outright
 * when the browser is set to block site data (Safari's "Prevent cross-site
 * tracking" in some configurations, Chrome's "Block all cookies", Firefox's
 * strict mode) — not on the value, on the *property access* itself. Writing can
 * also throw `QuotaExceededError`, which Safari raises in private browsing for
 * any write at all.
 *
 * Every call site in this app reads storage from an effect, so an uncaught throw
 * propagates to the root `ErrorBoundary` and replaces the whole page with an
 * error panel — over a remembered theme or language. These helpers degrade to
 * "no stored value" instead, which is always a usable state here.
 */

/** Reads `key`, returning null if storage is unavailable or the key is unset. */
export function readStored(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Writes `key`, returning whether it persisted. Callers that keep their own
 * in-memory state can ignore the result: the preference still applies for this
 * page, it just will not survive a reload.
 */
export function writeStored(key: string, value: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/** Removes `key`, returning whether the removal persisted. */
export function removeStored(key: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
