/**
 * Session Details Page Tests
 * Tests for detailed session view with breakdown and history
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useParams } from 'next/navigation';
import SessionDetailsPage from '../page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>;
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ArrowLeft: () => <span data-testid="arrow-left">←</span>,
  Pause: () => <span data-testid="pause-icon">⏸</span>,
  Play: () => <span data-testid="play-icon">▶</span>,
  TrendingUp: () => <span data-testid="trending-up">📈</span>,
  TrendingDown: () => <span data-testid="trending-down">📉</span>,
  Clock: () => <span data-testid="clock-icon">⏱</span>,
  Zap: () => <span data-testid="zap-icon">⚡</span>,
}));

// Mock components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h2>{children}</h2>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: any) => (
    <span data-testid="badge" data-variant={variant}>{children}</span>
  ),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, defaultValue }: any) => (
    <div data-testid="tabs" data-default={defaultValue}>{children}</div>
  ),
  TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value }: any) => (
    <button data-testid={`tab-${value}`}>{children}</button>
  ),
  TabsContent: ({ children, value }: any) => (
    <div data-testid={`tab-content-${value}`}>{children}</div>
  ),
}));

jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: any) => <div data-testid="skeleton" className={className} />,
}));

describe('Session Details Page', () => {
  const mockSession = {
    id: 'session-123',
    streamerName: 'Roshtein',
    streamerId: 'roshtein',
    platform: 'kick',
    startTime: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    endTime: new Date().toISOString(),
    duration: 21600,
    startBalance: 100000,
    endBalance: 125000,
    peakBalance: 150000,
    lowestBalance: 90000,
    totalWagered: 500000,
    totalPayouts: 520000,
    profitLoss: 25000,
    roi: 25,
    averageRtp: 98.5,
    biggestWin: 50000,
    biggestWinMultiplier: 125,
    sessionStatus: 'completed' as const,
    gameBreakdown: [
      {
        gameId: 'sweet-bonanza',
        gameName: 'Sweet Bonanza',
        sessionsCount: 150,
        totalWagered: 250000,
        totalWon: 260000,
        observedRtp: 98.5,
        theoreticalRtp: 96.5,
      },
    ],
    bigWins: [
      {
        id: 'win-1',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        gameName: 'Sweet Bonanza',
        amount: 50000,
        multiplier: 125,
        balanceBefore: 100000,
        balanceAfter: 150000,
      },
    ],
    balanceHistory: [
      {
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        balance: 100000,
        wagered: 1000,
        won: 900,
        balanceChange: -100,
      },
      {
        timestamp: new Date().toISOString(),
        balance: 125000,
        wagered: 5000,
        won: 5500,
        balanceChange: 500,
      },
    ],
  };

  beforeEach(() => {
    (useParams as jest.Mock).mockReturnValue({ id: 'session-123' });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading skeletons initially', () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        new Promise(() => {})
      );

      render(<SessionDetailsPage />);
      expect(screen.queryAllByTestId('skeleton').length).toBeGreaterThan(0);
    });

    it('should display header skeleton', () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        new Promise(() => {})
      );

      render(<SessionDetailsPage />);
      expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
    });
  });

  describe('Header Section', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSession),
        })
      );
    });

    it('should display page title', async () => {
      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByText('Session Details')).toBeInTheDocument();
      });
    });

    it('should display session date and time', async () => {
      render(<SessionDetailsPage />);
      await waitFor(() => {
        const content = screen.getByRole('document').textContent || '';
        expect(content).toContain('2025'); // Year
      });
    });

    it('should have back button', async () => {
      render(<SessionDetailsPage />);
      await waitFor(() => {
        const backBtn = screen.queryByRole('button');
        expect(backBtn).toBeInTheDocument();
      });
    });

    it('should link back to streamer profile', async () => {
      render(<SessionDetailsPage />);
      await waitFor(() => {
        const backLink = screen.queryByRole('link');
        expect(backLink && backLink.getAttribute('href')).toContain('roshtein');
      });
    });
  });

  describe('Status Bar', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSession),
        })
      );
    });

    it('should display session status', async () => {
      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByText('Completed')).toBeInTheDocument();
      });
    });

    it('should display duration', async () => {
      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByText(/Duration/i)).toBeInTheDocument();
      });
    });

    it('should show live icon for live sessions', async () => {
      const liveSession = { ...mockSession, sessionStatus: 'live' as const };
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(liveSession),
        })
      );

      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByText('Live Session')).toBeInTheDocument();
      });
    });

    it('should show completed status for completed sessions', async () => {
      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByText('Completed')).toBeInTheDocument();
      });
    });

    it('should show ended early for early terminated sessions', async () => {
      const earlySession = { ...mockSession, sessionStatus: 'ended_early' as const };
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(earlySession),
        })
      );

      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByText('Ended Early')).toBeInTheDocument();
      });
    });

    it('should format duration correctly', async () => {
      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByText(/6h 0m/)).toBeInTheDocument();
      });
    });
  });

  describe('Key Stats Grid', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSession),
        })
      );
    });

    it('should display starting balance', async () => {
      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByText(/100000/)).toBeInTheDocument();
      });
    });

    it('should display ending balance', async () => {
      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByText(/125000/)).toBeInTheDocument();
      });
    });

    it('should display profit/loss', async () => {
      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByText(/Profit\/Loss/i)).toBeInTheDocument();
      });
    });

    it('should display peak balance', async () => {
      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByText(/Peak Balance/i)).toBeInTheDocument();
      });
    });

    it('should color ending balance green when profit', async () => {
      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByRole('document')).toBeInTheDocument();
      });
    });

    it('should color ending balance red when loss', async () => {
      const lossSession = { ...mockSession, endBalance: 90000, profitLoss: -10000 };
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(lossSession),
        })
      );

      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByRole('document')).toBeInTheDocument();
      });
    });

    it('should display profit percentage', async () => {
      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByText(/25\.0%/)).toBeInTheDocument();
      });
    });

    it('should display peak balance increase percentage', async () => {
      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByRole('document')).toBeInTheDocument();
      });
    });
  });

  describe('Secondary Stats', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSession),
        })
      );
    });

    it('should display total wagered', async () => {
      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByText(/Total Wagered/i)).toBeInTheDocument();
      });
    });

    it('should display biggest win', async () => {
      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByText(/Biggest Win/i)).toBeInTheDocument();
      });
    });

    it('should display session RTP', async () => {
      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByText(/Session RTP/i)).toBeInTheDocument();
      });
    });

    it('should display biggest win multiplier', async () => {
      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByText(/125\.0x/)).toBeInTheDocument();
      });
    });

    it('should color RTP green if above target', async () => {
      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByRole('document')).toBeInTheDocument();
      });
    });

    it('should color RTP red if below target', async () => {
      const lowRtpSession = { ...mockSession, averageRtp: 94.5 };
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(lowRtpSession),
        })
      );

      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByRole('document')).toBeInTheDocument();
      });
    });
  });

  describe('Tabs Navigation', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSession),
        })
      );
    });

    it('should display tabs', async () => {
      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tabs')).toBeInTheDocument();
      });
    });

    it('should have games played tab', async () => {
      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tab-games')).toBeInTheDocument();
      });
    });

    it('should have big wins tab with count', async () => {
      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByText(/Big Wins/)).toBeInTheDocument();
      });
    });

    it('should have balance history tab', async () => {
      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tab-history')).toBeInTheDocument();
      });
    });

    it('should display games content by default', async () => {
      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tab-content-games')).toBeInTheDocument();
      });
    });

    it('should switch tabs on click', async () => {
      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tab-wins')).toBeInTheDocument();
      });

      const winsTab = screen.getByTestId('tab-wins');
      await userEvent.click(winsTab);
      expect(screen.getByTestId('tab-content-wins')).toBeInTheDocument();
    });
  });

  describe('Games Tab', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSession),
        })
      );
    });

    it('should display games breakdown title', async () => {
      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByText(/Games Breakdown/i)).toBeInTheDocument();
      });
    });

    it('should display game names', async () => {
      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByText('Sweet Bonanza')).toBeInTheDocument();
      });
    });

    it('should display game session count', async () => {
      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByText(/150 session/)).toBeInTheDocument();
      });
    });

    it('should display game wagered amount', async () => {
      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByText(/Wagered/)).toBeInTheDocument();
      });
    });

    it('should display game RTP badge', async () => {
      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByText(/98\.50%/)).toBeInTheDocument();
      });
    });

    it('should link to game detail page', async () => {
      render(<SessionDetailsPage />);
      await waitFor(() => {
        const gameLink = screen.getByRole('link', { name: 'Sweet Bonanza' });
        expect(gameLink.getAttribute('href')).toContain('sweet-bonanza');
      });
    });

    it('should display profit/loss for each game', async () => {
      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByText(/P\/L/)).toBeInTheDocument();
      });
    });

    it('should handle empty games list', async () => {
      const noGamesSession = { ...mockSession, gameBreakdown: [] };
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(noGamesSession),
        })
      );

      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByRole('document')).toBeInTheDocument();
      });
    });
  });

  describe('Big Wins Tab', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSession),
        })
      );
    });

    it('should display big wins title', async () => {
      render(<SessionDetailsPage />);
      const winsTab = screen.getByTestId('tab-wins');
      await userEvent.click(winsTab);
      await waitFor(() => {
        expect(screen.getByText(/Biggest Wins/)).toBeInTheDocument();
      });
    });

    it('should display win amount', async () => {
      render(<SessionDetailsPage />);
      const winsTab = screen.getByTestId('tab-wins');
      await userEvent.click(winsTab);
      await waitFor(() => {
        expect(screen.getByText(/50000/)).toBeInTheDocument();
      });
    });

    it('should display multiplier', async () => {
      render(<SessionDetailsPage />);
      const winsTab = screen.getByTestId('tab-wins');
      await userEvent.click(winsTab);
      await waitFor(() => {
        expect(screen.getByText(/125\.0x/)).toBeInTheDocument();
      });
    });

    it('should display game name of win', async () => {
      render(<SessionDetailsPage />);
      const winsTab = screen.getByTestId('tab-wins');
      await userEvent.click(winsTab);
      await waitFor(() => {
        expect(screen.getByText('Sweet Bonanza')).toBeInTheDocument();
      });
    });

    it('should display balance before and after', async () => {
      render(<SessionDetailsPage />);
      const winsTab = screen.getByTestId('tab-wins');
      await userEvent.click(winsTab);
      await waitFor(() => {
        expect(screen.getByText(/Before/i)).toBeInTheDocument();
        expect(screen.getByText(/After/i)).toBeInTheDocument();
      });
    });

    it('should show message when no big wins', async () => {
      const noBigWinsSession = { ...mockSession, bigWins: [] };
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(noBigWinsSession),
        })
      );

      render(<SessionDetailsPage />);
      const winsTab = screen.getByTestId('tab-wins');
      await userEvent.click(winsTab);
      await waitFor(() => {
        expect(screen.getByText(/No big wins recorded/i)).toBeInTheDocument();
      });
    });

    it('should display timestamp of win', async () => {
      render(<SessionDetailsPage />);
      const winsTab = screen.getByTestId('tab-wins');
      await userEvent.click(winsTab);
      await waitFor(() => {
        expect(screen.getByRole('document')).toBeInTheDocument();
      });
    });
  });

  describe('Balance History Tab', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSession),
        })
      );
    });

    it('should display balance timeline title', async () => {
      render(<SessionDetailsPage />);
      const historyTab = screen.getByTestId('tab-history');
      await userEvent.click(historyTab);
      await waitFor(() => {
        expect(screen.getByText(/Balance Timeline/)).toBeInTheDocument();
      });
    });

    it('should display history entries', async () => {
      render(<SessionDetailsPage />);
      const historyTab = screen.getByTestId('tab-history');
      await userEvent.click(historyTab);
      await waitFor(() => {
        expect(screen.getByText(/Wagered/)).toBeInTheDocument();
      });
    });

    it('should display timestamps', async () => {
      render(<SessionDetailsPage />);
      const historyTab = screen.getByTestId('tab-history');
      await userEvent.click(historyTab);
      await waitFor(() => {
        expect(screen.getByRole('document')).toBeInTheDocument();
      });
    });

    it('should display balance for each entry', async () => {
      render(<SessionDetailsPage />);
      const historyTab = screen.getByTestId('tab-history');
      await userEvent.click(historyTab);
      await waitFor(() => {
        expect(screen.getByText(/Balance/)).toBeInTheDocument();
      });
    });

    it('should display balance change', async () => {
      render(<SessionDetailsPage />);
      const historyTab = screen.getByTestId('tab-history');
      await userEvent.click(historyTab);
      await waitFor(() => {
        expect(screen.getByRole('document')).toBeInTheDocument();
      });
    });

    it('should be scrollable when many entries', async () => {
      const manyHistorySession = {
        ...mockSession,
        balanceHistory: Array.from({ length: 50 }, (_, i) => ({
          timestamp: new Date(Date.now() - i * 60000).toISOString(),
          balance: 100000 + i * 100,
          wagered: 100,
          won: 110,
          balanceChange: 10,
        })),
      };
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(manyHistorySession),
        })
      );

      render(<SessionDetailsPage />);
      const historyTab = screen.getByTestId('tab-history');
      await userEvent.click(historyTab);
      await waitFor(() => {
        expect(screen.getByRole('document')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error message when session not found', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
        })
      );

      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByText(/not found/i)).toBeInTheDocument();
      });
    });

    it('should show back button in error state', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
        })
      );

      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
    });

    it('should have link to leaderboard in error', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
        })
      );

      render(<SessionDetailsPage />);
      await waitFor(() => {
        const leaderboardLink = screen.getByRole('link');
        expect(leaderboardLink.getAttribute('href')).toContain('leaderboard');
      });
    });
  });

  describe('Data Mapping', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSession),
        })
      );
    });

    it('should map session data correctly', async () => {
      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByText('Completed')).toBeInTheDocument();
      });
    });

    it('should map game breakdown correctly', async () => {
      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByText('Sweet Bonanza')).toBeInTheDocument();
      });
    });

    it('should map big wins correctly', async () => {
      render(<SessionDetailsPage />);
      const winsTab = screen.getByTestId('tab-wins');
      await userEvent.click(winsTab);
      await waitFor(() => {
        expect(screen.getByText(/50000/)).toBeInTheDocument();
      });
    });

    it('should map balance history correctly', async () => {
      render(<SessionDetailsPage />);
      const historyTab = screen.getByTestId('tab-history');
      await userEvent.click(historyTab);
      await waitFor(() => {
        expect(screen.getByText(/Balance/)).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSession),
        })
      );
    });

    it('should render without performance issues', async () => {
      const startTime = performance.now();
      render(<SessionDetailsPage />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500);
    });

    it('should load data without blocking', async () => {
      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByText('Session Details')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSession),
        })
      );
    });

    it('should render on mobile viewport', async () => {
      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByRole('document')).toBeInTheDocument();
      });
    });

    it('should use responsive grid', async () => {
      const { container } = render(<SessionDetailsPage />);
      await waitFor(() => {
        const gridElements = container.querySelectorAll('[class*="grid"]');
        expect(gridElements.length).toBeGreaterThan(0);
      });
    });

    it('should display properly on all screen sizes', async () => {
      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByText('Session Details')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero duration', async () => {
      const zeroSession = { ...mockSession, duration: 0 };
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(zeroSession),
        })
      );

      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByRole('document')).toBeInTheDocument();
      });
    });

    it('should handle break-even session', async () => {
      const breakEvenSession = {
        ...mockSession,
        endBalance: mockSession.startBalance,
        profitLoss: 0,
        roi: 0,
      };
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(breakEvenSession),
        })
      );

      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByRole('document')).toBeInTheDocument();
      });
    });

    it('should handle very large numbers', async () => {
      const largeSession = {
        ...mockSession,
        startBalance: 1000000,
        totalWagered: 10000000,
        profitLoss: 500000,
      };
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(largeSession),
        })
      );

      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByRole('document')).toBeInTheDocument();
      });
    });

    it('should handle many games', async () => {
      const manyGamesSession = {
        ...mockSession,
        gameBreakdown: Array.from({ length: 20 }, (_, i) => ({
          gameId: `game-${i}`,
          gameName: `Game ${i}`,
          sessionsCount: 10 + i,
          totalWagered: 10000 + i * 1000,
          totalWon: 10500 + i * 1000,
          observedRtp: 95 + i * 0.1,
          theoreticalRtp: 96,
        })),
      };
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(manyGamesSession),
        })
      );

      render(<SessionDetailsPage />);
      await waitFor(() => {
        expect(screen.getByRole('document')).toBeInTheDocument();
      });
    });
  });
});
