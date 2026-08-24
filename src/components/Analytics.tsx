import { Analytics as VercelAnalytics } from '@vercel/analytics/next';

/**
 * Page analytics.
 *
 * Vercel Web Analytics, deliberately chosen over Google Analytics: it sets no
 * cookies at all (visitors are identified by a hash of the incoming request,
 * discarded after 24 hours), so there is nothing to ask consent for and no
 * consent banner, and the data stays first-party rather than going to Google.
 *
 * It records page views with country, referrer, device and browser — enough to
 * see how the site is used. It does NOT record what anyone does with their JSON:
 * the previous setup sent format/compact/copy/paste/clear/tab events, which is
 * behavioural data this tool has no business collecting. Those are gone.
 *
 * The trade-off is that a 24-hour hash carries no cross-day identity, so
 * "visitors" means unique-per-period and new-vs-returning is not available.
 * Getting that back would require a persistent identifier, i.e. a cookie and a
 * consent banner.
 *
 * Requires Web Analytics to be enabled for the project in the Vercel dashboard;
 * the component is inert everywhere else, including local development.
 */
export default function Analytics() {
  return <VercelAnalytics />;
}
