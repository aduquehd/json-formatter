'use client';

import { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type ConsentChoice,
  getConsentServerSnapshot,
  getConsentSnapshot,
  setConsent,
  subscribeToConsent,
} from '@/lib/consent';

/**
 * Asks once whether analytics cookies are allowed.
 *
 * Only shown when there is a decision to make: no GA measurement ID means no
 * cookies, so no banner. Until the visitor chooses, Consent Mode keeps GA
 * cookieless, so declining is a real option rather than a dark pattern — both
 * buttons carry equal visual weight for the same reason.
 *
 * Rendered from the root layout so the choice applies site-wide.
 */
export default function ConsentBanner() {
  const { t } = useTranslation();
  const consent = useSyncExternalStore(
    subscribeToConsent,
    getConsentSnapshot,
    getConsentServerSnapshot
  );

  if (!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || consent !== 'undecided') return null;

  const decide = (choice: ConsentChoice) => setConsent(choice);

  return (
    <section
      aria-label={t('consent.title', 'Analytics cookies')}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-4 shadow-lg"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
          {t(
            'consent.body',
            'We use analytics cookies to count visitors and see which countries they come from. Your JSON is always processed in your browser and is never sent anywhere, whichever you choose.'
          )}
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => decide('denied')}
            className="rounded-lg border border-[var(--border-color)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-hover)] hover:text-[var(--text-primary)]"
          >
            {t('consent.decline', 'Decline')}
          </button>
          <button
            type="button"
            onClick={() => decide('granted')}
            className="rounded-lg bg-[var(--accent-color)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            {t('consent.accept', 'Accept')}
          </button>
        </div>
      </div>
    </section>
  );
}
