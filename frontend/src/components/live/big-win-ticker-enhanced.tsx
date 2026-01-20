'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useBigWinsLive,
  getWinTierConfig,
  formatWinAmount,
  formatMultiplier,
} from '@/lib/hooks/use-big-wins-live';

interface EnhancedBigWinTickerProps {
  limit?: number;
  autoScroll?: boolean;
  scrollInterval?: number;
  enableWebSocket?: boolean;
  onNewWin?: (win: any) => void;
  showTierBadges?: boolean;
}

export function BigWinTickerEnhanced({
  limit = 20,
  autoScroll = true,
  scrollInterval = 5000,
  enableWebSocket = true,
  onNewWin,
  showTierBadges = true,
}: EnhancedBigWinTickerProps) {
  const { recentWins, wsStatus, isLive, winCount } = useBigWinsLive({
    enableWebSocket,
    onNewWin: (win) => {
      onNewWin?.(win);
      // Animate new win
      if (containerRef.current) {
        containerRef.current.scrollLeft = 0;
      }
    },
  });

  const [scrollPosition, setScrollPosition] = useState(0);
  const [paused, setPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll effect
  useEffect(() => {
    if (!autoScroll || !containerRef.current || paused) {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
      return;
    }

    scrollIntervalRef.current = setInterval(() => {
      if (containerRef.current && !paused) {
        const maxScroll = containerRef.current.scrollWidth - containerRef.current.clientWidth;
        setScrollPosition((prev) => {
          const next = prev + containerRef.current!.clientWidth / 2;
          return next >= maxScroll ? 0 : next;
        });
      }
    }, scrollInterval);

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, [autoScroll, scrollInterval, paused]);

  // Apply scroll position
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = scrollPosition;
    }
  }, [scrollPosition]);

  const scroll = (direction: 'left' | 'right') => {
    if (!containerRef.current) return;

    const scrollAmount = containerRef.current.clientWidth / 2;
    const newPosition =
      direction === 'left'
        ? Math.max(0, scrollPosition - scrollAmount)
        : Math.min(
            containerRef.current.scrollWidth - containerRef.current.clientWidth,
            scrollPosition + scrollAmount
          );

    setScrollPosition(newPosition);
  };

  const displayWins = recentWins.slice(0, limit);

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <h3 className="font-semibold">Recent Big Wins</h3>
              {isLive && (
                <Badge variant="secondary" className="animate-pulse">
                  <Zap className="h-3 w-3 mr-1" />
                  LIVE
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {winCount} wins
            </div>
          </div>

          {/* Wins ticker */}
          <div className="relative">
            <div
              ref={containerRef}
              className="flex gap-3 overflow-x-auto pb-2 scroll-smooth scrollbar-hide"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              {displayWins.length === 0 ? (
                <div className="flex items-center justify-center w-full h-24 text-muted-foreground">
                  No big wins yet today
                </div>
              ) : (
                displayWins.map((win) => {
                  const tierConfig = getWinTierConfig(win.tier);
                  return (
                    <div
                      key={win.id}
                      className="flex-shrink-0 w-64 bg-card border rounded-lg p-3 hover:bg-accent transition-colors cursor-pointer"
                    >
                      <div className="space-y-2">
                        {/* Tier badge */}
                        {showTierBadges && (
                          <Badge className={`${tierConfig.bgColor} ${tierConfig.textColor} border-0`}>
                            {tierConfig.emoji} {tierConfig.label}
                          </Badge>
                        )}

                        {/* Streamer and game */}
                        <div>
                          <p className="font-semibold text-sm">{win.streamerName}</p>
                          <p className="text-xs text-muted-foreground">{win.gameName}</p>
                        </div>

                        {/* Win details */}
                        <div className="flex items-baseline justify-between pt-1 border-t">
                          <div>
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">
                              {formatWinAmount(win.amount)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatMultiplier(win.multiplier)} multiplier
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(win.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Scroll buttons */}
            {displayWins.length > 3 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background"
                  onClick={() => scroll('left')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background"
                  onClick={() => scroll('right')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {/* Status indicator */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div>
              {isLive ? (
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  Connected to live stream
                </span>
              ) : (
                <span>Polling for updates</span>
              )}
            </div>
            {paused && <span>Paused</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
