'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export interface BonusHuntStatsData {
  totalCost: number;
  totalPayout: number;
  profitLoss: number;
  roiPercentage?: number;
  bonusCount: number;
  bonusesOpened: number;
  bonusesRemaining: number;
  bestMultiplier?: number;
  worstMultiplier?: number;
  avgMultiplier?: number;
  currentAvgNeeded?: number;
}

interface BonusHuntStatsProps {
  stats: BonusHuntStatsData;
  status: 'collecting' | 'opening' | 'completed' | 'cancelled';
}

export function BonusHuntStats({ stats, status }: BonusHuntStatsProps) {
  const isProfit = stats.profitLoss >= 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatMultiplier = (value?: number) => {
    if (value === undefined || value === null) return 'N/A';
    return `${value.toFixed(2)}x`;
  };

  const progressPercentage = stats.bonusCount > 0
    ? (stats.bonusesOpened / stats.bonusCount) * 100
    : 0;

  return (
    <div className="space-y-4">
      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/60 border-slate-700/50">
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500 uppercase">Total Cost</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalCost)}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/60 border-slate-700/50">
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500 uppercase">Total Payout</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalPayout)}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/60 border-slate-700/50">
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500 uppercase">Profit/Loss</p>
            <p className={`text-2xl font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
              {isProfit ? '+' : ''}{formatCurrency(stats.profitLoss)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/60 border-slate-700/50">
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500 uppercase">ROI</p>
            <p className={`text-2xl font-bold ${stats.roiPercentage && stats.roiPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.roiPercentage !== undefined ? `${stats.roiPercentage.toFixed(1)}%` : 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card className="bg-slate-800/60 border-slate-700/50">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Opening Progress</span>
            <span className="text-sm text-white">
              {stats.bonusesOpened} / {stats.bonusCount} opened
            </span>
          </div>
          <div className="w-full h-4 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          {stats.bonusesRemaining > 0 && (
            <p className="text-xs text-slate-500 mt-2">
              {stats.bonusesRemaining} bonuses remaining
            </p>
          )}
        </CardContent>
      </Card>

      {/* Multiplier Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/60 border-slate-700/50">
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500 uppercase">Best Multiplier</p>
            <p className="text-xl font-bold text-green-400">{formatMultiplier(stats.bestMultiplier)}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/60 border-slate-700/50">
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500 uppercase">Worst Multiplier</p>
            <p className="text-xl font-bold text-red-400">{formatMultiplier(stats.worstMultiplier)}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/60 border-slate-700/50">
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500 uppercase">Avg Multiplier</p>
            <p className="text-xl font-bold text-white">{formatMultiplier(stats.avgMultiplier)}</p>
          </CardContent>
        </Card>

        {status === 'opening' && stats.currentAvgNeeded !== undefined && stats.currentAvgNeeded > 0 && (
          <Card className="bg-slate-800/60 border-slate-700/50">
            <CardContent className="pt-4">
              <p className="text-xs text-slate-500 uppercase">Avg Needed (Break Even)</p>
              <p className="text-xl font-bold text-yellow-400">{formatMultiplier(stats.currentAvgNeeded)}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
