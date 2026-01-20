'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { StreamerHeader } from '@/components/streamer/streamer-header';
import { StreamerStats } from '@/components/streamer/streamer-stats';
import { SessionHistory } from '@/components/streamer/session-history';
import { GamePreferences } from '@/components/streamer/game-preferences';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  StreamerProfilePageStructuredData,
  StreamerBreadcrumbStructuredData,
  BroadcastStructuredData,
} from '@/components/seo';
import type { Session } from '@/types';

interface StreamerData {
  id: string;
  username: string;
  displayName: string;
  platform: 'kick' | 'twitch' | 'youtube';
  platformId: string;
  avatarUrl?: string;
  bio?: string;
  followerCount: number;
  isLive: boolean;
  livestream?: {
    id: number;
    title: string;
    viewerCount: number;
    startedAt: string;
    thumbnail?: string;
  };
  lifetimeStats: {
    totalSessions: number;
    totalHoursStreamed: number;
    totalWagered: number;
    totalWon: number;
    biggestWin: number;
    biggestMultiplier: number;
    averageRtp: number;
  };
  socialLinks?: {
    kick?: string;
    twitch?: string;
    youtube?: string;
    twitter?: string;
    discord?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Game stats interface
interface GameStat {
  gameId: string;
  gameName: string;
  provider: string;
  sessionsPlayed: number;
  totalWagered: number;
  totalWon: number;
  biggestWin: number;
  observedRtp: number;
  theoreticalRtp: number;
}

export default function StreamerProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const [streamer, setStreamer] = useState<StreamerData | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [gameStats, setGameStats] = useState<GameStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStreamerData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch from FastAPI backend via proxy
        const response = await fetch(`/api/v1/streamers/${username}`);

        if (!response.ok) {
          throw new Error('Streamer not found');
        }

        const data = await response.json();
        setStreamer(data);

        // Fetch sessions from API
        try {
          const sessionsResponse = await fetch(`/api/v1/sessions/streamer/${username}`);
          if (sessionsResponse.ok) {
            const sessionsData = await sessionsResponse.json();
            // Map API response to Session type
            const mappedSessions = (sessionsData.sessions || []).map((s: any) => ({
              id: s.id,
              streamerId: s.streamerId,
              startTime: new Date(s.startTime),
              endTime: s.endTime ? new Date(s.endTime) : undefined,
              startBalance: s.startBalance || 0,
              currentBalance: s.endBalance || 0,
              peakBalance: s.peakBalance || 0,
              lowestBalance: s.lowestBalance || 0,
              totalWagered: s.totalWagered || 0,
              status: s.status as 'live' | 'ended',
            }));
            setSessions(mappedSessions);
          }
        } catch (err) {
          console.error('Error fetching sessions:', err);
        }

        // Fetch game stats from API
        try {
          const gamesResponse = await fetch(`/api/v1/streamers/${username}/games`);
          if (gamesResponse.ok) {
            const gamesData = await gamesResponse.json();
            setGameStats(gamesData.games || []);
          }
        } catch (err) {
          console.error('Error fetching game stats:', err);
        }
      } catch (err) {
        console.error('Error fetching streamer:', err);
        setError(err instanceof Error ? err.message : 'Failed to load streamer');
      } finally {
        setIsLoading(false);
      }
    };

    if (username) {
      fetchStreamerData();

      // Refresh every 30 seconds for live data
      const interval = setInterval(fetchStreamerData, 30000);
      return () => clearInterval(interval);
    }
  }, [username]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 space-y-8">
        <div className="flex items-start gap-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-96" />
            <div className="flex gap-3">
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !streamer) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive text-lg mb-4">
              {error || 'Streamer not found'}
            </p>
            <p className="text-muted-foreground">
              The streamer &quot;{username}&quot; could not be found.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get favorite games for SEO
  const favoriteGames = gameStats
    .slice(0, 5)
    .map((g) => g.gameName);

  // Platform URL mapping - use socialLinks from API if available, fallback to constructed URLs
  const platformUrls = {
    kick: streamer.socialLinks?.kick || `https://kick.com/${streamer.username}`,
    twitch: streamer.socialLinks?.twitch || `https://twitch.tv/${streamer.username}`,
    youtube: streamer.socialLinks?.youtube || `https://youtube.com/@${streamer.username}`,
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* SEO Structured Data */}
      <StreamerProfilePageStructuredData
        streamer={{
          name: streamer.displayName,
          username: streamer.username,
          platform: streamer.platform,
          platformUrl: platformUrls[streamer.platform],
          avatarUrl: streamer.avatarUrl,
          bio: streamer.bio,
          followerCount: streamer.followerCount,
          isLive: streamer.isLive,
        }}
        stats={streamer.lifetimeStats}
        favoriteGames={favoriteGames}
      />
      <StreamerBreadcrumbStructuredData
        streamerName={streamer.displayName}
        streamerUsername={streamer.username}
        currentPage="profile"
      />

      {/* Live Stream Schema - only when live */}
      {streamer.isLive && streamer.livestream && (
        <BroadcastStructuredData
          streamerName={streamer.displayName}
          streamerSlug={streamer.username}
          title={streamer.livestream.title}
          startDate={streamer.livestream.startedAt}
          thumbnailUrl={streamer.livestream.thumbnail}
          platform={streamer.platform}
          streamUrl={platformUrls[streamer.platform]}
          viewerCount={streamer.livestream.viewerCount}
          isLive={true}
        />
      )}

      <StreamerHeader streamer={streamer} />

      <StreamerStats stats={streamer.lifetimeStats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SessionHistory sessions={sessions} />
        <GamePreferences games={gameStats} />
      </div>
    </div>
  );
}
