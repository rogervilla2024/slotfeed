'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Game } from '@/types';

interface SlotHeaderProps {
  game: Game;
  className?: string;
}

export function SlotHeader({ game, className }: SlotHeaderProps) {
  const volatilityColors = {
    low: 'bg-green-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    very_high: 'bg-red-500',
  };

  const volatilityLabels = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    very_high: 'Very High',
  };

  return (
    <div className={className}>
      <div className="flex items-start gap-6">
        {/* Game thumbnail */}
        <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center">
          {game.thumbnailUrl ? (
            <img
              src={game.thumbnailUrl}
              alt={game.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <span className="text-4xl">🎰</span>
          )}
        </div>

        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{game.name}</h1>

          <div className="flex items-center gap-3 mb-4">
            <Badge variant="secondary">{game.provider?.name || 'Unknown Provider'}</Badge>
            <Badge className={`${volatilityColors[game.volatility]} text-white border-0`}>
              {volatilityLabels[game.volatility]} Volatility
            </Badge>
            {game.isActive && (
              <Badge variant="outline" className="border-win text-win">
                Active
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-3 gap-6 text-sm">
            <div>
              <div className="text-muted-foreground">RTP</div>
              <div className="text-xl font-semibold">{game.rtp.toFixed(2)}%</div>
            </div>
            <div>
              <div className="text-muted-foreground">Max Multiplier</div>
              <div className="text-xl font-semibold">{game.maxMultiplier.toLocaleString()}x</div>
            </div>
            <div>
              <div className="text-muted-foreground">Volatility</div>
              <div className="text-xl font-semibold">{volatilityLabels[game.volatility]}</div>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <Button>Set Alert</Button>
            <Button variant="outline">View Big Wins</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
