'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { HotColdIndicator } from '@/components/slot/hot-cold-indicator';
import { RefreshCw } from 'lucide-react';
import {
  HotColdSlotsStructuredData,
  WebPageStructuredData,
  FAQStructuredData,
} from '@/components/seo';

type HotColdStatus = 'hot' | 'neutral' | 'cold';
type TrendDirection = 'heating' | 'cooling' | 'stable';

interface HotColdMetrics {
  theoretical_rtp: number;
  observed_rtp: number;
  rtp_difference: number;
  sample_sessions: number;
  total_spins: number;
  total_wagered: number;
  total_won: number;
  recent_big_wins: number;
  avg_big_wins: number;
  big_win_ratio: number;
}

interface SlotScore {
  game_id: string;
  game_name: string | null;
  game_slug: string | null;
  provider_name: string | null;
  status: HotColdStatus;
  score: number;
  heat_score: number;
  metrics: HotColdMetrics;
  trend: TrendDirection;
  confidence: number;
  period_hours: number;
  last_updated: string;
}

interface HotColdAllResponse {
  items: SlotScore[];
  total: number;
  hot_count: number;
  cold_count: number;
  neutral_count: number;
}

function SlotRankingCard({ slot, rank }: { slot: SlotScore; rank: number }) {
  const getTrendIcon = () => {
    if (slot.trend === 'heating') return '+';
    if (slot.trend === 'cooling') return '-';
    return '=';
  };

  const getStatusColor = () => {
    if (slot.status === 'hot') return 'bg-gradient-to-r from-orange-500 to-red-500';
    if (slot.status === 'cold') return 'bg-gradient-to-r from-blue-500 to-cyan-500';
    return 'bg-gray-500';
  };

  const getRankBadge = () => {
    if (rank === 1) return '#1';
    if (rank === 2) return '#2';
    if (rank === 3) return '#3';
    return `#${rank}`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow active:scale-[0.99] touch-manipulation">
      <CardContent className="p-3 md:p-4">
        <div className="flex items-center gap-2 md:gap-4">
          {/* Rank */}
          <div className="text-xl md:text-2xl font-bold text-muted-foreground w-8 md:w-12 text-center flex-shrink-0">
            {getRankBadge()}
          </div>

          {/* Game Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1 md:gap-2">
              <h3 className="font-semibold text-sm md:text-base truncate">
                {slot.game_name || 'Unknown Game'}
              </h3>
              {slot.provider_name && (
                <Badge variant="outline" className="text-[10px] md:text-xs flex-shrink-0">
                  {slot.provider_name}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-1 text-xs md:text-sm text-muted-foreground">
              <span>RTP: {slot.metrics.observed_rtp.toFixed(2)}%</span>
              <span className="hidden sm:inline">vs {slot.metrics.theoretical_rtp.toFixed(2)}% expected</span>
              <span>{getTrendIcon()} {slot.trend}</span>
            </div>
          </div>

          {/* Score */}
          <div className="text-right flex-shrink-0">
            <Badge className={`${getStatusColor()} text-white border-0 text-sm md:text-lg px-2 md:px-3 py-0.5 md:py-1`}>
              {slot.score > 0 ? '+' : ''}{slot.score}
            </Badge>
            <div className="text-[10px] md:text-xs text-muted-foreground mt-1">
              {Math.round(slot.confidence * 100)}% conf
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SlotRankingCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-3 md:p-4">
        <div className="flex items-center gap-2 md:gap-4">
          <Skeleton className="h-8 w-8 md:h-12 md:w-12 rounded" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

function StatsOverview({
  hotCount,
  coldCount,
  neutralCount,
  hottestScore,
  loading
}: {
  hotCount: number;
  coldCount: number;
  neutralCount: number;
  hottestScore: number;
  loading: boolean;
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
      <Card>
        <CardContent className="p-3 md:p-4 text-center">
          {loading ? (
            <Skeleton className="h-8 w-12 mx-auto mb-1" />
          ) : (
            <div className="text-2xl md:text-3xl font-bold text-orange-500">{hotCount}</div>
          )}
          <div className="text-xs md:text-sm text-muted-foreground">Hot Slots</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3 md:p-4 text-center">
          {loading ? (
            <Skeleton className="h-8 w-12 mx-auto mb-1" />
          ) : (
            <div className="text-2xl md:text-3xl font-bold text-blue-500">{coldCount}</div>
          )}
          <div className="text-xs md:text-sm text-muted-foreground">Cold Slots</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3 md:p-4 text-center">
          {loading ? (
            <Skeleton className="h-8 w-12 mx-auto mb-1" />
          ) : (
            <div className="text-2xl md:text-3xl font-bold text-muted-foreground">{neutralCount}</div>
          )}
          <div className="text-xs md:text-sm text-muted-foreground">Neutral Slots</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3 md:p-4 text-center">
          {loading ? (
            <Skeleton className="h-8 w-12 mx-auto mb-1" />
          ) : (
            <div className="text-2xl md:text-3xl font-bold text-green-500">
              {hottestScore > 0 ? '+' : ''}{hottestScore}
            </div>
          )}
          <div className="text-xs md:text-sm text-muted-foreground">Hottest Score</div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function HotColdPage() {
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('24h');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allSlots, setAllSlots] = useState<SlotScore[]>([]);
  const [stats, setStats] = useState({ hot_count: 0, cold_count: 0, neutral_count: 0 });

  const periodToHours = {
    '24h': 24,
    '7d': 168,
    '30d': 720,
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const periodHours = periodToHours[period];
      const response = await fetch(`/api/v1/hot-cold/all?period_hours=${periodHours}`);

      if (response.ok) {
        const data: HotColdAllResponse = await response.json();
        setAllSlots(data.items || []);
        setStats({
          hot_count: data.hot_count || 0,
          cold_count: data.cold_count || 0,
          neutral_count: data.neutral_count || 0,
        });
      } else {
        setError('Failed to load hot/cold data');
      }
    } catch (err) {
      console.error('Error fetching hot/cold data:', err);
      setError('Network error - please try again');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every 60 seconds
    return () => clearInterval(interval);
  }, [period]);

  // Sort slots by score
  const hottestSlots = [...allSlots].filter(s => s.status === 'hot').sort((a, b) => b.score - a.score);
  const coldestSlots = [...allSlots].filter(s => s.status === 'cold').sort((a, b) => a.score - b.score);
  const sortedAll = [...allSlots].sort((a, b) => b.score - a.score);

  // Featured slot (hottest one)
  const featuredSlot = hottestSlots[0];
  const hottestScore = featuredSlot?.score || 0;

  // Prepare data for SEO
  const hotSlotsForSchema = hottestSlots.slice(0, 10).map((slot) => ({
    id: slot.game_id,
    name: slot.game_name || 'Unknown',
    slug: slot.game_slug || slot.game_id,
    provider: slot.provider_name || undefined,
    status: 'hot' as const,
    score: slot.score,
    observedRtp: slot.metrics.observed_rtp,
    theoreticalRtp: slot.metrics.theoretical_rtp,
  }));

  const coldSlotsForSchema = coldestSlots.slice(0, 10).map((slot) => ({
    id: slot.game_id,
    name: slot.game_name || 'Unknown',
    slug: slot.game_slug || slot.game_id,
    provider: slot.provider_name || undefined,
    status: 'cold' as const,
    score: slot.score,
    observedRtp: slot.metrics.observed_rtp,
    theoreticalRtp: slot.metrics.theoretical_rtp,
  }));

  // Hot/Cold FAQ for SEO
  const hotColdFAQs = [
    {
      question: 'What does hot slot mean?',
      answer: 'A hot slot is a slot machine that is currently paying out above its theoretical RTP (Return to Player). This is based on recent observed data from streamer sessions. Hot status indicates the game has been more generous than expected in the short term.',
    },
    {
      question: 'What does cold slot mean?',
      answer: 'A cold slot is a slot machine that is currently paying out below its theoretical RTP. This means players have been winning less than the statistical average. However, this does not mean the slot is "due" for a win - each spin is independent.',
    },
    {
      question: 'Should I play hot slots?',
      answer: 'Hot/cold status is based on recent data and does not predict future results. Slot machines use random number generators (RNG), so past performance does not influence future spins. Use hot/cold indicators for entertainment context only, not as a betting strategy.',
    },
  ];

  return (
    <div className="container mx-auto py-4 md:py-6 px-4">
      {/* SEO Structured Data */}
      <WebPageStructuredData
        name="Hot & Cold Slots - SlotFeed"
        description="Real-time slot performance analysis. See which slots are currently paying above or below their RTP based on live stream data."
        url="https://slotfeed.com/hot-cold"
        type="CollectionPage"
        breadcrumbs={[
          { name: 'Home', url: 'https://slotfeed.com' },
          { name: 'Hot/Cold Slots', url: 'https://slotfeed.com/hot-cold' },
        ]}
      />
      {hotSlotsForSchema.length > 0 && (
        <HotColdSlotsStructuredData type="hot" slots={hotSlotsForSchema} />
      )}
      {coldSlotsForSchema.length > 0 && (
        <HotColdSlotsStructuredData type="cold" slots={coldSlotsForSchema} />
      )}
      <FAQStructuredData faqs={hotColdFAQs} />

      {/* Header */}
      <div className="mb-4 md:mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Hot/Cold Slot Indicator</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Real-time slot performance analysis based on observed vs theoretical RTP
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md mb-6">
          {error}
          <Button variant="link" onClick={fetchData} className="ml-2">
            Retry
          </Button>
        </div>
      )}

      {/* Period Selector */}
      <div className="flex gap-2 mb-4 md:mb-6 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
        {(['24h', '7d', '30d'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 touch-manipulation ${
              period === p
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {p === '24h' ? 'Last 24 Hours' : p === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
          </button>
        ))}
      </div>

      {/* Stats Overview */}
      <StatsOverview
        hotCount={stats.hot_count}
        coldCount={stats.cold_count}
        neutralCount={stats.neutral_count}
        hottestScore={hottestScore}
        loading={loading}
      />

      {/* Featured Slot & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
        <div className="lg:col-span-1">
          {loading ? (
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ) : featuredSlot ? (
            <HotColdIndicator
              status={featuredSlot.status}
              score={featuredSlot.score}
              recentRtp={featuredSlot.metrics.observed_rtp}
              historicalRtp={featuredSlot.metrics.theoretical_rtp}
              recentBigWins={featuredSlot.metrics.recent_big_wins}
              avgBigWins={featuredSlot.metrics.avg_big_wins}
              lastUpdated={new Date(featuredSlot.last_updated)}
            />
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No hot slots available
              </CardContent>
            </Card>
          )}
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
              <CardTitle className="text-base md:text-lg">About Hot/Cold Indicator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4 text-xs md:text-sm text-muted-foreground p-4 md:p-6 pt-0">
              <p>
                The Hot/Cold indicator analyzes slot performance by comparing observed RTP
                (Return to Player) against the theoretical RTP provided by the game.
              </p>
              <div className="grid grid-cols-3 gap-2 md:gap-4">
                <div className="text-center p-2 md:p-3 rounded-lg bg-red-500/10">
                  <div className="text-lg md:text-2xl mb-0.5 md:mb-1">HOT</div>
                  <div className="font-medium text-foreground text-xs md:text-sm">Score &gt; +25</div>
                  <div className="text-[10px] md:text-xs">Above average</div>
                </div>
                <div className="text-center p-2 md:p-3 rounded-lg bg-gray-500/10">
                  <div className="text-lg md:text-2xl mb-0.5 md:mb-1">NEUTRAL</div>
                  <div className="font-medium text-foreground text-xs md:text-sm">-25 to +25</div>
                  <div className="text-[10px] md:text-xs">As expected</div>
                </div>
                <div className="text-center p-2 md:p-3 rounded-lg bg-blue-500/10">
                  <div className="text-lg md:text-2xl mb-0.5 md:mb-1">COLD</div>
                  <div className="font-medium text-foreground text-xs md:text-sm">Score &lt; -25</div>
                  <div className="text-[10px] md:text-xs">Below average</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Rankings Tabs */}
      <Tabs defaultValue="hottest" className="space-y-3 md:space-y-4">
        <TabsList className="w-full flex overflow-x-auto scrollbar-hide">
          <TabsTrigger value="hottest" className="flex-1 text-xs md:text-sm">Hottest</TabsTrigger>
          <TabsTrigger value="coldest" className="flex-1 text-xs md:text-sm">Coldest</TabsTrigger>
          <TabsTrigger value="all" className="flex-1 text-xs md:text-sm">All Slots</TabsTrigger>
        </TabsList>

        <TabsContent value="hottest" className="space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <SlotRankingCardSkeleton key={i} />)
          ) : hottestSlots.length > 0 ? (
            hottestSlots.map((slot, index) => (
              <SlotRankingCard key={slot.game_id} slot={slot} rank={index + 1} />
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hot slots found. More game data is needed for analysis.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="coldest" className="space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <SlotRankingCardSkeleton key={i} />)
          ) : coldestSlots.length > 0 ? (
            coldestSlots.map((slot, index) => (
              <SlotRankingCard key={slot.game_id} slot={slot} rank={index + 1} />
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No cold slots found. More game data is needed for analysis.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SlotRankingCardSkeleton key={i} />)
          ) : sortedAll.length > 0 ? (
            sortedAll.map((slot, index) => (
              <SlotRankingCard key={slot.game_id} slot={slot} rank={index + 1} />
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No slot data available. The system needs game session data to calculate hot/cold scores.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Data source indicator */}
      {!loading && allSlots.length > 0 && (
        <div className="text-center text-sm text-muted-foreground mt-4">
          Real-time data from {allSlots.length} tracked slots
        </div>
      )}
    </div>
  );
}
