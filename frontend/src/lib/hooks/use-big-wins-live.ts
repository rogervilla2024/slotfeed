/**
 * Real-time Big Wins Live Hook
 * Provides live big win notifications via WebSocket
 */

import { useCallback, useEffect, useState } from 'react';
import { useWebSocket } from '../websocket';

export interface BigWinUpdate {
  id: string;
  streamerName: string;
  gameName: string;
  amount: number;
  multiplier: number;
  timestamp: string;
  platform?: string;
  tier: 'big' | 'mega' | 'ultra' | 'legendary';
}

interface UseBigWinsLiveOptions {
  onNewWin?: (win: BigWinUpdate) => void;
  onError?: (error: string) => void;
  enableWebSocket?: boolean;
}

/**
 * Hook for real-time big win notifications
 */
export function useBigWinsLive({
  onNewWin,
  onError,
  enableWebSocket = true,
}: UseBigWinsLiveOptions) {
  const [recentWins, setRecentWins] = useState<BigWinUpdate[]>([]);
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [winCount, setWinCount] = useState(0);

  // Handle WebSocket messages
  const handleMessage = useCallback(
    (message: any) => {
      if (message.type === 'big_win_notification') {
        const win = message.data as BigWinUpdate;

        // Add to recent wins
        setRecentWins((prev) => [win, ...prev].slice(0, 100));
        setWinCount((prev) => prev + 1);

        // Trigger callback
        onNewWin?.(win);
      }
    },
    [onNewWin]
  );

  // WebSocket connection
  const { status: wsConnectionStatus } = useWebSocket({
    url: `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'}/api/v1/ws/big-wins`,
    channels: ['all'],
    onMessage: handleMessage,
    onConnect: () => {
      setWsStatus('connected');
      // Fetch recent wins on connection
      fetchRecentWins();
    },
    onDisconnect: () => setWsStatus('disconnected'),
    onError: () => {
      setWsStatus('disconnected');
      onError?.('Failed to connect to big wins stream');
    },
  });

  // Fetch recent big wins
  const fetchRecentWins = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/live/big-wins?limit=50&sort=recent');

      if (!response.ok) {
        throw new Error('Failed to fetch big wins');
      }

      const data = await response.json();
      const wins = (Array.isArray(data) ? data : data.wins || []).map((w: any) => ({
        id: w.id,
        streamerName: w.streamer_name || w.streamerName,
        gameName: w.game_name || w.gameName,
        amount: w.amount || 0,
        multiplier: w.multiplier || 1,
        timestamp: w.created_at || w.timestamp || new Date().toISOString(),
        platform: w.platform,
        tier: getTierFromMultiplier(w.multiplier || 1),
      }));

      setRecentWins(wins);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch big wins';
      onError?.(message);
    }
  }, [onError]);

  // Initial fetch
  useEffect(() => {
    if (!enableWebSocket) {
      // Polling fallback
      fetchRecentWins();
      const interval = setInterval(fetchRecentWins, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [enableWebSocket, fetchRecentWins]);

  return {
    recentWins,
    wsStatus,
    isLive: wsStatus === 'connected' && enableWebSocket,
    winCount,
    refresh: fetchRecentWins,
  };
}

/**
 * Hook for win tier badge
 */
export interface WinTierConfig {
  tier: 'big' | 'mega' | 'ultra' | 'legendary';
  label: string;
  emoji: string;
  bgColor: string;
  textColor: string;
}

export function getWinTierConfig(tier: 'big' | 'mega' | 'ultra' | 'legendary'): WinTierConfig {
  const configs: Record<string, WinTierConfig> = {
    big: {
      tier: 'big',
      label: 'BIG WIN',
      emoji: '🎉',
      bgColor: 'bg-yellow-500/20',
      textColor: 'text-yellow-600 dark:text-yellow-400',
    },
    mega: {
      tier: 'mega',
      label: 'MEGA WIN',
      emoji: '💥',
      bgColor: 'bg-orange-500/20',
      textColor: 'text-orange-600 dark:text-orange-400',
    },
    ultra: {
      tier: 'ultra',
      label: 'ULTRA WIN',
      emoji: '⚡',
      bgColor: 'bg-red-500/20',
      textColor: 'text-red-600 dark:text-red-400',
    },
    legendary: {
      tier: 'legendary',
      label: 'LEGENDARY WIN',
      emoji: '👑',
      bgColor: 'bg-purple-500/20',
      textColor: 'text-purple-600 dark:text-purple-400',
    },
  };

  return configs[tier] || configs.big;
}

/**
 * Determine tier from multiplier
 */
export function getTierFromMultiplier(multiplier: number): 'big' | 'mega' | 'ultra' | 'legendary' {
  if (multiplier >= 1000) return 'legendary';
  if (multiplier >= 500) return 'ultra';
  if (multiplier >= 100) return 'mega';
  return 'big';
}

/**
 * Format win amount
 */
export function formatWinAmount(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(2)}K`;
  }
  return `$${amount.toFixed(2)}`;
}

/**
 * Format multiplier
 */
export function formatMultiplier(multiplier: number): string {
  return `${multiplier.toFixed(1)}x`;
}
