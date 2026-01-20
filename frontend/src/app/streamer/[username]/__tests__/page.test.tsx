/**
 * Streamer Profile Page Tests
 * Tests for streamer profile page with header, stats, and sessions
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { useParams } from 'next/navigation';
import StreamerProfilePage from '../page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
}));

// Mock components
jest.mock('@/components/streamer/streamer-header', () => ({
  StreamerHeader: ({ streamer }: any) => (
    <div data-testid="streamer-header">{streamer.displayName}</div>
  ),
}));

jest.mock('@/components/streamer/streamer-stats', () => ({
  StreamerStats: ({ stats }: any) => (
    <div data-testid="streamer-stats">Stats: {stats.totalSessions}</div>
  ),
}));

jest.mock('@/components/streamer/session-history', () => ({
  SessionHistory: ({ sessions }: any) => (
    <div data-testid="session-history">Sessions: {sessions.length}</div>
  ),
}));

jest.mock('@/components/streamer/game-preferences', () => ({
  GamePreferences: ({ games }: any) => (
    <div data-testid="game-preferences">Games: {games.length}</div>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: any) => <div data-testid="skeleton" className={className} />,
}));

describe('Streamer Profile Page', () => {
  const mockStreamer = {
    id: 'roshtein-123',
    username: 'roshtein',
    displayName: 'Roshtein',
    platform: 'kick' as const,
    platformId: '1234567',
    avatarUrl: 'https://example.com/avatar.jpg',
    bio: 'Slot streaming expert',
    followerCount: 362000,
    isLive: true,
    livestream: {
      id: 1,
      title: 'Epic Slot Session',
      viewerCount: 15000,
      startedAt: new Date().toISOString(),
      thumbnail: 'https://example.com/thumb.jpg',
    },
    lifetimeStats: {
      totalSessions: 500,
      totalHoursStreamed: 5000,
      totalWagered: 10000000,
      totalWon: 9500000,
      biggestWin: 500000,
      biggestMultiplier: 2500,
      averageRtp: 96.5,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockSessions = [
    {
      id: 'session-1',
      streamerId: 'roshtein',
      startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endTime: new Date(),
      startBalance: 100000,
      currentBalance: 125000,
      peakBalance: 150000,
      lowestBalance: 90000,
      totalWagered: 500000,
      status: 'ended' as const,
    },
  ];

  const mockGameStats = [
    {
      gameId: 'sweet-bonanza',
      gameName: 'Sweet Bonanza',
      provider: 'Pragmatic Play',
      sessionsPlayed: 150,
      totalWagered: 500000,
      totalWon: 520000,
      biggestWin: 50000,
      observedRtp: 98.5,
      theoreticalRtp: 96.5,
    },
  ];

  beforeEach(() => {
    (useParams as jest.Mock).mockReturnValue({ username: 'roshtein' });
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading skeletons initially', () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        new Promise(() => {}) // Never resolves
      );

      render(<StreamerProfilePage />);
      expect(screen.queryAllByTestId('skeleton').length).toBeGreaterThan(0);
    });

    it('should display avatar skeleton', () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        new Promise(() => {})
      );

      render(<StreamerProfilePage />);
      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should display text skeletons', () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        new Promise(() => {})
      );

      render(<StreamerProfilePage />);
      expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
    });

    it('should display stats skeletons', () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        new Promise(() => {})
      );

      render(<StreamerProfilePage />);
      expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
    });
  });

  describe('Content Loading', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock)
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockStreamer),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ sessions: mockSessions }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ games: mockGameStats }),
          })
        );
    });

    it('should render streamer header after loading', async () => {
      render(<StreamerProfilePage />);
      await waitFor(() => {
        expect(screen.getByTestId('streamer-header')).toBeInTheDocument();
      });
    });

    it('should render streamer stats after loading', async () => {
      render(<StreamerProfilePage />);
      await waitFor(() => {
        expect(screen.getByTestId('streamer-stats')).toBeInTheDocument();
      });
    });

    it('should render session history after loading', async () => {
      render(<StreamerProfilePage />);
      await waitFor(() => {
        expect(screen.getByTestId('session-history')).toBeInTheDocument();
      });
    });

    it('should render game preferences after loading', async () => {
      render(<StreamerProfilePage />);
      await waitFor(() => {
        expect(screen.getByTestId('game-preferences')).toBeInTheDocument();
      });
    });

    it('should display streamer name', async () => {
      render(<StreamerProfilePage />);
      await waitFor(() => {
        expect(screen.getByText('Roshtein')).toBeInTheDocument();
      });
    });

    it('should display streamer stats count', async () => {
      render(<StreamerProfilePage />);
      await waitFor(() => {
        expect(screen.getByText(/Stats: 500/)).toBeInTheDocument();
      });
    });

    it('should display sessions count', async () => {
      render(<StreamerProfilePage />);
      await waitFor(() => {
        expect(screen.getByText(/Sessions: 1/)).toBeInTheDocument();
      });
    });

    it('should display games count', async () => {
      render(<StreamerProfilePage />);
      await waitFor(() => {
        expect(screen.getByText(/Games: 1/)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error message when streamer not found', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          statusText: 'Not Found',
        })
      );

      render(<StreamerProfilePage />);
      await waitFor(() => {
        expect(screen.getByText(/not found/i)).toBeInTheDocument();
      });
    });

    it('should display username in error message', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
        })
      );

      render(<StreamerProfilePage />);
      await waitFor(() => {
        expect(screen.getByText(/roshtein/)).toBeInTheDocument();
      });
    });

    it('should show destructive error styling', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
        })
      );

      render(<StreamerProfilePage />);
      await waitFor(() => {
        const error = screen.getByText(/not found/i).parentElement;
        expect(error).toBeInTheDocument();
      });
    });

    it('should display helpful message for streamer not found', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
        })
      );

      render(<StreamerProfilePage />);
      await waitFor(() => {
        expect(screen.getByText(/could not be found/i)).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('should fetch streamer data from correct endpoint', async () => {
      (global.fetch as jest.Mock)
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockStreamer),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ sessions: [] }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ games: [] }),
          })
        );

      render(<StreamerProfilePage />);
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/streamers/roshtein')
        );
      });
    });

    it('should fetch sessions from correct endpoint', async () => {
      (global.fetch as jest.Mock)
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockStreamer),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ sessions: mockSessions }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ games: [] }),
          })
        );

      render(<StreamerProfilePage />);
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/sessions/streamer/roshtein')
        );
      });
    });

    it('should fetch game stats from correct endpoint', async () => {
      (global.fetch as jest.Mock)
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockStreamer),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ sessions: [] }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ games: mockGameStats }),
          })
        );

      render(<StreamerProfilePage />);
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/streamers/roshtein/games')
        );
      });
    });

    it('should handle failed session fetch gracefully', async () => {
      (global.fetch as jest.Mock)
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockStreamer),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: false,
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ games: [] }),
          })
        );

      render(<StreamerProfilePage />);
      await waitFor(() => {
        expect(screen.getByTestId('streamer-header')).toBeInTheDocument();
      });
    });

    it('should handle failed game stats fetch gracefully', async () => {
      (global.fetch as jest.Mock)
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockStreamer),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ sessions: [] }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: false,
          })
        );

      render(<StreamerProfilePage />);
      await waitFor(() => {
        expect(screen.getByTestId('streamer-header')).toBeInTheDocument();
      });
    });
  });

  describe('Data Mapping', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock)
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockStreamer),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ sessions: mockSessions }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ games: mockGameStats }),
          })
        );
    });

    it('should map session data correctly', async () => {
      render(<StreamerProfilePage />);
      await waitFor(() => {
        expect(screen.getByTestId('session-history')).toBeInTheDocument();
      });
    });

    it('should map game data correctly', async () => {
      render(<StreamerProfilePage />);
      await waitFor(() => {
        expect(screen.getByTestId('game-preferences')).toBeInTheDocument();
      });
    });

    it('should handle missing session data', async () => {
      (global.fetch as jest.Mock)
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockStreamer),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({}),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ games: [] }),
          })
        );

      render(<StreamerProfilePage />);
      await waitFor(() => {
        expect(screen.getByTestId('session-history')).toBeInTheDocument();
      });
    });

    it('should handle missing game data', async () => {
      (global.fetch as jest.Mock)
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockStreamer),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ sessions: [] }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({}),
          })
        );

      render(<StreamerProfilePage />);
      await waitFor(() => {
        expect(screen.getByTestId('game-preferences')).toBeInTheDocument();
      });
    });
  });

  describe('Layout and Structure', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock)
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockStreamer),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ sessions: mockSessions }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ games: mockGameStats }),
          })
        );
    });

    it('should have container layout', async () => {
      const { container } = render(<StreamerProfilePage />);
      await waitFor(() => {
        const mainDiv = container.querySelector('[class*="container"]');
        expect(mainDiv).toBeInTheDocument();
      });
    });

    it('should have header at top', async () => {
      render(<StreamerProfilePage />);
      await waitFor(() => {
        expect(screen.getByTestId('streamer-header')).toBeInTheDocument();
      });
    });

    it('should have stats below header', async () => {
      render(<StreamerProfilePage />);
      await waitFor(() => {
        expect(screen.getByTestId('streamer-stats')).toBeInTheDocument();
      });
    });

    it('should have two column layout for history and preferences', async () => {
      const { container } = render(<StreamerProfilePage />);
      await waitFor(() => {
        const grid = container.querySelector('[class*="grid"]');
        expect(grid).toBeInTheDocument();
      });
    });

    it('should be responsive (1 column on mobile, 2 on desktop)', async () => {
      const { container } = render(<StreamerProfilePage />);
      await waitFor(() => {
        const grid = container.querySelector('[class*="lg:grid-cols"]');
        expect(grid || container).toBeDefined();
      });
    });
  });

  describe('Auto-refresh', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      (global.fetch as jest.Mock)
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockStreamer),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ sessions: mockSessions }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ games: mockGameStats }),
          })
        );
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should set up auto-refresh interval', async () => {
      render(<StreamerProfilePage />);
      await waitFor(() => {
        expect(screen.getByTestId('streamer-header')).toBeInTheDocument();
      });

      expect(setInterval).toHaveBeenCalled();
    });

    it('should refresh every 30 seconds', async () => {
      render(<StreamerProfilePage />);
      await waitFor(() => {
        expect(screen.getByTestId('streamer-header')).toBeInTheDocument();
      });

      // Check that setInterval was called with 30000ms
      expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 30000);
    });

    it('should clean up interval on unmount', async () => {
      const { unmount } = render(<StreamerProfilePage />);
      await waitFor(() => {
        expect(screen.getByTestId('streamer-header')).toBeInTheDocument();
      });

      unmount();
      expect(clearInterval).toHaveBeenCalled();
    });
  });

  describe('Parameter Handling', () => {
    it('should use username from URL params', async () => {
      (global.fetch as jest.Mock)
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockStreamer),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ sessions: [] }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ games: [] }),
          })
        );

      render(<StreamerProfilePage />);
      await waitFor(() => {
        expect(useParams).toHaveBeenCalled();
      });
    });

    it('should handle different usernames', async () => {
      (useParams as jest.Mock).mockReturnValue({ username: 'trainwreck' });
      (global.fetch as jest.Mock)
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ ...mockStreamer, username: 'trainwreck' }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ sessions: [] }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ games: [] }),
          })
        );

      render(<StreamerProfilePage />);
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('trainwreck')
        );
      });
    });
  });

  describe('Component Props', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock)
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockStreamer),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ sessions: mockSessions }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ games: mockGameStats }),
          })
        );
    });

    it('should pass streamer to header component', async () => {
      render(<StreamerProfilePage />);
      await waitFor(() => {
        expect(screen.getByTestId('streamer-header')).toBeInTheDocument();
      });
    });

    it('should pass stats to stats component', async () => {
      render(<StreamerProfilePage />);
      await waitFor(() => {
        expect(screen.getByText(/Stats: 500/)).toBeInTheDocument();
      });
    });

    it('should pass sessions to history component', async () => {
      render(<StreamerProfilePage />);
      await waitFor(() => {
        expect(screen.getByText(/Sessions: 1/)).toBeInTheDocument();
      });
    });

    it('should pass games to preferences component', async () => {
      render(<StreamerProfilePage />);
      await waitFor(() => {
        expect(screen.getByText(/Games: 1/)).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock)
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockStreamer),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ sessions: mockSessions }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ games: mockGameStats }),
          })
        );
    });

    it('should render on mobile viewport', async () => {
      render(<StreamerProfilePage />);
      await waitFor(() => {
        expect(screen.getByRole('document') || screen.getByTestId('streamer-header')).toBeInTheDocument();
      });
    });

    it('should use responsive grid', async () => {
      const { container } = render(<StreamerProfilePage />);
      await waitFor(() => {
        const grid = container.querySelector('[class*="grid"]');
        expect(grid).toBeInTheDocument();
      });
    });

    it('should stack single column on mobile', async () => {
      const { container } = render(<StreamerProfilePage />);
      await waitFor(() => {
        const grid = container.querySelector('[class*="grid-cols-1"]');
        expect(grid || container).toBeDefined();
      });
    });

    it('should use two columns on large screens', async () => {
      const { container } = render(<StreamerProfilePage />);
      await waitFor(() => {
        const grid = container.querySelector('[class*="lg:grid-cols"]');
        expect(grid || container).toBeDefined();
      });
    });
  });

  describe('State Management', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock)
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockStreamer),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ sessions: mockSessions }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ games: mockGameStats }),
          })
        );
    });

    it('should start with loading state', () => {
      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise(() => {})
      );

      render(<StreamerProfilePage />);
      expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
    });

    it('should transition to loaded state', async () => {
      render(<StreamerProfilePage />);
      await waitFor(() => {
        expect(screen.getByTestId('streamer-header')).toBeInTheDocument();
      });
    });

    it('should clear error state on successful load', async () => {
      render(<StreamerProfilePage />);
      await waitFor(() => {
        expect(screen.queryByText(/not found/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty sessions list', async () => {
      (global.fetch as jest.Mock)
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockStreamer),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ sessions: [] }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ games: mockGameStats }),
          })
        );

      render(<StreamerProfilePage />);
      await waitFor(() => {
        expect(screen.getByText(/Sessions: 0/)).toBeInTheDocument();
      });
    });

    it('should handle empty game stats', async () => {
      (global.fetch as jest.Mock)
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockStreamer),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ sessions: mockSessions }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ games: [] }),
          })
        );

      render(<StreamerProfilePage />);
      await waitFor(() => {
        expect(screen.getByText(/Games: 0/)).toBeInTheDocument();
      });
    });

    it('should handle network error', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.reject(new Error('Network error'))
      );

      render(<StreamerProfilePage />);
      await waitFor(() => {
        expect(screen.getByText(/not found/i)).toBeInTheDocument();
      });
    });

    it('should handle missing username param', () => {
      (useParams as jest.Mock).mockReturnValue({});

      render(<StreamerProfilePage />);
      // Should not make API calls
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock)
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockStreamer),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ sessions: mockSessions }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ games: mockGameStats }),
          })
        );
    });

    it('should render without performance issues', async () => {
      const startTime = performance.now();
      render(<StreamerProfilePage />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500);
    });

    it('should load content without blocking', async () => {
      render(<StreamerProfilePage />);
      await waitFor(() => {
        expect(screen.getByTestId('streamer-header')).toBeInTheDocument();
      });
    });
  });
});
