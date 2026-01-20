'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export interface BonusHuntSummary {
  id: string;
  streamerId: string;
  streamerName?: string;
  status: 'collecting' | 'opening' | 'completed' | 'cancelled';
  startedAt: string;
  endedAt?: string;
  totalCost: number;
  totalPayout: number;
  roiPercentage?: number;
  bonusCount: number;
  bonusesOpened: number;
}

interface BonusHuntCardProps {
  hunt: BonusHuntSummary;
}

export function BonusHuntCard({ hunt }: BonusHuntCardProps) {
  const profitLoss = hunt.totalPayout - hunt.totalCost;
  const isProfit = profitLoss >= 0;

  const getStatusBadge = () => {
    switch (hunt.status) {
      case 'collecting':
        return <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/50">Collecting</Badge>;
      case 'opening':
        return <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">Opening</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-500/20 text-gray-400 border-gray-500/50">Cancelled</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Link href={`/bonus-hunt/${hunt.id}`}>
      <Card className="bg-slate-800/60 border-slate-700/50 hover:bg-slate-800/80 transition-colors cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-white">
              {hunt.streamerName || 'Unknown Streamer'}
            </CardTitle>
            {getStatusBadge()}
          </div>
          <p className="text-sm text-slate-400">{formatDate(hunt.startedAt)}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 uppercase">Total Cost</p>
              <p className="text-lg font-bold text-white">{formatCurrency(hunt.totalCost)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase">Total Payout</p>
              <p className="text-lg font-bold text-white">{formatCurrency(hunt.totalPayout)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase">Profit/Loss</p>
              <p className={`text-lg font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                {isProfit ? '+' : ''}{formatCurrency(profitLoss)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase">ROI</p>
              <p className={`text-lg font-bold ${hunt.roiPercentage && hunt.roiPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {hunt.roiPercentage !== undefined ? `${hunt.roiPercentage.toFixed(1)}%` : 'N/A'}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-slate-400">
              Bonuses: {hunt.bonusesOpened} / {hunt.bonusCount}
            </span>
            <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                style={{ width: `${hunt.bonusCount > 0 ? (hunt.bonusesOpened / hunt.bonusCount) * 100 : 0}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
