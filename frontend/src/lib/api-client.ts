/**
 * API Client for SLOTFEED Backend
 * Centralized API calls with error handling and caching
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';

// Type-safe response wrapper
interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

// Cache for GET requests
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute default

/**
 * Make a fetch request with error handling
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  cacheKey?: string
): Promise<ApiResponse<T>> {
  try {
    // Check cache for GET requests
    if (options.method !== 'POST' && options.method !== 'PUT' && options.method !== 'DELETE' && cacheKey) {
      const cached = apiCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return { data: cached.data, status: 200 };
      }
    }

    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data?.detail || data?.message || 'Request failed',
        status: response.status,
      };
    }

    // Cache successful GET responses
    if (options.method !== 'POST' && options.method !== 'PUT' && options.method !== 'DELETE' && cacheKey) {
      apiCache.set(cacheKey, { data, timestamp: Date.now() });
    }

    return { data, status: response.status };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Network error',
      status: 0,
    };
  }
}

/**
 * Clear specific cache or all cache
 */
export function clearApiCache(key?: string) {
  if (key) {
    apiCache.delete(key);
  } else {
    apiCache.clear();
  }
}

// ============== STREAMERS ==============

export interface StreamerLeaderboardEntry {
  id: string;
  name: string;
  followers: number;
  totalSessions: number;
  totalWagered: number;
  totalPayouts: number;
  profitLoss: number;
  roi: number;
  averageRtp: number;
  platform: string;
}

export async function getStreamers(
  options?: { skip?: number; limit?: number; platform?: string; isLive?: boolean }
) {
  const params = new URLSearchParams();
  if (options?.skip) params.append('skip', options.skip.toString());
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.platform) params.append('platform', options.platform);
  if (options?.isLive !== undefined) params.append('is_live', options.isLive.toString());

  const endpoint = `/streamers?${params.toString()}`;
  const cacheKey = `streamers:${params.toString()}`;

  return fetchApi<StreamerLeaderboardEntry[]>(endpoint, {}, cacheKey);
}

export async function getStreamer(streamerId: string) {
  const endpoint = `/streamers/${streamerId}`;
  return fetchApi<any>(endpoint, {}, `streamer:${streamerId}`);
}

export async function getStreamerSessions(streamerId: string, skip = 0, limit = 20) {
  const endpoint = `/streamers/${streamerId}/sessions?skip=${skip}&limit=${limit}`;
  return fetchApi<any>(endpoint, {}, `streamer-sessions:${streamerId}`);
}

export async function getStreamerGames(streamerId: string, limit = 20) {
  const endpoint = `/streamers/${streamerId}/games?limit=${limit}`;
  return fetchApi<any>(endpoint, {}, `streamer-games:${streamerId}`);
}

// ============== SESSIONS ==============

export interface Session {
  id: string;
  streamerName: string;
  streamerId: string;
  platform: string;
  startTime: string;
  endTime: string;
  duration: number;
  startBalance: number;
  endBalance: number;
  peakBalance: number;
  lowestBalance: number;
  totalWagered: number;
  totalPayouts: number;
  profitLoss: number;
  roi: number;
  averageRtp: number;
  biggestWin: number;
  biggestWinMultiplier: number;
  sessionStatus: string;
  gameBreakdown: any[];
  bigWins: any[];
  balanceHistory: any[];
}

export async function getSessions(
  options?: { skip?: number; limit?: number; streamerId?: string; status?: string }
) {
  const params = new URLSearchParams();
  if (options?.skip) params.append('skip', options.skip.toString());
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.streamerId) params.append('streamer_id', options.streamerId);
  if (options?.status) params.append('status', options.status);

  const endpoint = `/sessions?${params.toString()}`;
  const cacheKey = `sessions:${params.toString()}`;

  return fetchApi<Session[]>(endpoint, {}, cacheKey);
}

export async function getSession(sessionId: string) {
  const endpoint = `/sessions/${sessionId}`;
  return fetchApi<Session>(endpoint, {}, `session:${sessionId}`);
}

export async function getSessionBalanceHistory(sessionId: string, skip = 0, limit = 100) {
  const endpoint = `/sessions/${sessionId}/balance-history?skip=${skip}&limit=${limit}`;
  return fetchApi<any>(endpoint, {}, `session-history:${sessionId}`);
}

// ============== GAMES ==============

export interface Game {
  id: string;
  name: string;
  slug: string;
  provider: string;
  rtp: number;
  volatility: string;
  maxMultiplier: number;
}

export async function getGames(
  options?: { skip?: number; limit?: number; provider?: string; search?: string }
) {
  const params = new URLSearchParams();
  if (options?.skip) params.append('skip', options.skip.toString());
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.provider) params.append('provider', options.provider);
  if (options?.search) params.append('search', options.search);

  const endpoint = `/games?${params.toString()}`;
  const cacheKey = `games:${params.toString()}`;

  return fetchApi<Game[]>(endpoint, {}, cacheKey);
}

export async function getGame(gameId: string) {
  const endpoint = `/games/${gameId}`;
  return fetchApi<Game>(endpoint, {}, `game:${gameId}`);
}

export async function getGameStats(gameId: string, period = '30d') {
  const endpoint = `/games/${gameId}/stats?period=${period}`;
  return fetchApi<any>(endpoint, {}, `game-stats:${gameId}:${period}`);
}

// ============== HOT/COLD ==============

export interface HotColdData {
  gameId: string;
  gameName: string;
  provider: string;
  status: 'hot' | 'cold' | 'neutral';
  score: number;
  recentRtp: number;
  theoreticalRtp: number;
  sampleSize: number;
  lastUpdated: string;
}

export async function getHotColdSlots(periodHours = 24) {
  const endpoint = `/hot-cold/all?period_hours=${periodHours}`;
  const cacheKey = `hot-cold:${periodHours}`;

  return fetchApi<HotColdData[]>(endpoint, {}, cacheKey);
}

// ============== LIVE ==============

export interface LiveStream {
  gameId: string;
  gameName: string;
  streamersCount: number;
  streamers: Array<{
    id: string;
    name: string;
    platform: string;
    viewers: number;
    url: string;
  }>;
  lastUpdated: string;
}

export async function getLiveStreams() {
  const endpoint = '/live/streams';
  return fetchApi<LiveStream[]>(endpoint, {}, 'live-streams');
}

export async function getBigWins(): Promise<ApiResponse<any[]>> {
  const endpoint = '/big-wins/';
  const response = await fetchApi<{ wins: any[]; total: number }>(endpoint, {}, 'big-wins');

  // Map API response to frontend expected format
  if (response.data && response.data.wins) {
    const mappedWins = response.data.wins.map((win: any) => ({
      id: win.id,
      streamerName: win.streamer?.displayName || win.streamer?.username || 'Unknown',
      gameName: win.game?.name || 'Unknown',
      amount: win.amount,
      multiplier: win.multiplier,
      timestamp: win.timestamp,
      platform: 'kick',
      videoUrl: win.clipUrl || '#',
    }));
    return { data: mappedWins, status: response.status };
  }

  return { data: [], status: response.status, error: response.error };
}

export async function getRtpTracker() {
  const endpoint = '/live/rtp-tracker';
  return fetchApi<any[]>(endpoint, {}, 'rtp-tracker');
}

// ============== BONUS HUNTS ==============

export async function getBonusHunts(
  options?: { skip?: number; limit?: number; status?: string; streamerId?: string }
) {
  const params = new URLSearchParams();
  if (options?.skip) params.append('skip', options.skip.toString());
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.status) params.append('status', options.status);
  if (options?.streamerId) params.append('streamer_id', options.streamerId);

  const endpoint = `/bonus-hunts?${params.toString()}`;
  const cacheKey = `bonus-hunts:${params.toString()}`;

  return fetchApi<any[]>(endpoint, {}, cacheKey);
}

export async function getBonusHunt(huntId: string) {
  const endpoint = `/bonus-hunts/${huntId}`;
  return fetchApi<any>(endpoint, {}, `bonus-hunt:${huntId}`);
}

// ============== PROVIDERS ==============

export async function getProviders(options?: { skip?: number; limit?: number }) {
  const params = new URLSearchParams();
  if (options?.skip) params.append('skip', options.skip.toString());
  if (options?.limit) params.append('limit', options.limit.toString());

  const endpoint = `/providers?${params.toString()}`;
  const cacheKey = `providers:${params.toString()}`;

  return fetchApi<any[]>(endpoint, {}, cacheKey);
}

export async function getProvider(providerId: string) {
  const endpoint = `/providers/${providerId}`;
  return fetchApi<any>(endpoint, {}, `provider:${providerId}`);
}
