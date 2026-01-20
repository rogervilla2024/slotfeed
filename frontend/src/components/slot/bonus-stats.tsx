'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';

interface BonusStatsProps {
  totalBonuses: number;
  avgBonusValue: number;
  avgSpinsToBonous: number;
  bonusHitRate: number; // percentage
  biggestBonus: number;
  avgBonusMultiplier: number;
  className?: string;
}

export function BonusStats({
  totalBonuses,
  avgBonusValue,
  avgSpinsToBonous,
  bonusHitRate,
  biggestBonus,
  avgBonusMultiplier,
  className,
}: BonusStatsProps) {
  const stats = [
    {
      label: 'Total Bonuses',
      value: formatNumber(totalBonuses),
      description: 'Bonuses triggered',
    },
    {
      label: 'Avg Bonus Value',
      value: `$${formatNumber(avgBonusValue)}`,
      description: 'Average payout',
    },
    {
      label: 'Avg Spins to Bonus',
      value: formatNumber(avgSpinsToBonous),
      description: 'Spins between bonuses',
    },
    {
      label: 'Bonus Hit Rate',
      value: `${bonusHitRate.toFixed(2)}%`,
      description: 'Chance per spin',
    },
    {
      label: 'Biggest Bonus',
      value: `$${formatNumber(biggestBonus)}`,
      description: 'Largest payout',
      highlight: true,
    },
    {
      label: 'Avg Multiplier',
      value: `${avgBonusMultiplier.toFixed(1)}x`,
      description: 'Bonus multiplier',
    },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Bonus Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="p-4 bg-muted/50 rounded-lg"
            >
              <div className="text-sm text-muted-foreground mb-1">
                {stat.label}
              </div>
              <div className={`text-2xl font-bold ${stat.highlight ? 'text-win' : ''}`}>
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </div>
            </div>
          ))}
        </div>

        {/* Bonus frequency visualization */}
        <div className="mt-6 pt-4 border-t">
          <div className="text-sm text-muted-foreground mb-2">Bonus Frequency</div>
          <div className="flex items-center gap-2">
            <div className="text-sm">1 in</div>
            <div className="text-2xl font-bold">{Math.round(100 / bonusHitRate)}</div>
            <div className="text-sm text-muted-foreground">spins</div>
          </div>
          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.min(bonusHitRate * 10, 100)}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
