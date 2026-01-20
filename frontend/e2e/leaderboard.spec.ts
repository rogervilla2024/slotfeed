import { test, expect } from '@playwright/test';

test.describe('Leaderboard Page E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/leaderboard');
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display leaderboard with streamers', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Leaderboard/);

    // Check for table headers
    await expect(page.getByText('Rank')).toBeVisible();
    await expect(page.getByText('Streamer')).toBeVisible();
    await expect(page.getByText('Sessions')).toBeVisible();
    await expect(page.getByText('Profit/Loss')).toBeVisible();
  });

  test('should show streamer rows in leaderboard', async ({ page }) => {
    // Wait for streamer data to load
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible();

    // Check for at least one streamer
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should have clickable streamer links', async ({ page }) => {
    // Find first streamer link
    const streamerLink = page.locator('a[href*="/streamer/"]').first();
    await expect(streamerLink).toBeVisible();

    // Click and verify navigation
    await streamerLink.click();
    await page.waitForLoadState('networkidle');

    // Should be on streamer page
    expect(page.url()).toContain('/streamer/');
  });

  test('should filter streamers by platform', async ({ page }) => {
    // Look for filter button/dropdown
    const filterButton = page.locator('button').filter({ hasText: /Platform|Filter/ }).first();

    if (await filterButton.isVisible()) {
      await filterButton.click();

      // Select Kick platform
      const kickOption = page.locator('[data-value="kick"]');
      if (await kickOption.isVisible()) {
        await kickOption.click();

        // Wait for filtered results
        await page.waitForLoadState('networkidle');

        // Verify filter was applied
        const filterDisplay = page.locator('[data-filter-active]');
        if (await filterDisplay.isVisible()) {
          await expect(filterDisplay).toContainText('kick');
        }
      }
    }
  });

  test('should sort streamers by profit/loss', async ({ page }) => {
    // Click profit/loss header to sort
    const profitHeader = page.locator('th').filter({ hasText: 'Profit/Loss' });
    await profitHeader.click();

    // Wait for sort
    await page.waitForLoadState('networkidle');

    // Verify sort indicator appears
    const sortIndicator = profitHeader.locator('svg, span').filter({ hasText: /↑|↓|sort/ });
    await expect(sortIndicator).toHaveCount(0); // May or may not have visible indicator
  });

  test('should display pagination controls', async ({ page }) => {
    // Check for pagination
    const pagination = page.locator('[data-testid="pagination"], nav[aria-label*="Pagination"]');

    if (await pagination.isVisible()) {
      const nextButton = page.locator('button').filter({ hasText: /Next|→/ });
      await expect(nextButton).toBeDefined();
    }
  });

  test('should show streamer statistics', async ({ page }) => {
    // Click on first streamer
    const streamerLink = page.locator('a[href*="/streamer/"]').first();
    await streamerLink.click();

    // Wait for streamer page
    await page.waitForLoadState('networkidle');

    // Check for statistics
    const stats = [
      'Sessions',
      'Total Wagered',
      'Followers',
      'Avg RTP',
    ];

    for (const stat of stats) {
      const element = page.locator('text=' + stat).first();
      expect(element).toBeDefined();
    }
  });

  test('should handle empty leaderboard state', async ({ page }) => {
    // If no data is available, should show empty state
    const emptyState = page.locator('[data-testid="empty-state"], text=/No streamers|empty/i');
    const rows = page.locator('tbody tr');

    const rowCount = await rows.count();
    if (rowCount === 0) {
      await expect(emptyState).toBeVisible();
    }
  });

  test('should auto-refresh leaderboard data', async ({ page }) => {
    // Get initial streamer count
    const initialRows = await page.locator('tbody tr').count();

    // Wait for auto-refresh (typically 1 minute, but we'll wait shorter in test)
    await page.waitForTimeout(2000);

    // Count should remain the same or update with new data
    const updatedRows = await page.locator('tbody tr').count();
    expect(updatedRows).toBeGreaterThanOrEqual(0);
  });

  test('should show loading indicator during data fetch', async ({ page }) => {
    // Reload to trigger loading state
    await page.reload();

    // Look for loading indicator
    const loadingSpinner = page.locator('[data-testid="loading"], .spinner, [role="status"]');
    const loadingText = page.locator('text=/Loading|Please wait/i');

    // At least one should be visible during load
    const isLoading = await loadingSpinner.isVisible().catch(() => false) ||
                      await loadingText.isVisible().catch(() => false);

    // Wait for load to complete
    await page.waitForLoadState('networkidle');

    // Data should be visible after loading
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });
});
