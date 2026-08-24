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

/** Hosts and keywords the policy must no longer permit. */
const REMOVED = [
  'unsafe-eval',
  'googletagmanager',
  'google-analytics',
  'analytics.google.com',
  'fonts.googleapis',
  'fonts.gstatic',
  'openstreetmap',
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

  // Tile hosts are named rather than allowed via a blanket `https:`.
  expect(csp).toContain('https://*.basemaps.cartocdn.com');
  expect(csp).toContain('https://server.arcgisonline.com');
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
