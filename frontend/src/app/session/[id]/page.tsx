'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Pause, Play, TrendingUp, TrendingDown, Clock, Zap } from 'lucide-react';

interface SessionDetails {
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
  sessionStatus: 'live' | 'completed' | 'ended_early';
  gameBreakdown: Array<{
    gameId: string;
    gameName: string;
    sessionsCount: number;
    totalWagered: number;
    totalWon: number;
    observedRtp: number;
    theoreticalRtp: number;
  }>;
  bigWins: Array<{
    id: string;
    timestamp: string;
    gameName: string;
    amount: number;
    multiplier: number;
    balanceBefore: number;
    balanceAfter: number;
  }>;
  balanceHistory: Array<{
    timestamp: string;
    balance: number;
    wagered: number;
    won: number;
    balanceChange: number;
  }>;
}

export default function SessionDetailsPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch(`/api/v1/sessions/${sessionId}`);
        if (!response.ok) {
          throw new Error('Session not found');
        }
        const data = await response.json();

        // Map API response to SessionDetails type
        const mappedSession: SessionDetails = {
          id: data.id,
          streamerName: data.streamerName,
          streamerId: data.streamerId,
          platform: data.platform,
          startTime: data.startTime,
          endTime: data.endTime,
          duration: data.duration,
          startBalance: data.startBalance,
          endBalance: data.endBalance,
          peakBalance: data.peakBalance,
          lowestBalance: data.lowestBalance,
          totalWagered: data.totalWagered,
          totalPayouts: data.totalPayouts,
          profitLoss: data.profitLoss,
          roi: data.roi,
          averageRtp: data.averageRtp,
          biggestWin: data.biggestWin,
          biggestWinMultiplier: data.biggestWinMultiplier,
          sessionStatus: data.sessionStatus,
          gameBreakdown: data.gameBreakdown || [],
          bigWins: data.bigWins || [],
          balanceHistory: data.balanceHistory || []
        };

        setSession(mappedSession);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load session');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  const formattedDuration = useMemo(() => {
    if (!session) return '';
    const minutes = Math.floor(session.duration / 60);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }, [session]);

  const sessionDate = useMemo(() => {
    if (!session) return '';
    return new Date(session.startTime).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [session]);

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </main>
    );
  }

  if (error || !session) {
    return (
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-destructive text-lg mb-4">{error || 'Session not found'}</p>
            <Link href="/leaderboard">
              <Button>Back to Leaderboard</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <section className="border-b border-border py-6 mb-8">
        <div className="container mx-auto px-4">
          <Link href={`/streamer/${session.streamerName.toLowerCase()}`}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to {session.streamerName}
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Session Details</h1>
          <p className="text-muted-foreground">{sessionDate}</p>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-12">
        {/* Status Bar */}
        <div className="flex items-center justify-between mb-8 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            {session.sessionStatus === 'live' ? (
              <>
                <Zap className="h-5 w-5 text-green-500 animate-pulse" />
                <span className="font-semibold text-green-500">Live Session</span>
              </>
            ) : session.sessionStatus === 'completed' ? (
              <>
                <Play className="h-5 w-5 text-blue-500" />
                <span className="font-semibold text-blue-500">Completed</span>
              </>
            ) : (
              <>
                <Pause className="h-5 w-5 text-orange-500" />
                <span className="font-semibold text-orange-500">Ended Early</span>
              </>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Duration</p>
            <p className="text-lg font-semibold flex items-center gap-2 justify-end">
              <Clock className="h-4 w-4" />
              {formattedDuration}
            </p>
          </div>
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Starting Balance</p>
              <p className="text-2xl font-bold">${session.startBalance.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Ending Balance</p>
              <p className={`text-2xl font-bold ${session.endBalance >= session.startBalance ? 'text-green-500' : 'text-red-500'}`}>
                ${session.endBalance.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Profit/Loss</p>
              <div className="flex items-baseline gap-2">
                <p className={`text-2xl font-bold ${session.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  ${session.profitLoss.toFixed(2)}
                </p>
                <p className={`text-sm ${session.roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  ({session.roi.toFixed(1)}%)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Peak Balance</p>
              <p className="text-2xl font-bold text-blue-500">${session.peakBalance.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Max {((session.peakBalance - session.startBalance) / session.startBalance * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Total Wagered</p>
              <p className="text-2xl font-bold">${session.totalWagered.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Biggest Win</p>
              <p className="text-2xl font-bold text-orange-500">${session.biggestWin.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-2">{session.biggestWinMultiplier.toFixed(1)}x multiplier</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Session RTP</p>
              <p className={`text-2xl font-bold ${session.averageRtp >= 96 ? 'text-green-500' : 'text-red-500'}`}>
                {session.averageRtp.toFixed(2)}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="games" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="games">Games Played</TabsTrigger>
            <TabsTrigger value="wins">Big Wins ({session.bigWins.length})</TabsTrigger>
            <TabsTrigger value="history">Balance History</TabsTrigger>
          </TabsList>

          {/* Games Tab */}
          <TabsContent value="games">
            <Card>
              <CardHeader>
                <CardTitle>Games Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {session.gameBreakdown.map((game) => (
                    <div key={game.gameId} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <Link href={`/slot/${game.gameId}`}>
                            <p className="font-semibold hover:text-primary">{game.gameName}</p>
                          </Link>
                          <p className="text-sm text-muted-foreground">{game.sessionsCount} session(s)</p>
                        </div>
                        <Badge variant="outline">
                          {game.observedRtp.toFixed(2)}% RTP
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Wagered</p>
                          <p className="font-semibold">${game.totalWagered.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Won</p>
                          <p className={`font-semibold ${game.totalWon >= game.totalWagered ? 'text-green-500' : 'text-red-500'}`}>
                            ${game.totalWon.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">P/L</p>
                          <p className={`font-semibold ${game.totalWon - game.totalWagered >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            ${(game.totalWon - game.totalWagered).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Big Wins Tab */}
          <TabsContent value="wins">
            <Card>
              <CardHeader>
                <CardTitle>Biggest Wins in this Session</CardTitle>
              </CardHeader>
              <CardContent>
                {session.bigWins.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No big wins recorded in this session</p>
                ) : (
                  <div className="space-y-3">
                    {session.bigWins.map((win, idx) => (
                      <div key={win.id} className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-lg">{win.gameName}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(win.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-orange-500">${win.amount.toFixed(2)}</p>
                            <p className="text-sm text-orange-600">{win.multiplier.toFixed(1)}x</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Before</p>
                            <p className="font-semibold">${win.balanceBefore.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">After</p>
                            <p className="font-semibold text-green-500">${win.balanceAfter.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Balance History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Balance Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {session.balanceHistory.map((entry, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between border-b last:border-0">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Wagered</p>
                          <p className="font-semibold">${entry.wagered.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Won</p>
                          <p className="font-semibold">${entry.won.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Balance</p>
                          <p className="font-bold text-lg">${entry.balance.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className={`text-xs font-semibold ${entry.balanceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {entry.balanceChange >= 0 ? '+' : ''}{entry.balanceChange.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}
