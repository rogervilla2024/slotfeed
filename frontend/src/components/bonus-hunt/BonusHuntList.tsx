'use client';

import { useState } from 'react';
import { BonusHuntCard, BonusHuntSummary } from './BonusHuntCard';
import { useBonusHunts } from '@/lib/hooks/use-bonus-hunts';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type StatusFilter = 'all' | 'collecting' | 'opening' | 'completed' | 'cancelled';

export function BonusHuntList() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const { data, loading, error, total, refetch } = useBonusHunts({
    status: statusFilter === 'all' ? undefined : statusFilter,
    limit: 50,
  });

  const hunts: BonusHuntSummary[] = data.map((hunt) => ({
    id: hunt.id,
    streamerId: hunt.streamer_id,
    streamerName: hunt.streamer_name,
    gameName: hunt.game_name,
    status: hunt.status,
    startedAt: hunt.created_at,
    endedAt: hunt.completed_at,
    totalCost: hunt.total_cost,
    totalPayout: hunt.total_payout,
    roiPercentage: hunt.roi_percent,
    bonusCount: hunt.entry_count,
    bonusesOpened: hunt.opened_count,
  }));

  const statusButtons: { value: StatusFilter; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: total },
    { value: 'collecting', label: 'Collecting', count: data.filter((h) => h.status === 'collecting').length },
    { value: 'opening', label: 'Opening', count: data.filter((h) => h.status === 'opening').length },
    { value: 'completed', label: 'Completed', count: data.filter((h) => h.status === 'completed').length },
  ];

  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-500">Failed to Load Bonus Hunts</p>
            <p className="text-sm text-red-500/80 mt-1">{error}</p>
            <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-3">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 items-center">
        {statusButtons.map(({ value, label, count }) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            disabled={loading}
            className={`px-4 py-2 rounded-lg transition-colors ${
              statusFilter === value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {label}
            <span className="ml-2 text-xs opacity-75">({count})</span>
          </button>
        ))}
        <Button onClick={() => refetch()} variant="ghost" size="sm" disabled={loading} className="ml-auto">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      )}

      {!loading && (
        <>
          {hunts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {hunts.map((hunt) => (
                <BonusHuntCard key={hunt.id} hunt={hunt} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              No bonus hunts found for this filter
            </div>
          )}
        </>
      )}
    </div>
  );
}
