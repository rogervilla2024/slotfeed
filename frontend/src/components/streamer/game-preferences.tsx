'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface GameStat {
  gameId: string;
  gameName: string;
  provider: string;
  sessionsPlayed: number;
  totalWagered: number;
  totalWon: number;
  biggestWin: number;
  observedRtp: number;
  theoreticalRtp: number;
}

interface GamePreferencesProps {
  games: GameStat[];
  className?: string;
}

export function GamePreferences({ games, className }: GamePreferencesProps) {
  // Sort by sessions played (most played first)
  const sortedGames = [...games].sort((a, b) => b.sessionsPlayed - a.sessionsPlayed);
  const topGames = sortedGames.slice(0, 10);

  const getRtpColor = (observed: number, theoretical: number) => {
    const diff = observed - theoretical;
    if (diff >= 2) return 'text-win';
    if (diff <= -2) return 'text-loss';
    return 'text-muted-foreground';
  };

  const getRtpBadge = (observed: number, theoretical: number) => {
    const diff = observed - theoretical;
    if (diff >= 2) return { text: 'Running Hot', variant: 'win' as const };
    if (diff <= -2) return { text: 'Running Cold', variant: 'loss' as const };
    return { text: 'Normal', variant: 'secondary' as const };
  };

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold mb-4">Game Preferences</h3>

      {games.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No game data available yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {topGames.map((game, index) => {
            const pl = game.totalWon - game.totalWagered;
            const rtpStatus = getRtpBadge(game.observedRtp, game.theoreticalRtp);

            return (
              <Card key={game.gameId} className="hover:border-primary/50 transition-colors">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold text-muted-foreground w-8">
                        #{index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{game.gameName}</div>
                        <div className="text-sm text-muted-foreground">
                          {game.provider} | {game.sessionsPlayed} sessions
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-lg font-semibold ${
                          pl >= 0 ? 'text-win' : 'text-loss'
                        }`}
                      >
                        {pl >= 0 ? '+' : ''}
                        {formatCurrency(pl)}
                      </div>
                      <Badge variant={rtpStatus.variant}>{rtpStatus.text}</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-4 mt-4 pt-4 border-t text-sm">
                    <div>
                      <div className="text-muted-foreground">Wagered</div>
                      <div className="font-medium">
                        {formatCurrency(game.totalWagered)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Won</div>
                      <div className="font-medium">
                        {formatCurrency(game.totalWon)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Biggest Win</div>
                      <div className="font-medium text-win">
                        {formatCurrency(game.biggestWin)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Observed RTP</div>
                      <div
                        className={`font-medium ${getRtpColor(
                          game.observedRtp,
                          game.theoreticalRtp
                        )}`}
                      >
                        {game.observedRtp.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Theoretical RTP</div>
                      <div className="font-medium">{game.theoreticalRtp.toFixed(2)}%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
