import { test, expect } from '@playwright/test';

test.describe('Error Handling Tests', () => {
  test('Should show connection error modal when /api/mails fails', async ({ page }) => {
    await page.route('**/api/config', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          appName: 'Test App',
          themeColor: '#3b82f6',
          columns: []
        })
      });
    });

    await page.route('**/api/mails', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' })
      });
    });

    await page.goto('http://localhost:3000');
    await expect(page.getByText('Kesalahan Koneksi')).toBeVisible({ timeout: 15000 });
  });
});
