import { expect, type Page, test } from '@playwright/test';

/**
 * Opens the example modal and loads the e-commerce sample by its card title,
 * so the tests don't depend on the order examples are listed in. The whole
 * card is clickable, so clicking its heading selects the example.
 */
async function loadEcommerceExample(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /Try an example JSON/i }).click();
  await expect(page.getByRole('heading', { name: /Select a JSON Example/i })).toBeVisible();
  await page.getByRole('heading', { name: 'E-commerce Catalog' }).click();
}

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
    await loadEcommerceExample(page);
    // exact: true — otherwise matches "Invalid JSON" and FAQ copy that contains "valid JSON"
    await expect(page.getByText('Valid JSON', { exact: true })).toBeVisible({ timeout: 15_000 });
  });

  test('tree tab renders nodes after loading example', async ({ page }) => {
    await loadEcommerceExample(page);
    await expect(page.getByText('Valid JSON', { exact: true })).toBeVisible({ timeout: 15_000 });

    await page.getByRole('tab', { name: 'Tree View' }).click();
    await expect(page).toHaveURL(/\/tree/);
    // Scope to the tree panel: the editor stays mounted (hidden) across view
    // switches, and its syntax-highlighted spans would also match this text.
    await expect(page.locator('#tree-tab').getByText('"catalog"').first()).toBeVisible({
      timeout: 15_000,
    });
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
