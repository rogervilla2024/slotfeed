'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LeaderboardCard, LeaderboardCardSkeleton } from './leaderboard-card';
import { formatCurrency, formatNumber } from '@/lib/utils';
import type { LeaderboardEntry, Streamer } from '@/types';

type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'all_time';

interface LeaderboardsProps {
  className?: string;
}

interface StreamerAPIData {
  id: string;
  username: string;
  displayName: string;
  platform: 'kick' | 'twitch' | 'youtube';
  platformId: string;
  avatarUrl?: string;
  followerCount: number;
  isLive: boolean;
  livestream?: {
    viewerCount: number;
  };
  lifetimeStats: {
    totalSessions: number;
    totalHoursStreamed: number;
    totalWagered: number;
    totalWon: number;
    biggestWin: number;
    biggestMultiplier: number;
    averageRtp: number;
    currentBalance?: number;
    profitLoss?: number;
  };
}

const periodLabels: Record<LeaderboardPeriod, string> = {
  daily: 'Today',
  weekly: 'This Week',
  monthly: 'This Month',
  all_time: 'All Time',
};

export function Leaderboards({ className }: LeaderboardsProps) {
  const [period, setPeriod] = useState<LeaderboardPeriod>('daily');
  const [loading, setLoading] = useState(true);
  const [streamers, setStreamers] = useState<StreamerAPIData[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch streamers data from API
  useEffect(() => {
    const fetchStreamers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/v1/streamers/?limit=50');
        if (response.ok) {
          const data = await response.json();
          setStreamers(data.streamers || []);
        } else {
          setError('Failed to fetch leaderboard data');
        }
      } catch (err) {
        console.error('Error fetching streamers:', err);
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchStreamers();
    const interval = setInterval(fetchStreamers, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // Transform API data to LeaderboardEntry format
  const transformToEntry = (
    streamer: StreamerAPIData,
    rank: number,
    value: number,
    category: string
  ): LeaderboardEntry => ({
    rank,
    streamerId: streamer.id,
    streamer: {
      id: streamer.id,
      username: streamer.username,
      displayName: streamer.displayName,
      platform: streamer.platform,
      platformId: streamer.platformId,
      avatarUrl: streamer.avatarUrl,
      followerCount: streamer.followerCount,
      isLive: streamer.isLive,
      lifetimeStats: streamer.lifetimeStats,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    value,
    category,
    period,
  });

  // Generate leaderboards from real data
  const generateLeaderboards = () => {
    if (streamers.length === 0) {
      return {
        biggestWins: [],
        bestRtp: [],
        mostWagered: [],
        mostActive: [],
      };
    }

    // Sort by biggest win
    const biggestWins = [...streamers]
      .filter(s => s.lifetimeStats.biggestWin > 0)
      .sort((a, b) => b.lifetimeStats.biggestWin - a.lifetimeStats.biggestWin)
      .slice(0, 5)
      .map((s, i) => transformToEntry(s, i + 1, s.lifetimeStats.biggestWin, 'biggest_win'));

    // Sort by RTP (only those with wagered > 0)
    const bestRtp = [...streamers]
      .filter(s => s.lifetimeStats.totalWagered > 0 && s.lifetimeStats.averageRtp > 0)
      .sort((a, b) => b.lifetimeStats.averageRtp - a.lifetimeStats.averageRtp)
      .slice(0, 5)
      .map((s, i) => transformToEntry(s, i + 1, s.lifetimeStats.averageRtp, 'best_rtp'));

    // Sort by total wagered
    const mostWagered = [...streamers]
      .filter(s => s.lifetimeStats.totalWagered > 0)
      .sort((a, b) => b.lifetimeStats.totalWagered - a.lifetimeStats.totalWagered)
      .slice(0, 5)
      .map((s, i) => transformToEntry(s, i + 1, s.lifetimeStats.totalWagered, 'most_wagered'));

    // Sort by sessions/activity
    const mostActive = [...streamers]
      .filter(s => s.lifetimeStats.totalSessions > 0)
      .sort((a, b) => b.lifetimeStats.totalSessions - a.lifetimeStats.totalSessions)
      .slice(0, 5)
      .map((s, i) => transformToEntry(s, i + 1, s.lifetimeStats.totalSessions, 'most_active'));

    return { biggestWins, bestRtp, mostWagered, mostActive };
  };

  const data = generateLeaderboards();

  return (
    <div className={className}>
      {/* Period selector */}
      <div className="flex gap-2 mb-4 md:mb-6 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
        {(Object.keys(periodLabels) as LeaderboardPeriod[]).map((p) => (
          <Button
            key={p}
            variant={period === p ? 'default' : 'outline'}
            onClick={() => setPeriod(p)}
            className="flex-shrink-0 text-sm md:text-base touch-manipulation"
            size="sm"
          >
            {periodLabels[p]}
          </Button>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="text-center text-muted-foreground py-8">
          {error}
        </div>
      )}

      {/* Leaderboard grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <LeaderboardCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <LeaderboardCard
            title="Biggest Wins"
            icon="🏆"
            entries={data.biggestWins}
            valueFormatter={(v) => formatCurrency(v)}
          />
          <LeaderboardCard
            title="Best RTP"
            icon="📈"
            entries={data.bestRtp}
            valueFormatter={(v) => v.toFixed(2)}
            valueLabel="%"
          />
          <LeaderboardCard
            title="Most Wagered"
            icon="💰"
            entries={data.mostWagered}
            valueFormatter={(v) => formatCurrency(v)}
          />
          <LeaderboardCard
            title="Most Active"
            icon="⏱️"
            entries={data.mostActive}
            valueFormatter={(v) => `${formatNumber(v)} sessions`}
          />
        </div>
      )}

      {/* Data source indicator */}
      {!loading && streamers.length > 0 && (
        <div className="text-center text-sm text-muted-foreground mt-4">
          Real-time data from {streamers.length} tracked streamers
        </div>
      )}
    </div>
  );
}
