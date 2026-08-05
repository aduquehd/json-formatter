import { expect, test } from '@playwright/test';

const ROUTES = [
  { path: '/', title: /JSON Formatter/i },
  { path: '/tree', title: /JSON Viewer|Tree/i },
  { path: '/graph', title: /JSON Graph|Graph/i },
  { path: '/stats', title: /JSON Analyzer|Statistics|Stats/i },
  { path: '/search', title: /Search/i },
  { path: '/map', title: /Map/i },
  { path: '/diff', title: /Diff|Compare/i },
  { path: '/help', title: /Help/i },
  { path: '/guides', title: /Guide/i },
] as const;

test.describe('workbench smoke', () => {
  test('home loads editor shell', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/JSON Formatter/i);
    await expect(page.getByRole('button', { name: 'Format' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Editor' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'JSON editor' })).toBeVisible();
  });

  test('example load shows valid status', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Try an example JSON/i }).click();
    await expect(page.getByRole('heading', { name: /Select a JSON Example/i })).toBeVisible();
    await page.getByRole('button', { name: 'Use this example' }).first().click();
    // exact: true — otherwise matches "Invalid JSON" and FAQ copy that contains "valid JSON"
    await expect(page.getByText('Valid JSON', { exact: true })).toBeVisible({ timeout: 15_000 });
  });

  test('tree tab renders nodes after loading example', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Try an example JSON/i }).click();
    await page.getByRole('button', { name: 'Use this example' }).first().click();
    await expect(page.getByText('Valid JSON', { exact: true })).toBeVisible({ timeout: 15_000 });

    await page.getByRole('tab', { name: 'Tree View' }).click();
    await expect(page).toHaveURL(/\/tree/);
    // Tree shows expandable catalog/metadata keys from the e-commerce sample.
    await expect(page.getByText('"catalog"').first()).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('route availability', () => {
  for (const { path, title } of ROUTES) {
    test(`${path} responds 200 and has a title`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.ok()).toBeTruthy();
      await expect(page).toHaveTitle(title);
    });
  }
});
