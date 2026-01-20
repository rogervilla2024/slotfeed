'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BigWinCard, BigWinCardSkeleton } from './big-win-card';
import { RefreshCw, Zap } from 'lucide-react';
import { useBigWinsUpdates } from '@/lib/websocket';
import type { BigWin } from '@/types';

type FilterPeriod = 'today' | 'week' | 'month' | 'all';
type FilterTier = 'all' | 'big' | 'mega' | 'ultra' | 'legendary';

interface BigWinsGalleryProps {
  initialWins?: BigWin[];
  streamerId?: string;
  gameId?: string;
  className?: string;
}

interface OCREvent {
  id: string;
  timestamp: string;
  streamer: string;
  balance: number | null;
  bet: number | null;
  win: number | null;
  multiplier: number | null;
}

export function BigWinsGallery({
  initialWins,
  streamerId,
  gameId,
  className,
}: BigWinsGalleryProps) {
  const [bigWins, setBigWins] = useState<BigWin[]>(initialWins || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<FilterPeriod>('all');
  const [tier, setTier] = useState<FilterTier>('all');
  const [newWinFlash, setNewWinFlash] = useState(false);

  // Real-time WebSocket updates
  const { isConnected } = useBigWinsUpdates((message) => {
    if (message.type === 'big_win' && message.data) {
      const newWin: BigWin = {
        id: `ws-${Date.now()}`,
        sessionId: `session-${message.data.streamerId}`,
        gameId: 'slots',
        streamerId: message.data.streamerId as string,
        streamer: {
          id: message.data.streamerId as string,
          username: message.data.streamerName as string,
          displayName: message.data.streamerName as string,
          platform: 'kick' as const,
          platformId: message.data.streamerId as string,
          followerCount: 0,
          isLive: true,
          lifetimeStats: {
            totalSessions: 0,
            totalHoursStreamed: 0,
            totalWagered: 0,
            totalWon: 0,
            biggestWin: 0,
            biggestMultiplier: 0,
            averageRtp: 0,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        game: {
          id: 'slots',
          name: message.data.gameName as string || 'Slots',
          slug: 'slots',
          providerId: 'unknown',
          rtp: 96,
          volatility: 'high' as const,
          maxMultiplier: 50000,
          isActive: true,
        },
        betAmount: (message.data.amount as number) / (message.data.multiplier as number),
        winAmount: message.data.amount as number,
        multiplier: message.data.multiplier as number,
        timestamp: new Date(message.timestamp || Date.now()),
        screenshotUrl: message.data.screenshotUrl as string | undefined,
        isVerified: true,
      };
      setBigWins(prev => [newWin, ...prev].slice(0, 100));
      // Flash animation
      setNewWinFlash(true);
      setTimeout(() => setNewWinFlash(false), 2000);
    }
  });

  const fetchBigWins = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch big wins from API
      const response = await fetch('/api/v1/live/big-wins?min_multiplier=50&limit=100');
      if (response.ok) {
        const data = await response.json();
        const wins = (data.wins || []).map((event: OCREvent, index: number) => ({
          id: event.id || `win-${index}`,
          sessionId: `session-${event.streamer}`,
          gameId: 'slots',
          streamerId: event.streamer,
          streamer: {
            id: event.streamer,
            username: event.streamer,
            displayName: event.streamer.charAt(0).toUpperCase() + event.streamer.slice(1),
            platform: 'kick' as const,
            platformId: event.streamer,
            followerCount: 0,
            isLive: true,
            lifetimeStats: {
              totalSessions: 0,
              totalHoursStreamed: 0,
              totalWagered: 0,
              totalWon: 0,
              biggestWin: 0,
              biggestMultiplier: 0,
              averageRtp: 0,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          game: {
            id: 'slots',
            name: 'Slots',
            slug: 'slots',
            providerId: 'unknown',
            rtp: 96,
            volatility: 'high' as const,
            maxMultiplier: 50000,
            isActive: true,
          },
          betAmount: event.bet || 0,
          winAmount: event.win || (event.bet || 0) * (event.multiplier || 1),
          multiplier: event.multiplier || 0,
          timestamp: new Date(event.timestamp),
          isVerified: true,
        }));
        setBigWins(wins);
      } else {
        setError('Failed to load big wins');
      }
    } catch (err) {
      console.error('Error fetching big wins:', err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBigWins();
    const interval = setInterval(fetchBigWins, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter wins based on selected filters
  const filteredWins = bigWins.filter((win) => {
    // Period filter
    if (period !== 'all') {
      const now = new Date();
      const winDate = new Date(win.timestamp);
      const diffDays = Math.floor((now.getTime() - winDate.getTime()) / (1000 * 60 * 60 * 24));

      if (period === 'today' && diffDays > 0) return false;
      if (period === 'week' && diffDays > 7) return false;
      if (period === 'month' && diffDays > 30) return false;
    }

    // Tier filter
    if (tier !== 'all') {
      const winTier = getTierFromMultiplier(win.multiplier);
      if (winTier !== tier) return false;
    }

    // Streamer filter
    if (streamerId && win.streamerId !== streamerId) return false;

    // Game filter
    if (gameId && win.gameId !== gameId) return false;

    return true;
  });

  // Sort by multiplier (highest first)
  const sortedWins = [...filteredWins].sort((a, b) => b.multiplier - a.multiplier);

  // Stats
  const totalWinValue = sortedWins.reduce((sum, w) => sum + w.winAmount, 0);
  const highestMultiplier = sortedWins.length > 0
    ? Math.max(...sortedWins.map((w) => w.multiplier))
    : 0;

  return (
    <div className={className}>
      {/* Header with stats */}
      <div className="flex flex-col gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              Big Wins Gallery
              {newWinFlash && (
                <Badge className="bg-yellow-500 text-black animate-pulse">
                  <Zap className="h-3 w-3 mr-1" />
                  NEW!
                </Badge>
              )}
            </h2>
            <p className="text-sm md:text-base text-muted-foreground">
              {sortedWins.length} big wins from OCR data
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? 'default' : 'secondary'} className="text-xs">
              <span className={`h-1.5 w-1.5 rounded-full mr-1 ${isConnected ? 'bg-green-400' : 'bg-gray-400'}`} />
              {isConnected ? 'Live' : 'Offline'}
            </Badge>
            <Button variant="outline" size="sm" onClick={fetchBigWins} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="text-sm text-destructive">{error}</div>
        )}

        {/* Filters */}
        <div className="space-y-2">
          {/* Period filter */}
          <div className="flex gap-1 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
            {(['today', 'week', 'month', 'all'] as FilterPeriod[]).map((p) => (
              <Button
                key={p}
                variant={period === p ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod(p)}
                className="flex-shrink-0 text-xs md:text-sm touch-manipulation"
              >
                {p === 'all' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
              </Button>
            ))}
          </div>

          {/* Tier filter */}
          <div className="flex gap-1 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
            {(['all', 'big', 'mega', 'ultra', 'legendary'] as FilterTier[]).map((t) => (
              <Button
                key={t}
                variant={tier === t ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTier(t)}
                className="flex-shrink-0 text-xs md:text-sm touch-manipulation"
              >
                {t === 'all' ? 'All Tiers' : t.charAt(0).toUpperCase() + t.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
        <Card>
          <CardContent className="p-3 md:pt-4 md:p-6">
            <div className="text-xs md:text-sm text-muted-foreground">Total Wins</div>
            <div className="text-xl md:text-2xl font-bold">{sortedWins.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:pt-4 md:p-6">
            <div className="text-xs md:text-sm text-muted-foreground">Highest Multi</div>
            <div className="text-xl md:text-2xl font-bold text-win">
              {highestMultiplier.toLocaleString()}x
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:pt-4 md:p-6">
            <div className="text-xs md:text-sm text-muted-foreground">Legendary (5000x+)</div>
            <div className="text-xl md:text-2xl font-bold text-amber-400">
              {sortedWins.filter((w) => w.multiplier >= 5000).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:pt-4 md:p-6">
            <div className="text-xs md:text-sm text-muted-foreground">Ultra (1000x+)</div>
            <div className="text-xl md:text-2xl font-bold text-purple-500">
              {sortedWins.filter((w) => w.multiplier >= 1000 && w.multiplier < 5000).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gallery grid */}
      {loading && bigWins.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <BigWinCardSkeleton key={i} />
          ))}
        </div>
      ) : sortedWins.length === 0 ? (
        <Card>
          <CardContent className="py-8 md:py-12 text-center">
            <div className="text-3xl md:text-4xl mb-3 md:mb-4">🎰</div>
            <p className="text-sm md:text-base text-muted-foreground">
              {bigWins.length === 0
                ? 'No big wins recorded yet. OCR is monitoring live streams...'
                : 'No big wins found for the selected filters.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {sortedWins.map((win) => (
            <BigWinCard key={win.id} bigWin={win} />
          ))}
        </div>
      )}

      {/* Data source indicator */}
      {!loading && bigWins.length > 0 && (
        <div className="text-center text-sm text-muted-foreground mt-4">
          Real-time data from OCR monitoring
        </div>
      )}
    </div>
  );
}

function getTierFromMultiplier(multiplier: number): FilterTier {
  if (multiplier >= 5000) return 'legendary';
  if (multiplier >= 1000) return 'ultra';
  if (multiplier >= 500) return 'mega';
  return 'big';
}
