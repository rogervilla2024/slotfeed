'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, BarChart3, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface RTPGame {
  rank: number;
  name: string;
  provider: string;
  theoreticalRtp: number;
  observedRtp: number;
  sampleSize: number;
  variance: number;
  trend: 'up' | 'down' | 'stable';
}

export default function RTPInsightsPage() {
  const [selectedProvider, setSelectedProvider] = useState<string>('all');

  // Mock data
  const topRtpGames: RTPGame[] = [
    {
      rank: 1,
      name: 'Big Bass Bonanza',
      provider: 'Pragmatic Play',
      theoreticalRtp: 96.71,
      observedRtp: 96.65,
      sampleSize: 3800000,
      variance: 0.06,
      trend: 'stable',
    },
    {
      rank: 2,
      name: 'Gates of Olympus',
      provider: 'Pragmatic Play',
      theoreticalRtp: 96.50,
      observedRtp: 96.28,
      sampleSize: 4500000,
      variance: -0.22,
      trend: 'up',
    },
    {
      rank: 3,
      name: 'Sweet Bonanza',
      provider: 'Pragmatic Play',
      theoreticalRtp: 96.48,
      observedRtp: 96.51,
      sampleSize: 5000000,
      variance: 0.03,
      trend: 'stable',
    },
    {
      rank: 4,
      name: 'Fruit Party',
      provider: 'Pragmatic Play',
      theoreticalRtp: 96.47,
      observedRtp: 96.32,
      sampleSize: 2100000,
      variance: -0.15,
      trend: 'down',
    },
    {
      rank: 5,
      name: 'Wanted Dead or a Wild',
      provider: 'Hacksaw Gaming',
      theoreticalRtp: 96.38,
      observedRtp: 95.92,
      sampleSize: 2000000,
      variance: -0.46,
      trend: 'down',
    },
  ];

  const lowestRtpGames: RTPGame[] = [
    {
      rank: 1,
      name: 'Lucky Dragon',
      provider: 'Legacy Games',
      theoreticalRtp: 93.5,
      observedRtp: 92.8,
      sampleSize: 500000,
      variance: -0.7,
      trend: 'down',
    },
    {
      rank: 2,
      name: 'Gold Rush',
      provider: 'Classic Casino',
      theoreticalRtp: 94.0,
      observedRtp: 93.2,
      sampleSize: 750000,
      variance: -0.8,
      trend: 'down',
    },
    {
      rank: 3,
      name: 'Diamond Mine',
      provider: 'Retro Slots',
      theoreticalRtp: 94.5,
      observedRtp: 94.1,
      sampleSize: 600000,
      variance: -0.4,
      trend: 'stable',
    },
  ];

  const providerStats = [
    {
      name: 'Pragmatic Play',
      avgRtp: 96.43,
      gameCount: 200,
      observedRtp: 96.32,
      variance: -0.11,
    },
    {
      name: 'Hacksaw Gaming',
      avgRtp: 96.3,
      gameCount: 85,
      observedRtp: 96.0,
      variance: -0.3,
    },
    {
      name: 'Evolution Gaming',
      avgRtp: 96.08,
      gameCount: 120,
      observedRtp: 96.0,
      variance: -0.08,
    },
  ];

  const RTCGameRow = ({ game }: { game: RTPGame }) => (
    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-sm font-bold text-muted-foreground">#{game.rank}</span>
          <div>
            <p className="font-semibold">{game.name}</p>
            <p className="text-xs text-muted-foreground">{game.provider}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 text-right">
        <div>
          <p className="text-xs text-muted-foreground">Theoretical</p>
          <p className="font-bold text-primary">{game.theoreticalRtp.toFixed(2)}%</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Observed</p>
          <p className="font-bold">{game.observedRtp.toFixed(2)}%</p>
        </div>
        <div className="flex flex-col items-end">
          <p className="text-xs text-muted-foreground">Trend</p>
          <div className="flex items-center gap-1">
            {game.trend === 'up' && (
              <>
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium text-green-600">Rising</span>
              </>
            )}
            {game.trend === 'down' && (
              <>
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-xs font-medium text-red-600">Falling</span>
              </>
            )}
            {game.trend === 'stable' && (
              <>
                <span className="text-xs font-medium text-yellow-600">Stable</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-b border-border py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="h-8 w-8 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">RTP Insights</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mb-6">
            Deep dive into Return to Player statistics across all games and providers. Understand
            the difference between theoretical and observed RTP, and make informed game choices.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Data Analysis</Badge>
            <Badge variant="secondary">Advanced Statistics</Badge>
            <Badge variant="secondary">Expert Insights</Badge>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <Tabs defaultValue="top-rtp" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="top-rtp">Highest RTP</TabsTrigger>
            <TabsTrigger value="lowest-rtp">Lowest RTP</TabsTrigger>
            <TabsTrigger value="provider-analysis">By Provider</TabsTrigger>
          </TabsList>

          {/* Top RTP Games */}
          <TabsContent value="top-rtp" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Games with Highest Theoretical RTP</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-6">
                  These games return the most money to players over the long term. Higher RTP
                  doesn't guarantee wins, but it means a smaller house edge in your favor.
                </p>

                <div className="space-y-3">
                  {topRtpGames.map((game) => (
                    <RTCGameRow key={game.name} game={game} />
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-foreground">
                      <p className="font-semibold mb-1">What This Means</p>
                      <p>
                        A game with 96.7% RTP means that for every $100 wagered, approximately
                        $96.70 is returned to players (and $3.30 is the house edge). Over millions
                        of spins, RTP converges to this theoretical value.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Key Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Pragmatic Play leads in RTP</p>
                    <p className="text-sm text-muted-foreground">
                      Average 96.43% - consistently high across portfolio
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Observed vs Theoretical differences matter</p>
                    <p className="text-sm text-muted-foreground">
                      Small variances (-0.3% to +0.3%) are normal. Larger gaps suggest sample
                      size needs to grow.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <TrendingUp className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Volatility affects RTP experience</p>
                    <p className="text-sm text-muted-foreground">
                      A 96.5% RTP game plays differently at low vs high volatility. Choose based
                      on your bankroll and play style.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lowest RTP Games */}
          <TabsContent value="lowest-rtp" className="space-y-6">
            <Card className="border-red-500/20">
              <CardHeader>
                <CardTitle className="text-xl text-red-600">Games to Avoid (Lowest RTP)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-6">
                  These games have the lowest theoretical RTP. While they might occasionally pay
                  out big, your expected losses are significantly higher over time.
                </p>

                <div className="space-y-3">
                  {lowestRtpGames.map((game) => (
                    <RTCGameRow key={game.name} game={game} />
                  ))}
                </div>

                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-foreground">
                      <p className="font-semibold mb-1">⚠️ Warning</p>
                      <p>
                        Games below 95% RTP have a house edge of 5%+. For every $100 wagered, you
                        expect to lose $5 or more. These games significantly favor the casino.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">RTP Comparison: High vs Low</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="font-semibold text-sm mb-3">High RTP (96.5%)</p>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium">$100 wagered:</span> Expect to lose ~$3.50
                      </p>
                      <p>
                        <span className="font-medium">House edge:</span> 3.5% (favorable)
                      </p>
                      <p>
                        <span className="font-medium">Best for:</span> Long-term play
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="font-semibold text-sm mb-3">Low RTP (94%)</p>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium">$100 wagered:</span> Expect to lose ~$6
                      </p>
                      <p>
                        <span className="font-medium">House edge:</span> 6% (unfavorable)
                      </p>
                      <p>
                        <span className="font-medium">Best for:</span> Avoid if possible
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-4">
                  Over 10,000 spins, the difference between 96.5% and 94% RTP = $250 in expected
                  losses. Always choose higher RTP when available.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* By Provider */}
          <TabsContent value="provider-analysis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Provider RTP Rankings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {providerStats.map((provider) => (
                    <div
                      key={provider.name}
                      className="p-4 border rounded-lg hover:border-primary transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold">{provider.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {provider.gameCount} games in portfolio
                          </p>
                        </div>
                        <Badge variant={provider.avgRtp >= 96 ? 'default' : 'secondary'}>
                          {provider.avgRtp.toFixed(2)}% Avg RTP
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Theoretical Avg</p>
                          <p className="font-bold text-primary">{provider.avgRtp.toFixed(2)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Observed Avg</p>
                          <p className="font-bold">{provider.observedRtp.toFixed(2)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Variance</p>
                          <p className={`font-bold ${provider.variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {provider.variance > 0 ? '+' : ''}{provider.variance.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-foreground">
                      <p className="font-semibold mb-1">Provider Differences</p>
                      <p>
                        Pragmatic Play offers the highest average RTP (96.43%) across their
                        portfolio. When choosing between providers, RTP should be a key factor in
                        your decision.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Industry Standards */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Industry RTP Standards</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold text-sm mb-2">🌍 By Region</p>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Europe:</span> 94-98% (regulated, high-RTP
                      standard)
                    </p>
                    <p>
                      <span className="font-medium">North America:</span> 85-95% (varies by
                      jurisdiction)
                    </p>
                    <p>
                      <span className="font-medium">Online:</span> 95-99% (generally highest RTP)
                    </p>
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-sm mb-2">💡 Player Recommendation</p>
                  <p className="text-sm">
                    Always play on platforms offering 95%+ RTP games. The difference between
                    94% and 96% RTP means ~$200 difference per 10,000 spins. Choose wisely.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* CTA */}
        <div className="mt-12 p-6 bg-primary/10 border border-primary/30 rounded-lg">
          <h3 className="font-semibold mb-2">Explore More</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Ready to apply what you've learned? Browse all games and filter by RTP to find your
            best options.
          </p>
          <Link href="/slots">
            <button className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium">
              Browse All Games
            </button>
          </Link>
        </div>
      </section>
    </main>
  );
}
