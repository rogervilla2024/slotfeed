'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { TrendingUp, Gamepad2, Users, Target, Award } from 'lucide-react';

interface ProviderData {
  id: string;
  name: string;
  slug: string;
  description: string;
  foundedYear: number;
  headquarter: string;
  gameCount: number;
  averageRtp: number;
  averageVolatility: string;
  totalSpins: number;
  totalWagered: number;
  totalPayouts: number;
  observedRtp: number;
  topGames: Array<{
    id: string;
    name: string;
    rtp: number;
    totalSpins: number;
    observedRtp: number;
    status: 'hot' | 'cold' | 'neutral';
  }>;
  streamerPreferences: Array<{
    streamerName: string;
    favoriteGame: string;
    totalSessions: number;
  }>;
}

export default function ProviderPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [provider, setProvider] = useState<ProviderData | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock provider data
  const providerMap: Record<string, ProviderData> = {
    'pragmatic-play': {
      id: 'pragmatic-play',
      name: 'Pragmatic Play',
      slug: 'pragmatic-play',
      description:
        'Pragmatic Play is a leading software provider for the iGaming industry with an impressive portfolio of slot games known for high-quality graphics and innovative features.',
      foundedYear: 2007,
      headquarter: 'Malta',
      gameCount: 200,
      averageRtp: 96.48,
      averageVolatility: 'medium',
      totalSpins: 125000000,
      totalWagered: 375000000,
      totalPayouts: 361200000,
      observedRtp: 96.32,
      topGames: [
        {
          id: 'sweet-bonanza',
          name: 'Sweet Bonanza',
          rtp: 96.48,
          totalSpins: 5000000,
          observedRtp: 96.51,
          status: 'hot',
        },
        {
          id: 'gates-of-olympus',
          name: 'Gates of Olympus',
          rtp: 96.50,
          totalSpins: 4500000,
          observedRtp: 96.28,
          status: 'neutral',
        },
        {
          id: 'big-bass-bonanza',
          name: 'Big Bass Bonanza',
          rtp: 96.71,
          totalSpins: 3800000,
          observedRtp: 96.65,
          status: 'hot',
        },
      ],
      streamerPreferences: [
        {
          streamerName: 'Roshtein',
          favoriteGame: 'Sweet Bonanza',
          totalSessions: 124,
        },
        {
          streamerName: 'ClassyBeef',
          favoriteGame: 'Gates of Olympus',
          totalSessions: 89,
        },
        {
          streamerName: 'Trainwreckstv',
          favoriteGame: 'Big Bass Bonanza',
          totalSessions: 67,
        },
      ],
    },
    hacksaw: {
      id: 'hacksaw',
      name: 'Hacksaw Gaming',
      slug: 'hacksaw',
      description:
        'Hacksaw Gaming is an iGaming software developer focused on creating unique, high-volatility slots with innovative mechanics and stunning visuals.',
      foundedYear: 2015,
      headquarter: 'Sweden',
      gameCount: 85,
      averageRtp: 96.3,
      averageVolatility: 'high',
      totalSpins: 45000000,
      totalWagered: 135000000,
      totalPayouts: 129600000,
      observedRtp: 96.0,
      topGames: [
        {
          id: 'wanted-dead-or-alive',
          name: 'Wanted Dead or a Wild',
          rtp: 96.38,
          totalSpins: 2000000,
          observedRtp: 95.92,
          status: 'cold',
        },
        {
          id: 'dragons-fire',
          name: "Dragon's Fire",
          rtp: 96.2,
          totalSpins: 1500000,
          observedRtp: 96.15,
          status: 'neutral',
        },
      ],
      streamerPreferences: [
        {
          streamerName: 'DeuceAce',
          favoriteGame: 'Wanted Dead or a Wild',
          totalSessions: 76,
        },
      ],
    },
    evolution: {
      id: 'evolution',
      name: 'Evolution Gaming',
      slug: 'evolution',
      description:
        'Evolution Gaming is the leader in live casino gaming, with an extensive portfolio of live and RNG-based games designed for the modern iGaming market.',
      foundedYear: 2006,
      headquarter: 'Sweden',
      gameCount: 120,
      averageRtp: 96.08,
      averageVolatility: 'medium',
      totalSpins: 85000000,
      totalWagered: 255000000,
      totalPayouts: 244800000,
      observedRtp: 96.0,
      topGames: [
        {
          id: 'crazy-time',
          name: 'Crazy Time',
          rtp: 96.08,
          totalSpins: 3000000,
          observedRtp: 96.02,
          status: 'neutral',
        },
      ],
      streamerPreferences: [
        {
          streamerName: 'Mellstroy',
          favoriteGame: 'Crazy Time',
          totalSessions: 102,
        },
      ],
    },
  };

  useEffect(() => {
    if (!slug) return;

    // Simulate API call
    const timer = setTimeout(() => {
      const data = providerMap[slug as string];
      if (data) {
        setProvider(data);
      }
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [slug]);

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-64 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </main>
    );
  }

  if (!provider) {
    return (
      <main className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Provider Not Found</h1>
        <p className="text-muted-foreground mb-6">This provider doesn't exist in our database.</p>
        <Link href="/slots">
          <Button>Back to Games</Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 to-purple-500/10 border-b border-border py-12 md:py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">{provider.name}</h1>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl">{provider.description}</p>
          <div className="flex flex-wrap gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Founded</span>
              <p className="font-semibold">{provider.foundedYear}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Headquarter</span>
              <p className="font-semibold">{provider.headquarter}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Active Games</span>
              <p className="font-semibold">{provider.gameCount}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Average RTP</span>
                <Target className="h-4 w-4 text-primary" />
              </div>
              <p className="text-3xl font-bold text-primary">{provider.averageRtp.toFixed(2)}%</p>
              <p className="text-xs text-muted-foreground mt-2">
                Observed: {provider.observedRtp.toFixed(2)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Spins</span>
                <Award className="h-4 w-4 text-primary" />
              </div>
              <p className="text-3xl font-bold">
                {(provider.totalSpins / 1000000).toFixed(1)}M
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                ${(provider.totalWagered / 1000000).toFixed(1)}M wagered
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Avg Volatility</span>
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <p className="text-3xl font-bold capitalize">{provider.averageVolatility}</p>
              <p className="text-xs text-muted-foreground mt-2">Risk level indicator</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Payouts</span>
                <Users className="h-4 w-4 text-primary" />
              </div>
              <p className="text-3xl font-bold">
                ${(provider.totalPayouts / 1000000).toFixed(1)}M
              </p>
              <p className="text-xs text-muted-foreground mt-2">Returned to players</p>
            </CardContent>
          </Card>
        </div>

        {/* Top Games */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Gamepad2 className="h-6 w-6" />
            Top Games from {provider.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {provider.topGames.map((game) => (
              <Link key={game.id} href={`/slot/${game.id}`}>
                <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle className="text-lg">{game.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-muted-foreground">Theoretical RTP</span>
                        <p className="text-2xl font-bold text-primary">{game.rtp.toFixed(2)}%</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Observed RTP</span>
                        <p className="text-2xl font-bold">{game.observedRtp.toFixed(2)}%</p>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-muted-foreground">Performance</span>
                      <Badge
                        className="mt-1"
                        variant={
                          game.status === 'hot'
                            ? 'default'
                            : game.status === 'cold'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {game.status === 'hot' && '🔥 Hot'}
                        {game.status === 'cold' && '❄️ Cold'}
                        {game.status === 'neutral' && '➖ Neutral'}
                      </Badge>
                    </div>

                    <div className="text-xs text-muted-foreground border-t pt-4">
                      {(game.totalSpins / 1000000).toFixed(1)}M spins tracked
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Streamer Preferences */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Users className="h-6 w-6" />
            Popular Among Streamers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {provider.streamerPreferences.map((pref, idx) => (
              <Card key={idx}>
                <CardContent className="p-6">
                  <p className="font-semibold text-lg mb-2">{pref.streamerName}</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Favorite: <span className="font-medium text-foreground">{pref.favoriteGame}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {pref.totalSessions} sessions recorded
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* All Games from Provider */}
        <div>
          <h2 className="text-2xl font-bold mb-6">All {provider.name} Games</h2>
          <Link href={`/slots?provider=${provider.name}`}>
            <Button size="lg">
              Browse {provider.gameCount} Games
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
