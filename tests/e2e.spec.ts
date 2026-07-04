import { test, expect } from '@playwright/test';

test.describe('Sistem Manajemen Agenda Persuratan', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');
  });

  test('Login and Dashboard View', async ({ page }) => {
    // Fill login form
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await expect(page.locator('text=Dashboard')).toBeVisible();

    // Screenshot for visual validation
    await page.screenshot({ path: 'screenshots/dashboard.png' });
  });

  test('Create and Edit Mail Entry', async ({ page }) => {
    // Login
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button[type="submit"]');

    // Go to Mails tab
    await page.click('text=Agenda Surat');
    await expect(page.locator('text=Tambah Surat')).toBeVisible();

    // Open Drawer
    await page.click('text=Tambah Surat');

    // Fill some fields (assuming standard columns like 'perihal')
    // Note: We use md-filled-text-field so we might need better selectors
    await page.locator('md-filled-text-field[label="PERIHAL"] input').fill('Surat Undangan Rapat E2E');
    await page.locator('md-filled-text-field[label="NOMOR SURAT"] input').fill('001/E2E/2026');

    // Save
    await page.click('md-filled-button:has-text("Simpan")');

    // Verify in table
    await expect(page.locator('text=Surat Undangan Rapat E2E')).toBeVisible();
    await page.screenshot({ path: 'screenshots/mail-list.png' });
  });
});
