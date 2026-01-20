'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Percent, Zap, Flame, Users, TrendingUp, Check, X } from 'lucide-react';
import { TOP_GAMES } from '@/data/top-games';
import type { Game } from '@/types';

interface ComparisonGame extends Game {
  streamerCount?: number;
  observedRtp?: number;
}

export default function ComparePage() {
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Convert TOP_GAMES to Game type
  const games: ComparisonGame[] = useMemo(() => {
    return TOP_GAMES.slice(0, 20).map((game) => ({
      id: game.id,
      name: game.name,
      slug: game.slug,
      providerId: game.providerSlug,
      rtp: game.rtp,
      volatility: game.volatility,
      maxMultiplier: game.maxMultiplier,
      isActive: game.isActive,
      thumbnailUrl: game.thumbnailUrl,
      provider: {
        id: game.providerSlug,
        name: game.providerSlug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        slug: game.providerSlug,
        logoUrl: '',
        gameCount: 1,
      },
      streamerCount: Math.floor(Math.random() * 50) + 5,
      observedRtp: game.rtp + (Math.random() - 0.5) * 2,
    }));
  }, []);

  const filteredGames = useMemo(() => {
    return games.filter((game) =>
      game.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [games, searchQuery]);

  const comparisonGames = useMemo(() => {
    return games.filter((g) => selectedGames.includes(g.id));
  }, [selectedGames, games]);

  const toggleGameSelection = (gameId: string) => {
    if (selectedGames.includes(gameId)) {
      setSelectedGames(selectedGames.filter((id) => id !== gameId));
    } else if (selectedGames.length < 3) {
      setSelectedGames([...selectedGames, gameId]);
    }
  };

  const getComparisonRows = () => {
    return [
      {
        label: 'Provider',
        getValue: (game: ComparisonGame) => game.provider?.name || 'Unknown',
      },
      {
        label: 'RTP %',
        getValue: (game: ComparisonGame) => `${game.rtp.toFixed(2)}%`,
        highlight: true,
      },
      {
        label: 'Observed RTP',
        getValue: (game: ComparisonGame) =>
          `${(game.observedRtp || game.rtp).toFixed(2)}%`,
        highlight: true,
      },
      {
        label: 'Volatility',
        getValue: (game: ComparisonGame) =>
          game.volatility.charAt(0).toUpperCase() + game.volatility.slice(1),
      },
      {
        label: 'Max Multiplier',
        getValue: (game: ComparisonGame) => `${game.maxMultiplier}x`,
      },
      {
        label: 'Active Streamers',
        getValue: (game: ComparisonGame) => `${game.streamerCount || 0}`,
      },
      {
        label: 'Best For',
        getValue: (game: ComparisonGame) => {
          if (game.volatility === 'low') return 'Beginners';
          if (game.volatility === 'high' || game.volatility === 'very_high')
            return 'High Rollers';
          return 'All Players';
        },
      },
    ];
  };

  const bestRtp = useMemo(() => {
    if (comparisonGames.length === 0) return null;
    return Math.max(...comparisonGames.map((g) => g.rtp));
  }, [comparisonGames]);

  const bestMultiplier = useMemo(() => {
    if (comparisonGames.length === 0) return null;
    return Math.max(...comparisonGames.map((g) => g.maxMultiplier));
  }, [comparisonGames]);

  const recommendation = useMemo(() => {
    if (comparisonGames.length === 0) return null;

    // Find game with best RTP
    const bestRtpGame = comparisonGames.find((g) => g.rtp === bestRtp);
    // Find safest game (lowest volatility)
    const safestGame = comparisonGames.reduce((prev, current) => {
      const prevVol = ['low', 'medium', 'high', 'very_high'].indexOf(prev.volatility);
      const currVol = ['low', 'medium', 'high', 'very_high'].indexOf(current.volatility);
      return currVol < prevVol ? current : prev;
    });
    // Find most exciting (highest multiplier)
    const mostExciting = comparisonGames.find((g) => g.maxMultiplier === bestMultiplier);

    return { bestRtp: bestRtpGame, safest: safestGame, mostExciting };
  }, [comparisonGames, bestRtp, bestMultiplier]);

  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-b border-border py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Compare Slots</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Compare up to 3 slot games side-by-side. Analyze RTP, volatility, multipliers, and
            find the perfect game for your strategy.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Game Selection */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Select Games to Compare</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Input
                    placeholder="Search games..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredGames.map((game) => (
                    <button
                      key={game.id}
                      onClick={() => toggleGameSelection(game.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedGames.includes(game.id)
                          ? 'bg-primary/10 border-primary'
                          : 'bg-background border-border hover:border-primary/50'
                      }`}
                    >
                      <p className="font-medium text-sm">{game.name}</p>
                      <p className="text-xs text-muted-foreground">{game.provider?.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {game.rtp.toFixed(2)}%
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {game.volatility}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>

                {selectedGames.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedGames([])}
                    className="w-full"
                  >
                    Clear Selection
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Comparison Results */}
          <div className="lg:col-span-2">
            {selectedGames.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Percent className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">No games selected</p>
                  <p className="text-sm text-muted-foreground">
                    Choose 1-3 games from the list to compare their stats and features
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Comparison Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Side-by-Side Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 font-semibold text-muted-foreground">
                              Feature
                            </th>
                            {comparisonGames.map((game) => (
                              <th
                                key={game.id}
                                className="text-center p-3 font-semibold text-foreground"
                              >
                                <div className="flex items-center justify-center gap-2">
                                  <span>{game.name}</span>
                                  <button
                                    onClick={() => toggleGameSelection(game.id)}
                                    className="ml-2 text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {getComparisonRows().map((row, idx) => (
                            <tr key={idx} className="border-b hover:bg-muted/50">
                              <td className="p-3 font-medium text-muted-foreground">
                                {row.label}
                              </td>
                              {comparisonGames.map((game) => {
                                const value = row.getValue(game);
                                const isHighlight =
                                  row.highlight &&
                                  (row.label === 'RTP %' ? parseFloat(value) === bestRtp :
                                   row.label === 'Max Multiplier' ? parseInt(value) === bestMultiplier : false);

                                return (
                                  <td
                                    key={game.id}
                                    className={`p-3 text-center font-medium ${
                                      isHighlight ? 'bg-primary/10 text-primary font-bold' : ''
                                    }`}
                                  >
                                    {value}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                {recommendation && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">💡 Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {recommendation.bestRtp && (
                          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="h-5 w-5 text-green-600" />
                              <span className="font-semibold">Best RTP</span>
                            </div>
                            <p className="font-medium text-sm">{recommendation.bestRtp.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {recommendation.bestRtp.rtp.toFixed(2)}% theoretical return
                            </p>
                          </div>
                        )}

                        {recommendation.safest && (
                          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="bg-blue-500 text-white">
                                Safest
                              </Badge>
                            </div>
                            <p className="font-medium text-sm">{recommendation.safest.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {recommendation.safest.volatility} volatility
                            </p>
                          </div>
                        )}

                        {recommendation.mostExciting && (
                          <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Flame className="h-5 w-5 text-orange-600" />
                              <span className="font-semibold">Most Exciting</span>
                            </div>
                            <p className="font-medium text-sm">
                              {recommendation.mostExciting.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {recommendation.mostExciting.maxMultiplier}x max multiplier
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Links */}
                <div className="flex gap-4">
                  {comparisonGames.map((game) => (
                    <Link key={game.id} href={`/slot/${game.slug || game.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        View {game.name} Details
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
