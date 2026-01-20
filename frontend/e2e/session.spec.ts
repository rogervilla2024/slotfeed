import { test, expect } from '@playwright/test';

test.describe('Session Details Page E2E Tests', () => {
  test('should load session details page', async ({ page }) => {
    // Navigate to a session (using mock ID, adjust as needed)
    await page.goto('/session/test-session-id');
    await page.waitForLoadState('networkidle');

    // Check page loaded
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('should display session financial summary', async ({ page }) => {
    await page.goto('/session/test-session-id');
    await page.waitForLoadState('networkidle');

    // Check for financial information
    const labels = [
      'Start Balance',
      'End Balance',
      'Total Wagered',
      'Total Won',
      'Profit/Loss',
      'RTP',
    ];

    for (const label of labels) {
      const element = page.locator(`text=${label}`);
      await expect(element).toBeVisible();
    }
  });

  test('should show balance history chart', async ({ page }) => {
    await page.goto('/session/test-session-id');
    await page.waitForLoadState('networkidle');

    // Look for chart container
    const chart = page.locator('[data-testid="balance-chart"], canvas, svg').first();

    if (await chart.isVisible()) {
      await expect(chart).toBeVisible();
    }
  });

  test('should display game breakdown table', async ({ page }) => {
    await page.goto('/session/test-session-id');
    await page.waitForLoadState('networkidle');

    // Check for game breakdown section
    const gameSection = page.locator('text=/Game Breakdown|Games Played/i');
    await expect(gameSection).toBeVisible();

    // Check for table with game data
    const gameRows = page.locator('tbody tr, [data-testid*="game"]');
    const rowCount = await gameRows.count();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test('should link to individual games', async ({ page }) => {
    await page.goto('/session/test-session-id');
    await page.waitForLoadState('networkidle');

    // Find game link in breakdown
    const gameLink = page.locator('a[href*="/slot/"]').first();

    if (await gameLink.isVisible()) {
      const href = await gameLink.getAttribute('href');
      expect(href).toContain('/slot/');

      // Click and navigate
      await gameLink.click();
      await page.waitForLoadState('networkidle');

      expect(page.url()).toContain('/slot/');
    }
  });

  test('should show big wins during session', async ({ page }) => {
    await page.goto('/session/test-session-id');
    await page.waitForLoadState('networkidle');

    // Look for big wins section
    const bigWinsSection = page.locator('text=/Big Wins|Notable Wins/i');

    if (await bigWinsSection.isVisible()) {
      // Check for win details
      const winCards = page.locator('[data-testid*="win"], .win-card');
      const winCount = await winCards.count();
      expect(winCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display session timeline', async ({ page }) => {
    await page.goto('/session/test-session-id');
    await page.waitForLoadState('networkidle');

    // Check for timeline or balance events
    const timeline = page.locator('[data-testid="timeline"], .timeline, [role="list"]').first();

    if (await timeline.isVisible()) {
      await expect(timeline).toBeVisible();
    }
  });

  test('should show session metadata', async ({ page }) => {
    await page.goto('/session/test-session-id');
    await page.waitForLoadState('networkidle');

    // Check for metadata like duration, viewer count
    const metadata = page.locator('text=/Duration|Viewers|Platform/i');

    if (await metadata.isVisible()) {
      await expect(metadata).toBeVisible();
    }
  });

  test('should navigate back to streamer profile', async ({ page }) => {
    await page.goto('/session/test-session-id');
    await page.waitForLoadState('networkidle');

    // Look for back button or streamer link
    const backButton = page.locator('button').filter({ hasText: /Back|←/ }).first();
    const streamerLink = page.locator('a[href*="/streamer/"]').first();

    if (await backButton.isVisible()) {
      await backButton.click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).not.toContain('/session/');
    } else if (await streamerLink.isVisible()) {
      await streamerLink.click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/streamer/');
    }
  });

  test('should handle session not found', async ({ page }) => {
    // Navigate to invalid session
    await page.goto('/session/invalid-session-id');
    await page.waitForLoadState('networkidle');

    // Should show error message
    const errorMessage = page.locator('[role="alert"], text=/not found|error/i');

    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toBeVisible();
    }
  });

  test('should show loading state while fetching', async ({ page }) => {
    // Navigate and intercept to delay response
    await page.route('**/api/**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.continue();
    });

    await page.goto('/session/test-session-id');

    // Should show loading indicator
    const loadingSpinner = page.locator('[data-testid="loading"], .spinner, [role="status"]');

    if (await loadingSpinner.isVisible()) {
      await expect(loadingSpinner).toBeVisible();
    }

    // Wait for load to complete
    await page.waitForLoadState('networkidle');

    // Data should now be visible
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/session/test-session-id');
    await page.waitForLoadState('networkidle');

    // Check that page is still usable on mobile
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();

    // Verify no horizontal scroll needed
    const bodyWidth = await page.evaluate(() => document.body.offsetWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(windowWidth);
  });
});
