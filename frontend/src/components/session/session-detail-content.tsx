'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Activity,
  BarChart3,
  Gamepad2,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { Session, Streamer, GameSession, BigWin } from '@/types';

interface SessionDetailContentProps {
  session?: Session;
  streamer?: Streamer;
  username?: string;
  sessionId?: string;
  useMockData?: boolean;
}

interface GameSessionData {
  id: string;
  sessionId: string;
  gameId: string;
  gameName: string;
  provider: string;
  startBalance: number;
  endBalance: number;
  wagered: number;
  won: number;
  duration: number;
  spinCount: number;
}

interface BigWinData {
  id: string;
  sessionId: string;
  gameId: string;
  gameName: string;
  betAmount: number;
  winAmount: number;
  multiplier: number;
  timestamp: string;
}

export function SessionDetailContent({
  session: initialSession,
  streamer: initialStreamer,
  username,
  sessionId,
}: SessionDetailContentProps) {
  const [session, setSession] = useState<Session | null>(initialSession || null);
  const [streamer, setStreamer] = useState<Streamer | null>(initialStreamer || null);
  const [gameSessions, setGameSessions] = useState<GameSessionData[]>([]);
  const [bigWins, setBigWins] = useState<BigWinData[]>([]);
  const [isLoading, setIsLoading] = useState(!initialSession);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (initialSession && initialStreamer) {
      // Already have server-side data
      return;
    }

    if (!sessionId || !username) {
      setError('Missing session or username');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch session data
      const sessionResponse = await fetch(`/api/v1/sessions/${sessionId}`);
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        setSession({
          id: sessionData.id,
          streamerId: sessionData.streamer_id,
          startTime: new Date(sessionData.start_time),
          endTime: sessionData.end_time ? new Date(sessionData.end_time) : undefined,
          startBalance: sessionData.start_balance || 0,
          currentBalance: sessionData.current_balance || 0,
          peakBalance: sessionData.peak_balance || 0,
          lowestBalance: sessionData.lowest_balance || 0,
          totalWagered: sessionData.total_wagered || 0,
          status: sessionData.status || 'ended',
        });
      } else {
        setError('Session not found');
      }

      // Fetch streamer data
      const streamerResponse = await fetch(`/api/v1/streamers/${username}`);
      if (streamerResponse.ok) {
        const streamerData = await streamerResponse.json();
        setStreamer({
          id: streamerData.id,
          username: streamerData.username,
          displayName: streamerData.displayName || streamerData.display_name || streamerData.username,
          platform: streamerData.platform || 'kick',
          platformId: streamerData.platformId || streamerData.platform_id || '',
          avatarUrl: streamerData.avatarUrl || streamerData.avatar_url,
          followerCount: streamerData.followerCount || streamerData.follower_count || 0,
          isLive: streamerData.isLive || streamerData.is_live || false,
          createdAt: new Date(streamerData.createdAt || streamerData.created_at || Date.now()),
          updatedAt: new Date(streamerData.updatedAt || streamerData.updated_at || Date.now()),
        });
      }

      // Fetch balance history for game sessions breakdown
      const balanceResponse = await fetch(`/api/v1/sessions/${sessionId}/balance-history?limit=100`);
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        // Process balance history into game sessions if available
        if (balanceData.game_sessions) {
          setGameSessions(balanceData.game_sessions);
        }
        if (balanceData.big_wins) {
          setBigWins(balanceData.big_wins);
        }
      }
    } catch (err) {
      console.error('Failed to fetch session data:', err);
      setError('Failed to load session data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [initialSession, sessionId, username]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-12 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !session || !streamer) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive mb-4">{error || 'Session not found'}</p>
            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const profit = session.currentBalance - session.startBalance;
  const profitPercent = session.startBalance > 0
    ? (profit / session.startBalance) * 100
    : 0;
  const isProfit = profit >= 0;

  const duration = (() => {
    const start = new Date(session.startTime);
    const end = session.endTime ? new Date(session.endTime) : new Date();
    const minutes = Math.floor((end.getTime() - start.getTime()) / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  })();

  const sessionDate = new Date(session.startTime).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Back Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/streamer/${streamer.username}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {streamer.displayName}
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Session Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{streamer.displayName}</h1>
            <Badge variant={session.status === 'live' ? 'live' : 'secondary'}>
              {session.status === 'live' ? 'LIVE' : 'Ended'}
            </Badge>
          </div>
          <p className="text-muted-foreground">{sessionDate}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Duration: {duration} | Wagered: {formatCurrency(session.totalWagered)}
          </p>
        </div>

        <div className="text-right">
          <div
            className={`text-3xl font-bold ${
              isProfit ? 'text-win' : 'text-loss'
            }`}
          >
            {isProfit ? '+' : ''}
            {formatCurrency(profit)}
          </div>
          <div className={`text-lg ${isProfit ? 'text-win' : 'text-loss'}`}>
            {isProfit ? '+' : ''}
            {profitPercent.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Balance Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Start</span>
            </div>
            <div className="text-xl font-bold">
              {formatCurrency(session.startBalance)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Activity className="h-4 w-4" />
              <span className="text-sm">End</span>
            </div>
            <div className="text-xl font-bold">
              {formatCurrency(session.currentBalance)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-win mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Peak</span>
            </div>
            <div className="text-xl font-bold text-win">
              {formatCurrency(session.peakBalance)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-loss mb-1">
              <TrendingDown className="h-4 w-4" />
              <span className="text-sm">Lowest</span>
            </div>
            <div className="text-xl font-bold text-loss">
              {formatCurrency(session.lowestBalance)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Games and Big Wins */}
      <Tabs defaultValue="games" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="games" className="flex items-center gap-2">
            <Gamepad2 className="h-4 w-4" />
            Games Played
          </TabsTrigger>
          <TabsTrigger value="bigwins" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Big Wins
          </TabsTrigger>
        </TabsList>

        <TabsContent value="games" className="mt-6">
          <div className="space-y-4">
            {gameSessions.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No game session data available yet.
                </CardContent>
              </Card>
            ) : (
              gameSessions.map((game) => {
                const gamePL = game.endBalance - game.startBalance;
                const gameIsProfit = gamePL >= 0;

                return (
                  <Card key={game.id}>
                    <CardContent className="py-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/slot/${game.gameId}`}
                              className="font-semibold hover:text-primary transition-colors"
                            >
                              {game.gameName}
                            </Link>
                            <Badge variant="outline">{game.provider}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {game.duration}m | {game.spinCount} spins | Wagered: {formatCurrency(game.wagered)}
                          </div>
                        </div>

                        <div className="text-right">
                          <div
                            className={`text-lg font-semibold ${
                              gameIsProfit ? 'text-win' : 'text-loss'
                            }`}
                          >
                            {gameIsProfit ? '+' : ''}
                            {formatCurrency(gamePL)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Won: {formatCurrency(game.won)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="bigwins" className="mt-6">
          <div className="space-y-4">
            {bigWins.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No big wins recorded in this session.
                </CardContent>
              </Card>
            ) : (
              bigWins.map((win) => (
                <Card key={win.id}>
                  <CardContent className="py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/slot/${win.gameId}`}
                            className="font-semibold hover:text-primary transition-colors"
                          >
                            {win.gameName}
                          </Link>
                          <Badge className="bg-win/20 text-win border-win">
                            {win.multiplier}x
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Bet: {formatCurrency(win.betAmount)} |{' '}
                          {new Date(win.timestamp).toLocaleTimeString()}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xl font-bold text-win">
                          {formatCurrency(win.winAmount)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Watch on Platform Button */}
      {session.status === 'live' && (
        <div className="flex justify-center pt-4">
          <Button size="lg" asChild>
            <a
              href={`https://kick.com/${streamer.username}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Watch Live on Kick
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
