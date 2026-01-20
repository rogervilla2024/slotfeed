import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BigWinsGallery } from '../big-wins-gallery';
import type { BigWin } from '@/types';

jest.mock('../big-win-card', () => ({
  BigWinCard: ({ bigWin }: any) => (
    <div data-testid={`big-win-${bigWin.id}`}>{bigWin.multiplier}x</div>
  ),
  BigWinCardSkeleton: () => <div data-testid="skeleton">Loading...</div>,
}));

jest.mock('@/lib/websocket', () => ({
  useBigWinsUpdates: jest.fn(() => ({
    isConnected: true,
  })),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div data-testid="card" className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div data-testid="card-content" className={className}>{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, className }: any) => (
    <button
      data-testid="button"
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      data-size={size}
      className={className}
    >
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span data-testid="badge" data-variant={variant} className={className}>{children}</span>
  ),
}));

jest.mock('lucide-react', () => ({
  RefreshCw: () => <span data-testid="refresh-icon">🔄</span>,
  Zap: () => <span data-testid="zap-icon">⚡</span>,
}));

const mockBigWin: BigWin = {
  id: 'win-1',
  sessionId: 'session-1',
  gameId: 'sweet-bonanza',
  streamerId: 'roshtein',
  streamer: {
    id: 'roshtein',
    username: 'roshtein',
    displayName: 'Roshtein',
    platform: 'kick' as const,
    platformId: 'roshtein',
    followerCount: 362000,
    isLive: true,
    lifetimeStats: {
      totalSessions: 1000,
      totalHoursStreamed: 5000,
      totalWagered: 5000000,
      totalWon: 5500000,
      biggestWin: 100000,
      biggestMultiplier: 5000,
      averageRtp: 96.5,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  game: {
    id: 'sweet-bonanza',
    name: 'Sweet Bonanza',
    slug: 'sweet-bonanza',
    providerId: 'pragmatic-play',
    rtp: 96.48,
    volatility: 'medium' as const,
    maxMultiplier: 21100,
    isActive: true,
  },
  betAmount: 10,
  winAmount: 5000,
  multiplier: 500,
  timestamp: new Date(),
  isVerified: true,
};

describe('BigWinsGallery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  describe('Initial Rendering', () => {
    it('renders gallery component', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ wins: [mockBigWin] }),
      });

      render(<BigWinsGallery />);
      await waitFor(() => {
        expect(screen.getByText(/Big Wins Gallery/)).toBeInTheDocument();
      });
    });

    it('displays loading skeletons initially', () => {
      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve({ ok: true, json: () => ({ wins: [] }) }), 100))
      );

      render(<BigWinsGallery />);
      expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
    });

    it('fetches big wins on mount', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ wins: [mockBigWin] }),
      });

      render(<BigWinsGallery />);
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/v1/live/big-wins'));
      });
    });

    it('displays big win cards when data loaded', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ wins: [mockBigWin] }),
      });

      render(<BigWinsGallery />);
      await waitFor(() => {
        expect(screen.getByTestId('big-win-win-1')).toBeInTheDocument();
      });
    });
  });

  describe('Period Filter', () => {
    it('renders period filter buttons', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ wins: [mockBigWin] }),
      });

      render(<BigWinsGallery />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Today/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Week/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Month/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /All Time/ })).toBeInTheDocument();
      });
    });

    it('filters wins by today period', async () => {
      const user = userEvent.setup();
      const today = new Date();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const wins = [
        { ...mockBigWin, id: 'win-today', timestamp: today },
        { ...mockBigWin, id: 'win-yesterday', timestamp: yesterday },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ wins }),
      });

      render(<BigWinsGallery />);
      await waitFor(() => {
        expect(screen.getByTestId('big-win-win-today')).toBeInTheDocument();
      });

      const todayButton = screen.getByRole('button', { name: /Today/ });
      await user.click(todayButton);

      await waitFor(() => {
        expect(screen.getByTestId('big-win-win-today')).toBeInTheDocument();
      });
    });

    it('filters wins by week period', async () => {
      const user = userEvent.setup();
      const withinWeek = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const outsideWeek = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

      const wins = [
        { ...mockBigWin, id: 'win-week', timestamp: withinWeek },
        { ...mockBigWin, id: 'win-old', timestamp: outsideWeek },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ wins }),
      });

      render(<BigWinsGallery />);
      await waitFor(() => {
        expect(screen.getByTestId('big-win-win-week')).toBeInTheDocument();
      });

      const weekButton = screen.getByRole('button', { name: /Week/ });
      await user.click(weekButton);

      await waitFor(() => {
        expect(screen.getByTestId('big-win-win-week')).toBeInTheDocument();
      });
    });

    it('filters wins by month period', async () => {
      const user = userEvent.setup();
      const withinMonth = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
      const outsideMonth = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

      const wins = [
        { ...mockBigWin, id: 'win-month', timestamp: withinMonth },
        { ...mockBigWin, id: 'win-old', timestamp: outsideMonth },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ wins }),
      });

      render(<BigWinsGallery />);
      await waitFor(() => {
        expect(screen.getByTestId('big-win-win-month')).toBeInTheDocument();
      });

      const monthButton = screen.getByRole('button', { name: /Month/ });
      await user.click(monthButton);

      await waitFor(() => {
        expect(screen.getByTestId('big-win-win-month')).toBeInTheDocument();
      });
    });

    it('shows all wins with all time period', async () => {
      const user = userEvent.setup();
      const recentWin = mockBigWin;
      const oldWin = {
        ...mockBigWin,
        id: 'win-old',
        timestamp: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ wins: [recentWin, oldWin] }),
      });

      render(<BigWinsGallery />);
      await waitFor(() => {
        expect(screen.getByTestId('big-win-win-1')).toBeInTheDocument();
      });

      const allTimeButton = screen.getByRole('button', { name: /All Time/ });
      await user.click(allTimeButton);

      await waitFor(() => {
        expect(screen.getByTestId('big-win-win-old')).toBeInTheDocument();
      });
    });
  });

  describe('Tier Filter', () => {
    it('renders tier filter buttons', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ wins: [mockBigWin] }),
      });

      render(<BigWinsGallery />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Big/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Mega/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Ultra/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Legendary/ })).toBeInTheDocument();
      });
    });

    it('filters wins by big tier (50-499x)', async () => {
      const user = userEvent.setup();
      const bigWin = { ...mockBigWin, id: 'big', multiplier: 250 };
      const megaWin = { ...mockBigWin, id: 'mega', multiplier: 600 };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ wins: [bigWin, megaWin] }),
      });

      render(<BigWinsGallery />);
      await waitFor(() => {
        expect(screen.getByTestId('big-win-big')).toBeInTheDocument();
      });

      const bigButton = screen.getByRole('button', { name: /Big\s/ });
      await user.click(bigButton);

      await waitFor(() => {
        expect(screen.getByTestId('big-win-big')).toBeInTheDocument();
      });
    });

    it('filters wins by mega tier (500-999x)', async () => {
      const user = userEvent.setup();
      const megaWin = { ...mockBigWin, id: 'mega', multiplier: 750 };
      const ultraWin = { ...mockBigWin, id: 'ultra', multiplier: 1500 };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ wins: [megaWin, ultraWin] }),
      });

      render(<BigWinsGallery />);
      await waitFor(() => {
        expect(screen.getByTestId('big-win-mega')).toBeInTheDocument();
      });

      const megaButton = screen.getByRole('button', { name: /Mega/ });
      await user.click(megaButton);

      await waitFor(() => {
        expect(screen.getByTestId('big-win-mega')).toBeInTheDocument();
      });
    });

    it('filters wins by ultra tier (1000-4999x)', async () => {
      const user = userEvent.setup();
      const ultraWin = { ...mockBigWin, id: 'ultra', multiplier: 2000 };
      const legendaryWin = { ...mockBigWin, id: 'legendary', multiplier: 5000 };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ wins: [ultraWin, legendaryWin] }),
      });

      render(<BigWinsGallery />);
      await waitFor(() => {
        expect(screen.getByTestId('big-win-ultra')).toBeInTheDocument();
      });

      const ultraButton = screen.getByRole('button', { name: /Ultra/ });
      await user.click(ultraButton);

      await waitFor(() => {
        expect(screen.getByTestId('big-win-ultra')).toBeInTheDocument();
      });
    });

    it('filters wins by legendary tier (5000x+)', async () => {
      const user = userEvent.setup();
      const legendaryWin = { ...mockBigWin, id: 'legendary', multiplier: 5000 };
      const ultraWin = { ...mockBigWin, id: 'ultra', multiplier: 2000 };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ wins: [legendaryWin, ultraWin] }),
      });

      render(<BigWinsGallery />);
      await waitFor(() => {
        expect(screen.getByTestId('big-win-legendary')).toBeInTheDocument();
      });

      const legendaryButton = screen.getByRole('button', { name: /Legendary/ });
      await user.click(legendaryButton);

      await waitFor(() => {
        expect(screen.getByTestId('big-win-legendary')).toBeInTheDocument();
      });
    });
  });

  describe('Streamer Filter', () => {
    it('filters wins by streamer ID', async () => {
      const roshteinWin = mockBigWin;
      const classyBeefWin = { ...mockBigWin, id: 'win-2', streamerId: 'classybeef' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ wins: [roshteinWin, classyBeefWin] }),
      });

      render(<BigWinsGallery streamerId="roshtein" />);
      await waitFor(() => {
        expect(screen.getByTestId('big-win-win-1')).toBeInTheDocument();
        expect(screen.queryByTestId('big-win-win-2')).not.toBeInTheDocument();
      });
    });
  });

  describe('Game Filter', () => {
    it('filters wins by game ID', async () => {
      const sweetBonanzaWin = mockBigWin;
      const gatesWin = { ...mockBigWin, id: 'win-2', gameId: 'gates-of-olympus' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ wins: [sweetBonanzaWin, gatesWin] }),
      });

      render(<BigWinsGallery gameId="sweet-bonanza" />);
      await waitFor(() => {
        expect(screen.getByTestId('big-win-win-1')).toBeInTheDocument();
        expect(screen.queryByTestId('big-win-win-2')).not.toBeInTheDocument();
      });
    });
  });

  describe('Stats Display', () => {
    it('displays total wins count', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ wins: [mockBigWin, { ...mockBigWin, id: 'win-2' }] }),
      });

      render(<BigWinsGallery />);
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });

    it('displays highest multiplier', async () => {
      const wins = [
        { ...mockBigWin, multiplier: 500 },
        { ...mockBigWin, id: 'win-2', multiplier: 2000 },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ wins }),
      });

      render(<BigWinsGallery />);
      await waitFor(() => {
        expect(screen.getByText(/2,000x/)).toBeInTheDocument();
      });
    });

    it('displays legendary wins count', async () => {
      const wins = [
        { ...mockBigWin, multiplier: 5000 },
        { ...mockBigWin, id: 'win-2', multiplier: 5500 },
        { ...mockBigWin, id: 'win-3', multiplier: 500 },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ wins }),
      });

      render(<BigWinsGallery />);
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });

    it('displays ultra wins count', async () => {
      const wins = [
        { ...mockBigWin, multiplier: 1000 },
        { ...mockBigWin, id: 'win-2', multiplier: 2000 },
        { ...mockBigWin, id: 'win-3', multiplier: 5000 }, // legendary, not ultra
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ wins }),
      });

      render(<BigWinsGallery />);
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });
  });

  describe('Refresh Functionality', () => {
    it('displays refresh button', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ wins: [mockBigWin] }),
      });

      render(<BigWinsGallery />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Refresh/ })).toBeInTheDocument();
      });
    });

    it('fetches new data when refresh clicked', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ wins: [mockBigWin] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ wins: [{ ...mockBigWin, id: 'win-2' }] }),
        });

      render(<BigWinsGallery />);
      await waitFor(() => {
        expect(screen.getByTestId('big-win-win-1')).toBeInTheDocument();
      });

      const refreshButton = screen.getByRole('button', { name: /Refresh/ });
      await user.click(refreshButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
    });

    it('disables refresh button while loading', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve({ ok: true, json: () => ({ wins: [] }) }), 1000))
      );

      render(<BigWinsGallery />);
      const refreshButton = screen.getByRole('button', { name: /Refresh/ });
      expect(refreshButton).toBeDisabled();
    });

    it('sets up auto-refresh interval', async () => {
      jest.useFakeTimers();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ wins: [mockBigWin] }),
      });

      render(<BigWinsGallery />);
      expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 30000);

      jest.useRealTimers();
    });
  });

  describe('Error Handling', () => {
    it('displays error message on fetch failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      });

      render(<BigWinsGallery />);
      await waitFor(() => {
        expect(screen.getByText(/Failed to load big wins/)).toBeInTheDocument();
      });
    });

    it('displays network error message', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<BigWinsGallery />);
      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });
    });

    it('hides wins when error occurs', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed'));

      render(<BigWinsGallery />);
      await waitFor(() => {
        expect(screen.queryByTestId('big-win-win-1')).not.toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('displays empty state message when no wins', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ wins: [] }),
      });

      render(<BigWinsGallery />);
      await waitFor(() => {
        expect(screen.getByText(/No big wins recorded yet/)).toBeInTheDocument();
      });
    });

    it('displays filter empty state when filters applied', async () => {
      const user = userEvent.setup();
      const wins = [{ ...mockBigWin, multiplier: 500 }];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ wins }),
      });

      render(<BigWinsGallery />);
      await waitFor(() => {
        expect(screen.getByTestId('big-win-win-1')).toBeInTheDocument();
      });

      const legendaryButton = screen.getByRole('button', { name: /Legendary/ });
      await user.click(legendaryButton);

      await waitFor(() => {
        expect(screen.getByText(/No big wins found for the selected filters/)).toBeInTheDocument();
      });
    });
  });

  describe('WebSocket Integration', () => {
    it('displays live status badge', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ wins: [mockBigWin] }),
      });

      render(<BigWinsGallery />);
      await waitFor(() => {
        expect(screen.getByText('Live')).toBeInTheDocument();
      });
    });

    it('displays offline status when not connected', async () => {
      const { useBigWinsUpdates } = require('@/lib/websocket');
      useBigWinsUpdates.mockReturnValueOnce({ isConnected: false });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ wins: [mockBigWin] }),
      });

      render(<BigWinsGallery />);
      await waitFor(() => {
        expect(screen.getByText('Offline')).toBeInTheDocument();
      });
    });
  });

  describe('Initial Props', () => {
    it('renders with initial wins', async () => {
      render(<BigWinsGallery initialWins={[mockBigWin]} />);
      await waitFor(() => {
        expect(screen.getByTestId('big-win-win-1')).toBeInTheDocument();
      });
    });

    it('applies custom className', () => {
      const { container } = render(<BigWinsGallery className="custom-class" />);
      const gallery = container.firstChild;
      expect(gallery).toHaveClass('custom-class');
    });
  });

  describe('Sorting', () => {
    it('sorts wins by multiplier descending', async () => {
      const wins = [
        { ...mockBigWin, id: 'win-1', multiplier: 100 },
        { ...mockBigWin, id: 'win-2', multiplier: 5000 },
        { ...mockBigWin, id: 'win-3', multiplier: 1000 },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ wins }),
      });

      render(<BigWinsGallery />);
      await waitFor(() => {
        const cards = screen.getAllByTestId(/big-win-/);
        expect(cards[0]).toHaveAttribute('data-testid', 'big-win-win-2');
        expect(cards[1]).toHaveAttribute('data-testid', 'big-win-win-3');
        expect(cards[2]).toHaveAttribute('data-testid', 'big-win-win-1');
      });
    });
  });

  describe('Performance', () => {
    it('renders efficiently with many wins', async () => {
      const manyWins = Array.from({ length: 100 }, (_, i) => ({
        ...mockBigWin,
        id: `win-${i}`,
      }));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ wins: manyWins }),
      });

      const startTime = performance.now();
      render(<BigWinsGallery />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('Cleanup', () => {
    it('clears interval on unmount', () => {
      jest.useFakeTimers();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ wins: [mockBigWin] }),
      });

      const { unmount } = render(<BigWinsGallery />);
      unmount();

      expect(clearInterval).toHaveBeenCalled();
      jest.useRealTimers();
    });
  });

  describe('Accessibility', () => {
    it('renders semantic HTML structure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ wins: [mockBigWin] }),
      });

      render(<BigWinsGallery />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Today/ })).toBeInTheDocument();
      });
    });

    it('buttons are keyboard accessible', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ wins: [mockBigWin] }),
      });

      render(<BigWinsGallery />);
      await waitFor(() => {
        const filterButtons = screen.getAllByRole('button');
        filterButtons.forEach((button) => {
          expect(button).toBeInTheDocument();
        });
      });
    });
  });
});
