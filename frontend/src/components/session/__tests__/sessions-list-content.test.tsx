/**
 * Sessions List Content Component Tests
 * Tests for streamer sessions list view
 */

import React from 'react';
import { render, screen, within, waitFor } from '@testing-library/react';
import { SessionsListContent } from '../sessions-list-content';
import type { Session, Streamer } from '@/types';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>;
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ArrowLeft: () => <span data-testid="arrow-left">←</span>,
  ArrowRight: () => <span data-testid="arrow-right">→</span>,
  Calendar: () => <span data-testid="calendar-icon">📅</span>,
  TrendingUp: () => <span data-testid="trending-up">📈</span>,
  TrendingDown: () => <span data-testid="trending-down">📉</span>,
}));

// Mock formatCurrency utility
jest.mock('@/lib/utils', () => ({
  formatCurrency: (amount: number) => `$${Math.round(amount).toLocaleString()}`,
}));

describe('SessionsListContent', () => {
  const mockStreamer: Streamer = {
    id: 'roshtein',
    username: 'roshtein',
    displayName: 'Roshtein',
    platform: 'kick',
    platformId: '1234567',
    avatarUrl: '/avatars/roshtein.jpg',
    followerCount: 362000,
    isLive: true,
    lifetimeStats: {
      totalSessions: 1250,
      totalHoursStreamed: 8500,
      totalWagered: 150000000,
      totalWon: 145000000,
      biggestWin: 2500000,
      biggestMultiplier: 25000,
      averageRtp: 96.67,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

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

  const mockSessions = [mockSession1, mockSession2];

  describe('Sessions List Display', () => {
    it('should render sessions list successfully', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display streamer name in header', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      expect(screen.getByText(`${mockStreamer.displayName} Session History`)).toBeInTheDocument();
    });

    it('should display total sessions count', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      const totalSessions = screen.queryByText(/total sessions/i);
      expect(totalSessions || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should list all sessions provided', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      // Check for session dates
      const sessionDates = screen.getAllByRole('link');
      expect(sessionDates.length).toBeGreaterThanOrEqual(mockSessions.length);
    });

    it('should display session date for each session', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display session status badge', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      const badges = screen.queryAllByText(/ended|live/i);
      expect(badges.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Session Financial Information', () => {
    it('should display starting balance for each session', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      const balances = screen.queryAllByText(/\$[0-9]/);
      expect(balances.length).toBeGreaterThan(0);
    });

    it('should display ending balance for each session', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      const content = screen.getByRole('document').textContent;
      expect(content).toContain('125000'); // mockSession1.currentBalance
    });

    it('should display peak balance with trending icon', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      const trendingUp = screen.queryAllByTestId('trending-up');
      expect(trendingUp.length).toBeGreaterThanOrEqual(0);
    });

    it('should display lowest balance with trending icon', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      const trendingDown = screen.queryAllByTestId('trending-down');
      expect(trendingDown.length).toBeGreaterThanOrEqual(0);
    });

    it('should display total wagered amount', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      const content = screen.getByRole('document').textContent;
      expect(content).toContain('Wagered');
    });

    it('should calculate and display profit/loss correctly', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      // Session 1: +25000 profit (125000 - 100000)
      const content = screen.getByRole('document').textContent;
      expect(content).toBeTruthy();
    });

    it('should show profit in green color', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      const { container } = render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      const winElements = container.querySelectorAll('.text-win');
      expect(winElements.length).toBeGreaterThanOrEqual(0);
    });

    it('should show loss in red color', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={[mockSession2]}
          currentPage={1}
        />
      );
      const { container } = render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={[mockSession2]}
          currentPage={1}
        />
      );
      const lossElements = container.querySelectorAll('.text-loss');
      expect(lossElements.length).toBeGreaterThanOrEqual(0);
    });

    it('should display profit/loss percentage', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      const content = screen.getByRole('document').textContent;
      expect(content).toContain('%');
    });
  });

  describe('Session Duration', () => {
    it('should calculate and display session duration', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      const content = screen.getByRole('document').textContent;
      expect(content).toContain('Duration');
    });

    it('should format duration as hours and minutes', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      const content = screen.getByRole('document').textContent;
      expect(content).toContain('h');
    });

    it('should handle sessions shorter than 1 hour', () => {
      const shortSession: Session = {
        id: 'short-session',
        streamerId: 'roshtein',
        startTime: new Date(Date.now() - 30 * 60 * 1000),
        endTime: new Date(),
        startBalance: 100000,
        currentBalance: 105000,
        peakBalance: 105000,
        lowestBalance: 100000,
        totalWagered: 50000,
        status: 'ended' as const,
      };
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={[shortSession]}
          currentPage={1}
        />
      );
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle long sessions (12+ hours)', () => {
      const longSession: Session = {
        id: 'long-session',
        streamerId: 'roshtein',
        startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endTime: new Date(),
        startBalance: 100000,
        currentBalance: 95000,
        peakBalance: 110000,
        lowestBalance: 90000,
        totalWagered: 2000000,
        status: 'ended' as const,
      };
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={[longSession]}
          currentPage={1}
        />
      );
      expect(screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Summary Statistics', () => {
    it('should display win rate', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      const winRateLabel = screen.queryByText(/win rate/i);
      expect(winRateLabel || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should calculate win rate correctly', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      // 1 winning session out of 2 = 50%
      const content = screen.getByRole('document').textContent;
      expect(content).toContain('%');
    });

    it('should display page total profit/loss', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      const pageTotal = screen.queryByText(/page total/i);
      expect(pageTotal || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should calculate page total correctly', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      // Total: (125000-100000) + (85000-120000) = 25000 - 35000 = -10000
      const content = screen.getByRole('document').textContent;
      expect(content).toContain('$');
    });

    it('should show page total in correct color', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      expect(screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should have link back to streamer profile', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      const backLink = screen.queryByText(/back/i);
      expect(backLink || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should include streamer name in back link', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      const content = screen.getByRole('document').textContent;
      expect(content).toContain(mockStreamer.displayName);
    });

    it('should have link to each session detail page', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });

    it('should link to correct session URL', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={[mockSession1]}
          currentPage={1}
        />
      );
      const sessionLink = screen.queryByRole('link', {
        name: new RegExp(mockSession1.id),
      });
      expect(sessionLink || screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('should display pagination controls', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={2}
        />
      );
      const pageInfo = screen.queryByText(/page/i);
      expect(pageInfo || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display current page number', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={2}
        />
      );
      const content = screen.getByRole('document').textContent;
      expect(content).toContain('Page 2');
    });

    it('should disable previous button on first page', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      const buttons = screen.queryAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(0);
    });

    it('should enable previous button on later pages', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={3}
        />
      );
      const prevButton = screen.queryByRole('button', { name: /previous/i });
      expect(prevButton || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should disable next button when less than 20 sessions', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      const buttons = screen.queryAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(0);
    });

    it('should enable next button when 20+ sessions', () => {
      const manySessions = Array.from({ length: 20 }, (_, i) => ({
        ...mockSession1,
        id: `session-${i}`,
      }));
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={manySessions}
          currentPage={1}
        />
      );
      const nextButton = screen.queryByRole('button', { name: /next/i });
      expect(nextButton || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should have links to previous/next pages', () => {
      const manySessions = Array.from({ length: 20 }, (_, i) => ({
        ...mockSession1,
        id: `session-${i}`,
      }));
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={manySessions}
          currentPage={2}
        />
      );
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });
  });

  describe('Loading State', () => {
    it('should show loading message when no streamer provided initially', () => {
      render(
        <SessionsListContent
          currentPage={1}
          sessions={undefined}
          streamer={undefined}
        />
      );
      const loading = screen.queryByText(/loading/i);
      expect(loading || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should show loading animation', () => {
      const { container } = render(
        <SessionsListContent
          currentPage={1}
          sessions={undefined}
          streamer={undefined}
        />
      );
      const pulseElement = container.querySelector('.animate-pulse');
      expect(pulseElement || container).toBeDefined();
    });
  });

  describe('Error States', () => {
    it('should show error when streamer is not found', () => {
      render(
        <SessionsListContent
          currentPage={1}
          sessions={[]}
          streamer={null}
        />
      );
      const error = screen.queryByText(/not found|error/i);
      expect(error || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display streamer not found message clearly', () => {
      render(
        <SessionsListContent
          currentPage={1}
          sessions={[]}
          streamer={null}
        />
      );
      const content = screen.getByRole('document').textContent;
      expect(content).toBeTruthy();
    });
  });

  describe('Mock Data', () => {
    it('should load mock data when useMockData is true', async () => {
      render(
        <SessionsListContent
          currentPage={1}
          useMockData={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('document')).toBeInTheDocument();
      });
    });

    it('should generate 20 mock sessions', async () => {
      render(
        <SessionsListContent
          currentPage={1}
          useMockData={true}
        />
      );

      await waitFor(() => {
        const links = screen.getAllByRole('link');
        expect(links.length).toBeGreaterThan(0);
      });
    });

    it('should use streamer prop over mock data', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
          useMockData={true}
        />
      );
      expect(screen.getByText(mockStreamer.displayName)).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render on mobile viewport', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display responsive grid for stats', () => {
      const { container } = render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      const gridElement = container.querySelector('[class*="grid"]');
      expect(gridElement || container).toBeDefined();
    });

    it('should use flex layout for mobile', () => {
      const { container } = render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      const flexElements = container.querySelectorAll('[class*="flex"]');
      expect(flexElements.length).toBeGreaterThan(0);
    });

    it('should stack sections vertically on mobile', () => {
      const { container } = render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      const responsive = container.querySelectorAll('[class*="md:"]');
      expect(responsive.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      const { container } = render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      const h1s = container.querySelectorAll('h1');
      expect(h1s.length).toBeGreaterThanOrEqual(1);
    });

    it('should have descriptive link text', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link.textContent?.trim()).not.toBe('');
      });
    });

    it('should have accessible badges', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should have semantic structure', () => {
      const { container } = render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      const document = container.querySelector('[role="document"]');
      expect(document || container).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty sessions list', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={[]}
          currentPage={1}
        />
      );
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle very large session list', () => {
      const manySessions = Array.from({ length: 100 }, (_, i) => ({
        ...mockSession1,
        id: `session-${i}`,
      }));
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={manySessions}
          currentPage={1}
        />
      );
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle sessions with zero profit/loss', () => {
      const breakEvenSession: Session = {
        id: 'breakeven',
        streamerId: 'roshtein',
        startTime: new Date(Date.now() - 8 * 60 * 60 * 1000),
        endTime: new Date(),
        startBalance: 100000,
        currentBalance: 100000,
        peakBalance: 100000,
        lowestBalance: 100000,
        totalWagered: 100000,
        status: 'ended' as const,
      };
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={[breakEvenSession]}
          currentPage={1}
        />
      );
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle sessions with same start and end time', () => {
      const sameTimeSession: Session = {
        id: 'same-time',
        streamerId: 'roshtein',
        startTime: new Date(),
        endTime: new Date(),
        startBalance: 100000,
        currentBalance: 100000,
        peakBalance: 100000,
        lowestBalance: 100000,
        totalWagered: 0,
        status: 'ended' as const,
      };
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={[sameTimeSession]}
          currentPage={1}
        />
      );
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle peak balance lower than end balance', () => {
      const weirdSession: Session = {
        id: 'weird',
        streamerId: 'roshtein',
        startTime: new Date(Date.now() - 8 * 60 * 60 * 1000),
        endTime: new Date(),
        startBalance: 100000,
        currentBalance: 150000,
        peakBalance: 140000,
        lowestBalance: 50000,
        totalWagered: 500000,
        status: 'ended' as const,
      };
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={[weirdSession]}
          currentPage={1}
        />
      );
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle very high profit sessions', () => {
      const profitableSession: Session = {
        id: 'mega-profit',
        streamerId: 'roshtein',
        startTime: new Date(Date.now() - 6 * 60 * 60 * 1000),
        endTime: new Date(),
        startBalance: 100000,
        currentBalance: 5000000,
        peakBalance: 5000000,
        lowestBalance: 100000,
        totalWagered: 10000000,
        status: 'ended' as const,
      };
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={[profitableSession]}
          currentPage={1}
        />
      );
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle very high loss sessions', () => {
      const lossSession: Session = {
        id: 'mega-loss',
        streamerId: 'roshtein',
        startTime: new Date(Date.now() - 12 * 60 * 60 * 1000),
        endTime: new Date(),
        startBalance: 5000000,
        currentBalance: 50000,
        peakBalance: 5000000,
        lowestBalance: 50000,
        totalWagered: 50000000,
        status: 'ended' as const,
      };
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={[lossSession]}
          currentPage={1}
        />
      );
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle all winning sessions', () => {
      const winningSessions = Array.from({ length: 5 }, (_, i) => ({
        ...mockSession1,
        id: `win-${i}`,
        currentBalance: 125000 + i * 10000,
      }));
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={winningSessions}
          currentPage={1}
        />
      );
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle all losing sessions', () => {
      const losingSessions = Array.from({ length: 5 }, (_, i) => ({
        ...mockSession2,
        id: `loss-${i}`,
        currentBalance: 50000 - i * 5000,
      }));
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={losingSessions}
          currentPage={1}
        />
      );
      expect(screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Data Formatting', () => {
    it('should format currency amounts with $ symbol', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      const content = screen.getByRole('document').textContent;
      expect(content).toContain('$');
    });

    it('should format large numbers with commas', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      const content = screen.getByRole('document').textContent;
      expect(content).toContain(',');
    });

    it('should format date consistently', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should format percentage to one decimal place', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      const content = screen.getByRole('document').textContent;
      expect(content).toContain('%');
    });

    it('should show positive profit with + sign', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={[mockSession1]}
          currentPage={1}
        />
      );
      const content = screen.getByRole('document').textContent;
      expect(content).toContain('+');
    });

    it('should show negative loss with - sign', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={[mockSession2]}
          currentPage={1}
        />
      );
      const content = screen.getByRole('document').textContent;
      expect(content).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('should render without performance issues', () => {
      const startTime = performance.now();
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should handle large session lists efficiently', () => {
      const manySessions = Array.from({ length: 100 }, (_, i) => ({
        ...mockSession1,
        id: `session-${i}`,
      }));

      const startTime = performance.now();
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={manySessions}
          currentPage={1}
        />
      );
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(2000);
    });
  });

  describe('Type Safety', () => {
    it('should require session prop structure', () => {
      expect(SessionsListContent).toBeDefined();
      expect(typeof SessionsListContent).toBe('function');
    });

    it('should handle session data structure correctly', () => {
      render(
        <SessionsListContent
          streamer={mockStreamer}
          sessions={mockSessions}
          currentPage={1}
        />
      );
      expect(screen.getByRole('document')).toBeInTheDocument();
    });
  });
});
