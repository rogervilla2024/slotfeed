'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatCurrency, formatNumber, getTimeAgo } from '@/lib/utils';
import type { LiveStreamData } from '@/types';

interface StreamerCardProps {
  data: LiveStreamData;
}

export function StreamerCard({ data }: StreamerCardProps) {
  const { session, streamer, currentGame, viewerCount, sessionProfitLoss } = data;

  const platformBadge = {
    kick: 'kick',
    twitch: 'twitch',
    youtube: 'youtube',
  } as const;

  return (
    <Link href={`/streamer/${streamer.id}`}>
      <Card className="overflow-hidden hover:border-primary/50 transition-colors cursor-pointer active:scale-[0.98] touch-manipulation">
      <CardHeader className="pb-2 md:pb-3 p-3 md:p-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            <Avatar className="h-10 w-10 md:h-12 md:w-12 border-2 border-primary flex-shrink-0">
              <AvatarImage src={streamer.avatarUrl} alt={streamer.displayName} />
              <AvatarFallback className="text-sm md:text-base">
                {streamer.displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm md:text-base truncate">{streamer.displayName}</div>
              <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground">
                <Badge variant={platformBadge[streamer.platform]} className="text-[10px] md:text-xs px-1.5 md:px-2">
                  {streamer.platform.charAt(0).toUpperCase() + streamer.platform.slice(1)}
                </Badge>
                <span className="truncate">{formatNumber(viewerCount)} viewers</span>
              </div>
            </div>
          </div>
          <Badge variant="live" className="gap-1 flex-shrink-0 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="hidden sm:inline">LIVE</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 md:space-y-4 p-3 pt-0 md:p-6 md:pt-0">
        {currentGame && (
          <div className="flex items-center gap-2 text-xs md:text-sm">
            <span className="text-muted-foreground">Playing:</span>
            <span className="font-medium truncate">{currentGame.name}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 md:gap-4">
          <div>
            <div className="text-[10px] md:text-xs text-muted-foreground">Current Balance</div>
            <div className="text-base md:text-lg font-semibold">
              {formatCurrency(session.currentBalance)}
            </div>
          </div>
          <div>
            <div className="text-[10px] md:text-xs text-muted-foreground">Session P/L</div>
            <div
              className={`text-base md:text-lg font-semibold ${
                sessionProfitLoss.isProfit ? 'text-win' : 'text-loss'
              }`}
            >
              {sessionProfitLoss.isProfit ? '+' : ''}
              {formatCurrency(sessionProfitLoss.amount)}
              <span className="text-[10px] md:text-xs ml-0.5 md:ml-1">
                ({sessionProfitLoss.percentage.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] md:text-xs text-muted-foreground pt-2 border-t">
          <span>Started {getTimeAgo(new Date(session.startTime))}</span>
          <span className="truncate ml-2">Wagered: {formatCurrency(session.totalWagered)}</span>
        </div>
      </CardContent>
      </Card>
    </Link>
  );
}
