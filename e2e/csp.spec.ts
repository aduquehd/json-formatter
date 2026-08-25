import { expect, test } from '@playwright/test';

/**
 * Pins the production Content-Security-Policy and proves every route renders
 * without violating it.
 *
 * The policy was tightened once the dead Monaco stack ('unsafe-eval'), Google
 * Analytics and the Google Fonts hosts were removed. Without this test those
 * allowances creep back the first time something appears not to work, and a CSP
 * regression is otherwise invisible: browsers report violations to the console,
 * not to the test runner.
 */

/**
 * Hosts and keywords the policy must no longer permit.
 *
 * Google Analytics is deliberately NOT in this list: it was reinstated behind
 * Consent Mode for audience metrics, so googletagmanager and the analytics
 * beacon hosts are expected. What must stay gone is everything nothing uses.
 */
const REMOVED = ['unsafe-eval', 'fonts.googleapis', 'fonts.gstatic', 'openstreetmap'];

/** Hosts the policy must still permit, or the feature that needs them breaks. */
const REQUIRED = [
  'https://*.basemaps.cartocdn.com',
  'https://server.arcgisonline.com',
  'https://*.googletagmanager.com',
  'https://*.google-analytics.com',
];

const ROUTES = ['/', '/tree', '/diff', '/graph', '/stats', '/search', '/map', '/help', '/guides'];

/**
 * Vercel serves the Web Analytics script from /_vercel/insights/* at the edge.
 * Running the production build under plain `next start` there is no such route,
 * so it 404s to text/plain and the browser reports a MIME error. That is an
 * artefact of testing off-platform, not a policy failure — and notably NOT a CSP
 * refusal, which confirms 'self' already covers the script.
 */
const OFF_PLATFORM_NOISE = /_vercel\/insights/;

test('production CSP is the tightened policy', async ({ request }) => {
  const csp = (await request.get('/')).headers()['content-security-policy'];
  expect(csp, 'CSP header must be present on a production build').toBeTruthy();

  for (const gone of REMOVED) {
    expect(csp, `policy should no longer allow ${gone}`).not.toContain(gone);
  }

  // Every third-party host is named rather than allowed via a blanket `https:`.
  for (const host of REQUIRED) {
    expect(csp, `policy must still allow ${host}`).toContain(host);
  }
  expect(csp).not.toMatch(/img-src[^;]*\shttps:(\s|;|$)/);

  // Clickjacking and base-tag hijacking stay closed.
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("base-uri 'self'");
  expect(csp).toContain("object-src 'none'");
});

for (const path of ROUTES) {
  test(`renders ${path} with no CSP violation`, async ({ page }) => {
    const violations: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (/Content Security Policy|Refused to/i.test(text) && !OFF_PLATFORM_NOISE.test(text)) {
        violations.push(`console: ${text}`);
      }
    });
    page.on('pageerror', (err) => {
      if (!OFF_PLATFORM_NOISE.test(err.message)) violations.push(`pageerror: ${err.message}`);
    });

    await page.goto(path, { waitUntil: 'networkidle' });
    expect(violations, violations.join('\n')).toEqual([]);
  });
}
