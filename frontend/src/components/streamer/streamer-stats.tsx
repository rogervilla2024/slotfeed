'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatNumber } from '@/lib/utils';
import type { StreamerLifetimeStats } from '@/types';

interface StreamerStatsProps {
  stats: StreamerLifetimeStats;
  className?: string;
}

export function StreamerStats({ stats, className }: StreamerStatsProps) {
  const statItems = [
    {
      label: 'Total Sessions',
      value: formatNumber(stats.totalSessions),
      description: 'Streaming sessions tracked',
    },
    {
      label: 'Hours Streamed',
      value: formatNumber(stats.totalHoursStreamed),
      description: 'Total time on stream',
    },
    {
      label: 'Total Wagered',
      value: formatCurrency(stats.totalWagered),
      description: 'Lifetime wagered amount',
    },
    {
      label: 'Total Won',
      value: formatCurrency(stats.totalWon),
      description: 'Lifetime winnings',
    },
    {
      label: 'Biggest Win',
      value: formatCurrency(stats.biggestWin),
      description: 'Single largest win',
    },
    {
      label: 'Biggest Multiplier',
      value: `${formatNumber(stats.biggestMultiplier)}x`,
      description: 'Highest multiplier achieved',
    },
    {
      label: 'Average RTP',
      value: `${stats.averageRtp.toFixed(2)}%`,
      description: 'Return to player percentage',
      highlight: stats.averageRtp >= 96,
    },
    {
      label: 'Net P/L',
      value: formatCurrency(stats.totalWon - stats.totalWagered),
      description: 'Lifetime profit/loss',
      isProfit: stats.totalWon >= stats.totalWagered,
    },
  ];

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold mb-4">Lifetime Statistics</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statItems.map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  'isProfit' in item
                    ? item.isProfit
                      ? 'text-win'
                      : 'text-loss'
                    : 'highlight' in item && item.highlight
                    ? 'text-primary'
                    : ''
                }`}
              >
                {item.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
