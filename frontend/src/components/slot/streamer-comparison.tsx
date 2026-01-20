'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface StreamerSlotStats {
  streamerId: string;
  streamerName: string;
  avatarUrl?: string;
  platform: 'kick' | 'twitch' | 'youtube';
  sessionsPlayed: number;
  totalWagered: number;
  totalWon: number;
  observedRtp: number;
  biggestWin: number;
  biggestMultiplier: number;
  lastPlayed: Date;
}

interface StreamerComparisonProps {
  gameName: string;
  streamers: StreamerSlotStats[];
  className?: string;
}

export function StreamerComparison({
  gameName,
  streamers,
  className,
}: StreamerComparisonProps) {
  // Sort by observed RTP (highest first)
  const sortedStreamers = [...streamers].sort((a, b) => b.observedRtp - a.observedRtp);

  const getRtpColor = (rtp: number) => {
    if (rtp >= 98) return 'text-win';
    if (rtp <= 94) return 'text-loss';
    return '';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Streamer Comparison on {gameName}</CardTitle>
      </CardHeader>
      <CardContent>
        {streamers.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No streamer data available for this game yet.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header row */}
            <div className="grid grid-cols-7 gap-4 text-xs text-muted-foreground font-medium pb-2 border-b">
              <div className="col-span-2">Streamer</div>
              <div className="text-right">Sessions</div>
              <div className="text-right">Wagered</div>
              <div className="text-right">RTP</div>
              <div className="text-right">Biggest Win</div>
              <div className="text-right">Max Multi</div>
            </div>

            {/* Streamer rows */}
            {sortedStreamers.map((streamer, index) => {
              const pl = streamer.totalWon - streamer.totalWagered;
              const isProfit = pl >= 0;

              return (
                <div
                  key={streamer.streamerId}
                  className="grid grid-cols-7 gap-4 items-center py-2 hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <div className="col-span-2 flex items-center gap-3">
                    <div className="text-lg font-bold text-muted-foreground w-6">
                      #{index + 1}
                    </div>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={streamer.avatarUrl} alt={streamer.streamerName} />
                      <AvatarFallback className="text-xs">
                        {streamer.streamerName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">{streamer.streamerName}</div>
                      <Badge variant="secondary" className="text-xs">
                        {streamer.platform}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-medium">{streamer.sessionsPlayed}</div>
                  </div>

                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(streamer.totalWagered)}</div>
                    <div className={`text-xs ${isProfit ? 'text-win' : 'text-loss'}`}>
                      {isProfit ? '+' : ''}{formatCurrency(pl)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`font-medium ${getRtpColor(streamer.observedRtp)}`}>
                      {streamer.observedRtp.toFixed(2)}%
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-medium text-win">
                      {formatCurrency(streamer.biggestWin)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-medium">
                      {formatNumber(streamer.biggestMultiplier)}x
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
