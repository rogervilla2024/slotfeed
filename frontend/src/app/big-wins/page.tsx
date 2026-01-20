'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Trophy, Zap, Users } from 'lucide-react';
import {
  BigWinsListStructuredData,
  BigWinsDailySummary,
  WebPageStructuredData,
} from '@/components/seo';

interface BigWin {
  id: string;
  streamerName: string;
  gameName: string;
  amount: number;
  multiplier: number;
  timestamp: string;
  platform: string;
  videoUrl: string;
}

export default function BigWinsPage() {
  const [bigWins, setBigWins] = useState<BigWin[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'multiplier' | 'amount' | 'recent'>('multiplier');

  useEffect(() => {
    const fetchBigWins = async () => {
      try {
        const { getBigWins } = await import('@/lib/api-client');
        const response = await getBigWins();
        if (response.data) {
          setBigWins(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch big wins:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBigWins();
    const interval = setInterval(fetchBigWins, 60000);
    return () => clearInterval(interval);
  }, []);

  const sortedWins = useMemo(() => {
    const sorted = [...bigWins];
    if (sortBy === 'multiplier') {
      sorted.sort((a, b) => b.multiplier - a.multiplier);
    } else if (sortBy === 'amount') {
      sorted.sort((a, b) => b.amount - a.amount);
    } else {
      sorted.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    return sorted;
  }, [bigWins, sortBy]);

  const recordByMultiplier = useMemo(() => {
    return sortedWins[0];
  }, [sortedWins]);

  const recordByAmount = useMemo(() => {
    return [...bigWins].sort((a, b) => b.amount - a.amount)[0];
  }, [bigWins]);

  const topStreamers = useMemo(() => {
    const streamerMap: { [key: string]: { count: number; totalWins: number } } = {};
    bigWins.forEach((win) => {
      if (!streamerMap[win.streamerName]) {
        streamerMap[win.streamerName] = { count: 0, totalWins: 0 };
      }
      streamerMap[win.streamerName].count++;
      streamerMap[win.streamerName].totalWins += win.amount;
    });
    return Object.entries(streamerMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.totalWins - a.totalWins)
      .slice(0, 5);
  }, [bigWins]);

  const gameBreakdown = useMemo(() => {
    const gameMap: { [key: string]: { count: number; totalWins: number } } = {};
    bigWins.forEach((win) => {
      if (!gameMap[win.gameName]) {
        gameMap[win.gameName] = { count: 0, totalWins: 0 };
      }
      gameMap[win.gameName].count++;
      gameMap[win.gameName].totalWins += win.amount;
    });
    return Object.entries(gameMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.totalWins - a.totalWins)
      .slice(0, 10);
  }, [bigWins]);

  // Prepare data for SEO structured data
  const today = new Date().toISOString().split('T')[0];
  const bigWinsForSchema = sortedWins.slice(0, 10).map((win) => ({
    id: win.id,
    streamerName: win.streamerName,
    gameName: win.gameName,
    amount: win.amount,
    multiplier: win.multiplier,
    timestamp: win.timestamp,
    videoUrl: win.videoUrl,
  }));

  return (
    <main className="min-h-screen bg-background">
      {/* SEO Structured Data */}
      <WebPageStructuredData
        name="Big Wins Gallery - SlotFeed"
        description="Watch the biggest slot wins from top streamers. Browse massive multipliers, record payouts, and celebrate the biggest moments on stream."
        url="https://slotfeed.com/big-wins"
        type="CollectionPage"
        breadcrumbs={[
          { name: 'Home', url: 'https://slotfeed.com' },
          { name: 'Big Wins', url: 'https://slotfeed.com/big-wins' },
        ]}
      />
      <BigWinsListStructuredData
        title="Biggest Slot Wins - Today's Highlights"
        wins={bigWinsForSchema}
        sortedBy={sortBy}
      />
      {recordByMultiplier && (
        <BigWinsDailySummary
          date={today}
          totalWins={bigWins.length}
          biggestWinAmount={recordByAmount?.amount || 0}
          biggestWinStreamer={recordByAmount?.streamerName || ''}
          biggestWinGame={recordByAmount?.gameName || ''}
          biggestMultiplier={recordByMultiplier?.multiplier || 0}
        />
      )}

      <section className="bg-gradient-to-r from-primary/10 to-orange-500/10 border-b border-border py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="h-8 w-8 text-orange-500" />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Big Wins Gallery</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Witness the most impressive wins from top streamers. Browse massive multipliers, record payouts, and celebrate the biggest moments on stream.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Largest Multiplier</span>
                <Trophy className="h-4 w-4 text-orange-500" />
              </div>
              {recordByMultiplier && (
                <>
                  <p className="text-3xl font-bold text-orange-500">{recordByMultiplier.multiplier.toFixed(1)}x</p>
                  <p className="text-xs text-muted-foreground mt-2">{recordByMultiplier.streamerName} on {recordByMultiplier.gameName}</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Largest Payout</span>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              {recordByAmount && (
                <>
                  <p className="text-3xl font-bold text-green-500">${recordByAmount.amount.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-2">{recordByAmount.streamerName} ({recordByAmount.multiplier.toFixed(1)}x)</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Big Wins</span>
                <Users className="h-4 w-4 text-primary" />
              </div>
              <p className="text-3xl font-bold">{bigWins.length}</p>
              <p className="text-xs text-muted-foreground mt-2">In the last 24 hours</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="gallery" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="gallery">Big Wins Gallery</TabsTrigger>
            <TabsTrigger value="streamers">Top Streamers</TabsTrigger>
            <TabsTrigger value="games">By Game</TabsTrigger>
          </TabsList>

          <TabsContent value="gallery" className="space-y-6">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={sortBy === 'multiplier' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('multiplier')}
              >
                Highest Multiplier
              </Button>
              <Button
                variant={sortBy === 'amount' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('amount')}
              >
                Highest Amount
              </Button>
              <Button
                variant={sortBy === 'recent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('recent')}
              >
                Most Recent
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {loading ? (
                <div className="col-span-2 text-center py-12">
                  <p className="text-muted-foreground">Loading big wins...</p>
                </div>
              ) : sortedWins.length === 0 ? (
                <div className="col-span-2 text-center py-12">
                  <p className="text-muted-foreground">No big wins found</p>
                </div>
              ) : (
                sortedWins.map((win, idx) => (
                  <Card key={win.id} className="overflow-hidden hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{win.platform.toUpperCase()}</Badge>
                            {idx === 0 && sortBy === 'multiplier' && (
                              <Badge className="bg-orange-500">RECORD</Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg">{win.gameName}</CardTitle>
                          <p className="text-sm text-muted-foreground">{win.streamerName}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-orange-500/10 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground mb-1">Multiplier</p>
                          <p className="text-2xl font-bold text-orange-500">{win.multiplier.toFixed(1)}x</p>
                        </div>
                        <div className="bg-green-500/10 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground mb-1">Payout</p>
                          <p className="text-2xl font-bold text-green-500">${win.amount.toFixed(0)}</p>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        {new Date(win.timestamp).toLocaleDateString()} at {new Date(win.timestamp).toLocaleTimeString()}
                      </div>

                      <Link href={win.videoUrl} target="_blank">
                        <Button variant="outline" className="w-full" size="sm">
                          Watch Clip
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="streamers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Streamers by Total Wins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topStreamers.map((streamer, idx) => (
                    <div
                      key={streamer.name}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-lg font-bold">
                          #{idx + 1}
                        </Badge>
                        <div>
                          <Link href={`/streamer/${streamer.name.toLowerCase()}`}>
                            <p className="font-semibold hover:text-primary transition-colors">{streamer.name}</p>
                          </Link>
                          <p className="text-sm text-muted-foreground">{streamer.count} big wins</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-green-500">${streamer.totalWins.toFixed(0)}</p>
                        <p className="text-xs text-muted-foreground">Total winnings</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="games" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Big Wins by Game</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {gameBreakdown.map((game) => (
                    <div key={game.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Link href={`/slot/${game.name.toLowerCase().replace(/\s+/g, '-')}`}>
                          <p className="font-medium hover:text-primary transition-colors">{game.name}</p>
                        </Link>
                        <Badge variant="outline">{game.count} wins</Badge>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full"
                          style={{
                            width: `${
                              (game.totalWins /
                                (gameBreakdown[0]?.totalWins || 1)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">${game.totalWins.toFixed(0)} total</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}
