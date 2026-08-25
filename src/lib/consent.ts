import { readStored, writeStored } from '@/utils/safeStorage';

/**
 * Analytics consent state.
 *
 * Google Analytics sets first-party cookies (`_ga`, `_ga_<id>`), which EU
 * ePrivacy treats as non-essential storage requiring prior consent. Google
 * Consent Mode is the mechanism: `analytics_storage` starts `denied`, GA sends
 * cookieless pings carrying no identifiers, and only after an explicit grant may
 * it store anything. The tag is always present; what the choice changes is
 * whether it may write to the device.
 *
 * Note what is NOT gated here: the user's JSON. It is parsed, formatted and
 * explored entirely in the browser and is never transmitted, consent or not.
 * This governs audience measurement — visits, countries, new vs returning — and
 * nothing about document content.
 *
 * The `default` command that starts everything denied is inlined into the
 * document head (see `src/app/layout.tsx`) rather than set from React, because
 * it has to run before the gtag script initialises; anything scheduled by a
 * component would land after GA had already written its cookies.
 */

export const CONSENT_STORAGE_KEY = 'analytics-consent';

export type ConsentChoice = 'granted' | 'denied';

/** Snapshot value for a visitor who has not chosen yet. */
export type ConsentState = ConsentChoice | 'undecided';

function parse(value: string | null): ConsentState {
  return value === 'granted' || value === 'denied' ? value : 'undecided';
}

/* ------------------------------------------------------------------ *
 * Store
 *
 * A `useSyncExternalStore` source rather than component state, so the banner
 * can read storage during render without a hydration mismatch and without the
 * `setState`-inside-an-effect pattern this codebase is trying to shed. The
 * server snapshot is 'granted' so nothing renders during SSR; the real value
 * arrives on the client's first commit.
 * ------------------------------------------------------------------ */

let cached: ConsentState | null = null;
const listeners = new Set<() => void>();

export function subscribeToConsent(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Client snapshot. Cached so repeated renders return a stable value. */
export function getConsentSnapshot(): ConsentState {
  if (cached === null) cached = parse(readStored(CONSENT_STORAGE_KEY));
  return cached;
}

/** Server snapshot: treat as decided so the banner is never server-rendered. */
export function getConsentServerSnapshot(): ConsentState {
  return 'granted';
}

/**
 * Records a choice and tells any loaded tag about it.
 *
 * Persisting can fail when the browser blocks site data. The in-memory value and
 * the Consent Mode update still apply, so the decision is honoured for this
 * session — it just has to be asked again next time.
 */
export function setConsent(choice: ConsentChoice): void {
  cached = choice;
  writeStored(CONSENT_STORAGE_KEY, choice);
  applyConsent(choice);
  for (const listener of listeners) listener();
}

/**
 * Pushes the choice into Consent Mode. Safe to call before the GA script has
 * loaded: `gtag` queues into `dataLayer`, which the head snippet defines
 * synchronously, so the update replays once the tag initialises.
 */
export function applyConsent(choice: ConsentChoice): void {
  if (typeof window === 'undefined') return;
  window.gtag?.('consent', 'update', { analytics_storage: choice });
}

/**
 * The inline script that must run before gtag loads.
 *
 * It defines `dataLayer`/`gtag`, then sets the Consent Mode default from storage
 * so a visitor who already accepted is not downgraded to cookieless for the
 * first few hundred milliseconds of every page load. Ad storage stays denied
 * unconditionally — this site runs no ads.
 */
export function consentBootstrapScript(): string {
  return `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
var c = 'denied';
try { if (window.localStorage.getItem(${JSON.stringify(CONSENT_STORAGE_KEY)}) === 'granted') c = 'granted'; } catch (e) {}
gtag('consent', 'default', {
  analytics_storage: c,
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  wait_for_update: 500
});`.trim();
}
