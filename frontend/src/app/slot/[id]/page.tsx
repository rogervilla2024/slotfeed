'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw } from 'lucide-react';
import {
  SlotHeader,
  RTPComparison,
  HotColdIndicator,
  BonusStats,
  StreamerComparison,
} from '@/components/slot';
import { RTPTrendChart } from '@/components/charts/rtp-trend-chart';
import { BonusFrequencyChart } from '@/components/charts/bonus-frequency-chart';
import { WinDistributionChart } from '@/components/charts/win-distribution-chart';
import { BalanceHistoryChart } from '@/components/charts/balance-history-chart';
import { PeriodSelector } from '@/components/charts/chart-wrapper';
import { SlotGuide } from '@/components/slot/slot-guide';
import {
  SlotPageStructuredData,
  FAQStructuredData,
  generateSlotFAQs,
} from '@/components/seo';
import { SessionHistoryList } from '@/components/session/session-history-list';
import type { Game } from '@/types';

interface GameStats {
  game_id: string;
  period: string;
  observed_rtp: number;
  theoretical_rtp: number;
  total_spins: number;
  total_wagered: number;
  bonus_frequency: number;
  average_bonus_payout: number;
  biggest_wins: Array<{
    amount: number;
    multiplier: number;
    streamer: string;
  }>;
  streamer_rankings: Array<{
    streamerId: string;
    streamerName: string;
    platform: 'kick' | 'twitch' | 'youtube';
    avatarUrl?: string;
    sessionsPlayed: number;
    totalWagered: number;
    totalWon: number;
    observedRtp: number;
    biggestWin: number;
    biggestMultiplier: number;
    lastPlayed: Date;
  }>;
}

interface HotColdData {
  status: 'hot' | 'neutral' | 'cold';
  score: number;
  metrics: {
    observed_rtp: number;
    theoretical_rtp: number;
    recent_big_wins: number;
    avg_big_wins: number;
  };
  last_updated: string;
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
}

function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toLocaleString();
}

export default function SlotPage() {
  const params = useParams();
  const slotId = params.id as string;

  const [game, setGame] = useState<Game | null>(null);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [hotCold, setHotCold] = useState<HotColdData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch game data
      const gameResponse = await fetch(`/api/v1/games/${slotId}`);
      if (gameResponse.ok) {
        const gameData = await gameResponse.json();
        setGame({
          id: gameData.id,
          name: gameData.name,
          slug: gameData.slug,
          providerId: gameData.provider?.id || 'unknown',
          provider: gameData.provider ? {
            id: gameData.provider.id,
            name: gameData.provider.name || 'Unknown Provider',
            slug: gameData.provider.slug || gameData.provider.id,
            gameCount: gameData.provider.gameCount || 0,
          } : undefined,
          rtp: gameData.rtp || 96.0,
          volatility: gameData.volatility || 'high',
          maxMultiplier: gameData.max_multiplier || 10000,
          thumbnailUrl: gameData.thumbnail_url,
          isActive: gameData.is_active !== false,
        });
      } else if (gameResponse.status === 404) {
        setError('Game not found');
        setLoading(false);
        return;
      }

      // Fetch game stats
      const statsResponse = await fetch(`/api/v1/games/${slotId}/stats?period=30d`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch hot/cold data
      const hotColdResponse = await fetch(`/api/v1/hot-cold/games/${slotId}?period_hours=24`);
      if (hotColdResponse.ok) {
        const hotColdData = await hotColdResponse.json();
        setHotCold(hotColdData.score || null);
      }
    } catch (err) {
      console.error('Failed to fetch slot data:', err);
      setError('Failed to load slot data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every 60 seconds
    return () => clearInterval(interval);
  }, [slotId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded-lg mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-muted rounded-lg" />
            <div className="h-64 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold mb-2">Slot Not Found</h1>
          <p className="text-muted-foreground mb-4">
            {error || "The slot game you're looking for doesn't exist or has been removed."}
          </p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  // Safely access stats with defaults
  const observedRtp = stats?.observed_rtp || game.rtp;
  const totalSpins = stats?.total_spins || 0;
  const totalWagered = stats?.total_wagered || 0;
  const streamerStats = stats?.streamer_rankings || [];

  // Generate FAQ data for SEO
  const slotFAQs = generateSlotFAQs(
    game.name,
    game.rtp,
    game.volatility,
    game.provider?.name,
    game.maxMultiplier
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* SEO Structured Data */}
      <SlotPageStructuredData
        gameId={slotId}
        gameName={game.name}
        rtp={game.rtp}
        volatility={game.volatility}
        provider={game.provider?.name}
        thumbnailUrl={game.thumbnailUrl}
        maxMultiplier={game.maxMultiplier}
      />
      <FAQStructuredData faqs={slotFAQs} />
      {/* Slot Header */}
      <div className="flex items-center justify-between mb-8">
        <SlotHeader game={game} />
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="guide">Guide</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="streamers">Streamers</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* RTP Comparison */}
            <RTPComparison
              theoreticalRtp={game.rtp}
              observedRtp={observedRtp}
              sampleSize={totalSpins}
            />

            {/* Hot/Cold Indicator */}
            {hotCold ? (
              <HotColdIndicator
                status={hotCold.status}
                score={hotCold.score}
                recentRtp={hotCold.metrics.observed_rtp}
                historicalRtp={hotCold.metrics.theoretical_rtp}
                recentBigWins={hotCold.metrics.recent_big_wins}
                avgBigWins={hotCold.metrics.avg_big_wins}
                lastUpdated={new Date(hotCold.last_updated)}
              />
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <p>Hot/Cold data not available</p>
                  <p className="text-sm mt-2">More game sessions are needed for analysis</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Bonus Stats */}
          <BonusStats
            totalBonuses={stats?.bonus_frequency ? Math.round(totalSpins * stats.bonus_frequency) : 0}
            avgBonusValue={stats?.average_bonus_payout || 0}
            avgSpinsToBonous={stats?.bonus_frequency ? Math.round(1 / stats.bonus_frequency) : 0}
            bonusHitRate={stats?.bonus_frequency || 0}
            biggestBonus={stats?.biggest_wins?.[0]?.amount || 0}
            avgBonusMultiplier={stats?.average_bonus_payout ? stats.average_bonus_payout / 100 : 0}
          />
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RTPComparison
              theoreticalRtp={game.rtp}
              observedRtp={observedRtp}
              sampleSize={totalSpins}
            />

            <BonusStats
              totalBonuses={stats?.bonus_frequency ? Math.round(totalSpins * stats.bonus_frequency) : 0}
              avgBonusValue={stats?.average_bonus_payout || 0}
              avgSpinsToBonous={stats?.bonus_frequency ? Math.round(1 / stats.bonus_frequency) : 0}
              bonusHitRate={stats?.bonus_frequency || 0}
              biggestBonus={stats?.biggest_wins?.[0]?.amount || 0}
              avgBonusMultiplier={stats?.average_bonus_payout ? stats.average_bonus_payout / 100 : 0}
            />
          </div>

          {/* Additional Statistics Card */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-card border rounded-lg">
              <div className="text-sm text-muted-foreground">Total Spins Tracked</div>
              <div className="text-2xl font-bold">{formatNumber(totalSpins)}</div>
            </div>
            <div className="p-4 bg-card border rounded-lg">
              <div className="text-sm text-muted-foreground">Total Wagered</div>
              <div className="text-2xl font-bold">{formatCurrency(totalWagered)}</div>
            </div>
            <div className="p-4 bg-card border rounded-lg">
              <div className="text-sm text-muted-foreground">Total Won</div>
              <div className="text-2xl font-bold">{formatCurrency(totalWagered * (observedRtp / 100))}</div>
            </div>
            <div className="p-4 bg-card border rounded-lg">
              <div className="text-sm text-muted-foreground">Max Win Recorded</div>
              <div className="text-2xl font-bold text-win">
                {stats?.biggest_wins?.[0] ? formatCurrency(stats.biggest_wins[0].amount) : 'N/A'}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Guide Tab */}
        <TabsContent value="guide" className="space-y-6">
          <SlotGuide gameId={slotId} gameName={game.name} />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Analytics & Trends</h3>
            <PeriodSelector
              periods={[
                { label: '7 Days', value: '7d' },
                { label: '30 Days', value: '30d' },
                { label: '90 Days', value: '90d' },
              ]}
              selectedPeriod={analyticsPeriod}
              onPeriodChange={(period) => setAnalyticsPeriod(period as '7d' | '30d' | '90d')}
              isLoading={loading}
            />
          </div>
          <div className="space-y-6">
            {/* RTP Trend Chart */}
            <RTPTrendChart 
              gameId={slotId} 
              theoreticalRtp={game.rtp}
              period={analyticsPeriod}
            />

            {/* Bonus Frequency Chart */}
            <BonusFrequencyChart
              gameId={slotId}
              period={analyticsPeriod}
              averageFrequency={stats?.bonus_frequency}
            />

            {/* Win Distribution Chart */}
            <WinDistributionChart
              gameId={slotId}
              gameName={game.name}
            />
          </div>
        </TabsContent>

        {/* Streamers Tab */}
        <TabsContent value="streamers">
          {streamerStats.length > 0 ? (
            <StreamerComparison
              gameName={game.name}
              streamers={streamerStats}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <p>No streamer data available for this slot yet.</p>
                <p className="text-sm mt-2">Data will appear as streamers play this game.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <SessionHistoryList gameId={slotId} gameName={game.name} />
        </TabsContent>
      </Tabs>

      {/* Data source indicator */}
      {totalSpins > 0 && (
        <div className="text-center text-sm text-muted-foreground mt-6">
          Statistics based on {formatNumber(totalSpins)} tracked spins
        </div>
      )}
    </div>
  );
}
