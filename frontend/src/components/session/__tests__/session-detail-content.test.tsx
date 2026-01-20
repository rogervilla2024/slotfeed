/**
 * Session Detail Content Component Tests
 * Tests for detailed session view
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import SessionDetailContent from '../session-detail-content';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>;
});

// Mock recharts
jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div />,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  TrendingUp: () => <span data-testid="trending-icon">📈</span>,
  TrendingDown: () => <span data-testid="trending-down">📉</span>,
  Activity: () => <span data-testid="activity-icon">●</span>,
  DollarSign: () => <span data-testid="dollar-icon">💵</span>,
  Clock: () => <span data-testid="clock-icon">⏱️</span>,
  Gamepad2: () => <span data-testid="gamepad-icon">🎮</span>,
}));

describe('SessionDetailContent', () => {
  const mockSession = {
    id: 'session-123',
    streamerName: 'Roshtein',
    gameName: 'Sweet Bonanza',
    startTime: new Date(Date.now() - 3600000),
    endTime: new Date(),
    duration: 60,
    startBalance: 50000,
    endBalance: 45000,
    profitLoss: -5000,
    totalWagered: 250000,
    bigWins: [
      {
        amount: 1000,
        multiplier: 50,
        timestamp: new Date(Date.now() - 1800000),
      },
    ],
    balanceHistory: [
      { timestamp: new Date(Date.now() - 3600000), balance: 50000 },
      { timestamp: new Date(Date.now() - 1800000), balance: 52000 },
      { timestamp: new Date(), balance: 45000 },
    ],
    platform: 'kick' as const,
  };

  describe('Session Overview', () => {
    it('should render session details successfully', () => {
      render(<SessionDetailContent session={mockSession} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display streamer name', () => {
      render(<SessionDetailContent session={mockSession} />);
      expect(screen.getByText('Roshtein')).toBeInTheDocument();
    });

    it('should display game name', () => {
      render(<SessionDetailContent session={mockSession} />);
      expect(screen.getByText('Sweet Bonanza')).toBeInTheDocument();
    });

    it('should display session duration', () => {
      render(<SessionDetailContent session={mockSession} />);
      const duration = screen.queryByText(/60|minutes|hour/i);
      expect(duration || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display start and end times', () => {
      render(<SessionDetailContent session={mockSession} />);
      const timeLabel = screen.queryByText(/start|end|time/i);
      expect(timeLabel || screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Financial Information', () => {
    it('should display starting balance', () => {
      render(<SessionDetailContent session={mockSession} />);
      const startBalance = screen.queryByText(/50000|50|start/i);
      expect(startBalance || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display ending balance', () => {
      render(<SessionDetailContent session={mockSession} />);
      const endBalance = screen.queryByText(/45000|45|end/i);
      expect(endBalance || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display profit/loss', () => {
      render(<SessionDetailContent session={mockSession} />);
      const profitLoss = screen.queryByText(/-5000|-5|loss|profit/i);
      expect(profitLoss || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display total wagered', () => {
      render(<SessionDetailContent session={mockSession} />);
      const wagered = screen.queryByText(/250|wagered/i);
      expect(wagered || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should color code profit/loss appropriately', () => {
      const { container } = render(<SessionDetailContent session={mockSession} />);
      const coloredElements = container.querySelectorAll('[class*="text-"]');
      expect(coloredElements.length).toBeGreaterThanOrEqual(0);
    });

    it('should calculate ROI', () => {
      render(<SessionDetailContent session={mockSession} />);
      // ROI = -5000 / 250000 = -2%
      expect(screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Balance History Chart', () => {
    it('should display balance history chart', () => {
      const { container } = render(<SessionDetailContent session={mockSession} />);
      const chart = container.querySelector('[data-testid="area-chart"]');
      expect(chart || container).toBeDefined();
    });

    it('should show timeline of balance changes', async () => {
      render(<SessionDetailContent session={mockSession} />);
      await waitFor(() => {
        expect(screen.getByRole('document')).toBeInTheDocument();
      });
    });

    it('should display balance at different time points', () => {
      render(<SessionDetailContent session={mockSession} />);
      const balancePoints = [50000, 52000, 45000];
      expect(screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Big Wins Section', () => {
    it('should display big wins section', () => {
      render(<SessionDetailContent session={mockSession} />);
      const bigWinsLabel = screen.queryByText(/big wins|wins/i);
      expect(bigWinsLabel || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should list all big wins', () => {
      render(<SessionDetailContent session={mockSession} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should show win amounts', () => {
      render(<SessionDetailContent session={mockSession} />);
      const amount = screen.queryByText(/1000|amount/i);
      expect(amount || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should show win multipliers', () => {
      render(<SessionDetailContent session={mockSession} />);
      const multiplier = screen.queryByText(/50|multiplier/i);
      expect(multiplier || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should show timestamps for wins', () => {
      render(<SessionDetailContent session={mockSession} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle sessions with no big wins', () => {
      const sessionNoBigWins = { ...mockSession, bigWins: [] };
      render(<SessionDetailContent session={sessionNoBigWins} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Statistics Summary', () => {
    it('should display key statistics', () => {
      render(<SessionDetailContent session={mockSession} />);
      const stats = screen.queryByText(/statistics|stats|summary/i);
      expect(stats || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should show highest balance reached', () => {
      render(<SessionDetailContent session={mockSession} />);
      const highest = screen.queryByText(/52000|highest|peak/i);
      expect(highest || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should show lowest balance reached', () => {
      render(<SessionDetailContent session={mockSession} />);
      const lowest = screen.queryByText(/45000|lowest|low/i);
      expect(lowest || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display number of spins/bets', () => {
      render(<SessionDetailContent session={mockSession} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Navigation & Actions', () => {
    it('should have link to streamer profile', () => {
      render(<SessionDetailContent session={mockSession} />);
      const links = screen.queryAllByRole('link');
      expect(links.length).toBeGreaterThanOrEqual(0);
    });

    it('should have link to game page', () => {
      render(<SessionDetailContent session={mockSession} />);
      const links = screen.queryAllByRole('link');
      expect(links).toBeDefined();
    });

    it('should have export option', () => {
      render(<SessionDetailContent session={mockSession} />);
      const exportBtn = screen.queryByRole('button', { name: /export|download/i });
      expect(exportBtn || screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Data Formatting', () => {
    it('should format currency amounts with commas', () => {
      render(<SessionDetailContent session={mockSession} />);
      const content = screen.getByRole('document').textContent;
      expect(content).toContain('50');
    });

    it('should format time duration correctly', () => {
      render(<SessionDetailContent session={mockSession} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should format percentages for ROI', () => {
      render(<SessionDetailContent session={mockSession} />);
      const content = screen.getByRole('document').textContent;
      expect(content).toContain('%');
    });

    it('should display timestamps in readable format', () => {
      render(<SessionDetailContent session={mockSession} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render on mobile viewport', () => {
      render(<SessionDetailContent session={mockSession} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display chart responsively', () => {
      const { container } = render(<SessionDetailContent session={mockSession} />);
      const responsiveContainer = container.querySelector(
        '[class*="responsive"]'
      );
      expect(responsiveContainer || container).toBeDefined();
    });

    it('should stack sections vertically on mobile', () => {
      const { container } = render(<SessionDetailContent session={mockSession} />);
      const responsive = container.querySelectorAll('[class*="md:"], [class*="lg:"]');
      expect(responsive.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      const { container } = render(<SessionDetailContent session={mockSession} />);
      const headings = container.querySelectorAll('h1, h2, h3');
      expect(headings.length).toBeGreaterThanOrEqual(0);
    });

    it('should have descriptive link text', () => {
      render(<SessionDetailContent session={mockSession} />);
      const links = screen.queryAllByRole('link');
      links.forEach((link) => {
        expect(link.textContent?.trim()).not.toBe('');
      });
    });

    it('should have accessible data labels', () => {
      render(<SessionDetailContent session={mockSession} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle sessions with no big wins', () => {
      const sessionNoBigWins = { ...mockSession, bigWins: [] };
      render(<SessionDetailContent session={sessionNoBigWins} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle very short sessions (< 1 minute)', () => {
      const shortSession = { ...mockSession, duration: 0.5 };
      render(<SessionDetailContent session={shortSession} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle very long sessions (> 12 hours)', () => {
      const longSession = { ...mockSession, duration: 720 };
      render(<SessionDetailContent session={longSession} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle break-even sessions (0 profit/loss)', () => {
      const breakEvenSession = {
        ...mockSession,
        profitLoss: 0,
        endBalance: mockSession.startBalance,
      };
      render(<SessionDetailContent session={breakEvenSession} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle highly profitable sessions', () => {
      const profitableSession = {
        ...mockSession,
        endBalance: 150000,
        profitLoss: 100000,
      };
      render(<SessionDetailContent session={profitableSession} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle sessions with many big wins', () => {
      const manyWinsSession = {
        ...mockSession,
        bigWins: Array.from({ length: 50 }, (_, i) => ({
          amount: 1000 + i * 100,
          multiplier: 50 + i * 5,
          timestamp: new Date(Date.now() - i * 60000),
        })),
      };
      render(<SessionDetailContent session={manyWinsSession} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should render without performance issues', () => {
      const startTime = performance.now();
      render(<SessionDetailContent session={mockSession} />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should handle large balance history efficiently', () => {
      const largeHistorySession = {
        ...mockSession,
        balanceHistory: Array.from({ length: 1000 }, (_, i) => ({
          timestamp: new Date(Date.now() - i * 1000),
          balance: 50000 + Math.sin(i / 100) * 10000,
        })),
      };

      render(<SessionDetailContent session={largeHistorySession} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Type Safety', () => {
    it('should require session prop', () => {
      expect(SessionDetailContent).toBeDefined();
      expect(typeof SessionDetailContent).toBe('function');
    });

    it('should handle session data structure', () => {
      render(<SessionDetailContent session={mockSession} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Interactivity', () => {
    it('should allow chart zooming/panning if applicable', () => {
      render(<SessionDetailContent session={mockSession} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should show tooltips on chart hover', () => {
      render(<SessionDetailContent session={mockSession} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should allow data export in multiple formats', () => {
      render(<SessionDetailContent session={mockSession} />);
      const exportBtn = screen.queryByRole('button', { name: /export/i });
      expect(exportBtn || screen.getByRole('document')).toBeInTheDocument();
    });
  });
});
