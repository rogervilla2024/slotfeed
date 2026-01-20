'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ChevronDown, ChevronUp, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { BalanceHistoryChart } from '@/components/charts/balance-history-chart';
import type { BalanceDataPoint } from '@/types/charts';

interface SessionData {
  id: string;
  streamerId: string;
  streamerName: string;
  startTime: string;
  endTime?: string;
  status: 'live' | 'ended';
  startBalance: number;
  endBalance: number;
  peakBalance: number;
  lowestBalance: number;
  profitLoss: number;
  totalWagered: number;
  totalWon: number;
}

interface SessionsResponse {
  gameId: string;
  sessions: SessionData[];
  total: number;
  skip: number;
  limit: number;
}

interface SessionHistoryListProps {
  gameId: string;
  gameName: string;
}

export function SessionHistoryList({ gameId, gameName }: SessionHistoryListProps) {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [sessionBalances, setSessionBalances] = useState<Record<string, BalanceDataPoint[]>>({});

  useEffect(() => {
    fetchSessions();
  }, [gameId]);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/sessions/game/${gameId}?limit=50`);
      if (response.ok) {
        const data: SessionsResponse = await response.json();
        setSessions(data.sessions);
      } else {
        setError('Failed to load session history');
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      setError('Failed to load session history');
    } finally {
      setLoading(false);
    }
  };

  const toggleSession = async (sessionId: string) => {
    const newExpanded = new Set(expandedSessions);

    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
      // Fetch balance history if not already loaded
      if (!sessionBalances[sessionId]) {
        await fetchBalanceHistory(sessionId);
      }
    }

    setExpandedSessions(newExpanded);
  };

  const fetchBalanceHistory = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/v1/sessions/${sessionId}/balance-history?limit=500`);
      if (response.ok) {
        const data = await response.json();
        const history = data.history || [];

        // Transform to BalanceDataPoint format
        const balancePoints: BalanceDataPoint[] = history.map((point: any, idx: number) => ({
          timestamp: new Date(point.timestamp || point.time).getTime(),
          balance: point.balance || point.amount || 0,
          change: idx === 0 ? 0 : (point.balance || 0) - (history[idx - 1]?.balance || 0),
          changePercent: idx === 0 ? 0 : ((point.balance || 0) - (history[0]?.balance || 0)) / (history[0]?.balance || 1) * 100,
          bet: point.bet,
          win: point.win,
          gameId: gameId,
          description: point.description,
        }));

        setSessionBalances((prev) => ({
          ...prev,
          [sessionId]: balancePoints,
        }));
      }
    } catch (err) {
      console.error(`Failed to fetch balance history for session ${sessionId}:`, err);
    }
  };

  const formatCurrency = (value: number): string => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-500/10 border-red-500/20">
        <CardContent className="flex items-start gap-3 pt-6">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-500">{error}</p>
            <Button onClick={() => fetchSessions()} variant="outline" size="sm" className="mt-3">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">
          <p className="text-lg font-semibold">No Session History</p>
          <p className="text-sm mt-2">
            Session history for {gameName} will appear here when streamers play this game on tracked streams.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Session History</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {sessions.length} tracked session{sessions.length !== 1 ? 's' : ''} of {gameName}
          </p>
        </div>
        <Button onClick={() => fetchSessions()} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {sessions.map((session) => {
          const isExpanded = expandedSessions.has(session.id);
          const profitLoss = session.endBalance - session.startBalance;
          const profitPercent = session.startBalance > 0 ? (profitLoss / session.startBalance) * 100 : 0;
          const isProfit = profitLoss >= 0;
          const balanceData = sessionBalances[session.id] || [];

          return (
            <Card key={session.id} className="overflow-hidden">
              <button
                onClick={() => toggleSession(session.id)}
                className="w-full text-left p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-muted-foreground truncate">
                      {session.streamerName}
                    </p>
                    <p className="text-sm text-foreground font-semibold">{formatDate(session.startTime)}</p>
                  </div>

                  <div className="text-right md:text-left">
                    <p className="text-xs text-muted-foreground">Start Balance</p>
                    <p className="text-sm font-medium">{formatCurrency(session.startBalance)}</p>
                  </div>

                  <div className="text-right md:text-left">
                    <p className="text-xs text-muted-foreground">End Balance</p>
                    <p className="text-sm font-medium">{formatCurrency(session.endBalance)}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">P/L</p>
                    <div className={`text-sm font-semibold flex items-center gap-1 justify-end`}>
                      {isProfit ? (
                        <TrendingUp className="h-4 w-4 text-success" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-danger" />
                      )}
                      <span className={isProfit ? 'text-success' : 'text-danger'}>
                        {isProfit ? '+' : ''}{formatCurrency(profitLoss)} ({profitPercent.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="ml-4">
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-border px-4 py-4 bg-muted/30">
                  <div className="space-y-4">
                    {/* Balance History Chart */}
                    {balanceData.length > 0 ? (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Balance History</h4>
                        <BalanceHistoryChart
                          data={balanceData}
                          height={250}
                          responsive={true}
                        />
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Skeleton className="h-48 rounded-lg" />
                      </div>
                    )}

                    {/* Session Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
                      <div className="p-3 bg-card border rounded-lg">
                        <p className="text-xs text-muted-foreground">Peak Balance</p>
                        <p className="text-sm font-semibold mt-1">{formatCurrency(session.peakBalance)}</p>
                      </div>
                      <div className="p-3 bg-card border rounded-lg">
                        <p className="text-xs text-muted-foreground">Lowest Balance</p>
                        <p className="text-sm font-semibold mt-1">{formatCurrency(session.lowestBalance)}</p>
                      </div>
                      <div className="p-3 bg-card border rounded-lg">
                        <p className="text-xs text-muted-foreground">Total Wagered</p>
                        <p className="text-sm font-semibold mt-1">{formatCurrency(session.totalWagered)}</p>
                      </div>
                      <div className="p-3 bg-card border rounded-lg">
                        <p className="text-xs text-muted-foreground">Total Won</p>
                        <p className="text-sm font-semibold mt-1">{formatCurrency(session.totalWon)}</p>
                      </div>
                    </div>

                    {/* Session Duration */}
                    {session.endTime && (
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        <p>
                          Session duration:{' '}
                          {(() => {
                            const start = new Date(session.startTime).getTime();
                            const end = new Date(session.endTime!).getTime();
                            const minutes = Math.round((end - start) / 60000);
                            const hours = Math.floor(minutes / 60);
                            const mins = minutes % 60;
                            return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                          })()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
