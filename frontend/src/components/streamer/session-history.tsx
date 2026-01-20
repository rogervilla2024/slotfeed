'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { formatCurrency, getTimeAgo } from '@/lib/utils';
import type { Session } from '@/types';

interface SessionHistoryProps {
  sessions: Session[];
  streamerId?: string;
  className?: string;
}

export function SessionHistory({ sessions, streamerId, className }: SessionHistoryProps) {
  const [visibleCount, setVisibleCount] = useState(5);
  const username = streamerId || sessions[0]?.streamerId || 'unknown';

  const visibleSessions = sessions.slice(0, visibleCount);
  const hasMore = sessions.length > visibleCount;

  const getSessionDuration = (session: Session): string => {
    const start = new Date(session.startTime);
    const end = session.endTime ? new Date(session.endTime) : new Date();
    const minutes = Math.floor((end.getTime() - start.getTime()) / 60000);

    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getSessionPL = (session: Session) => {
    const pl = session.currentBalance - session.startBalance;
    return {
      amount: pl,
      percentage: session.startBalance > 0
        ? (pl / session.startBalance) * 100
        : 0,
      isProfit: pl >= 0,
    };
  };

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold mb-4">Session History</h3>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No sessions recorded yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visibleSessions.map((session) => {
            const pl = getSessionPL(session);
            const duration = getSessionDuration(session);
            const sessionDate = new Date(session.startTime).toISOString().split('T')[0];

            return (
              <Link
                key={session.id}
                href={`/session/${session.streamerId}/${sessionDate}/${session.id}`}
              >
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {new Date(session.startTime).toLocaleDateString('en-US', {
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

                    <div className="text-right">
                      <div
                        className={`text-lg font-semibold ${
                          pl.isProfit ? 'text-win' : 'text-loss'
                        }`}
                      >
                        {pl.isProfit ? '+' : ''}
                        {formatCurrency(pl.amount)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {pl.isProfit ? '+' : ''}
                        {pl.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t text-sm">
                    <div>
                      <div className="text-muted-foreground">Start</div>
                      <div className="font-medium">
                        {formatCurrency(session.startBalance)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">End</div>
                      <div className="font-medium">
                        {formatCurrency(session.currentBalance)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Peak</div>
                      <div className="font-medium text-win">
                        {formatCurrency(session.peakBalance)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Lowest</div>
                      <div className="font-medium text-loss">
                        {formatCurrency(session.lowestBalance)}
                      </div>
                    </div>
                  </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}

          {hasMore && (
            <div className="flex justify-center gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setVisibleCount((prev) => prev + 5)}
              >
                Load More ({sessions.length - visibleCount} remaining)
              </Button>
            </div>
          )}

          {/* View All Sessions Link */}
          <div className="flex justify-center pt-4">
            <Button variant="ghost" asChild>
              <Link href={`/streamer/${username}/sessions`}>
                View All Sessions
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
