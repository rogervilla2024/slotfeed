'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface BigWinEvent {
  id: string;
  streamerName: string;
  gameName: string;
  amount: number;
  multiplier: number;
  timestamp: string;
  platform?: string;
}

interface BigWinTickerProps {
  limit?: number;
  autoScroll?: boolean;
  scrollInterval?: number;
}

export function BigWinTicker({ limit = 10, autoScroll = true, scrollInterval = 5000 }: BigWinTickerProps) {
  const [wins, setWins] = useState<BigWinEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch big wins
  useEffect(() => {
    const fetchBigWins = async () => {
      try {
        const response = await fetch(`/api/v1/live/big-wins?limit=${limit}&sort=recent`);
        if (response.ok) {
          const data = await response.json();
          setWins(
            (Array.isArray(data) ? data : data.wins || []).map((win: any) => ({
              id: win.id,
              streamerName: win.streamer_name || win.streamerName,
              gameName: win.game_name || win.gameName,
              amount: win.amount || 0,
              multiplier: win.multiplier || 1,
              timestamp: win.created_at || win.timestamp || new Date().toISOString(),
              platform: win.platform,
            }))
          );
        }
      } catch (error) {
        console.error('Failed to fetch big wins:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBigWins();
    // Refresh every 30 seconds
    const interval = setInterval(fetchBigWins, 30000);
    return () => clearInterval(interval);
  }, [limit]);

  // Auto-scroll effect
  useEffect(() => {
    if (!autoScroll || !containerRef.current) return;

    const interval = setInterval(() => {
      if (containerRef.current) {
        const maxScroll = containerRef.current.scrollWidth - containerRef.current.clientWidth;
        setScrollPosition((prev) => {
          const next = prev + containerRef.current!.clientWidth / 2;
          return next >= maxScroll ? 0 : next;
        });
      }
    }, scrollInterval);

    return () => clearInterval(interval);
  }, [autoScroll, scrollInterval]);

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

  if (loading || wins.length === 0) {
    return null;
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return 'now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-yellow-500" />
        <h3 className="text-lg font-semibold">Recent Big Wins</h3>
        <span className="text-xs text-muted-foreground ml-auto">{wins.length} wins</span>
      </div>

      <div className="relative">
        {/* Scroll Buttons */}
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Ticker Container */}
        <div
          ref={containerRef}
          className="flex gap-3 overflow-x-auto scroll-smooth pb-2 px-8"
          style={{ scrollBehavior: 'smooth' }}
        >
          {wins.map((win) => (
            <Card
              key={win.id}
              className="flex-shrink-0 w-72 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30 hover:border-yellow-500/50 transition-colors"
            >
              <div className="p-3 space-y-2">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate text-foreground">
                      {win.streamerName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{win.gameName}</p>
                  </div>
                  <span className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold whitespace-nowrap">
                    {formatTime(win.timestamp)}
                  </span>
                </div>

                {/* Win Amount */}
                <div className="bg-yellow-500/20 rounded px-2 py-1.5 border border-yellow-500/30">
                  <p className="text-xs text-muted-foreground">Win Amount</p>
                  <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                    ${win.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Multiplier */}
                <div className="flex items-center justify-between pt-1 border-t border-yellow-500/20">
                  <span className="text-xs text-muted-foreground">Multiplier</span>
                  <span className="text-sm font-semibold text-orange-500">
                    {win.multiplier.toFixed(1)}x
                  </span>
                </div>

                {/* Platform Badge */}
                {win.platform && (
                  <div className="pt-1">
                    <span className="inline-block px-2 py-0.5 bg-muted/50 rounded text-xs text-muted-foreground capitalize">
                      {win.platform}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Auto-scroll indicator */}
      {autoScroll && (
        <p className="text-xs text-muted-foreground text-center">
          Auto-scrolling through recent big wins
        </p>
      )}
    </div>
  );
}
