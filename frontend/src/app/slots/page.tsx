'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Gamepad2, Percent, Zap, TrendingUp, Flame, Snowflake } from 'lucide-react';
import type { Game } from '@/types';
import { TOP_GAMES, PROVIDERS } from '@/data/top-games';
import { HotColdBadge, LiveIndicator } from '@/components/slot/hot-cold-badge';
import { useHotColdAll } from '@/lib/hooks/use-hot-cold';
import { useLiveStreamsAll } from '@/lib/hooks/use-live-streams';

function getVolatilityColor(volatility: string): string {
  switch (volatility) {
    case 'low':
      return 'bg-green-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'high':
      return 'bg-orange-500';
    case 'very_high':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

function getVolatilityLabel(volatility: string): string {
  switch (volatility) {
    case 'very_high':
      return 'Very High';
    default:
      return volatility.charAt(0).toUpperCase() + volatility.slice(1);
  }
}

export default function SlotsPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [volatilityFilter, setVolatilityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const { data: hotColdData } = useHotColdAll({ enabled: true, refreshInterval: 60000 });
  const { data: liveStreamsData } = useLiveStreamsAll({ enabled: true, refreshInterval: 30000 });

  // Convert seed data to Game type
  const convertToGame = (data: typeof TOP_GAMES[0]): Game => {
    const provider = PROVIDERS.find(p => p.slug === data.providerSlug);
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      providerId: data.providerSlug,
      rtp: data.rtp,
      volatility: data.volatility,
      maxMultiplier: data.maxMultiplier,
      isActive: data.isActive,
      thumbnailUrl: data.thumbnailUrl,
      provider: provider ? {
        id: provider.id,
        name: provider.name,
        slug: provider.slug,
        logoUrl: provider.logoUrl,
        gameCount: TOP_GAMES.filter(g => g.providerSlug === provider.slug).length,
      } : undefined,
    };
  };

  useEffect(() => {
    const fetchGames = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/v1/games');
        if (response.ok) {
          const data = await response.json();
          const gamesData = data.games || data;
          if (Array.isArray(gamesData) && gamesData.length > 0) {
            setGames(gamesData);
          } else {
            setGames([]);
          }
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.log('Using local game data');
      }

      // Use local data if API fails or returns empty
      const localGames = TOP_GAMES.map(convertToGame);
      setGames(localGames);
      setIsLoading(false);
    };

    fetchGames();
  }, []);

  // Get unique providers for filter
  const providers = [...new Set(games.map((g) => g.provider?.name).filter(Boolean))];

  const filteredGames = games
    .filter((game) => {
      const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesProvider =
        providerFilter === 'all' || game.provider?.name === providerFilter;
      const matchesVolatility =
        volatilityFilter === 'all' || game.volatility === volatilityFilter;
      return matchesSearch && matchesProvider && matchesVolatility;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rtp':
          return b.rtp - a.rtp;
        case 'maxMultiplier':
          return b.maxMultiplier - a.maxMultiplier;
        default:
          return 0;
      }
    });

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Slot Games</h1>
          <p className="text-muted-foreground mt-2">
            Browse and analyze slot performance
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Slot Games</h1>
        <p className="text-muted-foreground mt-2">
          Browse and analyze slot performance across all streamers
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search slots..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={providerFilter} onValueChange={setProviderFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Providers</SelectItem>
            {providers.map((provider) => (
              <SelectItem key={provider} value={provider!}>
                {provider}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={volatilityFilter} onValueChange={setVolatilityFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Volatility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Volatility</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="very_high">Very High</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="rtp">RTP</SelectItem>
            <SelectItem value="maxMultiplier">Max Multiplier</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Games Grid */}
      {filteredGames.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Gamepad2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No slots found</p>
            {searchQuery && (
              <Button
                variant="link"
                onClick={() => setSearchQuery('')}
                className="mt-2"
              >
                Clear search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredGames.map((game) => (
            <SlotCard 
              key={game.id} 
              game={game} 
              hotColdData={hotColdData.get(game.id) || null}
              liveStreamsData={liveStreamsData.get(game.id) || null}
            />
          ))}
        </div>
      )}
    </main>
  );
}

function SlotCard({ game, hotColdData, liveStreamsData }: { game: Game; hotColdData: any; liveStreamsData: any }) {
  return (
    <Link href={`/slot/${game.slug || game.id}`}>
      <Card className="hover:border-primary transition-colors cursor-pointer h-full relative">
        <CardContent className="p-4">
          {/* Badges */}
          <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
            {hotColdData && (
              <HotColdBadge 
                status={hotColdData.status} 
                score={hotColdData.score} 
                size="sm"
              />
            )}
            {liveStreamsData && liveStreamsData.streamersCount > 0 && (
              <LiveIndicator 
                streamersCount={liveStreamsData.streamersCount} 
                size="sm"
              />
            )}
          </div>

          {/* Thumbnail */}
          <div className="aspect-video bg-muted rounded-lg mb-4 flex items-center justify-center overflow-hidden">
            {game.thumbnailUrl ? (
              <img
                src={game.thumbnailUrl}
                alt={game.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Gamepad2 className="h-12 w-12 text-muted-foreground" />
            )}
          </div>

          {/* Info */}
          <div className="space-y-2">
            <h3 className="font-semibold truncate">{game.name}</h3>
            <div className="flex items-center gap-2">
              {game.provider && (
                <Badge variant="outline" className="text-xs">
                  {game.provider.name}
                </Badge>
              )}
              <Badge
                variant="secondary"
                className={`${getVolatilityColor(game.volatility)} text-white text-xs`}
              >
                {getVolatilityLabel(game.volatility)}
              </Badge>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t">
            <div>
              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                <Percent className="h-3 w-3" />
                RTP
              </div>
              <p
                className={`font-semibold ${
                  game.rtp >= 96.5
                    ? 'text-win'
                    : game.rtp >= 95
                    ? 'text-yellow-500'
                    : 'text-muted-foreground'
                }`}
              >
                {game.rtp.toFixed(2)}%
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                <Zap className="h-3 w-3" />
                Max Win
              </div>
              <p className="font-semibold">
                {game.maxMultiplier.toLocaleString()}x
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
