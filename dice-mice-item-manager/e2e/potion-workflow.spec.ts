import { test, expect } from '@playwright/test';

test.describe('Potion Creation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Note: In a real app, you'd set up test data and authentication here
    // For now, we'll mock the authentication state
    await page.goto('/');

    // Mock authentication by setting session storage or cookies
    // This would depend on your actual auth implementation
    await page.evaluate(() => {
      // Mock session data
      localStorage.setItem('next-auth.session-token', 'mock-session-token');
    });
  });

  test('user can create a potion and see it in my-items', async ({ page }) => {
    // Navigate to compendium page
    await page.goto('/compendium');

    // Wait for potions to load
    await page.waitForSelector('[data-testid="potions-section"]', {
      timeout: 10000,
    });

    // Find and click on a potion template to add
    const firstPotionCard = page.locator('[data-testid="potion-card"]').first();
    await expect(firstPotionCard).toBeVisible();
    await firstPotionCard.click();

    // Wait for and interact with the "Add Potion" modal
    await page.waitForSelector('[data-testid="add-potion-modal"]', {
      timeout: 5000,
    });

    // Fill out the potion creation form
    await page.fill('[data-testid="custom-id-input"]', 'TEST-E2E-001');
    await page.fill('[data-testid="crafted-by-input"]', 'E2E Test Alchemist');
    await page.selectOption('[data-testid="potency-select"]', 'success');
    await page.fill('[data-testid="weight-input"]', '0.5');

    // Submit the form
    await page.click('[data-testid="create-potion-button"]');

    // Wait for success message or modal to close
    await page.waitForSelector('[data-testid="add-potion-modal"]', {
      state: 'hidden',
      timeout: 5000,
    });

    // Navigate to my-items page
    await page.goto('/my-items');

    // Wait for my-items page to load
    await page.waitForSelector('[data-testid="my-potions-section"]', {
      timeout: 10000,
    });

    // Verify the created potion appears in the list
    const createdPotion = page.locator('[data-testid="user-potion-card"]', {
      has: page.locator('text=TEST-E2E-001'),
    });

    await expect(createdPotion).toBeVisible();

    // Verify potion details are correct
    await expect(createdPotion).toContainText('E2E Test Alchemist');
    await expect(createdPotion).toContainText('Success');
    await expect(createdPotion).toContainText('0.5 lbs');

    // Click on the potion to open details modal
    await createdPotion.click();

    // Verify details modal opens with correct information
    await page.waitForSelector('[data-testid="potion-details-modal"]', {
      timeout: 5000,
    });
    await expect(
      page.locator('[data-testid="potion-details-modal"]')
    ).toContainText('TEST-E2E-001');
    await expect(
      page.locator('[data-testid="potion-details-modal"]')
    ).toContainText('E2E Test Alchemist');

    // Close the modal
    await page.click('[data-testid="close-modal-button"]');
    await page.waitForSelector('[data-testid="potion-details-modal"]', {
      state: 'hidden',
      timeout: 3000,
    });
  });

  test('user can search and filter potions in my-items', async ({ page }) => {
    // This test assumes there are multiple potions already created
    await page.goto('/my-items');

    // Wait for my-items page to load
    await page.waitForSelector('[data-testid="my-potions-section"]', {
      timeout: 10000,
    });

    // Get initial count of visible potion cards
    const initialCards = await page
      .locator('[data-testid="user-potion-card"]')
      .count();

    // Test search functionality
    const searchInput = page.locator('[data-testid="potion-search-input"]');
    await searchInput.fill('TEST-E2E');

    // Verify filtered results
    await page.waitForTimeout(500); // Allow debounce
    const searchedCards = await page
      .locator('[data-testid="user-potion-card"]')
      .count();
    expect(searchedCards).toBeLessThanOrEqual(initialCards);

    // Clear search
    await searchInput.clear();

    // Test status filter
    const statusFilter = page.locator('[data-testid="status-filter-select"]');
    await statusFilter.selectOption('available');

    // Verify only available potions are shown
    const availableCards = page.locator('[data-testid="user-potion-card"]');
    const cardCount = await availableCards.count();

    // Each visible card should not have consumed status
    for (let i = 0; i < cardCount; i++) {
      const card = availableCards.nth(i);
      await expect(card).not.toContainText('Consumed by:');
    }

    // Test consumed filter
    await statusFilter.selectOption('consumed');

    // If there are consumed potions, they should be shown
    const consumedCards = await page
      .locator('[data-testid="user-potion-card"]')
      .count();

    // Reset filter
    await statusFilter.selectOption('all');
  });

  test('user can consume a potion', async ({ page }) => {
    await page.goto('/my-items');

    // Wait for my-items page to load
    await page.waitForSelector('[data-testid="my-potions-section"]', {
      timeout: 10000,
    });

    // Find an available potion to consume
    const availablePotion = page
      .locator('[data-testid="user-potion-card"]')
      .first();
    await expect(availablePotion).toBeVisible();

    // Get the potion ID for later verification
    const potionText = await availablePotion.textContent();

    // Click to open details modal
    await availablePotion.click();

    // Wait for details modal
    await page.waitForSelector('[data-testid="potion-details-modal"]', {
      timeout: 5000,
    });

    // Click consume potion button
    const consumeButton = page.locator('[data-testid="consume-potion-button"]');
    await expect(consumeButton).toBeVisible();
    await consumeButton.click();

    // Fill out consumption form if it appears
    const consumptionModal = page.locator('[data-testid="consumption-modal"]');
    if (await consumptionModal.isVisible()) {
      await page.fill('[data-testid="consumed-by-input"]', 'E2E Test Hero');
      await page.click('[data-testid="confirm-consumption-button"]');
    }

    // Wait for modals to close
    await page.waitForSelector('[data-testid="potion-details-modal"]', {
      state: 'hidden',
      timeout: 5000,
    });

    // Verify the potion now shows as consumed
    // Look for the updated potion card
    const updatedPotion = page.locator('[data-testid="user-potion-card"]', {
      has: page.locator('text=E2E Test Hero'),
    });

    await expect(updatedPotion).toBeVisible();
    await expect(updatedPotion).toContainText('Consumed by:');
    await expect(updatedPotion).toContainText('E2E Test Hero');
  });

  test('statistics are updated correctly', async ({ page }) => {
    await page.goto('/my-items');

    // Wait for my-items page to load
    await page.waitForSelector('[data-testid="my-potions-section"]', {
      timeout: 10000,
    });

    // Check initial statistics
    const totalPotionsElement = page.locator(
      '[data-testid="total-potions-stat"]'
    );
    const availablePotionsElement = page.locator(
      '[data-testid="available-potions-stat"]'
    );
    const consumedPotionsElement = page.locator(
      '[data-testid="consumed-potions-stat"]'
    );
    const totalValueElement = page.locator('[data-testid="total-value-stat"]');

    // Verify statistics exist and are numbers
    await expect(totalPotionsElement).toBeVisible();
    await expect(availablePotionsElement).toBeVisible();
    await expect(consumedPotionsElement).toBeVisible();
    await expect(totalValueElement).toBeVisible();

    // Get current values
    const totalText = await totalPotionsElement.textContent();
    const availableText = await availablePotionsElement.textContent();
    const consumedText = await consumedPotionsElement.textContent();

    const total = parseInt(totalText || '0');
    const available = parseInt(availableText || '0');
    const consumed = parseInt(consumedText || '0');

    // Verify math is correct
    expect(total).toBe(available + consumed);

    // Verify that the total value is reasonable (greater than 0 if there are potions)
    if (total > 0) {
      const valueText = await totalValueElement.textContent();
      const value = parseInt(valueText || '0');
      expect(value).toBeGreaterThan(0);
    }
  });

  test('error handling works correctly', async ({ page }) => {
    // Test for network error handling
    await page.goto('/compendium');

    // Intercept API calls and simulate network error
    await page.route('**/api/potions', (route) => {
      route.abort('internetdisconnected');
    });

    // Try to create a potion
    const firstPotionCard = page.locator('[data-testid="potion-card"]').first();
    await firstPotionCard.click();

    // Fill form and submit
    await page.waitForSelector('[data-testid="add-potion-modal"]', {
      timeout: 5000,
    });
    await page.fill('[data-testid="custom-id-input"]', 'ERROR-TEST-001');
    await page.fill('[data-testid="crafted-by-input"]', 'Error Test');
    await page.selectOption('[data-testid="potency-select"]', 'success');
    await page.fill('[data-testid="weight-input"]', '0.5');

    await page.click('[data-testid="create-potion-button"]');

    // Verify error message appears
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    await expect(errorMessage).toContainText(/error|failed/i);
  });
});
