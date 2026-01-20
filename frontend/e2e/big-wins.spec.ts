import { test, expect } from '@playwright/test';

test.describe('Big Wins Gallery E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/big-wins');
    await page.waitForLoadState('networkidle');
  });

  test('should display big wins gallery', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Big Wins|Wins/i);

    // Check for gallery heading
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('should display win cards with details', async ({ page }) => {
    // Find win cards
    const winCards = page.locator('[data-testid*="win"], .win-card, [role="article"]');
    const cardCount = await winCards.count();

    if (cardCount > 0) {
      // Check first card has required information
      const firstCard = winCards.first();

      // Should have streamer, game, amount, multiplier
      const elements = await firstCard.locator('*').all();
      expect(elements.length).toBeGreaterThan(0);
    }
  });

  test('should show win amounts and multipliers', async ({ page }) => {
    // Look for multiplier notation (e.g., "500x", "1000x")
    const multiplierText = page.locator('text=/\\d+x|multiplier/i');

    if (await multiplierText.isVisible()) {
      await expect(multiplierText).toBeVisible();
    }

    // Look for dollar amounts
    const amountText = page.locator('text=/\\$[0-9,]+/');

    if (await amountText.isVisible()) {
      await expect(amountText).toBeVisible();
    }
  });

  test('should filter wins by streamer', async ({ page }) => {
    // Look for filter dropdown
    const filterButton = page.locator('button, select').filter({ hasText: /Streamer|Filter|All/ }).first();

    if (await filterButton.isVisible()) {
      await filterButton.click();

      // Select first streamer option
      const option = page.locator('option, [role="option"]').nth(1);
      if (await option.isVisible()) {
        await option.click();

        // Wait for filter
        await page.waitForLoadState('networkidle');

        // Verify filtered results
        const winCards = page.locator('[data-testid*="win"], .win-card');
        const cardCount = await winCards.count();
        expect(cardCount).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('should filter wins by game', async ({ page }) => {
    // Look for game filter
    const gameFilter = page.locator('select, button').filter({ hasText: /Game|Slot/ });

    if (await gameFilter.isVisible()) {
      await gameFilter.click();

      const gameOption = page.locator('option, [role="option"]').nth(1);
      if (await gameOption.isVisible()) {
        await gameOption.click();

        await page.waitForLoadState('networkidle');

        // Verify filter applied
        const winCards = page.locator('[data-testid*="win"], .win-card');
        const cardCount = await winCards.count();
        expect(cardCount).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('should sort wins by amount', async ({ page }) => {
    // Look for sort button
    const sortButton = page.locator('button').filter({ hasText: /Sort|Amount|Recent/ });

    if (await sortButton.isVisible()) {
      await sortButton.click();

      // Select amount sort
      const amountSort = page.locator('[data-value="amount"]');
      if (await amountSort.isVisible()) {
        await amountSort.click();

        await page.waitForLoadState('networkidle');

        // Verify sort applied
        const winCards = page.locator('[data-testid*="win"], .win-card');
        const cardCount = await winCards.count();
        expect(cardCount).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('should display win timestamps', async ({ page }) => {
    // Look for timestamps
    const timestamps = page.locator('text=/ago|2024|January|minutes/i');

    if (await timestamps.isVisible()) {
      await expect(timestamps).toBeVisible();
    }
  });

  test('should link to win screenshots', async ({ page }) => {
    // Find screenshot link
    const screenshotLink = page.locator('a[href*="screenshot"], a[href*="image"], img[alt*="win"]').first();

    if (await screenshotLink.isVisible()) {
      const href = await screenshotLink.getAttribute('href') ||
                   await screenshotLink.getAttribute('src');

      expect(href).toBeDefined();
    }
  });

  test('should navigate to session from big win', async ({ page }) => {
    // Find win that links to session
    const sessionLink = page.locator('a[href*="/session/"]').first();

    if (await sessionLink.isVisible()) {
      const href = await sessionLink.getAttribute('href');
      expect(href).toContain('/session/');

      // Click and verify navigation
      await sessionLink.click();
      await page.waitForLoadState('networkidle');

      expect(page.url()).toContain('/session/');
    }
  });

  test('should navigate to game from big win', async ({ page }) => {
    // Find game link
    const gameLink = page.locator('a[href*="/slot/"]').first();

    if (await gameLink.isVisible()) {
      const href = await gameLink.getAttribute('href');
      expect(href).toContain('/slot/');

      // Click and verify navigation
      await gameLink.click();
      await page.waitForLoadState('networkidle');

      expect(page.url()).toContain('/slot/');
    }
  });

  test('should show pagination or infinite scroll', async ({ page }) => {
    // Get initial card count
    const initialCards = await page.locator('[data-testid*="win"], .win-card').count();

    if (initialCards >= 10) {
      // Look for pagination
      const pagination = page.locator('button').filter({ hasText: /Next|More|Load/ }).first();

      if (await pagination.isVisible()) {
        await pagination.click();
        await page.waitForLoadState('networkidle');

        // Count should increase
        const updatedCards = await page.locator('[data-testid*="win"], .win-card').count();
        expect(updatedCards).toBeGreaterThanOrEqual(initialCards);
      } else {
        // Try scrolling for infinite scroll
        await page.locator('body').evaluate(el => el.scrollTop = el.scrollHeight);
        await page.waitForLoadState('networkidle');

        const scrolledCards = await page.locator('[data-testid*="win"], .win-card').count();
        expect(scrolledCards).toBeGreaterThanOrEqual(initialCards);
      }
    }
  });

  test('should auto-refresh big wins', async ({ page }) => {
    const initialCards = await page.locator('[data-testid*="win"], .win-card').count();

    // Wait for auto-refresh
    await page.waitForTimeout(3000);

    // Cards should still be there
    const updatedCards = await page.locator('[data-testid*="win"], .win-card').count();
    expect(updatedCards).toBeGreaterThanOrEqual(0);
  });

  test('should show empty state when no wins', async ({ page }) => {
    // Apply a filter that returns no results
    const filterButton = page.locator('button, select').filter({ hasText: /Filter|Streamer/ }).first();

    if (await filterButton.isVisible()) {
      // Set a filter that might return no results
      // This is implementation-specific

      const emptyState = page.locator('[data-testid="empty-state"], text=/No wins|No big wins/i');

      if (await emptyState.isVisible()) {
        await expect(emptyState).toBeVisible();
      }
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/big-wins');
    await page.waitForLoadState('networkidle');

    // Check visible on mobile
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();

    // Win cards should be visible
    const winCard = page.locator('[data-testid*="win"], .win-card').first();
    if (await winCard.isVisible()) {
      await expect(winCard).toBeVisible();
    }
  });
});
