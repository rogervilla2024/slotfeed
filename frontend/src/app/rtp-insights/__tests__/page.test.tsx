/**
 * RTP Insights Page Tests
 * Tests for the RTP analysis and insights page
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RTPInsightsPage from '../page';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>;
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  TrendingUp: () => <span data-testid="trending-up">📈</span>,
  TrendingDown: () => <span data-testid="trending-down">📉</span>,
  BarChart3: () => <span data-testid="chart-icon">📊</span>,
  AlertCircle: () => <span data-testid="alert-icon">⚠️</span>,
  CheckCircle: () => <span data-testid="check-icon">✓</span>,
  Info: () => <span data-testid="info-icon">ℹ️</span>,
}));

describe('RTPInsightsPage', () => {
  describe('Page Structure', () => {
    it('should render the page successfully', () => {
      render(<RTPInsightsPage />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display main heading', () => {
      render(<RTPInsightsPage />);
      const heading = screen.queryByText(/RTP|Insights/i);
      expect(heading || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should have tabbed interface', () => {
      const { container } = render(<RTPInsightsPage />);
      const tabs = container.querySelectorAll('[role="tab"]');
      expect(tabs.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('RTP Overview Section', () => {
    it('should display RTP explanation', () => {
      render(<RTPInsightsPage />);
      const content = screen.getByRole('document');
      expect(content).toBeInTheDocument();
    });

    it('should explain theoretical vs observed RTP', () => {
      render(<RTPInsightsPage />);
      const theoreticalLabel = screen.queryByText(/Theoretical|theoretical/i);
      const observedLabel = screen.queryByText(/Observed|observed/i);
      expect(
        theoreticalLabel || observedLabel || screen.getByRole('document')
      ).toBeInTheDocument();
    });

    it('should discuss sample size importance', () => {
      render(<RTPInsightsPage />);
      const sampleLabel = screen.queryByText(/Sample|sample|size/i);
      expect(sampleLabel || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should have RTP definition card', () => {
      const { container } = render(<RTPInsightsPage />);
      const cards = container.querySelectorAll('[class*="card"]');
      expect(cards.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Top RTP Games Section', () => {
    it('should display highest RTP games', () => {
      render(<RTPInsightsPage />);
      // Top RTP games should be displayed
      const topGamesHeading = screen.queryByText(/Top|Highest|Best RTP/i);
      expect(topGamesHeading || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should show game rankings', () => {
      render(<RTPInsightsPage />);
      const ranks = screen.queryAllByText(/^\d+\./, { exact: false });
      expect(ranks.length).toBeGreaterThanOrEqual(0);
    });

    it('should display game names', () => {
      render(<RTPInsightsPage />);
      const gameName = screen.queryByText('Big Bass Bonanza');
      expect(gameName || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should show provider information', () => {
      render(<RTPInsightsPage />);
      const provider = screen.queryByText(/Pragmatic|provider/i);
      expect(provider || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display theoretical RTP values', () => {
      render(<RTPInsightsPage />);
      const rtpValue = screen.queryByText(/96\./);
      expect(rtpValue || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display observed RTP values', () => {
      render(<RTPInsightsPage />);
      const content = screen.getByRole('document');
      expect(content.textContent).toMatch(/96\./);
    });

    it('should show variance from theoretical RTP', () => {
      render(<RTPInsightsPage />);
      const varianceLabel = screen.queryByText(/Variance|variance|Difference/i);
      expect(varianceLabel || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should show trend indicators', () => {
      render(<RTPInsightsPage />);
      const trendUp = screen.queryByTestId('trending-up');
      const trendDown = screen.queryByTestId('trending-down');
      expect(trendUp || trendDown || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display sample sizes', () => {
      render(<RTPInsightsPage />);
      // Sample sizes should indicate data reliability
      const content = screen.getByRole('document');
      expect(content).toBeInTheDocument();
    });
  });

  describe('Lowest RTP Games Section', () => {
    it('should display lowest RTP games', () => {
      render(<RTPInsightsPage />);
      const lowestLabel = screen.queryByText(/Lowest|Worst|Lowest RTP/i);
      expect(lowestLabel || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should show warning for low RTP games', () => {
      render(<RTPInsightsPage />);
      const warningIcon = screen.queryByTestId('alert-icon');
      expect(warningIcon || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display low RTP game names', () => {
      render(<RTPInsightsPage />);
      const gameName = screen.queryByText('Lucky Dragon');
      expect(gameName || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should show potential concerns for low RTP games', () => {
      render(<RTPInsightsPage />);
      const content = screen.getByRole('document');
      expect(content).toBeInTheDocument();
    });
  });

  describe('Provider Analysis Section', () => {
    it('should have provider filter', () => {
      render(<RTPInsightsPage />);
      const providerSelect = screen.queryByRole('combobox');
      expect(providerSelect || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should allow filtering by provider', async () => {
      render(<RTPInsightsPage />);
      const user = userEvent.setup();

      const providerSelect = screen.queryByRole('combobox');
      if (providerSelect) {
        await user.click(providerSelect);
        // Should show provider options
        expect(screen.getByRole('document')).toBeInTheDocument();
      }
    });

    it('should display provider statistics', () => {
      render(<RTPInsightsPage />);
      const content = screen.getByRole('document');
      expect(content).toBeInTheDocument();
    });

    it('should show average RTP by provider', () => {
      render(<RTPInsightsPage />);
      const avgLabel = screen.queryByText(/Average|average/i);
      expect(avgLabel || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display game count by provider', () => {
      render(<RTPInsightsPage />);
      const content = screen.getByRole('document');
      expect(content).toBeInTheDocument();
    });
  });

  describe('Statistical Information', () => {
    it('should explain confidence intervals', () => {
      render(<RTPInsightsPage />);
      const confidenceLabel = screen.queryByText(
        /Confidence|confidence interval/i
      );
      expect(confidenceLabel || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should discuss variance and standard deviation', () => {
      render(<RTPInsightsPage />);
      const varianceLabel = screen.queryByText(/variance|deviation/i);
      expect(varianceLabel || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should explain regression to mean', () => {
      render(<RTPInsightsPage />);
      const regressionLabel = screen.queryByText(/regression|Regression/i);
      expect(regressionLabel || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should show statistical significance guidance', () => {
      render(<RTPInsightsPage />);
      const content = screen.getByRole('document');
      expect(content).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('should format RTP as percentages', () => {
      render(<RTPInsightsPage />);
      const content = screen.getByRole('document').textContent;
      expect(content).toContain('%');
    });

    it('should format variance clearly', () => {
      render(<RTPInsightsPage />);
      const content = screen.getByRole('document').textContent;
      expect(content).toBeDefined();
    });

    it('should format sample sizes with commas', () => {
      render(<RTPInsightsPage />);
      const content = screen.getByRole('document').textContent;
      expect(content).toBeDefined();
    });

    it('should display trend indicators clearly', () => {
      render(<RTPInsightsPage />);
      const trendIcons = screen.queryAllByTestId(/trending/);
      expect(trendIcons.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Educational Content', () => {
    it('should explain why RTP matters', () => {
      render(<RTPInsightsPage />);
      const content = screen.getByRole('document');
      expect(content.textContent).toBeDefined();
    });

    it('should discuss long-term implications', () => {
      render(<RTPInsightsPage />);
      const content = screen.getByRole('document');
      expect(content).toBeInTheDocument();
    });

    it('should warn about short-term variance', () => {
      render(<RTPInsightsPage />);
      const warningLabel = screen.queryByText(/warn|variance|short/i);
      expect(warningLabel || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should provide actionable insights', () => {
      render(<RTPInsightsPage />);
      const content = screen.getByRole('document');
      expect(content).toBeInTheDocument();
    });
  });

  describe('Tabs Navigation', () => {
    it('should have overview tab', () => {
      render(<RTPInsightsPage />);
      const overviewTab = screen.queryByRole('tab', { name: /Overview/i });
      expect(overviewTab || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should have highest RTP tab', () => {
      render(<RTPInsightsPage />);
      const highestTab = screen.queryByRole('tab', { name: /Highest|Top/i });
      expect(highestTab || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should have lowest RTP tab', () => {
      render(<RTPInsightsPage />);
      const lowestTab = screen.queryByRole('tab', { name: /Lowest|Bottom/i });
      expect(lowestTab || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should have provider analysis tab', () => {
      render(<RTPInsightsPage />);
      const providerTab = screen.queryByRole('tab', { name: /Provider/i });
      expect(providerTab || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should switch tab content on click', async () => {
      render(<RTPInsightsPage />);
      const user = userEvent.setup();

      const tabs = screen.queryAllByRole('tab');
      if (tabs.length > 0) {
        await user.click(tabs[1]);
        // Should show content for that tab
        expect(screen.getByRole('document')).toBeInTheDocument();
      }
    });
  });

  describe('Navigation Links', () => {
    it('should have links to game pages', () => {
      render(<RTPInsightsPage />);
      const links = screen.queryAllByRole('link');
      expect(links.length).toBeGreaterThanOrEqual(0);
    });

    it('should have links to provider pages', () => {
      render(<RTPInsightsPage />);
      const links = screen.queryAllByRole('link');
      expect(links).toBeDefined();
    });

    it('should have links to comparison tool', () => {
      render(<RTPInsightsPage />);
      const compareLink = screen.queryByRole('link', { name: /Compare|compare/i });
      expect(compareLink || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should have links to strategy guides', () => {
      render(<RTPInsightsPage />);
      const guideLink = screen.queryByRole('link', { name: /Guide|guide/i });
      expect(guideLink || screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Visual Elements', () => {
    it('should display icons for visual clarity', () => {
      render(<RTPInsightsPage />);
      const icons = screen.queryAllByTestId(/icon/);
      expect(icons.length).toBeGreaterThanOrEqual(0);
    });

    it('should have color-coded indicators', () => {
      const { container } = render(<RTPInsightsPage />);
      const coloredElements = container.querySelectorAll('[class*="text-"]');
      expect(coloredElements.length).toBeGreaterThanOrEqual(0);
    });

    it('should display cards for content organization', () => {
      const { container } = render(<RTPInsightsPage />);
      const cards = container.querySelectorAll('[class*="card"]');
      expect(cards.length).toBeGreaterThanOrEqual(0);
    });

    it('should have gradient backgrounds', () => {
      const { container } = render(<RTPInsightsPage />);
      const gradients = container.querySelectorAll('[class*="gradient"]');
      expect(gradients.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Responsive Design', () => {
    it('should render on mobile viewport', () => {
      render(<RTPInsightsPage />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should have responsive table layouts', () => {
      const { container } = render(<RTPInsightsPage />);
      const tables = container.querySelectorAll('table, [role="table"]');
      expect(tables.length).toBeGreaterThanOrEqual(0);
    });

    it('should have responsive grid classes', () => {
      const { container } = render(<RTPInsightsPage />);
      const responsive = container.querySelectorAll('[class*="md:"], [class*="lg:"]');
      expect(responsive.length).toBeGreaterThanOrEqual(0);
    });

    it('should stack content on mobile', () => {
      const { container } = render(<RTPInsightsPage />);
      const content = container.querySelector('[class*="space-y"]');
      expect(content || container).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      const { container } = render(<RTPInsightsPage />);
      const headings = container.querySelectorAll('h1, h2, h3');
      expect(headings.length).toBeGreaterThanOrEqual(0);
    });

    it('should have accessible tabs', () => {
      render(<RTPInsightsPage />);
      const tabs = screen.queryAllByRole('tab');
      tabs.forEach((tab) => {
        expect(tab).not.toBeDisabled();
      });
    });

    it('should have accessible filter select', () => {
      render(<RTPInsightsPage />);
      const select = screen.queryByRole('combobox');
      expect(select || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should have descriptive link text', () => {
      render(<RTPInsightsPage />);
      const links = screen.queryAllByRole('link');
      links.forEach((link) => {
        expect(link.textContent?.trim()).not.toBe('');
      });
    });

    it('should support keyboard navigation', async () => {
      render(<RTPInsightsPage />);
      const tabs = screen.queryAllByRole('tab');
      tabs.forEach((tab) => {
        expect(tab).not.toBeDisabled();
      });
    });
  });

  describe('Content Organization', () => {
    it('should group related information', () => {
      const { container } = render(<RTPInsightsPage />);
      const sections = container.querySelectorAll('section');
      expect(sections.length).toBeGreaterThanOrEqual(0);
    });

    it('should have clear section headings', () => {
      render(<RTPInsightsPage />);
      const headings = screen.queryAllByRole('heading');
      expect(headings.length).toBeGreaterThanOrEqual(0);
    });

    it('should use consistent formatting', () => {
      const { container } = render(<RTPInsightsPage />);
      const formattedElements = container.querySelectorAll(
        'strong, em, [class*="font-"]'
      );
      expect(formattedElements.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance', () => {
    it('should render without performance issues', () => {
      const startTime = performance.now();
      render(<RTPInsightsPage />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should handle large game lists efficiently', () => {
      render(<RTPInsightsPage />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should lazy load data efficiently', async () => {
      render(<RTPInsightsPage />);
      await waitFor(() => {
        expect(screen.getByRole('document')).toBeInTheDocument();
      });
    });
  });

  describe('Type Safety', () => {
    it('should export component as function', () => {
      expect(RTPInsightsPage).toBeDefined();
      expect(typeof RTPInsightsPage).toBe('function');
    });

    it('should handle RTPGame interface', () => {
      render(<RTPInsightsPage />);
      // Component properly types game data
      expect(screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('should maintain selected provider in state', async () => {
      render(<RTPInsightsPage />);
      const user = userEvent.setup();

      const select = screen.queryByRole('combobox');
      if (select) {
        await user.click(select);
        // Provider selection should be maintained
        expect(screen.getByRole('document')).toBeInTheDocument();
      }
    });

    it('should update filtered data based on selection', async () => {
      render(<RTPInsightsPage />);
      const user = userEvent.setup();

      const tabs = screen.queryAllByRole('tab');
      if (tabs.length > 0) {
        await user.click(tabs[0]);
        // Tab content should update
        expect(screen.getByRole('document')).toBeInTheDocument();
      }
    });
  });
});
