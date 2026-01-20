'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Users, TrendingUp, Trophy, Clock, Radio, RefreshCw } from 'lucide-react';

type Platform = 'kick' | 'twitch' | 'youtube';

interface StreamerData {
  id: string;
  username: string;
  displayName: string;
  platform: Platform;
  platformId: string;
  avatarUrl?: string;
  followerCount: number;
  isLive: boolean;
  livestream?: {
    viewerCount: number;
    title?: string;
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
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
}

function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

function getPlatformColor(platform: Platform): string {
  switch (platform) {
    case 'kick':
      return 'bg-green-500';
    case 'twitch':
      return 'bg-purple-500';
    case 'youtube':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

export default function StreamersPage() {
  const [streamers, setStreamers] = useState<StreamerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('followers');

  const fetchStreamers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use trailing slash to avoid redirect
      const response = await fetch('/api/v1/streamers/?limit=100');
      if (response.ok) {
        const data = await response.json();
        setStreamers(data.streamers || []);
      } else {
        setError('Failed to load streamers');
      }
    } catch (err) {
      console.error('Error fetching streamers:', err);
      setError('Network error - please try again');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStreamers();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStreamers, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredStreamers = streamers
    .filter((streamer) => {
      const matchesSearch =
        streamer.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        streamer.username.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPlatform =
        platformFilter === 'all' || streamer.platform === platformFilter;
      return matchesSearch && matchesPlatform;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'followers':
          return b.followerCount - a.followerCount;
        case 'wagered':
          return (b.lifetimeStats?.totalWagered || 0) - (a.lifetimeStats?.totalWagered || 0);
        case 'rtp':
          return (b.lifetimeStats?.averageRtp || 0) - (a.lifetimeStats?.averageRtp || 0);
        case 'sessions':
          return (b.lifetimeStats?.totalSessions || 0) - (a.lifetimeStats?.totalSessions || 0);
        default:
          return 0;
      }
    });

  const liveStreamers = filteredStreamers.filter((s) => s.isLive);

  if (isLoading && streamers.length === 0) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Streamers</h1>
          <p className="text-muted-foreground mt-2">
            Loading real-time data...
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Streamers</h1>
          <p className="text-muted-foreground mt-2">
            {streamers.length} tracked streamers - Real-time data
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStreamers} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md mb-6">
          {error}
          <Button variant="link" onClick={fetchStreamers} className="ml-2">
            Retry
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search streamers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="kick">Kick</SelectItem>
            <SelectItem value="twitch">Twitch</SelectItem>
            <SelectItem value="youtube">YouTube</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="followers">Followers</SelectItem>
            <SelectItem value="wagered">Total Wagered</SelectItem>
            <SelectItem value="rtp">Avg RTP</SelectItem>
            <SelectItem value="sessions">Sessions</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Live Streamers Section */}
      {liveStreamers.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Radio className="h-5 w-5 text-red-500 animate-pulse" />
            Live Now ({liveStreamers.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveStreamers.map((streamer) => (
              <StreamerCard key={streamer.id} streamer={streamer} />
            ))}
          </div>
        </div>
      )}

      {/* All Streamers */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          All Streamers ({filteredStreamers.length})
        </h2>
        {filteredStreamers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No streamers found matching your search' : 'No streamers available'}
              </p>
              {searchQuery && (
                <Button
                  variant="link"
                  onClick={() => setSearchQuery('')}
                  className="mt-2"
                >
                  Clear search
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStreamers.map((streamer) => (
              <StreamerCard key={streamer.id} streamer={streamer} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function StreamerCard({ streamer }: { streamer: StreamerData }) {
  const stats = streamer.lifetimeStats || {
    totalSessions: 0,
    totalWagered: 0,
    biggestWin: 0,
    averageRtp: 0,
  };

  return (
    <Link href={`/streamer/${streamer.username}`}>
      <Card className="hover:border-primary transition-colors cursor-pointer h-full">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {streamer.avatarUrl ? (
                  <img
                    src={streamer.avatarUrl}
                    alt={streamer.displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Users className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              {streamer.isLive && (
                <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-red-500 rounded-full border-2 border-background flex items-center justify-center">
                  <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{streamer.displayName}</h3>
                <Badge
                  variant="secondary"
                  className={`${getPlatformColor(streamer.platform)} text-white text-xs`}
                >
                  {streamer.platform}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">@{streamer.username}</p>
              <div className="flex items-center gap-1 mt-1">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {formatNumber(streamer.followerCount)} followers
                </span>
              </div>
              {streamer.isLive && streamer.livestream && (
                <div className="text-xs text-red-500 mt-1">
                  {formatNumber(streamer.livestream.viewerCount)} watching
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
            <div>
              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                <TrendingUp className="h-3 w-3" />
                Total Wagered
              </div>
              <p className="font-semibold">
                {formatCurrency(stats.totalWagered)}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                <Trophy className="h-3 w-3" />
                Biggest Win
              </div>
              <p className="font-semibold text-win">
                {formatCurrency(stats.biggestWin)}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                <Clock className="h-3 w-3" />
                Sessions
              </div>
              <p className="font-semibold">
                {stats.totalSessions}
              </p>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Avg RTP</div>
              <p
                className={`font-semibold ${
                  stats.averageRtp >= 96
                    ? 'text-win'
                    : stats.averageRtp >= 94
                    ? 'text-yellow-500'
                    : stats.averageRtp > 0
                    ? 'text-loss'
                    : 'text-muted-foreground'
                }`}
              >
                {stats.averageRtp > 0 ? `${stats.averageRtp.toFixed(2)}%` : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
