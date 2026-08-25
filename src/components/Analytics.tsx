'use client';

import { Analytics as VercelAnalytics } from '@vercel/analytics/next';
import Script from 'next/script';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Page analytics: Google Analytics 4 for audience metrics, Vercel Web Analytics
 * as a cookieless baseline.
 *
 * GA4 answers "how many new vs returning users, from which countries" — that
 * needs a persistent identifier, i.e. a cookie, so it runs behind Consent Mode.
 * Vercel Web Analytics needs no cookie and no consent, so it keeps counting
 * regardless and covers the traffic GA loses to declines and blockers.
 *
 * Deliberately absent: any event describing what a visitor does with their JSON.
 * An earlier version sent format / compact / clear / copy / paste / tab-switch /
 * example-used events. Document content never left the browser then either, but
 * a behavioural stream is more than audience measurement needs. Page views only.
 *
 * The Consent Mode default is NOT set here — it is inlined into the document
 * head in `src/app/layout.tsx`, because it has to execute before the tag below
 * initialises. Anything a component schedules would land after GA had already
 * written its cookies.
 */
export default function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <>
      <VercelAnalytics />

      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`gtag('js', new Date());\ngtag('config', ${JSON.stringify(gaId)});`}
          </Script>
        </>
      )}
    </>
  );
}
