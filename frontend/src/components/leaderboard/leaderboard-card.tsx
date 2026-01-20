'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatNumber } from '@/lib/utils';
import type { LeaderboardEntry } from '@/types';

interface LeaderboardCardProps {
  title: string;
  icon: string;
  entries: LeaderboardEntry[];
  valueFormatter?: (value: number) => string;
  valueLabel?: string;
  className?: string;
}

const rankColors: Record<number, string> = {
  1: 'text-amber-400',
  2: 'text-gray-300',
  3: 'text-amber-600',
};

const rankEmojis: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

export function LeaderboardCard({
  title,
  icon,
  entries,
  valueFormatter = formatNumber,
  valueLabel = '',
  className,
}: LeaderboardCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span>{icon}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            No data available
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <Link
                key={`${entry.streamerId}-${entry.rank}`}
                href={`/streamer/${entry.streamer.username || entry.streamerId}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer block"
              >
                {/* Rank */}
                <div className={`w-8 text-center font-bold ${rankColors[entry.rank] || ''}`}>
                  {rankEmojis[entry.rank] || `#${entry.rank}`}
                </div>

                {/* Avatar */}
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={entry.streamer.avatarUrl}
                    alt={entry.streamer.displayName}
                  />
                  <AvatarFallback className="text-xs">
                    {entry.streamer.displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Name and platform */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {entry.streamer.displayName}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={entry.streamer.platform as 'kick' | 'twitch' | 'youtube'}
                      className="text-xs"
                    >
                      {entry.streamer.platform}
                    </Badge>
                    {entry.streamer.isLive && (
                      <Badge variant="live" className="text-xs gap-1">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                        </span>
                        Live
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Value */}
                <div className="text-right">
                  <div className="font-bold text-win">
                    {valueFormatter(entry.value)}
                    {valueLabel}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function LeaderboardCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="h-6 w-32 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <div className="w-8 h-6 bg-muted animate-pulse rounded" />
              <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-24 bg-muted animate-pulse rounded mb-1" />
                <div className="h-4 w-16 bg-muted animate-pulse rounded" />
              </div>
              <div className="h-6 w-20 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
