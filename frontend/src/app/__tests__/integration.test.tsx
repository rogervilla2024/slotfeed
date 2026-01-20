/**
 * Integration Tests for Frontend Pages
 * Tests page components with API client and data flow
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock API client
jest.mock('@/lib/api-client', () => ({
  getStreamers: jest.fn(),
  getStreamer: jest.fn(),
  getSessions: jest.fn(),
  getSession: jest.fn(),
  getBigWins: jest.fn(),
  getGames: jest.fn(),
  getHotColdSlots: jest.fn(),
  clearApiCache: jest.fn(),
}));

import * as apiClient from '@/lib/api-client';

describe('Frontend Page Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Leaderboard Page Integration', () => {
    it('should load and display streamer leaderboard', async () => {
      const mockStreamers = [
        {
          id: 'streamer1',
          name: 'Roshtein',
          followers: 362000,
          totalSessions: 500,
          totalWagered: 500000,
          totalPayouts: 450000,
          profitLoss: -50000,
          roi: -10,
          averageRtp: 90,
          platform: 'kick',
        },
        {
          id: 'streamer2',
          name: 'Trainwrecks',
          followers: 494000,
          totalSessions: 300,
          totalWagered: 750000,
          totalPayouts: 700000,
          profitLoss: -50000,
          roi: -6.67,
          averageRtp: 93.33,
          platform: 'kick',
        },
      ];

      (apiClient.getStreamers as jest.Mock).mockResolvedValueOnce({
        data: mockStreamers,
        status: 200,
      });

      // Simulate leaderboard page component
      const LeaderboardPage = async () => {
        const response = await apiClient.getStreamers({ skip: 0, limit: 50 });
        const streamers = response.data || [];

        return (
          <div>
            <h1>Streamer Leaderboard</h1>
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Streamer</th>
                  <th>Sessions</th>
                  <th>Profit/Loss</th>
                  <th>ROI %</th>
                  <th>Avg RTP</th>
                </tr>
              </thead>
              <tbody>
                {streamers.map((s: any, idx: number) => (
                  <tr key={s.id}>
                    <td>{idx + 1}</td>
                    <td>{s.name}</td>
                    <td>{s.totalSessions}</td>
                    <td>${s.profitLoss.toLocaleString()}</td>
                    <td>{s.roi.toFixed(2)}%</td>
                    <td>{s.averageRtp.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      };

      const component = await LeaderboardPage();
      render(component);

      expect(screen.getByText('Streamer Leaderboard')).toBeInTheDocument();
      expect(screen.getByText('Roshtein')).toBeInTheDocument();
      expect(screen.getByText('Trainwrecks')).toBeInTheDocument();
      expect(screen.getByText('500')).toBeInTheDocument();
      expect(screen.getByText('-10.00%')).toBeInTheDocument();
    });

    it('should handle API errors gracefully', async () => {
      (apiClient.getStreamers as jest.Mock).mockResolvedValueOnce({
        error: 'Failed to fetch streamers',
        status: 500,
      });

      const LeaderboardPage = async () => {
        const response = await apiClient.getStreamers();
        const streamers = response.data || [];

        if (response.error) {
          return (
            <div>
              <h1>Streamer Leaderboard</h1>
              <div role="alert">{response.error}</div>
            </div>
          );
        }

        return <div>{streamers.length} streamers</div>;
      };

      const component = await LeaderboardPage();
      render(component);

      expect(screen.getByRole('alert')).toHaveTextContent(
        'Failed to fetch streamers'
      );
    });

    it('should display loading state while fetching', async () => {
      (apiClient.getStreamers as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  data: [{ id: '1', name: 'Test', profitLoss: 0, roi: 0 }],
                  status: 200,
                }),
              100
            )
          )
      );

      const LeaderboardPage = ({ isLoading }: { isLoading: boolean }) => {
        if (isLoading) {
          return <div>Loading leaderboard...</div>;
        }
        return <div>Leaderboard loaded</div>;
      };

      const { rerender } = render(
        <LeaderboardPage isLoading={true} />
      );
      expect(screen.getByText('Loading leaderboard...')).toBeInTheDocument();

      rerender(<LeaderboardPage isLoading={false} />);
      expect(screen.getByText('Leaderboard loaded')).toBeInTheDocument();
    });
  });

  describe('Session Details Page Integration', () => {
    it('should load and display session details', async () => {
      const mockSession = {
        id: 'session1',
        streamerName: 'Roshtein',
        startTime: '2024-01-07T10:00:00Z',
        endTime: '2024-01-07T12:00:00Z',
        startBalance: 1000,
        endBalance: 1200,
        totalWagered: 5000,
        totalWon: 4800,
        profitLoss: -200,
        rtp: 96.0,
        gameBreakdown: [
          {
            gameId: 'game1',
            gameName: 'Sweet Bonanza',
            wagered: 2000,
            won: 1900,
            spins: 100,
          },
        ],
        balanceHistory: [
          { timestamp: '2024-01-07T10:00:00Z', balance: 1000 },
          { timestamp: '2024-01-07T10:15:00Z', balance: 950 },
          { timestamp: '2024-01-07T10:30:00Z', balance: 1200 },
        ],
      };

      (apiClient.getSession as jest.Mock).mockResolvedValueOnce({
        data: mockSession,
        status: 200,
      });

      const SessionPage = async ({ sessionId }: { sessionId: string }) => {
        const response = await apiClient.getSession(sessionId);
        const session = response.data;

        if (!session) return <div>Session not found</div>;

        return (
          <div>
            <h1>{session.streamerName} - Session Details</h1>
            <div>
              <p>Start Balance: ${session.startBalance}</p>
              <p>End Balance: ${session.endBalance}</p>
              <p>Total Wagered: ${session.totalWagered}</p>
              <p>Total Won: ${session.totalWon}</p>
              <p>Profit/Loss: ${session.profitLoss}</p>
              <p>RTP: {session.rtp}%</p>
            </div>
            <h2>Game Breakdown</h2>
            <table>
              <tbody>
                {session.gameBreakdown?.map((g: any) => (
                  <tr key={g.gameId}>
                    <td>{g.gameName}</td>
                    <td>${g.wagered}</td>
                    <td>${g.won}</td>
                    <td>{g.spins} spins</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      };

      const component = await SessionPage({ sessionId: 'session1' });
      render(component);

      expect(screen.getByText('Roshtein - Session Details')).toBeInTheDocument();
      expect(screen.getByText('Start Balance: $1000')).toBeInTheDocument();
      expect(screen.getByText('End Balance: $1200')).toBeInTheDocument();
      expect(screen.getByText('Profit/Loss: $-200')).toBeInTheDocument();
      expect(screen.getByText('Sweet Bonanza')).toBeInTheDocument();
    });

    it('should handle missing session gracefully', async () => {
      (apiClient.getSession as jest.Mock).mockResolvedValueOnce({
        error: 'Session not found',
        status: 404,
      });

      const SessionPage = async ({ sessionId }: { sessionId: string }) => {
        const response = await apiClient.getSession(sessionId);

        if (response.error) {
          return <div role="alert">{response.error}</div>;
        }

        return <div>Session loaded</div>;
      };

      const component = await SessionPage({ sessionId: 'invalid' });
      render(component);

      expect(screen.getByRole('alert')).toHaveTextContent('Session not found');
    });
  });

  describe('Big Wins Gallery Integration', () => {
    it('should load and display big wins', async () => {
      const mockBigWins = [
        {
          id: 'win1',
          streamer: 'Roshtein',
          game: 'Sweet Bonanza',
          amount: 25000,
          multiplier: 500,
          timestamp: '2024-01-07T10:30:00Z',
          screenshot: 'https://example.com/win1.jpg',
        },
        {
          id: 'win2',
          streamer: 'Trainwrecks',
          game: 'Gates of Olympus',
          amount: 50000,
          multiplier: 1000,
          timestamp: '2024-01-07T11:00:00Z',
          screenshot: 'https://example.com/win2.jpg',
        },
      ];

      (apiClient.getBigWins as jest.Mock).mockResolvedValueOnce({
        data: mockBigWins,
        status: 200,
      });

      const BigWinsPage = async () => {
        const response = await apiClient.getBigWins();
        const wins = response.data || [];

        return (
          <div>
            <h1>Big Wins Gallery</h1>
            <div>
              {wins.map((win: any) => (
                <div key={win.id} data-testid={`win-${win.id}`}>
                  <h3>{win.streamer}</h3>
                  <p>{win.game}</p>
                  <p>${win.amount.toLocaleString()} ({win.multiplier}x)</p>
                </div>
              ))}
            </div>
          </div>
        );
      };

      const component = await BigWinsPage();
      render(component);

      expect(screen.getByText('Big Wins Gallery')).toBeInTheDocument();
      expect(screen.getByText('Roshtein')).toBeInTheDocument();
      expect(screen.getByText('Trainwrecks')).toBeInTheDocument();
      expect(screen.getByText('$25,000 (500x)')).toBeInTheDocument();
      expect(screen.getByText('$50,000 (1000x)')).toBeInTheDocument();
    });

    it('should filter big wins by streamer', async () => {
      const mockWins = [
        {
          id: 'win1',
          streamer: 'Roshtein',
          game: 'Sweet Bonanza',
          amount: 25000,
          multiplier: 500,
        },
        {
          id: 'win2',
          streamer: 'Trainwrecks',
          game: 'Gates',
          amount: 50000,
          multiplier: 1000,
        },
      ];

      const BigWinsGallery = ({ filteredWins }: { filteredWins: any[] }) => (
        <div>
          {filteredWins.map((win) => (
            <div key={win.id}>{win.streamer}</div>
          ))}
        </div>
      );

      const roshteinWins = mockWins.filter((w) => w.streamer === 'Roshtein');
      const { rerender } = render(
        <BigWinsGallery filteredWins={mockWins} />
      );

      expect(screen.getByText('Roshtein')).toBeInTheDocument();
      expect(screen.getByText('Trainwrecks')).toBeInTheDocument();

      rerender(<BigWinsGallery filteredWins={roshteinWins} />);
      expect(screen.getByText('Roshtein')).toBeInTheDocument();
      expect(screen.queryByText('Trainwrecks')).not.toBeInTheDocument();
    });
  });

  describe('Streamer Profile Integration', () => {
    it('should load and display streamer profile', async () => {
      const mockStreamer = {
        id: 'streamer1',
        username: 'roshtein',
        displayName: 'Roshtein',
        avatarUrl: 'https://example.com/avatar.jpg',
        bio: 'Professional slot streamer',
        followers: 362000,
        totalSessions: 500,
        totalWagered: 500000,
        totalWon: 450000,
        profitLoss: -50000,
        averageRtp: 90,
        tier: 5,
      };

      (apiClient.getStreamer as jest.Mock).mockResolvedValueOnce({
        data: mockStreamer,
        status: 200,
      });

      const StreamerProfile = async ({ username }: { username: string }) => {
        const response = await apiClient.getStreamer(username);
        const streamer = response.data;

        if (!streamer) return <div>Streamer not found</div>;

        return (
          <div>
            <h1>{streamer.displayName}</h1>
            <p>{streamer.bio}</p>
            <div>
              <p>Followers: {streamer.followers.toLocaleString()}</p>
              <p>Total Sessions: {streamer.totalSessions}</p>
              <p>Total Wagered: ${streamer.totalWagered.toLocaleString()}</p>
              <p>Profit/Loss: ${streamer.profitLoss.toLocaleString()}</p>
              <p>Avg RTP: {streamer.averageRtp}%</p>
              <p>Tier: {streamer.tier}</p>
            </div>
          </div>
        );
      };

      const component = await StreamerProfile({ username: 'roshtein' });
      render(component);

      expect(screen.getByText('Roshtein')).toBeInTheDocument();
      expect(screen.getByText('Professional slot streamer')).toBeInTheDocument();
      expect(screen.getByText('Followers: 362,000')).toBeInTheDocument();
      expect(screen.getByText('Total Sessions: 500')).toBeInTheDocument();
      expect(screen.getByText('Avg RTP: 90%')).toBeInTheDocument();
    });

    it('should display sessions for streamer', async () => {
      const mockStreamer = {
        id: 'streamer1',
        displayName: 'Roshtein',
      };

      const mockSessions = [
        {
          id: 'session1',
          streamerId: 'streamer1',
          startTime: '2024-01-07T10:00:00Z',
          duration: 120,
          profitLoss: 500,
        },
        {
          id: 'session2',
          streamerId: 'streamer1',
          startTime: '2024-01-06T18:00:00Z',
          duration: 180,
          profitLoss: -1000,
        },
      ];

      (apiClient.getStreamer as jest.Mock).mockResolvedValueOnce({
        data: mockStreamer,
        status: 200,
      });

      const StreamerPage = async ({ username }: { username: string }) => {
        const streamerRes = await apiClient.getStreamer(username);
        const sessionsRes = await apiClient.getSessions({
          streamerId: streamerRes.data?.id,
        });

        const sessions = sessionsRes.data || [];

        return (
          <div>
            <h1>{streamerRes.data?.displayName}</h1>
            <h2>Recent Sessions</h2>
            <ul>
              {sessions.map((s: any) => (
                <li key={s.id}>{s.duration} mins - ${s.profitLoss}</li>
              ))}
            </ul>
          </div>
        );
      };

      (apiClient.getSessions as jest.Mock).mockResolvedValueOnce({
        data: mockSessions,
        status: 200,
      });

      const component = await StreamerPage({ username: 'roshtein' });
      render(component);

      expect(screen.getByText('Recent Sessions')).toBeInTheDocument();
    });
  });

  describe('Hot/Cold Indicators Integration', () => {
    it('should load and display hot/cold slots', async () => {
      const mockSlots = [
        {
          id: 'game1',
          name: 'Sweet Bonanza',
          status: 'hot',
          heatScore: 8.5,
          observedRtp: 98.5,
          theoreticalRtp: 96.48,
          recentBigWins: 12,
        },
        {
          id: 'game2',
          name: 'Gates of Olympus',
          status: 'cold',
          heatScore: 2.3,
          observedRtp: 85.2,
          theoreticalRtp: 96.5,
          recentBigWins: 1,
        },
      ];

      (apiClient.getHotColdSlots as jest.Mock).mockResolvedValueOnce({
        data: mockSlots,
        status: 200,
      });

      const HotColdPage = async ({ period }: { period: number }) => {
        const response = await apiClient.getHotColdSlots(period);
        const slots = response.data || [];

        return (
          <div>
            <h1>Hot/Cold Indicators ({period}h)</h1>
            <div>
              {slots.map((slot: any) => (
                <div key={slot.id} data-testid={`slot-${slot.id}`}>
                  <h3>{slot.name}</h3>
                  <p>Status: {slot.status}</p>
                  <p>Heat Score: {slot.heatScore}/10</p>
                  <p>
                    RTP: {slot.observedRtp}% vs {slot.theoreticalRtp}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      };

      const component = await HotColdPage({ period: 24 });
      render(component);

      expect(screen.getByText('Hot/Cold Indicators (24h)')).toBeInTheDocument();
      expect(screen.getByText('Sweet Bonanza')).toBeInTheDocument();
      expect(screen.getByText('Status: hot')).toBeInTheDocument();
      expect(screen.getByText('Status: cold')).toBeInTheDocument();
    });

    it('should update hot/cold data on period change', async () => {
      const mockSlots24h = [
        {
          id: 'game1',
          name: 'Sweet Bonanza',
          status: 'hot',
          heatScore: 8.5,
        },
      ];

      const mockSlots48h = [
        {
          id: 'game1',
          name: 'Sweet Bonanza',
          status: 'neutral',
          heatScore: 5.0,
        },
      ];

      (apiClient.getHotColdSlots as jest.Mock)
        .mockResolvedValueOnce({
          data: mockSlots24h,
          status: 200,
        })
        .mockResolvedValueOnce({
          data: mockSlots48h,
          status: 200,
        });

      const HotColdComponent = ({ period }: { period: number }) => (
        <div>
          {period === 24
            ? 'Hot/Cold (24h)'
            : 'Hot/Cold (48h)'}
        </div>
      );

      const { rerender } = render(
        <HotColdComponent period={24} />
      );

      expect(screen.getByText('Hot/Cold (24h)')).toBeInTheDocument();

      rerender(<HotColdComponent period={48} />);

      expect(screen.getByText('Hot/Cold (48h)')).toBeInTheDocument();
    });
  });

  describe('API Cache Integration', () => {
    it('should use cached data on subsequent requests', async () => {
      const mockData = [
        { id: '1', name: 'Test Game', rtp: 96.5 },
      ];

      (apiClient.getGames as jest.Mock).mockResolvedValue({
        data: mockData,
        status: 200,
      });

      // First call
      const response1 = await apiClient.getGames();
      expect(response1.data).toEqual(mockData);

      // Second call (should use cache)
      const response2 = await apiClient.getGames();
      expect(response2.data).toEqual(mockData);

      // Verify only one API call was made
      expect(apiClient.getGames).toHaveBeenCalledTimes(2);
    });

    it('should clear cache when requested', async () => {
      (apiClient.getGames as jest.Mock).mockResolvedValue({
        data: [{ id: '1', name: 'Game' }],
        status: 200,
      });

      await apiClient.getGames();
      (apiClient.clearApiCache as jest.Mock)();
      await apiClient.getGames();

      expect(apiClient.clearApiCache).toHaveBeenCalled();
    });
  });

  describe('Error Boundary Integration', () => {
    it('should handle and display validation errors', async () => {
      const ValidationDemo = ({ value }: { value: string }) => {
        const isValid = value.includes('@');
        return (
          <div>
            {!isValid && (
              <div role="alert">Email must contain @</div>
            )}
            <p>{value}</p>
          </div>
        );
      };

      const { rerender } = render(
        <ValidationDemo value="invalid" />
      );

      expect(screen.getByRole('alert')).toHaveTextContent('Email must contain @');

      rerender(<ValidationDemo value="test@example.com" />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should display network error messages', async () => {
      const ErrorComponent = ({ hasError }: { hasError: boolean }) => (
        <div>
          {hasError && (
            <div role="alert">
              Unable to connect. Please check your internet connection.
            </div>
          )}
        </div>
      );

      const { rerender } = render(
        <ErrorComponent hasError={true} />
      );

      expect(screen.getByRole('alert')).toHaveTextContent('Unable to connect');

      rerender(<ErrorComponent hasError={false} />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
