import { test, expect } from '@playwright/test';

test.describe('Authentication and Basic Navigation', () => {
  test('home page loads correctly', async ({ page }) => {
    await page.goto('/');

    // Check that the main elements are present
    await expect(page.locator('h1')).toBeVisible();

    // Check navigation elements
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });

  test('unauthenticated user is prompted to sign in', async ({ page }) => {
    await page.goto('/my-items');

    // Should redirect to auth or show sign-in prompt
    // This depends on your auth implementation
    const signInButton = page.locator('text=Sign in');
    const authRedirect = page.locator('[data-testid="auth-required"]');

    // Either a sign-in button should be visible or user should be redirected
    try {
      await expect(signInButton).toBeVisible({ timeout: 5000 });
    } catch {
      await expect(authRedirect).toBeVisible({ timeout: 5000 });
    }
  });

  test('navigation works correctly', async ({ page }) => {
    await page.goto('/');

    // Test navigation to different pages
    const pages = [
      { link: 'Compendium', path: '/compendium' },
      { link: 'My Items', path: '/my-items' },
      { link: 'Create Character', path: '/create-character' },
      { link: 'My Characters', path: '/my-characters' },
    ];

    for (const { link, path } of pages) {
      // Look for navigation link
      const navLink = page.locator(`nav a:has-text("${link}")`);
      if (await navLink.isVisible()) {
        await navLink.click();
        await page.waitForURL(`**${path}**`, { timeout: 5000 });
        expect(page.url()).toContain(path);

        // Go back to home
        await page.goto('/');
      }
    }
  });

  test('responsive design works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    // Check that mobile navigation works
    const mobileMenu = page.locator('[data-testid="mobile-menu-button"]');
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();

      // Mobile menu should open
      const mobileNav = page.locator('[data-testid="mobile-navigation"]');
      await expect(mobileNav).toBeVisible();
    }

    // Test that content is readable on mobile
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('dark mode toggle works', async ({ page }) => {
    await page.goto('/');

    // Look for dark mode toggle
    const darkModeToggle = page.locator('[data-testid="dark-mode-toggle"]');

    if (await darkModeToggle.isVisible()) {
      // Get initial theme
      const initialTheme = await page.locator('html').getAttribute('class');

      // Toggle dark mode
      await darkModeToggle.click();

      // Wait a moment for theme to change
      await page.waitForTimeout(500);

      // Check that theme changed
      const newTheme = await page.locator('html').getAttribute('class');
      expect(newTheme).not.toBe(initialTheme);

      // Toggle back
      await darkModeToggle.click();
      await page.waitForTimeout(500);

      // Should be back to original theme
      const finalTheme = await page.locator('html').getAttribute('class');
      expect(finalTheme).toBe(initialTheme);
    }
  });
});
