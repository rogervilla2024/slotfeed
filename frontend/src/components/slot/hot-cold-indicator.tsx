'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface HotColdIndicatorProps {
  status: 'hot' | 'neutral' | 'cold';
  score: number; // -100 to 100
  recentRtp: number;
  historicalRtp: number;
  recentBigWins: number;
  avgBigWins: number;
  lastUpdated: Date;
  className?: string;
}

export function HotColdIndicator({
  status,
  score,
  recentRtp,
  historicalRtp,
  recentBigWins,
  avgBigWins,
  lastUpdated,
  className,
}: HotColdIndicatorProps) {
  const getStatusConfig = () => {
    if (status === 'hot') {
      return {
        label: 'HOT',
        description: 'Slot is paying above average',
        bgColor: 'bg-gradient-to-r from-orange-500 to-red-500',
        textColor: 'text-orange-500',
        icon: '🔥',
      };
    }
    if (status === 'cold') {
      return {
        label: 'COLD',
        description: 'Slot is paying below average',
        bgColor: 'bg-gradient-to-r from-blue-500 to-cyan-500',
        textColor: 'text-blue-500',
        icon: '❄️',
      };
    }
    return {
      label: 'NEUTRAL',
      description: 'Slot is paying as expected',
      bgColor: 'bg-gradient-to-r from-gray-400 to-gray-500',
      textColor: 'text-muted-foreground',
      icon: '⚖️',
    };
  };

  const config = getStatusConfig();

  // Calculate gauge position (0-100)
  const gaugePosition = ((score + 100) / 200) * 100;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Hot/Cold Indicator</CardTitle>
          <Badge
            className={`${config.bgColor} text-white border-0`}
          >
            {config.icon} {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main gauge */}
        <div className="relative">
          {/* Gauge background */}
          <div className="h-4 rounded-full bg-gradient-to-r from-blue-500 via-gray-400 to-red-500" />

          {/* Gauge marker */}
          <div
            className="absolute top-0 -translate-x-1/2 transition-all duration-500"
            style={{ left: `${gaugePosition}%` }}
          >
            <div className="w-6 h-6 -mt-1 bg-white border-2 border-primary rounded-full shadow-lg flex items-center justify-center">
              <div className="w-2 h-2 bg-primary rounded-full" />
            </div>
          </div>

          {/* Labels */}
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Cold</span>
            <span>Neutral</span>
            <span>Hot</span>
          </div>
        </div>

        {/* Score display */}
        <div className="text-center">
          <div className={`text-4xl font-bold ${config.textColor}`}>
            {score > 0 ? '+' : ''}{score}
          </div>
          <div className="text-sm text-muted-foreground">{config.description}</div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <div className="text-sm text-muted-foreground">Recent RTP (24h)</div>
            <div className={`text-lg font-semibold ${
              recentRtp > historicalRtp ? 'text-win' : recentRtp < historicalRtp ? 'text-loss' : ''
            }`}>
              {recentRtp.toFixed(2)}%
            </div>
            <div className="text-xs text-muted-foreground">
              vs {historicalRtp.toFixed(2)}% avg
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Big Wins (24h)</div>
            <div className={`text-lg font-semibold ${
              recentBigWins > avgBigWins ? 'text-win' : recentBigWins < avgBigWins ? 'text-loss' : ''
            }`}>
              {recentBigWins}
            </div>
            <div className="text-xs text-muted-foreground">
              vs {avgBigWins.toFixed(1)} avg
            </div>
          </div>
        </div>

        {/* Last updated */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
}
