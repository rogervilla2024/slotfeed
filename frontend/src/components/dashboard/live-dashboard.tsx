'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StreamerCard } from './streamer-card';
import { useLiveUpdates, type WebSocketMessage } from '@/lib/websocket';
import { api } from '@/lib/api';
import type { LiveStreamData } from '@/types';
import { RefreshCw, Users, TrendingUp, Zap, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Platform = 'all' | 'kick' | 'twitch' | 'youtube';

const PLATFORM_CONFIG: Record<Platform, { label: string; color: string; icon: string }> = {
  all: { label: 'All Platforms', color: 'bg-gradient-to-r from-green-500 via-purple-500 to-red-500', icon: '🌐' },
  kick: { label: 'Kick', color: 'bg-green-500', icon: '🟢' },
  twitch: { label: 'Twitch', color: 'bg-purple-500', icon: '🟣' },
  youtube: { label: 'YouTube', color: 'bg-red-500', icon: '🔴' },
};

interface DashboardStats {
  activeStreamers: number;
  totalViewers: number;
  todaysBigWins: number;
  totalWageredToday: number;
}

export function LiveDashboard() {
  const [liveStreams, setLiveStreams] = useState<LiveStreamData[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    activeStreamers: 0,
    totalViewers: 0,
    todaysBigWins: 0,
    totalWageredToday: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('all');
  const [platformStats, setPlatformStats] = useState<Record<string, { streams: number; viewers: number }>>({});

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    if (!message.data) return;

    switch (message.type) {
      case 'balance_update': {
        const data = message.data as {
          session_id: string;
          balance: number;
          bet?: number;
          win?: number;
        };

        setLiveStreams(prev =>
          prev.map(stream => {
            if (stream.session.id === data.session_id) {
              const currentBalance = data.balance;
              const profitLoss = currentBalance - stream.session.startBalance;
              return {
                ...stream,
                session: {
                  ...stream.session,
                  currentBalance,
                  peakBalance: Math.max(stream.session.peakBalance, currentBalance),
                  lowestBalance: Math.min(stream.session.lowestBalance, currentBalance),
                },
                sessionProfitLoss: {
                  amount: profitLoss,
                  percentage: (profitLoss / stream.session.startBalance) * 100,
                  isProfit: profitLoss >= 0,
                },
              };
            }
            return stream;
          })
        );
        break;
      }

      case 'big_win': {
        const data = message.data as {
          session_id: string;
          win_amount: number;
          multiplier: number;
        };

        setStats(prev => ({
          ...prev,
          todaysBigWins: prev.todaysBigWins + 1,
        }));

        console.log(`Big Win! ${data.multiplier}x - $${data.win_amount}`);
        break;
      }

      case 'stream_start': {
        fetchLiveStreams();
        break;
      }

      case 'stream_end': {
        const data = message.data as { session_id: string };
        setLiveStreams(prev =>
          prev.filter(stream => stream.session.id !== data.session_id)
        );
        break;
      }

      case 'game_change': {
        const data = message.data as {
          session_id: string;
          game_id: string;
          game_name: string;
        };

        setLiveStreams(prev =>
          prev.map(stream => {
            if (stream.session.id === data.session_id && stream.currentGame) {
              return {
                ...stream,
                currentGame: {
                  ...stream.currentGame,
                  id: data.game_id,
                  name: data.game_name,
                },
              };
            }
            return stream;
          })
        );
        break;
      }
    }
  }, []);

  // Connect to WebSocket
  const { status: wsStatus, isConnected } = useLiveUpdates(handleWebSocketMessage);

  // Transform API response to LiveStreamData format
  const transformStreamData = (rawData: unknown): LiveStreamData[] => {
    console.log('[DEBUG] transformStreamData input:', rawData);
    // If it's already an array with proper format, return as is
    if (Array.isArray(rawData)) {
      console.log('[DEBUG] Input is array with length:', rawData.length);
      const filtered = rawData.filter((item: unknown) => {
        // Check if item has the required structure
        const stream = item as Record<string, unknown>;
        const passes = stream &&
          (stream.session || stream.streamer) &&
          (typeof stream.session === 'object' || typeof stream.streamer === 'object');
        console.log('[DEBUG] Filter check for item:', { hasSession: !!stream?.session, hasStreamer: !!stream?.streamer, passes });
        return passes;
      });
      console.log('[DEBUG] After filter:', filtered.length);
      return filtered.map((item: unknown) => {
        const stream = item as Record<string, unknown>;

        // Ensure all required fields have defaults
        const defaultSession = {
          id: 'unknown',
          streamerId: 'unknown',
          startTime: new Date().toISOString(),
          startBalance: 10000,
          currentBalance: 10000,
          peakBalance: 10000,
          lowestBalance: 8000,
          totalWagered: 0,
          status: 'live' as const,
        };

        const defaultStreamer = {
          id: 'unknown',
          username: 'unknown',
          displayName: 'Unknown Streamer',
          platform: 'kick' as const,
          platformId: 'unknown',
          followerCount: 0,
          isLive: true,
          lifetimeStats: {
            totalSessions: 0,
            totalHoursStreamed: 0,
            totalWagered: 0,
            totalWon: 0,
            biggestWin: 0,
            biggestMultiplier: 0,
            averageRtp: 96.0,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const defaultProfitLoss = {
          amount: 0,
          percentage: 0,
          isProfit: true,
        };

        return {
          session: { ...defaultSession, ...(stream.session as object || {}) },
          streamer: { ...defaultStreamer, ...(stream.streamer as object || {}) },
          currentGame: stream.currentGame as LiveStreamData['currentGame'],
          recentWins: (stream.recentWins as LiveStreamData['recentWins']) || [],
          viewerCount: (stream.viewerCount as number) || 0,
          sessionProfitLoss: { ...defaultProfitLoss, ...(stream.sessionProfitLoss as object || {}) },
        } as LiveStreamData;
      });
    }

    // If it's an object with streams property (like { streams: [...] })
    const data = rawData as Record<string, unknown>;
    if (data && Array.isArray(data.streams)) {
      return transformStreamData(data.streams);
    }

    // If it's empty or invalid, return empty array
    return [];
  };

  // Fetch live streams from API
  const fetchLiveStreams = useCallback(async (platform: Platform = selectedPlatform) => {
    setIsLoading(true);
    setError(null);

    try {
      // Call backend API with platform filter
      const url = platform === 'all'
        ? '/api/v1/live/streams'
        : `/api/v1/live/streams?platform=${platform}`;

      const response = await fetch(url);
      if (response.ok) {
        const rawData = await response.json();
        console.log('[DEBUG] Raw API response:', rawData);
        console.log('[DEBUG] Raw data type:', typeof rawData, Array.isArray(rawData));
        const streams = transformStreamData(rawData);
        console.log('[DEBUG] Transformed streams:', streams);
        console.log('[DEBUG] Streams count:', streams.length);
        setLiveStreams(streams);

        // Calculate per-platform stats
        const pStats: Record<string, { streams: number; viewers: number }> = {
          kick: { streams: 0, viewers: 0 },
          twitch: { streams: 0, viewers: 0 },
          youtube: { streams: 0, viewers: 0 },
        };

        streams.forEach((s: LiveStreamData) => {
          const p = s.streamer?.platform || 'kick';
          if (pStats[p]) {
            pStats[p].streams += 1;
            pStats[p].viewers += s.viewerCount || 0;
          }
        });
        setPlatformStats(pStats);

        setStats({
          activeStreamers: streams.length,
          totalViewers: streams.reduce((acc: number, s: LiveStreamData) => acc + (s.viewerCount || 0), 0),
          todaysBigWins: 0,
          totalWageredToday: streams.reduce((acc: number, s: LiveStreamData) => acc + (s.session?.totalWagered || 0), 0),
        });
        setLastUpdate(new Date());
      } else {
        setError('Failed to fetch live streams');
      }
    } catch (err) {
      setError('Network error - please check your connection');
      console.error('Error fetching streams:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPlatform]);

  // Handle platform change
  const handlePlatformChange = useCallback((platform: string) => {
    setSelectedPlatform(platform as Platform);
    fetchLiveStreams(platform as Platform);
  }, [fetchLiveStreams]);

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchLiveStreams();
    // Refresh every 15 seconds for real-time feel
    const interval = setInterval(() => fetchLiveStreams(), 15000);
    return () => clearInterval(interval);
  }, [fetchLiveStreams]);

  // Loading state
  if (isLoading && liveStreams.length === 0) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl sm:text-2xl font-semibold">Live Streams</h2>
          <Badge variant="secondary" className="gap-1">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Loading...
          </Badge>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <h2 className="text-xl sm:text-2xl font-semibold">Live Streams</h2>
          <Badge variant={liveStreams.length > 0 ? 'live' : 'secondary'} className="gap-1">
            <span className="relative flex h-2 w-2">
              {liveStreams.length > 0 && (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </>
              )}
            </span>
            {liveStreams.length} Live
          </Badge>
          <Badge variant={isConnected ? 'secondary' : 'outline'} className="text-xs hidden sm:inline-flex">
            {isConnected ? 'Real-time' : wsStatus}
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => fetchLiveStreams()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {lastUpdate && (
            <span className="text-xs text-muted-foreground">
              Updated {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Platform Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Tabs value={selectedPlatform} onValueChange={handlePlatformChange} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-4 sm:w-auto sm:inline-flex">
            <TabsTrigger value="all" className="gap-1.5">
              <span className="hidden sm:inline">🌐</span> All
              {selectedPlatform === 'all' && stats.activeStreamers > 0 && (
                <span className="text-xs ml-1">({stats.activeStreamers})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="kick" className="gap-1.5">
              <span className="hidden sm:inline">🟢</span> Kick
              {platformStats.kick?.streams > 0 && (
                <span className="text-xs ml-1">({platformStats.kick.streams})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="twitch" className="gap-1.5">
              <span className="hidden sm:inline">🟣</span> Twitch
              {platformStats.twitch?.streams > 0 && (
                <span className="text-xs ml-1">({platformStats.twitch.streams})</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="youtube" className="gap-1.5">
              <span className="hidden sm:inline">🔴</span> YouTube
              {platformStats.youtube?.streams > 0 && (
                <span className="text-xs ml-1">({platformStats.youtube.streams})</span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Platform viewer counts */}
        {selectedPlatform === 'all' && Object.keys(platformStats).length > 0 && (
          <div className="flex gap-3 text-xs text-muted-foreground">
            {platformStats.kick?.viewers > 0 && (
              <span>🟢 {platformStats.kick.viewers.toLocaleString()}</span>
            )}
            {platformStats.twitch?.viewers > 0 && (
              <span>🟣 {platformStats.twitch.viewers.toLocaleString()}</span>
            )}
            {platformStats.youtube?.viewers > 0 && (
              <span>🔴 {platformStats.youtube.viewers.toLocaleString()}</span>
            )}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Live Streamers</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.activeStreamers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Total Viewers</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.totalViewers.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Big Wins Today</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.todaysBigWins}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Total Wagered</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              ${(stats.totalWageredToday / 1000).toFixed(0)}K
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md flex items-center gap-2">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={fetchLiveStreams}>
            Retry
          </Button>
        </div>
      )}

      {/* Streams Grid */}
      {liveStreams.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No Streamers Currently Live</p>
            <p className="text-muted-foreground mb-4">
              Check back later or refresh to see live streams
            </p>
            <Button onClick={fetchLiveStreams} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Check Again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {liveStreams.map((stream, index) => (
            <StreamerCard key={stream?.session?.id || stream?.streamer?.id || `stream-${index}`} data={stream} />
          ))}
        </div>
      )}

      {/* Real-time indicator */}
      {liveStreams.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          {selectedPlatform === 'all'
            ? 'Data from Kick, Twitch & YouTube APIs'
            : `Data from ${PLATFORM_CONFIG[selectedPlatform].label} API`}
          {' '}- Auto-refreshes every 15 seconds
        </div>
      )}
    </div>
  );
}
