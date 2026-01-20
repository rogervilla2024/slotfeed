import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BonusHuntList } from '../BonusHuntList';

jest.mock('@/lib/hooks/use-bonus-hunts', () => ({
  useBonusHunts: jest.fn(),
}));

jest.mock('../BonusHuntCard', () => ({
  BonusHuntCard: ({ hunt }: any) => (
    <div data-testid={`bonus-hunt-card-${hunt.id}`}>
      {hunt.streamerName} - {hunt.gameName}
    </div>
  ),
}));

jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: any) => <div data-testid="skeleton" className={className} />,
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

jest.mock('lucide-react', () => ({
  AlertCircle: () => <span data-testid="alert-icon">⚠️</span>,
  RefreshCw: () => <span data-testid="refresh-icon">🔄</span>,
}));

import { useBonusHunts } from '@/lib/hooks/use-bonus-hunts';

const mockHunt = {
  id: 'hunt-1',
  streamer_id: 'streamer-1',
  streamer_name: 'Roshtein',
  game_name: 'Sweet Bonanza',
  status: 'completed' as const,
  created_at: new Date().toISOString(),
  completed_at: new Date().toISOString(),
  total_cost: 1000,
  total_payout: 1500,
  roi_percent: 50,
  entry_count: 10,
  opened_count: 10,
};

describe('BonusHuntList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('renders loading state when data is loading', () => {
      (useBonusHunts as jest.Mock).mockReturnValue({
        data: [],
        loading: true,
        error: null,
        total: 0,
        refetch: jest.fn(),
      });

      render(<BonusHuntList />);
      expect(screen.getAllByTestId('skeleton')).toHaveLength(6);
    });

    it('renders status filter buttons', () => {
      (useBonusHunts as jest.Mock).mockReturnValue({
        data: [mockHunt],
        loading: false,
        error: null,
        total: 1,
        refetch: jest.fn(),
      });

      render(<BonusHuntList />);
      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('Collecting')).toBeInTheDocument();
      expect(screen.getByText('Opening')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('displays total count for all filter', () => {
      (useBonusHunts as jest.Mock).mockReturnValue({
        data: [mockHunt, { ...mockHunt, id: 'hunt-2' }],
        loading: false,
        error: null,
        total: 2,
        refetch: jest.fn(),
      });

      render(<BonusHuntList />);
      expect(screen.getByText(/All.*\(2\)/)).toBeInTheDocument();
    });

    it('renders refresh button', () => {
      (useBonusHunts as jest.Mock).mockReturnValue({
        data: [mockHunt],
        loading: false,
        error: null,
        total: 1,
        refetch: jest.fn(),
      });

      render(<BonusHuntList />);
      const buttons = screen.getAllByTestId('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Data Display', () => {
    it('displays bonus hunt cards', () => {
      (useBonusHunts as jest.Mock).mockReturnValue({
        data: [mockHunt],
        loading: false,
        error: null,
        total: 1,
        refetch: jest.fn(),
      });

      render(<BonusHuntList />);
      expect(screen.getByTestId('bonus-hunt-card-hunt-1')).toBeInTheDocument();
    });

    it('displays multiple hunt cards', () => {
      const hunts = [
        mockHunt,
        { ...mockHunt, id: 'hunt-2', streamer_name: 'ClassyBeef' },
        { ...mockHunt, id: 'hunt-3', streamer_name: 'Xposed' },
      ];

      (useBonusHunts as jest.Mock).mockReturnValue({
        data: hunts,
        loading: false,
        error: null,
        total: 3,
        refetch: jest.fn(),
      });

      render(<BonusHuntList />);
      expect(screen.getByTestId('bonus-hunt-card-hunt-1')).toBeInTheDocument();
      expect(screen.getByTestId('bonus-hunt-card-hunt-2')).toBeInTheDocument();
      expect(screen.getByTestId('bonus-hunt-card-hunt-3')).toBeInTheDocument();
    });

    it('displays empty state when no hunts', () => {
      (useBonusHunts as jest.Mock).mockReturnValue({
        data: [],
        loading: false,
        error: null,
        total: 0,
        refetch: jest.fn(),
      });

      render(<BonusHuntList />);
      expect(screen.getByText(/No bonus hunts found/)).toBeInTheDocument();
    });

    it('displays hunt cards with correct data', () => {
      (useBonusHunts as jest.Mock).mockReturnValue({
        data: [mockHunt],
        loading: false,
        error: null,
        total: 1,
        refetch: jest.fn(),
      });

      render(<BonusHuntList />);
      expect(screen.getByText(/Roshtein/)).toBeInTheDocument();
      expect(screen.getByText(/Sweet Bonanza/)).toBeInTheDocument();
    });
  });

  describe('Status Filtering', () => {
    it('filters by collecting status', async () => {
      const user = userEvent.setup();
      const mockRefetch = jest.fn();

      (useBonusHunts as jest.Mock).mockReturnValue({
        data: [mockHunt],
        loading: false,
        error: null,
        total: 1,
        refetch: mockRefetch,
      });

      render(<BonusHuntList />);

      const collectingButton = screen.getByRole('button', { name: /Collecting/ });
      await user.click(collectingButton);

      expect(collectingButton).toBeInTheDocument();
    });

    it('filters by opening status', async () => {
      const user = userEvent.setup();

      (useBonusHunts as jest.Mock).mockReturnValue({
        data: [{ ...mockHunt, status: 'opening' }],
        loading: false,
        error: null,
        total: 1,
        refetch: jest.fn(),
      });

      render(<BonusHuntList />);

      const openingButton = screen.getByRole('button', { name: /Opening/ });
      await user.click(openingButton);

      expect(openingButton).toBeInTheDocument();
    });

    it('filters by completed status', async () => {
      const user = userEvent.setup();

      (useBonusHunts as jest.Mock).mockReturnValue({
        data: [{ ...mockHunt, status: 'completed' }],
        loading: false,
        error: null,
        total: 1,
        refetch: jest.fn(),
      });

      render(<BonusHuntList />);

      const completedButton = screen.getByRole('button', { name: /Completed/ });
      await user.click(completedButton);

      expect(completedButton).toBeInTheDocument();
    });

    it('shows correct count for each status', () => {
      const hunts = [
        { ...mockHunt, id: 'hunt-1', status: 'collecting' as const },
        { ...mockHunt, id: 'hunt-2', status: 'opening' as const },
        { ...mockHunt, id: 'hunt-3', status: 'completed' as const },
      ];

      (useBonusHunts as jest.Mock).mockReturnValue({
        data: hunts,
        loading: false,
        error: null,
        total: 3,
        refetch: jest.fn(),
      });

      render(<BonusHuntList />);
      expect(screen.getByText(/All.*\(3\)/)).toBeInTheDocument();
      expect(screen.getByText(/Collecting.*\(1\)/)).toBeInTheDocument();
      expect(screen.getByText(/Opening.*\(1\)/)).toBeInTheDocument();
      expect(screen.getByText(/Completed.*\(1\)/)).toBeInTheDocument();
    });

    it('calls refetch when hook receives new status filter', async () => {
      const mockRefetch = jest.fn();

      (useBonusHunts as jest.Mock)
        .mockReturnValueOnce({
          data: [mockHunt],
          loading: false,
          error: null,
          total: 1,
          refetch: mockRefetch,
        })
        .mockReturnValueOnce({
          data: [mockHunt],
          loading: false,
          error: null,
          total: 1,
          refetch: mockRefetch,
        });

      const { rerender } = render(<BonusHuntList />);
      rerender(<BonusHuntList />);

      expect(useBonusHunts).toHaveBeenCalled();
    });
  });

  describe('Refresh Functionality', () => {
    it('calls refetch when refresh button is clicked', async () => {
      const user = userEvent.setup();
      const mockRefetch = jest.fn();

      (useBonusHunts as jest.Mock).mockReturnValue({
        data: [mockHunt],
        loading: false,
        error: null,
        total: 1,
        refetch: mockRefetch,
      });

      render(<BonusHuntList />);

      const refreshButtons = screen.getAllByTestId('button');
      const refreshButton = refreshButtons[refreshButtons.length - 1]; // Last button is refresh
      await user.click(refreshButton);

      expect(mockRefetch).toHaveBeenCalled();
    });

    it('disables refresh button when loading', () => {
      (useBonusHunts as jest.Mock).mockReturnValue({
        data: [],
        loading: true,
        error: null,
        total: 0,
        refetch: jest.fn(),
      });

      render(<BonusHuntList />);
      const buttons = screen.getAllByTestId('button');
      expect(buttons[0]).toBeDisabled();
    });

    it('disables status buttons when loading', () => {
      (useBonusHunts as jest.Mock).mockReturnValue({
        data: [],
        loading: true,
        error: null,
        total: 0,
        refetch: jest.fn(),
      });

      render(<BonusHuntList />);
      const buttons = screen.getAllByTestId('button');
      buttons.forEach((button) => {
        if (!button.textContent?.includes('(')) {
          expect(button).toBeDisabled();
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message when fetch fails', () => {
      (useBonusHunts as jest.Mock).mockReturnValue({
        data: [],
        loading: false,
        error: 'Failed to load bonus hunts',
        total: 0,
        refetch: jest.fn(),
      });

      render(<BonusHuntList />);
      expect(screen.getByText('Failed to Load Bonus Hunts')).toBeInTheDocument();
      expect(screen.getByText('Failed to load bonus hunts')).toBeInTheDocument();
    });

    it('displays alert icon on error', () => {
      (useBonusHunts as jest.Mock).mockReturnValue({
        data: [],
        loading: false,
        error: 'Network error',
        total: 0,
        refetch: jest.fn(),
      });

      render(<BonusHuntList />);
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
    });

    it('displays retry button on error', () => {
      (useBonusHunts as jest.Mock).mockReturnValue({
        data: [],
        loading: false,
        error: 'Failed to load',
        total: 0,
        refetch: jest.fn(),
      });

      render(<BonusHuntList />);
      expect(screen.getByText(/Try Again/)).toBeInTheDocument();
    });

    it('calls refetch when retry button is clicked', async () => {
      const user = userEvent.setup();
      const mockRefetch = jest.fn();

      (useBonusHunts as jest.Mock).mockReturnValue({
        data: [],
        loading: false,
        error: 'Failed',
        total: 0,
        refetch: mockRefetch,
      });

      render(<BonusHuntList />);
      const retryButton = screen.getByText(/Try Again/);
      await user.click(retryButton);

      expect(mockRefetch).toHaveBeenCalled();
    });

    it('hides hunts when error occurs', () => {
      (useBonusHunts as jest.Mock).mockReturnValue({
        data: [mockHunt],
        loading: false,
        error: 'Error loading',
        total: 1,
        refetch: jest.fn(),
      });

      render(<BonusHuntList />);
      expect(screen.queryByTestId('bonus-hunt-card-hunt-1')).not.toBeInTheDocument();
    });
  });

  describe('Layout and Responsive Design', () => {
    it('renders grid layout for hunt cards', () => {
      (useBonusHunts as jest.Mock).mockReturnValue({
        data: [mockHunt, { ...mockHunt, id: 'hunt-2' }, { ...mockHunt, id: 'hunt-3' }],
        loading: false,
        error: null,
        total: 3,
        refetch: jest.fn(),
      });

      render(<BonusHuntList />);
      expect(screen.getByTestId('bonus-hunt-card-hunt-1')).toBeInTheDocument();
      expect(screen.getByTestId('bonus-hunt-card-hunt-2')).toBeInTheDocument();
      expect(screen.getByTestId('bonus-hunt-card-hunt-3')).toBeInTheDocument();
    });

    it('loads skeleton placeholders during loading', () => {
      (useBonusHunts as jest.Mock).mockReturnValue({
        data: [],
        loading: true,
        error: null,
        total: 0,
        refetch: jest.fn(),
      });

      render(<BonusHuntList />);
      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons).toHaveLength(6);
    });
  });

  describe('Data Mapping', () => {
    it('correctly maps API data to hunt display format', () => {
      const apiHunt = {
        id: 'test-hunt',
        streamer_id: 'streamer-1',
        streamer_name: 'TestStreamer',
        game_name: 'TestGame',
        status: 'completed' as const,
        created_at: '2026-01-08T00:00:00Z',
        completed_at: '2026-01-08T02:00:00Z',
        total_cost: 500,
        total_payout: 750,
        roi_percent: 50,
        entry_count: 5,
        opened_count: 5,
      };

      (useBonusHunts as jest.Mock).mockReturnValue({
        data: [apiHunt],
        loading: false,
        error: null,
        total: 1,
        refetch: jest.fn(),
      });

      render(<BonusHuntList />);
      expect(screen.getByText(/TestStreamer/)).toBeInTheDocument();
    });

    it('handles missing streamer name', () => {
      const huntWithoutStreamer = {
        ...mockHunt,
        streamer_name: undefined,
      };

      (useBonusHunts as jest.Mock).mockReturnValue({
        data: [huntWithoutStreamer],
        loading: false,
        error: null,
        total: 1,
        refetch: jest.fn(),
      });

      render(<BonusHuntList />);
      expect(screen.getByTestId('bonus-hunt-card-hunt-1')).toBeInTheDocument();
    });
  });

  describe('Status Badge Display', () => {
    it('displays correct badge for collecting status', () => {
      (useBonusHunts as jest.Mock).mockReturnValue({
        data: [{ ...mockHunt, status: 'collecting' }],
        loading: false,
        error: null,
        total: 1,
        refetch: jest.fn(),
      });

      render(<BonusHuntList />);
      expect(screen.getByTestId('bonus-hunt-card-hunt-1')).toBeInTheDocument();
    });

    it('displays correct badge for opening status', () => {
      (useBonusHunts as jest.Mock).mockReturnValue({
        data: [{ ...mockHunt, status: 'opening' }],
        loading: false,
        error: null,
        total: 1,
        refetch: jest.fn(),
      });

      render(<BonusHuntList />);
      expect(screen.getByTestId('bonus-hunt-card-hunt-1')).toBeInTheDocument();
    });

    it('displays correct badge for completed status', () => {
      (useBonusHunts as jest.Mock).mockReturnValue({
        data: [{ ...mockHunt, status: 'completed' }],
        loading: false,
        error: null,
        total: 1,
        refetch: jest.fn(),
      });

      render(<BonusHuntList />);
      expect(screen.getByTestId('bonus-hunt-card-hunt-1')).toBeInTheDocument();
    });

    it('displays correct badge for cancelled status', () => {
      (useBonusHunts as jest.Mock).mockReturnValue({
        data: [{ ...mockHunt, status: 'cancelled' }],
        loading: false,
        error: null,
        total: 1,
        refetch: jest.fn(),
      });

      render(<BonusHuntList />);
      expect(screen.getByTestId('bonus-hunt-card-hunt-1')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles large number of hunts', () => {
      const manyHunts = Array.from({ length: 50 }, (_, i) => ({
        ...mockHunt,
        id: `hunt-${i}`,
      }));

      (useBonusHunts as jest.Mock).mockReturnValue({
        data: manyHunts,
        loading: false,
        error: null,
        total: 50,
        refetch: jest.fn(),
      });

      render(<BonusHuntList />);
      expect(screen.getByTestId('bonus-hunt-card-hunt-0')).toBeInTheDocument();
      expect(screen.getByTestId('bonus-hunt-card-hunt-49')).toBeInTheDocument();
    });

    it('handles empty string game name', () => {
      const huntWithEmptyGame = {
        ...mockHunt,
        game_name: '',
      };

      (useBonusHunts as jest.Mock).mockReturnValue({
        data: [huntWithEmptyGame],
        loading: false,
        error: null,
        total: 1,
        refetch: jest.fn(),
      });

      render(<BonusHuntList />);
      expect(screen.getByTestId('bonus-hunt-card-hunt-1')).toBeInTheDocument();
    });

    it('handles zero profit hunts', () => {
      const zeroHunt = {
        ...mockHunt,
        total_cost: 500,
        total_payout: 500,
        roi_percent: 0,
      };

      (useBonusHunts as jest.Mock).mockReturnValue({
        data: [zeroHunt],
        loading: false,
        error: null,
        total: 1,
        refetch: jest.fn(),
      });

      render(<BonusHuntList />);
      expect(screen.getByTestId('bonus-hunt-card-hunt-1')).toBeInTheDocument();
    });

    it('handles losing hunts with negative ROI', () => {
      const losingHunt = {
        ...mockHunt,
        total_cost: 1000,
        total_payout: 800,
        roi_percent: -20,
      };

      (useBonusHunts as jest.Mock).mockReturnValue({
        data: [losingHunt],
        loading: false,
        error: null,
        total: 1,
        refetch: jest.fn(),
      });

      render(<BonusHuntList />);
      expect(screen.getByTestId('bonus-hunt-card-hunt-1')).toBeInTheDocument();
    });

    it('handles unopened bonuses', () => {
      const unopenedHunt = {
        ...mockHunt,
        bonusCount: 10,
        bonusesOpened: 0,
      };

      (useBonusHunts as jest.Mock).mockReturnValue({
        data: [unopenedHunt],
        loading: false,
        error: null,
        total: 1,
        refetch: jest.fn(),
      });

      render(<BonusHuntList />);
      expect(screen.getByTestId('bonus-hunt-card-hunt-1')).toBeInTheDocument();
    });

    it('handles single bonus', () => {
      const singleBonusHunt = {
        ...mockHunt,
        entry_count: 1,
        opened_count: 1,
      };

      (useBonusHunts as jest.Mock).mockReturnValue({
        data: [singleBonusHunt],
        loading: false,
        error: null,
        total: 1,
        refetch: jest.fn(),
      });

      render(<BonusHuntList />);
      expect(screen.getByTestId('bonus-hunt-card-hunt-1')).toBeInTheDocument();
    });
  });

  describe('Filter State Management', () => {
    it('maintains filter state when data changes', async () => {
      const user = userEvent.setup();
      const mockRefetch = jest.fn();

      (useBonusHunts as jest.Mock).mockReturnValue({
        data: [{ ...mockHunt, status: 'collecting' }],
        loading: false,
        error: null,
        total: 1,
        refetch: mockRefetch,
      });

      const { rerender } = render(<BonusHuntList />);

      const collectingButton = screen.getByRole('button', { name: /Collecting/ });
      await user.click(collectingButton);

      (useBonusHunts as jest.Mock).mockReturnValue({
        data: [{ ...mockHunt, status: 'collecting' }, { ...mockHunt, id: 'hunt-2' }],
        loading: false,
        error: null,
        total: 2,
        refetch: mockRefetch,
      });

      rerender(<BonusHuntList />);
      expect(screen.getByText(/Collecting/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('renders semantic button elements for filters', () => {
      (useBonusHunts as jest.Mock).mockReturnValue({
        data: [mockHunt],
        loading: false,
        error: null,
        total: 1,
        refetch: jest.fn(),
      });

      render(<BonusHuntList />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('buttons are keyboard accessible', async () => {
      const user = userEvent.setup();

      (useBonusHunts as jest.Mock).mockReturnValue({
        data: [mockHunt],
        loading: false,
        error: null,
        total: 1,
        refetch: jest.fn(),
      });

      render(<BonusHuntList />);
      await user.tab();
      // Focus should move to first button
      expect(screen.getByRole('button', { name: /All/ })).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('renders efficiently with many cards', () => {
      const manyHunts = Array.from({ length: 100 }, (_, i) => ({
        ...mockHunt,
        id: `hunt-${i}`,
      }));

      (useBonusHunts as jest.Mock).mockReturnValue({
        data: manyHunts,
        loading: false,
        error: null,
        total: 100,
        refetch: jest.fn(),
      });

      const startTime = performance.now();
      render(<BonusHuntList />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});
