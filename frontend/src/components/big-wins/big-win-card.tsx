'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatCurrency, formatNumber } from '@/lib/utils';
import type { BigWin } from '@/types';

type WinTier = 'big' | 'mega' | 'ultra' | 'legendary';

interface BigWinCardProps {
  bigWin: BigWin;
  className?: string;
}

const tierConfig: Record<WinTier, { label: string; color: string; emoji: string; bgClass: string }> = {
  big: {
    label: 'BIG WIN',
    color: 'text-yellow-500',
    emoji: '🎰',
    bgClass: 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20',
  },
  mega: {
    label: 'MEGA WIN',
    color: 'text-orange-500',
    emoji: '🔥',
    bgClass: 'bg-gradient-to-r from-orange-500/20 to-red-500/20',
  },
  ultra: {
    label: 'ULTRA WIN',
    color: 'text-purple-500',
    emoji: '💎',
    bgClass: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20',
  },
  legendary: {
    label: 'LEGENDARY',
    color: 'text-amber-400',
    emoji: '👑',
    bgClass: 'bg-gradient-to-r from-amber-400/20 to-yellow-500/20',
  },
};

function getTier(multiplier: number): WinTier {
  if (multiplier >= 5000) return 'legendary';
  if (multiplier >= 1000) return 'ultra';
  if (multiplier >= 500) return 'mega';
  return 'big';
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function BigWinCard({ bigWin, className }: BigWinCardProps) {
  const tier = getTier(bigWin.multiplier);
  const config = tierConfig[tier];

  return (
    <Card className={`overflow-hidden hover:border-primary/50 transition-all ${className}`}>
      {/* Screenshot or placeholder */}
      <div className={`relative h-40 ${config.bgClass} flex items-center justify-center`}>
        {bigWin.screenshotUrl ? (
          <img
            src={bigWin.screenshotUrl}
            alt={`${bigWin.multiplier}x win`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-6xl">{config.emoji}</div>
        )}

        {/* Multiplier badge */}
        <div className="absolute top-3 right-3">
          <Badge className={`${config.bgClass} ${config.color} border-0 text-lg font-bold px-3 py-1`}>
            {formatNumber(bigWin.multiplier)}x
          </Badge>
        </div>

        {/* Verified badge */}
        {bigWin.isVerified && (
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="gap-1">
              <span className="text-green-500">✓</span> Verified
            </Badge>
          </div>
        )}

        {/* Tier label */}
        <div className="absolute bottom-3 left-3">
          <Badge className={`${config.bgClass} ${config.color} border-0 font-bold`}>
            {config.emoji} {config.label}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Win amount */}
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-win">
            {formatCurrency(bigWin.winAmount)}
          </div>
          <div className="text-sm text-muted-foreground">
            from {formatCurrency(bigWin.betAmount)} bet
          </div>
        </div>

        {/* Game and streamer info */}
        <div className="flex items-center justify-between">
          {/* Streamer */}
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={bigWin.streamer?.avatarUrl} alt={bigWin.streamer?.displayName} />
              <AvatarFallback className="text-xs">
                {bigWin.streamer?.displayName?.slice(0, 2).toUpperCase() || '??'}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <div className="font-medium">{bigWin.streamer?.displayName || 'Unknown'}</div>
              <div className="text-xs text-muted-foreground">
                {bigWin.streamer?.platform || 'kick'}
              </div>
            </div>
          </div>

          {/* Game */}
          <div className="text-right">
            <div className="text-sm font-medium">{bigWin.game?.name || 'Unknown Game'}</div>
            <div className="text-xs text-muted-foreground">
              {formatTimeAgo(new Date(bigWin.timestamp))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function BigWinCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="h-40 bg-muted animate-pulse" />
      <CardContent className="p-4">
        <div className="text-center mb-4">
          <div className="h-8 w-32 mx-auto bg-muted animate-pulse rounded" />
          <div className="h-4 w-24 mx-auto mt-2 bg-muted animate-pulse rounded" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            <div>
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              <div className="h-3 w-12 mt-1 bg-muted animate-pulse rounded" />
            </div>
          </div>
          <div className="text-right">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-3 w-16 mt-1 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
