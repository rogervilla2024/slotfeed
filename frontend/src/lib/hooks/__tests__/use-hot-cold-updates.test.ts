/**
 * Tests for useHotColdUpdates hook
 * Tests real-time hot/cold slot updates
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useHotColdUpdates, getTrendText, getTrendEmoji } from '../use-hot-cold-updates';

// Mock fetch
const mockFetch = global.fetch as jest.Mock;

// Mock useWebSocket
jest.mock('../../websocket', () => ({
  useWebSocket: jest.fn(() => ({
    status: 'disconnected',
  })),
}));

describe('useHotColdUpdates', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Hook initialization', () => {
    it('should initialize with loading state', () => {
      mockFetch.mockImplementationOnce(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() =>
        useHotColdUpdates({ gameId: 'test-game', enableWebSocket: false })
      );

      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBeNull();
    });

    it('should fetch hot/cold data on mount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          score: {
            status: 'hot',
            score: 25,
            metrics: {
              observed_rtp: 97.5,
              theoretical_rtp: 96.48,
              recent_big_wins: 3,
              avg_big_wins: 2,
            },
            last_updated: new Date().toISOString(),
          },
        }),
      });

      const { result } = renderHook(() =>
        useHotColdUpdates({ gameId: 'test-game', enableWebSocket: false })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).not.toBeNull();
      expect(result.current.data?.status).toBe('hot');
      expect(result.current.data?.score).toBe(25);
    });

    it('should not fetch without gameId', () => {
      const { result } = renderHook(() =>
        useHotColdUpdates({ gameId: undefined, enableWebSocket: false })
      );

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.current.data).toBeNull();
    });
  });

  describe('Data transformation', () => {
    it('should transform API response correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          score: {
            status: 'cold',
            score: -30,
            metrics: {
              observed_rtp: 95.0,
              theoretical_rtp: 96.48,
              recent_big_wins: 1,
              avg_big_wins: 2,
            },
            last_updated: new Date().toISOString(),
          },
        }),
      });

      const { result } = renderHook(() =>
        useHotColdUpdates({ gameId: 'test-game', enableWebSocket: false })
      );

      await waitFor(() => {
        expect(result.current.data).not.toBeNull();
      });

      const data = result.current.data!;
      expect(data.status).toBe('cold');
      expect(data.score).toBe(-30);
      expect(data.trend).toBe('declining');
      expect(data.observedRtp).toBe(95.0);
    });

    it('should detect improving trend', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          score: {
            status: 'hot',
            score: 30,
            metrics: {
              observed_rtp: 98.0,
              theoretical_rtp: 96.48,
              recent_big_wins: 5,
              avg_big_wins: 2,
            },
            last_updated: new Date().toISOString(),
          },
        }),
      });

      const { result } = renderHook(() =>
        useHotColdUpdates({ gameId: 'test-game', enableWebSocket: false })
      );

      await waitFor(() => {
        expect(result.current.data).not.toBeNull();
      });

      expect(result.current.data?.trend).toBe('improving');
    });

    it('should detect stable trend', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          score: {
            status: 'neutral',
            score: 0,
            metrics: {
              observed_rtp: 96.48,
              theoretical_rtp: 96.48,
              recent_big_wins: 2,
              avg_big_wins: 2,
            },
            last_updated: new Date().toISOString(),
          },
        }),
      });

      const { result } = renderHook(() =>
        useHotColdUpdates({ gameId: 'test-game', enableWebSocket: false })
      );

      await waitFor(() => {
        expect(result.current.data).not.toBeNull();
      });

      expect(result.current.data?.trend).toBe('stable');
    });
  });

  describe('Error handling', () => {
    it('should handle fetch errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() =>
        useHotColdUpdates({ gameId: 'test-game', enableWebSocket: false })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toContain('Network error');
      expect(result.current.data).toBeNull();
    });

    it('should handle non-OK responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const { result } = renderHook(() =>
        useHotColdUpdates({ gameId: 'nonexistent', enableWebSocket: false })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Refresh functionality', () => {
    it('should allow manual refresh', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          score: {
            status: 'neutral',
            score: 0,
            metrics: {
              observed_rtp: 96.48,
              theoretical_rtp: 96.48,
              recent_big_wins: 0,
              avg_big_wins: 0,
            },
            last_updated: new Date().toISOString(),
          },
        }),
      });

      const { result } = renderHook(() =>
        useHotColdUpdates({ gameId: 'test-game', enableWebSocket: false })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.refresh();

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});

describe('Utility functions', () => {
  it('should get correct trend text', () => {
    expect(getTrendText('improving')).toBe('Getting Hotter 📈');
    expect(getTrendText('declining')).toBe('Getting Colder 📉');
    expect(getTrendText('stable')).toBe('Staying Stable ⚖️');
  });

  it('should get correct trend emoji', () => {
    expect(getTrendEmoji('improving')).toBe('📈');
    expect(getTrendEmoji('declining')).toBe('📉');
    expect(getTrendEmoji('stable')).toBe('⚖️');
  });
});
