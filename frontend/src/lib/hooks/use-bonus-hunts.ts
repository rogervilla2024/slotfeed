'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLiveUpdates } from '@/lib/websocket';

export interface BonusHuntFilters {
  streamer_id?: string;
  status?: 'collecting' | 'opening' | 'completed' | 'cancelled';
  page?: number;
  limit?: number;
}

export interface BonusHunt {
  id: string;
  streamer_id: string;
  streamer_name: string;
  game_id: string;
  game_name: string;
  status: 'collecting' | 'opening' | 'completed' | 'cancelled';
  total_cost: number;
  total_payout: number;
  total_profit: number;
  roi_percent: number;
  entry_count: number;
  opened_count: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface BonusHuntsResponse {
  items: BonusHunt[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

interface UseBonusHuntsState {
  data: BonusHunt[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  hasMore: boolean;
}

/**
 * Hook to fetch bonus hunts from API
 * Supports filtering, pagination, and real-time updates
 *
 * @example
 * const { data, loading, error, total } = useBonusHunts({
 *   status: 'opening',
 *   page: 1,
 *   limit: 20
 * });
 */
export function useBonusHunts(filters: BonusHuntFilters = {}) {
  const {
    streamer_id,
    status,
    page = 1,
    limit = 20,
  } = filters;

  const [state, setState] = useState<UseBonusHuntsState>({
    data: [],
    loading: true,
    error: null,
    total: 0,
    page,
    hasMore: true,
  });

  // Fetch bonus hunts from API
  const fetchBonusHunts = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const params = new URLSearchParams();
      if (streamer_id) params.append('streamer_id', streamer_id);
      if (status) params.append('status', status);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await fetch(`/api/v1/bonus-hunts?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch bonus hunts: ${response.statusText}`);
      }

      const result: BonusHuntsResponse = await response.json();

      setState((prev) => ({
        ...prev,
        data: result.items,
        total: result.total,
        page: result.page,
        hasMore: result.hasMore,
        loading: false,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
      console.error('Failed to fetch bonus hunts:', err);
    }
  }, [streamer_id, status, page, limit]);

  // Initial fetch
  useEffect(() => {
    fetchBonusHunts();
  }, [fetchBonusHunts]);

  // Handle real-time updates via WebSocket
  const handleWSMessage = useCallback((message: any) => {
    // Update specific hunt when bonus opened
    if (message.type === 'bonus_hunt_entry_opened') {
      setState((prev) => ({
        ...prev,
        data: prev.data.map((hunt) =>
          hunt.id === message.data.bonus_hunt_id
            ? {
              ...hunt,
              opened_count: (hunt.opened_count || 0) + 1,
              total_profit: message.data.total_profit,
              roi_percent: message.data.roi_percent,
              updated_at: new Date().toISOString(),
            }
            : hunt
        ),
      }));
    }

    // Update when bonus hunt is completed
    if (message.type === 'bonus_hunt_completed') {
      setState((prev) => ({
        ...prev,
        data: prev.data.map((hunt) =>
          hunt.id === message.data.bonus_hunt_id
            ? {
              ...hunt,
              status: 'completed',
              total_profit: message.data.total_profit,
              roi_percent: message.data.roi_percent,
              completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
            : hunt
        ),
      }));
    }

    // Add new bonus hunt when created
    if (message.type === 'bonus_hunt_created') {
      setState((prev) => ({
        ...prev,
        data: [message.data, ...prev.data].slice(0, prev.data.length),
      }));
    }
  }, []);

  useLiveUpdates(handleWSMessage);

  // Refetch function for manual refresh
  const refetch = useCallback(() => {
    fetchBonusHunts();
  }, [fetchBonusHunts]);

  // Update page and refetch
  const setPage = useCallback((newPage: number) => {
    setState((prev) => ({ ...prev, page: newPage }));
  }, []);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    total: state.total,
    page: state.page,
    hasMore: state.hasMore,
    refetch,
    setPage,
  };
}

/**
 * Hook to fetch a single bonus hunt by ID
 */
export function useBonusHunt(bonusHuntId: string) {
  const [state, setState] = useState<{
    data: BonusHunt | null;
    loading: boolean;
    error: string | null;
  }>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchBonusHunt = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(`/api/v1/bonus-hunts/${bonusHuntId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch bonus hunt: ${response.statusText}`);
      }

      const data: BonusHunt = await response.json();
      setState((prev) => ({ ...prev, data, loading: false }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setState((prev) => ({ ...prev, error: errorMessage, loading: false }));
      console.error('Failed to fetch bonus hunt:', err);
    }
  }, [bonusHuntId]);

  // Initial fetch
  useEffect(() => {
    if (bonusHuntId) {
      fetchBonusHunt();
    }
  }, [bonusHuntId, fetchBonusHunt]);

  // Handle real-time updates
  const handleWSMessage = useCallback((message: any) => {
    if (
      state.data &&
      (message.type === 'bonus_hunt_entry_opened' ||
        message.type === 'bonus_hunt_completed') &&
      message.data.bonus_hunt_id === bonusHuntId
    ) {
      // Refetch to get latest data
      fetchBonusHunt();
    }
  }, [bonusHuntId, state.data, fetchBonusHunt]);

  useLiveUpdates(handleWSMessage);

  const refetch = useCallback(() => {
    fetchBonusHunt();
  }, [fetchBonusHunt]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refetch,
  };
}

/**
 * Hook for mutations (create, update, delete bonus hunts)
 */
export function useBonusHuntMutation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBonusHunt = useCallback(
    async (streakerId: string, gameId: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/v1/bonus-hunts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ streaker_id: streakerId, game_id: gameId }),
        });

        if (!response.ok) throw new Error('Failed to create bonus hunt');

        const data = await response.json();
        return data;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const completeBonusHunt = useCallback(async (bonusHuntId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/bonus-hunts/${bonusHuntId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to complete bonus hunt');

      const data = await response.json();
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const openBonusEntry = useCallback(
    async (bonusHuntId: string, entryId: string, result: {
      payout: number;
      multiplier: number;
    }) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/v1/bonus-hunts/${bonusHuntId}/entries/${entryId}/open`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result),
          }
        );

        if (!response.ok) throw new Error('Failed to open bonus entry');

        const data = await response.json();
        return data;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    createBonusHunt,
    completeBonusHunt,
    openBonusEntry,
    loading,
    error,
  };
}
