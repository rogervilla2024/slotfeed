import type {
  Streamer,
  Game,
  Session,
  LiveStreamData,
  BigWin,
  HotColdIndicator,
  LeaderboardEntry
} from '@/types';

// Use Next.js API routes first, fallback to FastAPI backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000/api/v1';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, `API error: ${response.statusText}`);
  }

  return response.json();
}

// Streamers API
export const streamersApi = {
  list: async (params?: {
    platform?: string;
    isLive?: boolean;
    limit?: number;
    offset?: number
  }): Promise<Streamer[]> => {
    // Fetch from FastAPI backend via proxy
    const searchParams = new URLSearchParams();
    if (params?.platform) searchParams.set('platform', params.platform);
    if (params?.isLive !== undefined) searchParams.set('is_live', String(params.isLive));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('skip', String(params.offset));

    const query = searchParams.toString();
    const response = await fetch(`/api/v1/streamers/${query ? `?${query}` : ''}`);
    if (!response.ok) {
      throw new ApiError(response.status, 'Failed to fetch streamers');
    }
    const data = await response.json();
    return data.streamers || data;
  },

  get: async (id: string): Promise<Streamer> => {
    // Fetch from FastAPI backend via proxy
    const response = await fetch(`/api/v1/streamers/${id}`);
    if (!response.ok) {
      throw new ApiError(response.status, 'Streamer not found');
    }
    return response.json();
  },

  getStats: async (id: string): Promise<Streamer['lifetimeStats']> => {
    const streamer = await streamersApi.get(id);
    return streamer.lifetimeStats;
  },
};

// Games API
export const gamesApi = {
  list: async (params?: {
    providerId?: string;
    volatility?: string;
    limit?: number;
    offset?: number
  }): Promise<Game[]> => {
    const searchParams = new URLSearchParams();
    if (params?.providerId) searchParams.set('provider_id', params.providerId);
    if (params?.volatility) searchParams.set('volatility', params.volatility);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));

    const query = searchParams.toString();
    return fetchApi<Game[]>(`/games${query ? `?${query}` : ''}`);
  },

  get: async (id: string): Promise<Game> => {
    return fetchApi<Game>(`/games/${id}`);
  },
};

// Live Streams API
export const liveApi = {
  getStreams: async (): Promise<LiveStreamData[]> => {
    // Fetch from FastAPI backend via proxy
    const response = await fetch('/api/v1/live/streams');
    if (!response.ok) {
      throw new ApiError(response.status, 'Failed to fetch live streams');
    }
    const data = await response.json();
    return data.streams || data;
  },

  getStream: async (sessionId: string): Promise<LiveStreamData> => {
    return fetchApi<LiveStreamData>(`/live/streams/${sessionId}`);
  },

  getHotColdSlots: async (): Promise<HotColdIndicator[]> => {
    return fetchApi<HotColdIndicator[]>('/live/hot-cold');
  },
};

// Big Wins API
export const bigWinsApi = {
  list: async (params?: {
    streamerId?: string;
    gameId?: string;
    minMultiplier?: number;
    period?: 'day' | 'week' | 'month' | 'all';
    limit?: number;
    offset?: number;
  }): Promise<BigWin[]> => {
    const searchParams = new URLSearchParams();
    if (params?.streamerId) searchParams.set('streamer_id', params.streamerId);
    if (params?.gameId) searchParams.set('game_id', params.gameId);
    if (params?.minMultiplier) searchParams.set('min_multiplier', String(params.minMultiplier));
    if (params?.period) searchParams.set('period', params.period);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));

    const query = searchParams.toString();
    return fetchApi<BigWin[]>(`/big-wins${query ? `?${query}` : ''}`);
  },

  getRecent: async (limit: number = 10): Promise<BigWin[]> => {
    return fetchApi<BigWin[]>(`/big-wins/recent?limit=${limit}`);
  },
};

// Sessions API
export const sessionsApi = {
  list: async (params?: {
    streamerId?: string;
    status?: 'live' | 'ended';
    limit?: number;
    offset?: number;
  }): Promise<Session[]> => {
    const searchParams = new URLSearchParams();
    if (params?.streamerId) searchParams.set('streamer_id', params.streamerId);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));

    const query = searchParams.toString();
    return fetchApi<Session[]>(`/sessions${query ? `?${query}` : ''}`);
  },

  get: async (id: string): Promise<Session> => {
    return fetchApi<Session>(`/sessions/${id}`);
  },
};

// Leaderboards API
export const leaderboardsApi = {
  get: async (params: {
    category: 'biggest_win' | 'best_rtp' | 'most_wagered' | 'most_active';
    period: 'daily' | 'weekly' | 'monthly' | 'all_time';
    limit?: number;
  }): Promise<LeaderboardEntry[]> => {
    const searchParams = new URLSearchParams();
    searchParams.set('category', params.category);
    searchParams.set('period', params.period);
    if (params.limit) searchParams.set('limit', String(params.limit));

    return fetchApi<LeaderboardEntry[]>(`/leaderboards?${searchParams.toString()}`);
  },
};

// Export all APIs
export const api = {
  streamers: streamersApi,
  games: gamesApi,
  live: liveApi,
  bigWins: bigWinsApi,
  sessions: sessionsApi,
  leaderboards: leaderboardsApi,
};

export default api;
