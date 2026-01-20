'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { HotColdBadge } from '@/components/slot/hot-cold-badge';

export interface RTPTrackerEntry {
  gameId: string;
  gameName: string;
  streamerName: string;
  currentRtp: number;
  theoreticalRtp: number;
  status: 'hot' | 'cold' | 'neutral';
  trend?: 'up' | 'down' | 'stable';
  sparkline?: number[]; // Last 10 RTP values
  lastUpdated: string;
}

interface LiveRTPWidgetProps {
  limit?: number;
  refreshInterval?: number;
}

export function LiveRTPWidget({ limit = 8, refreshInterval = 30000 }: LiveRTPWidgetProps) {
  const [entries, setEntries] = useState<RTPTrackerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRTPData = async () => {
      try {
        const response = await fetch(`/api/v1/live/rtp-tracker?limit=${limit}`);
        if (response.ok) {
          const data = await response.json();
          setEntries(Array.isArray(data) ? data : data.games || data.entries || []);
          setError(null);
        } else {
          setError('Failed to fetch RTP data');
        }
      } catch (err) {
        console.error('RTP tracker fetch failed:', err);
        setError('Failed to load RTP tracker');
      } finally {
        setLoading(false);
      }
    };

    fetchRTPData();
    const interval = setInterval(fetchRTPData, refreshInterval);
    return () => clearInterval(interval);
  }, [limit, refreshInterval]);

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-win" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-loss" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRTPColor = (current: number, theoretical: number) => {
    const diff = current - theoretical;
    if (diff > 2) return 'text-win'; // Hot
    if (diff < -2) return 'text-loss'; // Cold
    return 'text-foreground'; // Neutral
  };

  if (error) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="p-6 text-center text-muted-foreground">
          <p>Unable to load live RTP data</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-6 bg-muted rounded w-40" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="p-6 text-center text-muted-foreground">
          <p>No active streams with RTP data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Live RTP Tracker</h3>
        <p className="text-sm text-muted-foreground">Real-time observed RTP from active streams</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {entries.map((entry) => (
          <Card key={`${entry.gameId}-${entry.streamerName}`} className="hover:border-primary/50 transition-colors">
            <CardContent className="p-3 space-y-2">
              {/* Game Info */}
              <div className="space-y-1 min-h-12">
                <p className="text-xs font-semibold text-foreground truncate">{entry.gameName}</p>
                <p className="text-xs text-muted-foreground truncate">{entry.streamerName}</p>
              </div>

              {/* RTP Display */}
              <div className="bg-muted/50 rounded px-2 py-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs text-muted-foreground">RTP</span>
                  {getTrendIcon(entry.trend)}
                </div>
                <p className={`text-sm font-bold ${getRTPColor(entry.currentRtp, entry.theoreticalRtp)}`}>
                  {entry.currentRtp.toFixed(2)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  vs {entry.theoreticalRtp.toFixed(2)}%
                </p>
              </div>

              {/* Hot/Cold Status */}
              <div className="flex justify-between items-center pt-1 border-t border-border">
                <HotColdBadge status={entry.status} size="sm" />
              </div>

              {/* Sparkline (if available) */}
              {entry.sparkline && entry.sparkline.length > 0 && (
                <div className="pt-1 flex items-end gap-0.5 h-6">
                  {entry.sparkline.map((rtp, i) => {
                    const maxRtp = Math.max(...entry.sparkline!);
                    const minRtp = Math.min(...entry.sparkline!);
                    const range = maxRtp - minRtp || 1;
                    const height = ((rtp - minRtp) / range) * 20;

                    return (
                      <div
                        key={i}
                        className="flex-1 bg-primary/50 rounded-t"
                        style={{ height: `${Math.max(2, height)}px` }}
                        title={rtp.toFixed(2) + '%'}
                      />
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Updates every {Math.round(refreshInterval / 1000)}s • Last update: {new Date().toLocaleTimeString()}
      </p>
    </div>
  );
}
