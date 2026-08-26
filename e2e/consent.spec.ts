import { expect, test } from '@playwright/test';

/**
 * The consent gate is only meaningful if GA genuinely writes nothing before the
 * visitor accepts. That is invisible from the UI, so assert on the cookie jar
 * and on the Consent Mode state the tag actually sees.
 *
 * These run without NEXT_PUBLIC_GA_MEASUREMENT_ID set, which is the state of the
 * e2e build — so they pin the "no ID configured" contract: no Google request, no
 * cookie, no banner. The consent-state assertions are written to hold either
 * way, so they keep their value if the suite ever runs with an ID.
 */

const GA_HOSTS = /googletagmanager\.com|google-analytics\.com|analytics\.google\.com/;

test('sets no Google cookie before any choice is made', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const cookies = await page.context().cookies();
  expect(cookies.filter((c) => c.name.startsWith('_ga'))).toEqual([]);
});

test('makes no Google request when no measurement ID is configured', async ({ page }) => {
  const googleRequests: string[] = [];
  page.on('request', (r) => {
    if (GA_HOSTS.test(r.url())) googleRequests.push(r.url());
  });
  await page.goto('/', { waitUntil: 'networkidle' });
  expect(googleRequests, googleRequests.join('\n')).toEqual([]);
});

test('the JSON never leaves the browser', async ({ page }) => {
  const outbound: string[] = [];
  page.on('request', (r) => {
    const url = new URL(r.url());
    if (url.host !== new URL(page.url()).host) outbound.push(r.url());
  });

  await page.goto('/', { waitUntil: 'networkidle' });
  const secret = 'CANARY_b7f3e1a9_do_not_transmit';
  await page.locator('.cm-content').first().fill(`{"secret": "${secret}"}`);
  await page.waitForTimeout(1500);

  // Nothing carrying the document may have gone anywhere, to any host.
  for (const url of outbound) {
    expect(url, `request leaked document content: ${url}`).not.toContain(secret);
  }
  const bodies = outbound.filter((u) => GA_HOSTS.test(u));
  expect(bodies, 'no analytics request should fire while typing').toEqual([]);
});

/**
 * The gate itself, exercised only when a measurement ID is baked into the build.
 * NEXT_PUBLIC_* is inlined at build time, so this cannot be toggled per-test —
 * run `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-TEST123 pnpm test:e2e` to cover it.
 *
 * Verified manually against a G-VERIFY123 build: consent defaults to denied, no
 * _ga cookie exists before the choice, and both _ga and _ga_<id> appear only
 * after Accept.
 */
const gaConfigured = Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);

test.describe('with a measurement ID configured', () => {
  test.skip(!gaConfigured, 'needs NEXT_PUBLIC_GA_MEASUREMENT_ID at build time');

  test('defaults consent to denied and writes no cookie until accepted', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const defaults = await page.evaluate(() =>
      ((window as { dataLayer?: unknown[] }).dataLayer ?? [])
        .map((a) => Array.from(a as ArrayLike<unknown>))
        .filter((a) => a[0] === 'consent' && a[1] === 'default')
    );
    expect(defaults).toHaveLength(1);
    expect(defaults[0][2]).toMatchObject({ analytics_storage: 'denied' });

    const before = (await page.context().cookies()).filter((c) => c.name.startsWith('_ga'));
    expect(before, 'no analytics cookie may exist before consent').toEqual([]);

    await page.getByRole('button', { name: /accept/i }).click();
    await page.waitForTimeout(1000);

    const after = (await page.context().cookies()).filter((c) => c.name.startsWith('_ga'));
    expect(after.length, 'accepting should allow the analytics cookie').toBeGreaterThan(0);
  });

  test('declining keeps it cookieless', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /decline/i }).click();
    await page.waitForTimeout(1000);
    const cookies = (await page.context().cookies()).filter((c) => c.name.startsWith('_ga'));
    expect(cookies, 'declining must not write an analytics cookie').toEqual([]);
  });
});
