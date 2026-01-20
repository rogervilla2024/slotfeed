'use client';

import { useEffect, useState, useCallback } from 'react';

export interface HotColdData {
  gameId: string;
  status: 'hot' | 'cold' | 'neutral';
  score: number;
  metrics?: {
    observed_rtp: number;
    theoretical_rtp: number;
    recent_big_wins: number;
    avg_big_wins: number;
  };
  lastUpdated: string;
}

interface UseHotColdOptions {
  refreshInterval?: number; // ms
  enabled?: boolean;
}

/**
 * Hook to fetch and cache hot/cold data for all games
 */
export function useHotColdAll(options: UseHotColdOptions = {}) {
  const { refreshInterval = 60000, enabled = true } = options;

  const [data, setData] = useState<Map<string, HotColdData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHotCold = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/hot-cold/all');
      if (response.ok) {
        const result = await response.json();
        const map = new Map<string, HotColdData>();

        if (Array.isArray(result)) {
          result.forEach((item: HotColdData) => {
            map.set(item.gameId, item);
          });
        } else if (result.games && Array.isArray(result.games)) {
          result.games.forEach((item: HotColdData) => {
            map.set(item.gameId, item);
          });
        }

        setData(map);
      } else {
        setError('Failed to fetch hot/cold data');
      }
    } catch (err) {
      console.error('Hot/cold data fetch failed:', err);
      setError('Failed to load hot/cold data');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchHotCold();
    const interval = setInterval(fetchHotCold, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchHotCold, refreshInterval]);

  return { data, loading, error, refetch: fetchHotCold };
}

/**
 * Hook to fetch hot/cold data for a specific game
 */
export function useHotCold(gameId: string, options: UseHotColdOptions = {}) {
  const { refreshInterval = 60000, enabled = true } = options;

  const [data, setData] = useState<HotColdData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHotCold = useCallback(async () => {
    if (!enabled || !gameId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/hot-cold/games/${gameId}`);
      if (response.ok) {
        const result = await response.json();
        setData(result.score || result);
      } else {
        setData(null);
      }
    } catch (err) {
      console.error('Hot/cold data fetch failed:', err);
      setError('Failed to load hot/cold data');
    } finally {
      setLoading(false);
    }
  }, [gameId, enabled]);

  useEffect(() => {
    fetchHotCold();
    const interval = setInterval(fetchHotCold, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchHotCold, refreshInterval]);

  return { data, loading, error, refetch: fetchHotCold };
}
