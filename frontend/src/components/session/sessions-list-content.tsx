'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { Session, Streamer } from '@/types';

interface SessionsListContentProps {
  streamer?: Streamer;
  sessions?: Session[];
  username?: string;
  currentPage: number;
  useMockData?: boolean;
}

// Mock data
const mockStreamer: Streamer = {
  id: 'roshtein',
  username: 'roshtein',
  displayName: 'Roshtein',
  platform: 'kick',
  platformId: '1234567',
  avatarUrl: '/avatars/roshtein.jpg',
  followerCount: 362000,
  isLive: true,
  lifetimeStats: {
    totalSessions: 1250,
    totalHoursStreamed: 8500,
    totalWagered: 150000000,
    totalWon: 145000000,
    biggestWin: 2500000,
    biggestMultiplier: 25000,
    averageRtp: 96.67,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockSessions: Session[] = Array.from({ length: 20 }, (_, i) => ({
  id: `session-${i + 1}`,
  streamerId: 'roshtein',
  startTime: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000),
  endTime: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
  startBalance: 100000 + Math.random() * 200000,
  currentBalance: 80000 + Math.random() * 250000,
  peakBalance: 150000 + Math.random() * 300000,
  lowestBalance: 50000 + Math.random() * 100000,
  totalWagered: 500000 + Math.random() * 1500000,
  status: 'ended' as const,
}));

export function SessionsListContent({
  streamer: initialStreamer,
  sessions: initialSessions,
  username,
  currentPage,
  useMockData = false,
}: SessionsListContentProps) {
  const [streamer, setStreamer] = useState<Streamer | null>(initialStreamer || null);
  const [sessions, setSessions] = useState<Session[]>(initialSessions || []);
  const [isLoading, setIsLoading] = useState(!initialStreamer);

  useEffect(() => {
    if (useMockData) {
      setStreamer(mockStreamer);
      setSessions(mockSessions);
      setIsLoading(false);
    }
  }, [useMockData]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="animate-pulse">Loading sessions...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!streamer) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="py-12 text-center text-destructive">
            Streamer not found
          </CardContent>
        </Card>
      </div>
    );
  }

  const getSessionDuration = (session: Session): string => {
    const start = new Date(session.startTime);
    const end = session.endTime ? new Date(session.endTime) : new Date();
    const minutes = Math.floor((end.getTime() - start.getTime()) / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getSessionPL = (session: Session) => {
    const pl = session.currentBalance - session.startBalance;
    return {
      amount: pl,
      percentage: session.startBalance > 0 ? (pl / session.startBalance) * 100 : 0,
      isProfit: pl >= 0,
    };
  };

  // Calculate summary stats
  const totalProfit = sessions.reduce(
    (sum, s) => sum + (s.currentBalance - s.startBalance),
    0
  );
  const profitableSessions = sessions.filter(
    (s) => s.currentBalance >= s.startBalance
  ).length;
  const winRate = sessions.length > 0 ? (profitableSessions / sessions.length) * 100 : 0;

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Back Navigation */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/streamer/${streamer.username}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {streamer.displayName}
          </Link>
        </Button>
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {streamer.displayName} Session History
          </h1>
          <p className="text-muted-foreground">
            {streamer.lifetimeStats?.totalSessions || sessions.length} total sessions
          </p>
        </div>

        <div className="flex gap-4">
          <Card className="px-4 py-2">
            <div className="text-sm text-muted-foreground">Win Rate</div>
            <div className="text-xl font-bold">{winRate.toFixed(0)}%</div>
          </Card>
          <Card className="px-4 py-2">
            <div className="text-sm text-muted-foreground">Page Total</div>
            <div
              className={`text-xl font-bold ${
                totalProfit >= 0 ? 'text-win' : 'text-loss'
              }`}
            >
              {totalProfit >= 0 ? '+' : ''}
              {formatCurrency(totalProfit)}
            </div>
          </Card>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-3">
        {sessions.map((session) => {
          const pl = getSessionPL(session);
          const duration = getSessionDuration(session);

          return (
            <Link
              key={session.id}
              href={`/streamer/${streamer.username}/sessions/${session.id}`}
            >
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="hidden md:flex h-12 w-12 rounded-lg bg-muted items-center justify-center">
                        <Calendar className="h-6 w-6 text-muted-foreground" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">
                            {new Date(session.startTime).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                          <Badge
                            variant={session.status === 'live' ? 'live' : 'secondary'}
                          >
                            {session.status === 'live' ? 'LIVE' : 'Ended'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Duration: {duration} | Wagered: {formatCurrency(session.totalWagered)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground text-xs">Start</div>
                          <div className="font-medium">
                            {formatCurrency(session.startBalance)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs">End</div>
                          <div className="font-medium">
                            {formatCurrency(session.currentBalance)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-win" />
                            Peak
                          </div>
                          <div className="font-medium text-win">
                            {formatCurrency(session.peakBalance)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground text-xs flex items-center gap-1">
                            <TrendingDown className="h-3 w-3 text-loss" />
                            Low
                          </div>
                          <div className="font-medium text-loss">
                            {formatCurrency(session.lowestBalance)}
                          </div>
                        </div>
                      </div>

                      <div className="text-right min-w-[100px]">
                        <div
                          className={`text-lg font-bold ${
                            pl.isProfit ? 'text-win' : 'text-loss'
                          }`}
                        >
                          {pl.isProfit ? '+' : ''}
                          {formatCurrency(pl.amount)}
                        </div>
                        <div
                          className={`text-sm ${
                            pl.isProfit ? 'text-win' : 'text-loss'
                          }`}
                        >
                          {pl.isProfit ? '+' : ''}
                          {pl.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2 pt-4">
        <Button
          variant="outline"
          disabled={currentPage <= 1}
          asChild={currentPage > 1}
        >
          {currentPage > 1 ? (
            <Link href={`/streamer/${streamer.username}/sessions?page=${currentPage - 1}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Link>
          ) : (
            <>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </>
          )}
        </Button>

        <div className="flex items-center px-4">
          Page {currentPage}
        </div>

        <Button
          variant="outline"
          disabled={sessions.length < 20}
          asChild={sessions.length >= 20}
        >
          {sessions.length >= 20 ? (
            <Link href={`/streamer/${streamer.username}/sessions?page=${currentPage + 1}`}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          ) : (
            <>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
