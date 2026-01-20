/**
 * Real-time Hot/Cold Updates Hook
 * Provides real-time hot/cold slot status with polling
 */

import { useEffect, useState, useCallback } from 'react';

export interface HotColdData {
  gameId: string;
  status: 'hot' | 'neutral' | 'cold';
  score: number;
  trend: 'improving' | 'declining' | 'stable';
  observedRtp: number;
  theoreticalRtp: number;
  recentBigWins: number;
  avgBigWins: number;
  lastUpdated: Date;
}

interface UseHotColdUpdatesOptions {
  gameId?: string;
  pollInterval?: number;
  enableWebSocket?: boolean;
}

/**
 * Hook for hot/cold updates with polling
 */
export function useHotColdUpdates({
  gameId,
  pollInterval = 300000, // 5 minutes default
  enableWebSocket = false,
}: UseHotColdUpdatesOptions) {
  const [data, setData] = useState<HotColdData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsStatus] = useState<'connected' | 'disconnected'>('disconnected');

  // Fetch hot/cold data from API
  const fetchHotColdData = useCallback(async () => {
    if (!gameId) return;

    try {
      setError(null);
      const response = await fetch(`/api/v1/hot-cold/games/${gameId}?period_hours=24`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const rawData = await response.json();

      const hotColdScore = rawData.score || {
        status: 'neutral',
        score: 0,
        metrics: {
          observed_rtp: 96,
          theoretical_rtp: 96,
          recent_big_wins: 0,
          avg_big_wins: 0,
        },
        last_updated: new Date().toISOString(),
      };

      const trend: 'improving' | 'declining' | 'stable' =
        hotColdScore.score > 20 ? 'improving' : hotColdScore.score < -20 ? 'declining' : 'stable';

      setData({
        gameId,
        status: hotColdScore.status || 'neutral',
        score: hotColdScore.score || 0,
        trend,
        observedRtp: hotColdScore.metrics?.observed_rtp || 96,
        theoreticalRtp: hotColdScore.metrics?.theoretical_rtp || 96,
        recentBigWins: hotColdScore.metrics?.recent_big_wins || 0,
        avgBigWins: hotColdScore.metrics?.avg_big_wins || 0,
        lastUpdated: new Date(hotColdScore.last_updated || new Date().toISOString()),
      });

      setLoading(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch hot/cold data';
      setError(message);
      setLoading(false);
    }
  }, [gameId]);

  // Initial fetch
  useEffect(() => {
    fetchHotColdData();
  }, [fetchHotColdData]);

  // Polling
  useEffect(() => {
    const interval = setInterval(fetchHotColdData, pollInterval);
    return () => clearInterval(interval);
  }, [fetchHotColdData, pollInterval]);

  return {
    data,
    loading,
    error,
    wsStatus,
    isLive: false,
    refresh: fetchHotColdData,
  };
}

export function getTrendText(trend: 'improving' | 'declining' | 'stable'): string {
  switch (trend) {
    case 'improving':
      return 'Getting Hotter';
    case 'declining':
      return 'Getting Colder';
    case 'stable':
      return 'Staying Stable';
    default:
      return 'Unknown';
  }
}

export function getTrendEmoji(trend: 'improving' | 'declining' | 'stable'): string {
  return '';
}
