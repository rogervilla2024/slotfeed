/**
 * Tests for useBigWinsLive hook
 * Tests real-time big win notifications
 */

import { renderHook, waitFor } from '@testing-library/react';
import {
  useBigWinsLive,
  getWinTierConfig,
  getTierFromMultiplier,
  formatWinAmount,
  formatMultiplier,
} from '../use-big-wins-live';

// Mock fetch
const mockFetch = global.fetch as jest.Mock;

// Mock useWebSocket
jest.mock('../../websocket', () => ({
  useWebSocket: jest.fn(({ onMessage, onConnect }) => {
    // Simulate connection
    setTimeout(() => onConnect?.(), 0);
    return { status: 'connected' };
  }),
}));

describe('useBigWinsLive', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Hook initialization', () => {
    it('should initialize with empty wins', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          wins: [],
        }),
      });

      const { result } = renderHook(() =>
        useBigWinsLive({ enableWebSocket: false })
      );

      await waitFor(() => {
        expect(result.current.recentWins).toBeDefined();
      });

      expect(Array.isArray(result.current.recentWins)).toBe(true);
    });

    it('should fetch recent big wins on connection', async () => {
      const mockWins = [
        {
          id: '1',
          streamer_name: 'TestStreamer',
          game_name: 'Sweet Bonanza',
          amount: 1000,
          multiplier: 100,
          created_at: new Date().toISOString(),
          platform: 'kick',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          wins: mockWins,
        }),
      });

      const { result } = renderHook(() =>
        useBigWinsLive({ enableWebSocket: true })
      );

      await waitFor(() => {
        expect(result.current.recentWins.length).toBeGreaterThan(0);
      });

      expect(result.current.recentWins[0].streamerName).toBe('TestStreamer');
    });
  });

  describe('Win data transformation', () => {
    it('should map API response to hook data format', async () => {
      const mockWins = [
        {
          id: 'win-123',
          streamer_name: 'Roshtein',
          game_name: 'Gates of Olympus',
          amount: 2500,
          multiplier: 250,
          created_at: '2026-01-08T12:00:00Z',
          platform: 'kick',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockWins,
      });

      const { result } = renderHook(() =>
        useBigWinsLive({ enableWebSocket: false })
      );

      await waitFor(() => {
        expect(result.current.recentWins.length).toBeGreaterThan(0);
      });

      const win = result.current.recentWins[0];
      expect(win.id).toBe('win-123');
      expect(win.streamerName).toBe('Roshtein');
      expect(win.gameName).toBe('Gates of Olympus');
      expect(win.tier).toBe('mega');
    });

    it('should assign correct tier based on multiplier', async () => {
      const wins = [
        {
          id: '1',
          streamer_name: 'Test',
          game_name: 'Test',
          amount: 100,
          multiplier: 50,
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          streamer_name: 'Test',
          game_name: 'Test',
          amount: 100,
          multiplier: 150,
          created_at: new Date().toISOString(),
        },
        {
          id: '3',
          streamer_name: 'Test',
          game_name: 'Test',
          amount: 100,
          multiplier: 600,
          created_at: new Date().toISOString(),
        },
        {
          id: '4',
          streamer_name: 'Test',
          game_name: 'Test',
          amount: 100,
          multiplier: 2000,
          created_at: new Date().toISOString(),
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => wins,
      });

      const { result } = renderHook(() =>
        useBigWinsLive({ enableWebSocket: false })
      );

      await waitFor(() => {
        expect(result.current.recentWins.length).toBe(4);
      });

      expect(result.current.recentWins[3].tier).toBe('big');
      expect(result.current.recentWins[2].tier).toBe('mega');
      expect(result.current.recentWins[1].tier).toBe('ultra');
      expect(result.current.recentWins[0].tier).toBe('legendary');
    });
  });

  describe('Error handling', () => {
    it('should handle fetch errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const onError = jest.fn();
      const { result } = renderHook(() =>
        useBigWinsLive({ onError, enableWebSocket: false })
      );

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });

      expect(onError).toHaveBeenCalledWith(expect.stringContaining('Network error'));
    });

    it('should handle non-OK responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const onError = jest.fn();
      const { result } = renderHook(() =>
        useBigWinsLive({ onError, enableWebSocket: false })
      );

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });
    });
  });

  describe('Win count tracking', () => {
    it('should track total win count', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          {
            id: '1',
            streamer_name: 'Test',
            game_name: 'Test',
            amount: 100,
            multiplier: 100,
            created_at: new Date().toISOString(),
          },
        ]),
      });

      const { result } = renderHook(() =>
        useBigWinsLive({ enableWebSocket: false })
      );

      await waitFor(() => {
        expect(result.current.recentWins.length).toBeGreaterThan(0);
      });

      expect(result.current.winCount).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('Tier configuration', () => {
  it('should return correct config for big tier', () => {
    const config = getWinTierConfig('big');
    expect(config.label).toBe('BIG WIN');
    expect(config.emoji).toBe('🎉');
  });

  it('should return correct config for mega tier', () => {
    const config = getWinTierConfig('mega');
    expect(config.label).toBe('MEGA WIN');
    expect(config.emoji).toBe('💥');
  });

  it('should return correct config for ultra tier', () => {
    const config = getWinTierConfig('ultra');
    expect(config.label).toBe('ULTRA WIN');
    expect(config.emoji).toBe('⚡');
  });

  it('should return correct config for legendary tier', () => {
    const config = getWinTierConfig('legendary');
    expect(config.label).toBe('LEGENDARY WIN');
    expect(config.emoji).toBe('👑');
  });
});

describe('Utility functions', () => {
  it('should determine tier from multiplier', () => {
    expect(getTierFromMultiplier(50)).toBe('big');
    expect(getTierFromMultiplier(100)).toBe('mega');
    expect(getTierFromMultiplier(500)).toBe('ultra');
    expect(getTierFromMultiplier(1000)).toBe('legendary');
  });

  it('should format win amount', () => {
    expect(formatWinAmount(100)).toBe('$100.00');
    expect(formatWinAmount(5000)).toBe('$5.00K');
    expect(formatWinAmount(1500000)).toBe('$1.50M');
  });

  it('should format multiplier', () => {
    expect(formatMultiplier(100)).toBe('100.0x');
    expect(formatMultiplier(250.5)).toBe('250.5x');
    expect(formatMultiplier(1000)).toBe('1000.0x');
  });
});
