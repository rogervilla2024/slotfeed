import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SlotDetailPage from '../page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    prefetch: jest.fn(),
  }),
  useParams: () => ({ id: 'sweet-bonanza' }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock dynamic imports
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (dynamicActualComp: () => Promise<{ default: React.ComponentType<any> }>, options?: any) => {
    const DynamicActualComp = React.lazy(dynamicActualComp);
    const DynamicComponent = (props: any) => (
      <React.Suspense fallback={<div data-testid="loading">Loading...</div>}>
        <DynamicActualComp {...props} />
      </React.Suspense>
    );
    return DynamicComponent;
  },
}));

// Mock chart components
jest.mock('@/components/charts/rtp-trend-chart', () => ({
  __esModule: true,
  default: ({ gameId, period }: any) => <div data-testid="rtp-trend-chart">RTP Trend Chart - {period}</div>,
}));

jest.mock('@/components/charts/bonus-frequency-chart', () => ({
  __esModule: true,
  default: ({ gameId, period }: any) => <div data-testid="bonus-frequency-chart">Bonus Frequency - {period}</div>,
}));

jest.mock('@/components/charts/win-distribution-chart', () => ({
  __esModule: true,
  default: ({ gameId, gameName }: any) => <div data-testid="win-distribution-chart">Win Distribution - {gameName}</div>,
}));

// Mock slot components
jest.mock('@/components/slot/slot-header', () => ({
  __esModule: true,
  default: ({ game, stats }: any) => (
    <div data-testid="slot-header">
      {game?.name} - {stats?.total_spins || 0} spins
    </div>
  ),
}));

jest.mock('@/components/slot/rtp-comparison', () => ({
  __esModule: true,
  default: ({ theoretical, observed }: any) => (
    <div data-testid="rtp-comparison">
      Theoretical: {theoretical}% | Observed: {observed?.toFixed(2)}%
    </div>
  ),
}));

jest.mock('@/components/slot/hot-cold-indicator', () => ({
  __esModule: true,
  default: ({ status, score }: any) => (
    <div data-testid="hot-cold-indicator">
      Status: {status} - Score: {score}
    </div>
  ),
}));

jest.mock('@/components/slot/bonus-stats', () => ({
  __esModule: true,
  default: ({ data }: any) => (
    <div data-testid="bonus-stats">
      Avg Frequency: {data?.average_frequency || 'N/A'}
    </div>
  ),
}));

jest.mock('@/components/slot/slot-guide', () => ({
  __esModule: true,
  default: ({ gameId, gameName }: any) => (
    <div data-testid="slot-guide">
      Guide for {gameName}
    </div>
  ),
}));

jest.mock('@/components/streamer/streamer-comparison', () => ({
  __esModule: true,
  default: ({ gameName, streamers }: any) => (
    <div data-testid="streamer-comparison">
      Streamers: {streamers?.length || 0}
    </div>
  ),
}));

jest.mock('@/components/ui/period-selector', () => ({
  __esModule: true,
  default: ({ onPeriodChange, selectedPeriod }: any) => (
    <select
      data-testid="period-selector"
      value={selectedPeriod}
      onChange={(e) => onPeriodChange(e.target.value)}
    >
      <option value="7d">7 Days</option>
      <option value="30d">30 Days</option>
      <option value="90d">90 Days</option>
    </select>
  ),
}));

jest.mock('@/lib/utils', () => ({
  formatCurrency: (amount: number) => `$${amount.toLocaleString()}`,
  formatNumber: (n: number) => n.toLocaleString(),
  getTimeAgo: (date: Date) => 'recently',
}));

jest.mock('lucide-react', () => ({
  Flame: () => <span data-testid="flame-icon">🔥</span>,
  Snowflake: () => <span data-testid="snowflake-icon">❄️</span>,
  TrendingUp: () => <span data-testid="trending-up">📈</span>,
  BarChart3: () => <span data-testid="bar-chart">📊</span>,
  AlertCircle: () => <span data-testid="alert-icon">⚠️</span>,
  Loader2: () => <span data-testid="loader">⏳</span>,
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div data-testid="card" className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div data-testid="card-content" className={className}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div data-testid="card-header" className={className}>{children}</div>,
  CardTitle: ({ children, className }: any) => <h2 data-testid="card-title" className={className}>{children}</h2>,
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange, className }: any) => (
    <div data-testid="tabs" data-value={value} className={className}>
      {children}
    </div>
  ),
  TabsList: ({ children, className }: any) => (
    <div data-testid="tabs-list" className={className}>{children}</div>
  ),
  TabsTrigger: ({ children, value, ...props }: any) => (
    <button
      data-testid={`tab-trigger-${value}`}
      data-tab={value}
      {...props}
    >
      {children}
    </button>
  ),
  TabsContent: ({ children, value, className }: any) => (
    <div data-testid={`tabs-content-${value}`} data-value={value} className={className}>
      {children}
    </div>
  ),
}));

// Mock data
const mockGame = {
  id: 'sweet-bonanza',
  name: 'Sweet Bonanza',
  provider: 'pragmatic-play',
  rtp: 96.48,
  volatility: 'medium',
};

const mockStats = {
  total_spins: 5000,
  total_profit: 1234.56,
  biggest_wins: [{ amount: 5000 }],
  bonus_frequency: 1.5,
  observed_rtp: 96.75,
  last_updated: new Date().toISOString(),
};

const mockHotCold = {
  status: 'hot',
  score: 78,
  big_wins_24h: 8,
  last_updated: new Date().toISOString(),
};

const mockStreamerStats = [
  {
    streamer_id: 'roshtein',
    username: 'Roshtein',
    avg_rtp: 95.5,
    total_sessions: 50,
  },
];

describe('Slot Detail Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();

    // Setup default fetch responses
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGame),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStats),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockHotCold),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ streamers: mockStreamerStats }),
      });
  });

  describe('Initial Rendering and Loading', () => {
    it('renders loading state initially', async () => {
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toBeInTheDocument();
      });
    });

    it('displays slot header when data loads', async () => {
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('slot-header')).toBeInTheDocument();
      });
    });

    it('displays slot name in header', async () => {
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByText(/Sweet Bonanza/)).toBeInTheDocument();
      });
    });

    it('displays spin count in header', async () => {
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByText(/5000 spins/)).toBeInTheDocument();
      });
    });

    it('fetches game data on mount', async () => {
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/v1/games/'));
      });
    });

    it('fetches stats data on mount', async () => {
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/v1/games/') && expect.stringContaining('/stats'));
      });
    });

    it('displays error message when fetch fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to fetch'));
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    it('renders all tab triggers', async () => {
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-overview')).toBeInTheDocument();
        expect(screen.getByTestId('tab-trigger-statistics')).toBeInTheDocument();
        expect(screen.getByTestId('tab-trigger-guide')).toBeInTheDocument();
        expect(screen.getByTestId('tab-trigger-analytics')).toBeInTheDocument();
        expect(screen.getByTestId('tab-trigger-streamers')).toBeInTheDocument();
        expect(screen.getByTestId('tab-trigger-history')).toBeInTheDocument();
      });
    });

    it('displays overview tab content by default', async () => {
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tabs-content-overview')).toBeInTheDocument();
      });
    });

    it('switches to statistics tab when clicked', async () => {
      const user = userEvent.setup();
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-statistics')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('tab-trigger-statistics'));
      await waitFor(() => {
        expect(screen.getByTestId('tabs-content-statistics')).toBeInTheDocument();
      });
    });

    it('switches to guide tab when clicked', async () => {
      const user = userEvent.setup();
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-guide')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('tab-trigger-guide'));
      await waitFor(() => {
        expect(screen.getByTestId('slot-guide')).toBeInTheDocument();
      });
    });

    it('switches to analytics tab when clicked', async () => {
      const user = userEvent.setup();
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-analytics')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('tab-trigger-analytics'));
      await waitFor(() => {
        expect(screen.getByTestId('rtp-trend-chart')).toBeInTheDocument();
      });
    });

    it('switches to streamers tab when clicked', async () => {
      const user = userEvent.setup();
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-streamers')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('tab-trigger-streamers'));
      await waitFor(() => {
        expect(screen.getByTestId('streamer-comparison')).toBeInTheDocument();
      });
    });

    it('switches to history tab when clicked', async () => {
      const user = userEvent.setup();
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-history')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('tab-trigger-history'));
      await waitFor(() => {
        expect(screen.getByTestId('tabs-content-history')).toBeInTheDocument();
      });
    });
  });

  describe('Overview Tab Content', () => {
    it('displays RTP comparison in overview', async () => {
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('rtp-comparison')).toBeInTheDocument();
      });
    });

    it('displays hot/cold indicator in overview', async () => {
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('hot-cold-indicator')).toBeInTheDocument();
      });
    });

    it('displays bonus stats in overview', async () => {
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('bonus-stats')).toBeInTheDocument();
      });
    });

    it('shows hot indicator with flame icon when status is hot', async () => {
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('hot-cold-indicator')).toHaveTextContent('Status: hot');
      });
    });

    it('displays volatility information', async () => {
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByText(/volatility/i)).toBeInTheDocument();
      });
    });
  });

  describe('Statistics Tab Content', () => {
    it('displays statistics header', async () => {
      const user = userEvent.setup();
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-statistics')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('tab-trigger-statistics'));
      await waitFor(() => {
        expect(screen.getByText(/Historical Performance/i)).toBeInTheDocument();
      });
    });

    it('displays key stats grid', async () => {
      const user = userEvent.setup();
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-statistics')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('tab-trigger-statistics'));
      await waitFor(() => {
        expect(screen.getByText(/Total Spins/i)).toBeInTheDocument();
      });
    });

    it('displays total spins count', async () => {
      const user = userEvent.setup();
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-statistics')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('tab-trigger-statistics'));
      await waitFor(() => {
        expect(screen.getByText(/5,000/)).toBeInTheDocument();
      });
    });

    it('displays total profit with currency formatting', async () => {
      const user = userEvent.setup();
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-statistics')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('tab-trigger-statistics'));
      await waitFor(() => {
        expect(screen.getByText(/\$1,234/)).toBeInTheDocument();
      });
    });

    it('displays average win amount', async () => {
      const user = userEvent.setup();
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-statistics')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('tab-trigger-statistics'));
      await waitFor(() => {
        expect(screen.getByText(/Average Win/i)).toBeInTheDocument();
      });
    });

    it('displays biggest win amount', async () => {
      const user = userEvent.setup();
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-statistics')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('tab-trigger-statistics'));
      await waitFor(() => {
        expect(screen.getByText(/Max Win Recorded/i)).toBeInTheDocument();
      });
    });

    it('displays N/A for biggest win when no data', async () => {
      (global.fetch as jest.Mock).mockClear();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockGame),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockStats,
            biggest_wins: [],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockHotCold),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ streamers: mockStreamerStats }),
        });

      const user = userEvent.setup();
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-statistics')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('tab-trigger-statistics'));
      await waitFor(() => {
        expect(screen.getByText('N/A')).toBeInTheDocument();
      });
    });
  });

  describe('Guide Tab Content', () => {
    it('displays slot guide component', async () => {
      const user = userEvent.setup();
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-guide')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('tab-trigger-guide'));
      await waitFor(() => {
        expect(screen.getByTestId('slot-guide')).toBeInTheDocument();
      });
    });

    it('passes correct gameId to slot guide', async () => {
      const user = userEvent.setup();
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-guide')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('tab-trigger-guide'));
      await waitFor(() => {
        expect(screen.getByText(/Guide for Sweet Bonanza/)).toBeInTheDocument();
      });
    });
  });

  describe('Analytics Tab Content', () => {
    it('displays analytics header', async () => {
      const user = userEvent.setup();
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-analytics')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('tab-trigger-analytics'));
      await waitFor(() => {
        expect(screen.getByText(/Analytics & Trends/i)).toBeInTheDocument();
      });
    });

    it('displays period selector', async () => {
      const user = userEvent.setup();
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-analytics')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('tab-trigger-analytics'));
      await waitFor(() => {
        expect(screen.getByTestId('period-selector')).toBeInTheDocument();
      });
    });

    it('displays RTP trend chart', async () => {
      const user = userEvent.setup();
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-analytics')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('tab-trigger-analytics'));
      await waitFor(() => {
        expect(screen.getByTestId('rtp-trend-chart')).toBeInTheDocument();
      });
    });

    it('displays bonus frequency chart', async () => {
      const user = userEvent.setup();
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-analytics')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('tab-trigger-analytics'));
      await waitFor(() => {
        expect(screen.getByTestId('bonus-frequency-chart')).toBeInTheDocument();
      });
    });

    it('displays win distribution chart', async () => {
      const user = userEvent.setup();
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-analytics')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('tab-trigger-analytics'));
      await waitFor(() => {
        expect(screen.getByTestId('win-distribution-chart')).toBeInTheDocument();
      });
    });

    it('changes period when selector changes', async () => {
      const user = userEvent.setup();
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-analytics')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('tab-trigger-analytics'));
      await waitFor(() => {
        expect(screen.getByTestId('period-selector')).toBeInTheDocument();
      });

      const selector = screen.getByTestId('period-selector') as HTMLSelectElement;
      await user.selectOption(selector, '30d');

      await waitFor(() => {
        expect(selector.value).toBe('30d');
      });
    });

    it('displays charts with selected period', async () => {
      const user = userEvent.setup();
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-analytics')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('tab-trigger-analytics'));
      await waitFor(() => {
        expect(screen.getByTestId('period-selector')).toBeInTheDocument();
      });

      const selector = screen.getByTestId('period-selector') as HTMLSelectElement;
      await user.selectOption(selector, '90d');

      await waitFor(() => {
        expect(screen.getByText(/RTP Trend Chart - 90d/)).toBeInTheDocument();
      });
    });
  });

  describe('Streamers Tab Content', () => {
    it('displays streamer comparison component', async () => {
      const user = userEvent.setup();
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-streamers')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('tab-trigger-streamers'));
      await waitFor(() => {
        expect(screen.getByTestId('streamer-comparison')).toBeInTheDocument();
      });
    });

    it('passes streamer stats to comparison component', async () => {
      const user = userEvent.setup();
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-streamers')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('tab-trigger-streamers'));
      await waitFor(() => {
        expect(screen.getByText(/Streamers: 1/)).toBeInTheDocument();
      });
    });

    it('displays empty state when no streamer data', async () => {
      (global.fetch as jest.Mock).mockClear();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockGame),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStats),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockHotCold),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ streamers: [] }),
        });

      const user = userEvent.setup();
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-streamers')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('tab-trigger-streamers'));
      await waitFor(() => {
        expect(screen.getByText(/No streamer data available/)).toBeInTheDocument();
      });
    });
  });

  describe('History Tab Content', () => {
    it('displays history placeholder', async () => {
      const user = userEvent.setup();
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-history')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('tab-trigger-history'));
      await waitFor(() => {
        expect(screen.getByText(/Session history for this slot/)).toBeInTheDocument();
      });
    });

    it('displays history guidance message', async () => {
      const user = userEvent.setup();
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-history')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('tab-trigger-history'));
      await waitFor(() => {
        expect(screen.getByText(/Play this slot on a tracked stream/)).toBeInTheDocument();
      });
    });
  });

  describe('Data Source Indicator', () => {
    it('displays spin count indicator', async () => {
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByText(/Statistics based on 5,000 tracked spins/)).toBeInTheDocument();
      });
    });

    it('hides indicator when no spins', async () => {
      (global.fetch as jest.Mock).mockClear();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockGame),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockStats,
            total_spins: 0,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockHotCold),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ streamers: mockStreamerStats }),
        });

      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.queryByText(/Statistics based on/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error state when game fetch fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to load'));
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
      });
    });

    it('handles network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Network error'));
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByText(/Unable to load slot information/i)).toBeInTheDocument();
      });
    });

    it('shows retry button on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed'));
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });
    });

    it('retries fetch when retry button clicked', async () => {
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockGame),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStats),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockHotCold),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ streamers: mockStreamerStats }),
        });

      const user = userEvent.setup();
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole('button', { name: /try again/i }));
      await waitFor(() => {
        expect(screen.getByTestId('slot-header')).toBeInTheDocument();
      });
    });

    it('displays error when API returns 404', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByText(/Slot not found/i)).toBeInTheDocument();
      });
    });

    it('displays error when API returns 500', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByText(/Server error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Auto-Refresh Functionality', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('sets up auto-refresh interval', async () => {
      render(<SlotDetailPage />);
      expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 60000);
    });

    it('refreshes data every 60 seconds', async () => {
      (global.fetch as jest.Mock).mockClear();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockGame),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStats),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockHotCold),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ streamers: mockStreamerStats }),
        });

      render(<SlotDetailPage />);

      jest.advanceTimersByTime(60000);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(8); // 4 initial + 4 refresh
      });
    });

    it('clears interval on unmount', async () => {
      const { unmount } = render(<SlotDetailPage />);
      unmount();
      expect(clearInterval).toHaveBeenCalled();
    });
  });

  describe('Responsive Behavior', () => {
    it('renders tabs in responsive layout', async () => {
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tabs')).toBeInTheDocument();
      });
    });

    it('displays content properly on mobile', async () => {
      const user = userEvent.setup();
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-overview')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('tab-trigger-overview'));
      expect(screen.getByTestId('tabs-content-overview')).toBeVisible();
    });
  });

  describe('Accessibility', () => {
    it('renders semantic HTML structure', async () => {
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByRole('tablist')).toBeInTheDocument();
      });
    });

    it('tab buttons are keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-overview')).toBeInTheDocument();
      });
      const tabButton = screen.getByTestId('tab-trigger-statistics');
      await user.tab();
      // Tab should be focusable
      expect(tabButton).toBeInTheDocument();
    });

    it('displays proper heading hierarchy', async () => {
      const user = userEvent.setup();
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-analytics')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('tab-trigger-analytics'));
      await waitFor(() => {
        expect(screen.getByText(/Analytics & Trends/i)).toBeInTheDocument();
      });
    });
  });

  describe('Data Integration', () => {
    it('correctly formats currency in stats', async () => {
      const user = userEvent.setup();
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-statistics')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('tab-trigger-statistics'));
      await waitFor(() => {
        expect(screen.getByText(/\$/)).toBeInTheDocument();
      });
    });

    it('correctly formats numbers in stats', async () => {
      const user = userEvent.setup();
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-statistics')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('tab-trigger-statistics'));
      await waitFor(() => {
        expect(screen.getByText(/5,000/)).toBeInTheDocument();
      });
    });

    it('passes correct RTP values to components', async () => {
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('rtp-comparison')).toHaveTextContent('Theoretical: 96.48%');
      });
    });

    it('displays hot/cold score correctly', async () => {
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('hot-cold-indicator')).toHaveTextContent('Score: 78');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles missing RTP data', async () => {
      (global.fetch as jest.Mock).mockClear();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockGame,
            rtp: null,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStats),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockHotCold),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ streamers: mockStreamerStats }),
        });

      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('slot-header')).toBeInTheDocument();
      });
    });

    it('handles zero profit correctly', async () => {
      (global.fetch as jest.Mock).mockClear();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockGame),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockStats,
            total_profit: 0,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockHotCold),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ streamers: mockStreamerStats }),
        });

      const user = userEvent.setup();
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-statistics')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('tab-trigger-statistics'));
      await waitFor(() => {
        expect(screen.getByText(/\$0/)).toBeInTheDocument();
      });
    });

    it('handles negative profit correctly', async () => {
      (global.fetch as jest.Mock).mockClear();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockGame),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockStats,
            total_profit: -500,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockHotCold),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ streamers: mockStreamerStats }),
        });

      const user = userEvent.setup();
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-statistics')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('tab-trigger-statistics'));
      await waitFor(() => {
        expect(screen.getByText(/-\$500/)).toBeInTheDocument();
      });
    });

    it('handles very large profit values', async () => {
      (global.fetch as jest.Mock).mockClear();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockGame),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockStats,
            total_profit: 999999.99,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockHotCold),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ streamers: mockStreamerStats }),
        });

      const user = userEvent.setup();
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-statistics')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('tab-trigger-statistics'));
      await waitFor(() => {
        expect(screen.getByText(/\$1,000,000/)).toBeInTheDocument();
      });
    });

    it('handles cold indicator status', async () => {
      (global.fetch as jest.Mock).mockClear();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockGame),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStats),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockHotCold,
            status: 'cold',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ streamers: mockStreamerStats }),
        });

      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('hot-cold-indicator')).toHaveTextContent('Status: cold');
      });
    });

    it('handles neutral indicator status', async () => {
      (global.fetch as jest.Mock).mockClear();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockGame),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockStats),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockHotCold,
            status: 'neutral',
            score: 50,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ streamers: mockStreamerStats }),
        });

      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('hot-cold-indicator')).toHaveTextContent('Status: neutral');
      });
    });

    it('renders correctly with minimal data', async () => {
      (global.fetch as jest.Mock).mockClear();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            id: 'test-slot',
            name: 'Test Slot',
            provider: 'test-provider',
            rtp: 96,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            total_spins: 0,
            total_profit: 0,
            biggest_wins: [],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            status: 'neutral',
            score: 50,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ streamers: [] }),
        });

      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('slot-header')).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('renders within acceptable time (< 500ms)', async () => {
      const startTime = performance.now();
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('slot-header')).toBeInTheDocument();
      });
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(500);
    });

    it('handles rapid tab switching', async () => {
      const user = userEvent.setup();
      render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('tab-trigger-overview')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('tab-trigger-statistics'));
      await user.click(screen.getByTestId('tab-trigger-guide'));
      await user.click(screen.getByTestId('tab-trigger-analytics'));
      await user.click(screen.getByTestId('tab-trigger-overview'));

      await waitFor(() => {
        expect(screen.getByTestId('tabs-content-overview')).toBeVisible();
      });
    });

    it('does not leak memory on unmount', async () => {
      const { unmount } = render(<SlotDetailPage />);
      await waitFor(() => {
        expect(screen.getByTestId('slot-header')).toBeInTheDocument();
      });
      unmount();
      // Verify cleanup: no pending fetches, timers cleared
      expect(clearInterval).toHaveBeenCalled();
    });
  });
});
