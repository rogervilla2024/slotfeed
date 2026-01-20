'use client';

import { useEffect, useState, useCallback } from 'react';

export interface LiveStreamData {
  gameId: string;
  streamersCount: number;
  streamers: Array<{
    id: string;
    name: string;
    platform: string;
    viewers: number;
  }>;
  lastUpdated: string;
}

interface UseLiveStreamsOptions {
  refreshInterval?: number; // ms
  enabled?: boolean;
}

/**
 * Hook to fetch live stream data for all games
 */
export function useLiveStreamsAll(options: UseLiveStreamsOptions = {}) {
  const { refreshInterval = 30000, enabled = true } = options;

  const [data, setData] = useState<Map<string, LiveStreamData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveStreams = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/live/streams');
      if (response.ok) {
        const result = await response.json();
        const map = new Map<string, LiveStreamData>();

        if (Array.isArray(result)) {
          result.forEach((item: LiveStreamData) => {
            map.set(item.gameId, item);
          });
        } else if (result.games && Array.isArray(result.games)) {
          result.games.forEach((item: LiveStreamData) => {
            map.set(item.gameId, item);
          });
        } else if (result.streams && Array.isArray(result.streams)) {
          // Group by gameId
          const grouped = new Map<string, LiveStreamData>();
          result.streams.forEach((stream: any) => {
            if (!grouped.has(stream.game_id)) {
              grouped.set(stream.game_id, {
                gameId: stream.game_id,
                streamersCount: 0,
                streamers: [],
                lastUpdated: new Date().toISOString(),
              });
            }
            const gameData = grouped.get(stream.game_id)!;
            gameData.streamersCount += 1;
            gameData.streamers.push({
              id: stream.id,
              name: stream.streamer_name,
              platform: stream.platform,
              viewers: stream.viewers || 0,
            });
          });
          return setData(grouped);
        }

        setData(map);
      } else {
        setError('Failed to fetch live streams');
      }
    } catch (err) {
      console.error('Live streams fetch failed:', err);
      // Don't set error, just continue with empty data
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchLiveStreams();
    const interval = setInterval(fetchLiveStreams, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchLiveStreams, refreshInterval]);

  return { data, loading, error, refetch: fetchLiveStreams };
}

/**
 * Hook to fetch live stream data for a specific game
 */
export function useLiveStreams(gameId: string, options: UseLiveStreamsOptions = {}) {
  const { refreshInterval = 30000, enabled = true } = options;

  const [data, setData] = useState<LiveStreamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveStreams = useCallback(async () => {
    if (!enabled || !gameId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/live/streams?game_id=${gameId}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        setData(null);
      }
    } catch (err) {
      console.error('Live streams fetch failed:', err);
      // Don't set error, just continue with null data
    } finally {
      setLoading(false);
    }
  }, [gameId, enabled]);

  useEffect(() => {
    fetchLiveStreams();
    const interval = setInterval(fetchLiveStreams, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchLiveStreams, refreshInterval]);

  return { data, loading, error, refetch: fetchLiveStreams };
}
