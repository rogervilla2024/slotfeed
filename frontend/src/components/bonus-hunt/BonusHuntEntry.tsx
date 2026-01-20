'use client';

import { Badge } from '@/components/ui/badge';

export interface BonusHuntEntryData {
  id: string;
  bonusHuntId: string;
  gameId: string;
  gameName?: string;
  gameSlug?: string;
  position: number;
  betAmount: number;
  isOpened: boolean;
  openedAt?: string;
  payout?: number;
  multiplier?: number;
  screenshotUrl?: string;
}

interface BonusHuntEntryProps {
  entry: BonusHuntEntryData;
  onOpen?: (entryId: string) => void;
  isOpeningPhase?: boolean;
}

export function BonusHuntEntry({ entry, onOpen, isOpeningPhase }: BonusHuntEntryProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getMultiplierColor = (mult?: number) => {
    if (mult === undefined) return 'text-slate-400';
    if (mult >= 100) return 'text-yellow-400'; // Legendary
    if (mult >= 50) return 'text-purple-400'; // Ultra
    if (mult >= 20) return 'text-blue-400'; // Mega
    if (mult >= 5) return 'text-green-400'; // Big
    if (mult >= 1) return 'text-slate-300'; // Break even or profit
    return 'text-red-400'; // Loss
  };

  const getMultiplierBadge = (mult?: number) => {
    if (mult === undefined) return null;
    if (mult >= 100) return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">LEGENDARY</Badge>;
    if (mult >= 50) return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">ULTRA</Badge>;
    if (mult >= 20) return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">MEGA</Badge>;
    if (mult >= 5) return <Badge className="bg-green-500/20 text-green-400 border-green-500/50">BIG</Badge>;
    return null;
  };

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
        entry.isOpened
          ? 'bg-slate-800/40 border-slate-700/30'
          : 'bg-slate-800/60 border-slate-700/50 hover:border-purple-500/50'
      }`}
    >
      {/* Position & Game Info */}
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 flex items-center justify-center bg-slate-700 rounded-full text-sm font-bold text-white">
          {entry.position}
        </div>
        <div>
          <p className={`font-medium ${entry.isOpened ? 'text-slate-400' : 'text-white'}`}>
            {entry.gameName || 'Unknown Game'}
          </p>
          <p className="text-sm text-slate-500">
            Bet: {formatCurrency(entry.betAmount)}
          </p>
        </div>
      </div>

      {/* Result or Action */}
      <div className="flex items-center gap-4">
        {entry.isOpened ? (
          <>
            <div className="text-right">
              <p className="text-sm text-slate-500">Payout</p>
              <p className={`font-bold ${entry.payout && entry.payout >= entry.betAmount ? 'text-green-400' : 'text-red-400'}`}>
                {entry.payout !== undefined ? formatCurrency(entry.payout) : 'N/A'}
              </p>
            </div>
            <div className="text-right min-w-[80px]">
              <p className="text-sm text-slate-500">Multiplier</p>
              <p className={`font-bold ${getMultiplierColor(entry.multiplier)}`}>
                {entry.multiplier !== undefined ? `${entry.multiplier.toFixed(2)}x` : 'N/A'}
              </p>
            </div>
            {getMultiplierBadge(entry.multiplier)}
          </>
        ) : isOpeningPhase ? (
          <button
            onClick={() => onOpen?.(entry.id)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors"
          >
            Open Bonus
          </button>
        ) : (
          <Badge variant="outline" className="bg-slate-700/50 text-slate-400">
            Waiting
          </Badge>
        )}
      </div>
    </div>
  );
}

interface BonusHuntEntryListProps {
  entries: BonusHuntEntryData[];
  onOpen?: (entryId: string) => void;
  isOpeningPhase?: boolean;
}

export function BonusHuntEntryList({ entries, onOpen, isOpeningPhase }: BonusHuntEntryListProps) {
  const sortedEntries = [...entries].sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-2">
      {sortedEntries.map((entry) => (
        <BonusHuntEntry
          key={entry.id}
          entry={entry}
          onOpen={onOpen}
          isOpeningPhase={isOpeningPhase}
        />
      ))}
      {entries.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          No bonuses collected yet
        </div>
      )}
    </div>
  );
}
