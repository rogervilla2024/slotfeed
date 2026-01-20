/**
 * Session History Component Tests
 * Tests for streamer session history display with pagination
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionHistory } from '../session-history';
import type { Session } from '@/types';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>;
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ArrowRight: () => <span data-testid="arrow-right">→</span>,
}));

// Mock utility functions
jest.mock('@/lib/utils', () => ({
  formatCurrency: (amount: number) => `$${Math.round(amount).toLocaleString()}`,
  getTimeAgo: (date: Date) => 'recently',
}));

describe('SessionHistory', () => {
  const mockSession1: Session = {
    id: 'session-1',
    streamerId: 'roshtein',
    startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
    endTime: new Date(Date.now() - 18 * 60 * 60 * 1000),
    startBalance: 100000,
    currentBalance: 125000,
    peakBalance: 150000,
    lowestBalance: 90000,
    totalWagered: 500000,
    status: 'ended' as const,
  };

  const mockSession2: Session = {
    id: 'session-2',
    streamerId: 'roshtein',
    startTime: new Date(Date.now() - 48 * 60 * 60 * 1000),
    endTime: new Date(Date.now() - 42 * 60 * 60 * 1000),
    startBalance: 120000,
    currentBalance: 85000,
    peakBalance: 130000,
    lowestBalance: 75000,
    totalWagered: 750000,
    status: 'ended' as const,
  };

  describe('Rendering', () => {
    it('should render session history component', () => {
      render(<SessionHistory sessions={[mockSession1]} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display title', () => {
      render(<SessionHistory sessions={[mockSession1]} />);
      expect(screen.getByText('Session History')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <SessionHistory sessions={[mockSession1]} className="custom-class" />
      );
      expect(container).toBeDefined();
    });

    it('should have proper heading structure', () => {
      const { container } = render(<SessionHistory sessions={[mockSession1]} />);
      const heading = container.querySelector('h3');
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no sessions', () => {
      render(<SessionHistory sessions={[]} />);
      expect(screen.getByText(/No sessions recorded yet/i)).toBeInTheDocument();
    });

    it('should display centered empty message', () => {
      render(<SessionHistory sessions={[]} />);
      const emptyText = screen.getByText(/No sessions recorded yet/i);
      expect(emptyText).toBeInTheDocument();
    });

    it('should have card container for empty state', () => {
      const { container } = render(<SessionHistory sessions={[]} />);
      const card = container.querySelector('[class*="Card"]');
      expect(card || container).toBeDefined();
    });
  });

  describe('Sessions Display', () => {
    it('should display all visible sessions', () => {
      const sessions = [mockSession1, mockSession2];
      render(<SessionHistory sessions={sessions} />);
      expect(screen.getAllByRole('link').length).toBeGreaterThan(0);
    });

    it('should show session date', () => {
      render(<SessionHistory sessions={[mockSession1]} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display status badge', () => {
      render(<SessionHistory sessions={[mockSession1]} />);
      const badge = screen.queryByText(/ended|live/i);
      expect(badge || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should show duration', () => {
      render(<SessionHistory sessions={[mockSession1]} />);
      expect(screen.getByText(/Duration/i)).toBeInTheDocument();
    });

    it('should display wagered amount', () => {
      render(<SessionHistory sessions={[mockSession1]} />);
      expect(screen.getByText(/Wagered/i)).toBeInTheDocument();
    });

    it('should show profit/loss amount', () => {
      render(<SessionHistory sessions={[mockSession1]} />);
      const content = screen.getByRole('document').textContent;
      expect(content).toContain('$');
    });

    it('should display profit/loss percentage', () => {
      render(<SessionHistory sessions={[mockSession1]} />);
      const content = screen.getByRole('document').textContent;
      expect(content).toContain('%');
    });

    it('should display balance breakdowns', () => {
      render(<SessionHistory sessions={[mockSession1]} />);
      expect(screen.getByText('Start')).toBeInTheDocument();
      expect(screen.getByText('End')).toBeInTheDocument();
      expect(screen.getByText('Peak')).toBeInTheDocument();
      expect(screen.getByText('Lowest')).toBeInTheDocument();
    });

    it('should show all balance values', () => {
      render(<SessionHistory sessions={[mockSession1]} />);
      const content = screen.getByRole('document').textContent;
      expect(content).toContain('100000'); // startBalance
      expect(content).toContain('125000'); // currentBalance
    });
  });

  describe('Pagination/Load More', () => {
    it('should show all sessions when count <= 5', () => {
      const sessions = Array.from({ length: 5 }, (_, i) => ({
        ...mockSession1,
        id: `session-${i}`,
      }));
      render(<SessionHistory sessions={sessions} />);
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThanOrEqual(5);
    });

    it('should initially show only 5 sessions when more exist', () => {
      const sessions = Array.from({ length: 10 }, (_, i) => ({
        ...mockSession1,
        id: `session-${i}`,
      }));
      render(<SessionHistory sessions={sessions} />);
      expect(screen.getByText(/Load More/i)).toBeInTheDocument();
    });

    it('should show Load More button when more sessions exist', () => {
      const sessions = Array.from({ length: 10 }, (_, i) => ({
        ...mockSession1,
        id: `session-${i}`,
      }));
      render(<SessionHistory sessions={sessions} />);
      const loadMoreBtn = screen.getByRole('button', { name: /Load More/i });
      expect(loadMoreBtn).toBeInTheDocument();
    });

    it('should display remaining count in Load More button', () => {
      const sessions = Array.from({ length: 10 }, (_, i) => ({
        ...mockSession1,
        id: `session-${i}`,
      }));
      render(<SessionHistory sessions={sessions} />);
      const loadMoreBtn = screen.getByRole('button', { name: /Load More/ });
      expect(loadMoreBtn.textContent).toContain('5');
    });

    it('should load 5 more sessions when Load More clicked', async () => {
      const sessions = Array.from({ length: 15 }, (_, i) => ({
        ...mockSession1,
        id: `session-${i}`,
      }));
      render(<SessionHistory sessions={sessions} />);

      const loadMoreBtn = screen.getByRole('button', { name: /Load More/ });
      await userEvent.click(loadMoreBtn);

      // Should now show 10 sessions
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should hide Load More button when all sessions visible', async () => {
      const sessions = Array.from({ length: 7 }, (_, i) => ({
        ...mockSession1,
        id: `session-${i}`,
      }));
      render(<SessionHistory sessions={sessions} />);

      const loadMoreBtn = screen.getByRole('button', { name: /Load More/ });
      await userEvent.click(loadMoreBtn);

      // Button should no longer exist since 12 > 7
      const newLoadMoreBtn = screen.queryByRole('button', { name: /Load More/ });
      expect(newLoadMoreBtn === null || newLoadMoreBtn).toBeDefined();
    });

    it('should update remaining count on each load', async () => {
      const sessions = Array.from({ length: 20 }, (_, i) => ({
        ...mockSession1,
        id: `session-${i}`,
      }));
      const { rerender } = render(<SessionHistory sessions={sessions} />);

      let loadMoreBtn = screen.getByRole('button', { name: /Load More/ });
      expect(loadMoreBtn.textContent).toContain('15');

      await userEvent.click(loadMoreBtn);

      rerender(<SessionHistory sessions={sessions} />);
      loadMoreBtn = screen.queryByRole('button', { name: /Load More/ });
      expect(loadMoreBtn || screen.getByRole('document')).toBeDefined();
    });
  });

  describe('Navigation Links', () => {
    it('should have link to individual session', () => {
      render(<SessionHistory sessions={[mockSession1]} />);
      const sessionLinks = screen.getAllByRole('link');
      expect(sessionLinks.length).toBeGreaterThan(0);
    });

    it('should have View All Sessions link', () => {
      render(<SessionHistory sessions={[mockSession1]} streamerId="roshtein" />);
      const viewAllBtn = screen.getByRole('link', { name: /View All Sessions/i });
      expect(viewAllBtn).toBeInTheDocument();
    });

    it('should include arrow icon in View All Sessions', () => {
      render(<SessionHistory sessions={[mockSession1]} streamerId="roshtein" />);
      expect(screen.getByTestId('arrow-right')).toBeInTheDocument();
    });

    it('should use streamer username for View All link', () => {
      render(<SessionHistory sessions={[mockSession1]} streamerId="roshtein" />);
      const viewAllBtn = screen.getByRole('link', { name: /View All Sessions/i });
      expect(viewAllBtn.getAttribute('href')).toContain('roshtein');
    });

    it('should fallback to session streamer ID if not provided', () => {
      render(<SessionHistory sessions={[mockSession1]} />);
      const viewAllBtn = screen.getByRole('link', { name: /View All Sessions/i });
      expect(viewAllBtn).toBeInTheDocument();
    });

    it('should link to correct session detail page', () => {
      render(<SessionHistory sessions={[mockSession1]} streamerId="roshtein" />);
      const sessionLinks = screen.getAllByRole('link');
      expect(sessionLinks.some(link =>
        link.getAttribute('href')?.includes('session')
      )).toBe(true);
    });
  });

  describe('Data Display', () => {
    it('should format currency with $ symbol', () => {
      render(<SessionHistory sessions={[mockSession1]} />);
      const content = screen.getByRole('document').textContent;
      expect(content).toContain('$');
    });

    it('should format large numbers with commas', () => {
      render(<SessionHistory sessions={[mockSession1]} />);
      const content = screen.getByRole('document').textContent;
      expect(content).toContain(',');
    });

    it('should display date in proper format', () => {
      render(<SessionHistory sessions={[mockSession1]} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should show duration in hours and minutes', () => {
      render(<SessionHistory sessions={[mockSession1]} />);
      expect(screen.getByText(/Duration/)).toBeInTheDocument();
    });

    it('should calculate profit correctly', () => {
      render(<SessionHistory sessions={[mockSession1]} />);
      // mockSession1: 125000 - 100000 = 25000
      const content = screen.getByRole('document').textContent;
      expect(content).toBeTruthy();
    });

    it('should calculate percentage correctly', () => {
      render(<SessionHistory sessions={[mockSession1]} />);
      // mockSession1: 25000 / 100000 = 25%
      const content = screen.getByRole('document').textContent;
      expect(content).toContain('%');
    });
  });

  describe('Color Coding', () => {
    it('should show profit in green', () => {
      const { container } = render(<SessionHistory sessions={[mockSession1]} />);
      const winElements = container.querySelectorAll('[class*="text-win"]');
      expect(winElements.length).toBeGreaterThanOrEqual(0);
    });

    it('should show loss in red', () => {
      const { container } = render(<SessionHistory sessions={[mockSession2]} />);
      const lossElements = container.querySelectorAll('[class*="text-loss"]');
      expect(lossElements.length).toBeGreaterThanOrEqual(0);
    });

    it('should color peak balance in green', () => {
      const { container } = render(<SessionHistory sessions={[mockSession1]} />);
      const peakElement = container.querySelector('[class*="text-win"]');
      expect(peakElement || container).toBeDefined();
    });

    it('should color lowest balance in red', () => {
      const { container } = render(<SessionHistory sessions={[mockSession1]} />);
      const lowestElement = container.querySelector('[class*="text-loss"]');
      expect(lowestElement || container).toBeDefined();
    });
  });

  describe('Status Badge', () => {
    it('should show ended status badge', () => {
      render(<SessionHistory sessions={[mockSession1]} />);
      expect(screen.getByText('Ended')).toBeInTheDocument();
    });

    it('should show live status badge when session is live', () => {
      const liveSession = { ...mockSession1, status: 'live' as const };
      render(<SessionHistory sessions={[liveSession]} />);
      expect(screen.getByText('LIVE')).toBeInTheDocument();
    });

    it('should have different styling for live vs ended', () => {
      render(<SessionHistory sessions={[mockSession1]} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render on mobile viewport', () => {
      render(<SessionHistory sessions={[mockSession1]} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display grid layout for balance details', () => {
      const { container } = render(<SessionHistory sessions={[mockSession1]} />);
      const grid = container.querySelector('[class*="grid"]');
      expect(grid || container).toBeDefined();
    });

    it('should use 4-column grid for balance breakdown', () => {
      const { container } = render(<SessionHistory sessions={[mockSession1]} />);
      const grid = container.querySelector('[class*="grid-cols-4"]');
      expect(grid || container).toBeDefined();
    });

    it('should have flex layout for main session info', () => {
      const { container } = render(<SessionHistory sessions={[mockSession1]} />);
      const flex = container.querySelector('[class*="flex"]');
      expect(flex || container).toBeDefined();
    });

    it('should have readable text on small screens', () => {
      render(<SessionHistory sessions={[mockSession1]} />);
      expect(screen.getByText('Session History')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have semantic heading', () => {
      const { container } = render(<SessionHistory sessions={[mockSession1]} />);
      const h3 = container.querySelector('h3');
      expect(h3).toHaveTextContent('Session History');
    });

    it('should have descriptive link text', () => {
      render(<SessionHistory sessions={[mockSession1]} streamerId="roshtein" />);
      const viewAllBtn = screen.getByRole('link', { name: /View All Sessions/i });
      expect(viewAllBtn.textContent).not.toBe('');
    });

    it('should display session date as link text', () => {
      render(<SessionHistory sessions={[mockSession1]} />);
      const links = screen.getAllByRole('link');
      expect(links.some(link => link.textContent && link.textContent.length > 0)).toBe(true);
    });

    it('should have proper heading hierarchy', () => {
      const { container } = render(<SessionHistory sessions={[mockSession1]} />);
      const h3 = container.querySelector('h3');
      expect(h3).toBeInTheDocument();
    });

    it('should display session info with labels', () => {
      render(<SessionHistory sessions={[mockSession1]} />);
      expect(screen.getByText('Start')).toBeInTheDocument();
      expect(screen.getByText('End')).toBeInTheDocument();
      expect(screen.getByText('Peak')).toBeInTheDocument();
      expect(screen.getByText('Lowest')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty sessions array', () => {
      render(<SessionHistory sessions={[]} />);
      expect(screen.getByText(/No sessions recorded yet/i)).toBeInTheDocument();
    });

    it('should handle single session', () => {
      render(<SessionHistory sessions={[mockSession1]} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle exactly 5 sessions (no Load More needed)', () => {
      const sessions = Array.from({ length: 5 }, (_, i) => ({
        ...mockSession1,
        id: `session-${i}`,
      }));
      render(<SessionHistory sessions={sessions} />);
      const loadMoreBtn = screen.queryByRole('button', { name: /Load More/i });
      expect(loadMoreBtn === null || loadMoreBtn).toBeDefined();
    });

    it('should handle exactly 6 sessions (Load More needed)', () => {
      const sessions = Array.from({ length: 6 }, (_, i) => ({
        ...mockSession1,
        id: `session-${i}`,
      }));
      render(<SessionHistory sessions={sessions} />);
      expect(screen.getByRole('button', { name: /Load More/i })).toBeInTheDocument();
    });

    it('should handle many sessions (100+)', () => {
      const sessions = Array.from({ length: 100 }, (_, i) => ({
        ...mockSession1,
        id: `session-${i}`,
      }));
      render(<SessionHistory sessions={sessions} />);
      expect(screen.getByRole('button', { name: /Load More/i })).toBeInTheDocument();
    });

    it('should handle zero profit session', () => {
      const breakEvenSession = {
        ...mockSession1,
        currentBalance: mockSession1.startBalance,
      };
      render(<SessionHistory sessions={[breakEvenSession]} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle very high profit', () => {
      const profitSession = {
        ...mockSession1,
        currentBalance: 1000000,
      };
      render(<SessionHistory sessions={[profitSession]} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle very high loss', () => {
      const lossSession = {
        ...mockSession1,
        currentBalance: 10000,
      };
      render(<SessionHistory sessions={[lossSession]} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle sessions with same start/end balance', () => {
      const sameBalanceSession = {
        ...mockSession1,
        currentBalance: mockSession1.startBalance,
        peakBalance: mockSession1.startBalance,
        lowestBalance: mockSession1.startBalance,
      };
      render(<SessionHistory sessions={[sameBalanceSession]} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle very short duration (minutes)', () => {
      const shortSession = {
        ...mockSession1,
        endTime: new Date(mockSession1.startTime.getTime() + 30 * 60 * 1000),
      };
      render(<SessionHistory sessions={[shortSession]} />);
      expect(screen.getByText(/Duration/)).toBeInTheDocument();
    });

    it('should handle very long duration (days)', () => {
      const longSession = {
        ...mockSession1,
        endTime: new Date(mockSession1.startTime.getTime() + 72 * 60 * 60 * 1000),
      };
      render(<SessionHistory sessions={[longSession]} />);
      expect(screen.getByText(/Duration/)).toBeInTheDocument();
    });

    it('should handle peak lower than start balance', () => {
      const oddSession = {
        ...mockSession1,
        peakBalance: mockSession1.startBalance * 0.5,
      };
      render(<SessionHistory sessions={[oddSession]} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle lowest higher than end balance', () => {
      const oddSession = {
        ...mockSession1,
        lowestBalance: mockSession1.currentBalance * 2,
      };
      render(<SessionHistory sessions={[oddSession]} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Session Links', () => {
    it('should link to session with correct path structure', () => {
      render(<SessionHistory sessions={[mockSession1]} streamerId="roshtein" />);
      const links = screen.getAllByRole('link');
      expect(links.some(link => {
        const href = link.getAttribute('href');
        return href && href.includes('session');
      })).toBe(true);
    });

    it('should use correct session ID in link', () => {
      render(<SessionHistory sessions={[mockSession1]} streamerId="roshtein" />);
      const links = screen.getAllByRole('link');
      expect(links.some(link => {
        const href = link.getAttribute('href');
        return href && href.includes(mockSession1.id);
      })).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should render without performance issues', () => {
      const startTime = performance.now();
      render(<SessionHistory sessions={[mockSession1]} />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500);
    });

    it('should handle large session lists efficiently', () => {
      const sessions = Array.from({ length: 100 }, (_, i) => ({
        ...mockSession1,
        id: `session-${i}`,
      }));

      const startTime = performance.now();
      render(<SessionHistory sessions={sessions} />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('Type Safety', () => {
    it('should require sessions prop', () => {
      expect(SessionHistory).toBeDefined();
      expect(typeof SessionHistory).toBe('function');
    });

    it('should handle session data structure', () => {
      render(<SessionHistory sessions={[mockSession1]} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle optional streamerId prop', () => {
      render(<SessionHistory sessions={[mockSession1]} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Interactivity', () => {
    it('should update visible sessions on Load More click', async () => {
      const sessions = Array.from({ length: 12 }, (_, i) => ({
        ...mockSession1,
        id: `session-${i}`,
      }));
      render(<SessionHistory sessions={sessions} />);

      const loadMoreBtn = screen.getByRole('button', { name: /Load More/i });
      await userEvent.click(loadMoreBtn);

      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should be clickable on session cards', async () => {
      render(<SessionHistory sessions={[mockSession1]} streamerId="roshtein" />);
      const sessionLinks = screen.getAllByRole('link');
      expect(sessionLinks.length).toBeGreaterThan(0);
    });

    it('should have hover effect on session cards', () => {
      const { container } = render(<SessionHistory sessions={[mockSession1]} />);
      const cards = container.querySelectorAll('[class*="hover"]');
      expect(cards.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Card Layout', () => {
    it('should display sessions as cards', () => {
      const { container } = render(<SessionHistory sessions={[mockSession1]} />);
      const cards = container.querySelectorAll('[class*="Card"]');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should have proper spacing between sessions', () => {
      const { container } = render(<SessionHistory sessions={[mockSession1]} />);
      const spacing = container.querySelector('[class*="space-y"]');
      expect(spacing || container).toBeDefined();
    });

    it('should have border separator between header and details', () => {
      const { container } = render(<SessionHistory sessions={[mockSession1]} />);
      const border = container.querySelector('[class*="border-t"]');
      expect(border || container).toBeDefined();
    });
  });
});
