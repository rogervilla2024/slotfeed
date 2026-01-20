/**
 * Real-time RTP Live Hook
 * Provides live RTP tracking with polling
 */

import { useCallback, useEffect, useState } from 'react';

export interface RTPTrackerEntry {
  gameId: string;
  gameName: string;
  streamerName: string;
  currentRtp: number;
  theoreticalRtp: number;
  status: 'hot' | 'cold' | 'neutral';
  trend: 'up' | 'down' | 'stable';
  sparkline: number[];
  lastUpdated: string;
  viewers?: number;
}

interface UseLiveRTPOptions {
  limit?: number;
  refreshInterval?: number;
  enableWebSocket?: boolean;
}

/**
 * Hook for RTP tracking with polling
 */
export function useLiveRTP({
  limit = 10,
  refreshInterval = 30000,
  enableWebSocket = false,
}: UseLiveRTPOptions) {
  const [entries, setEntries] = useState<RTPTrackerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsStatus] = useState<'connected' | 'disconnected'>('disconnected');

  // Fetch RTP data from API
  const fetchRTPData = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`/api/v1/live/rtp-tracker?limit=${limit}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const entries = (Array.isArray(data) ? data : data.entries || []) as RTPTrackerEntry[];

      setEntries(entries);
      setLoading(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch RTP data';
      setError(message);
      setLoading(false);
    }
  }, [limit]);

  // Initial fetch
  useEffect(() => {
    fetchRTPData();
  }, [fetchRTPData]);

  // Polling
  useEffect(() => {
    const interval = setInterval(fetchRTPData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchRTPData, refreshInterval]);

  return {
    entries,
    loading,
    error,
    wsStatus,
    isLive: false,
    refresh: fetchRTPData,
  };
}

export function getRTPColor(current: number, theoretical: number): string {
  const diff = current - theoretical;
  if (diff > 2) return 'text-win';
  if (diff < -2) return 'text-loss';
  return 'text-foreground';
}

export function getTrendIndicator(trend: 'up' | 'down' | 'stable'): {
  emoji: string;
  label: string;
  color: string;
} {
  switch (trend) {
    case 'up':
      return { emoji: '', label: 'Increasing', color: 'text-win' };
    case 'down':
      return { emoji: '', label: 'Decreasing', color: 'text-loss' };
    case 'stable':
      return { emoji: '', label: 'Stable', color: 'text-muted-foreground' };
    default:
      return { emoji: '', label: 'Unknown', color: 'text-muted-foreground' };
  }
}

export function formatRTP(rtp: number): string {
  return `${rtp.toFixed(2)}%`;
}

export function calculateRTPVariance(current: number, theoretical: number): {
  variance: number;
  isHot: boolean;
  isCold: boolean;
  label: string;
} {
  const variance = current - theoretical;
  const isHot = variance > 2;
  const isCold = variance < -2;

  let label = 'Neutral';
  if (isHot) label = 'Above Average';
  else if (isCold) label = 'Below Average';

  return {
    variance: parseFloat(variance.toFixed(2)),
    isHot,
    isCold,
    label,
  };
}
