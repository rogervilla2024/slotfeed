'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BonusHuntStats, BonusHuntStatsData } from '@/components/bonus-hunt/BonusHuntStats';
import { BonusHuntEntryList, BonusHuntEntryData } from '@/components/bonus-hunt/BonusHuntEntry';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';

interface BonusHuntData {
  id: string;
  sessionId: string;
  streamerId: string;
  streamerName: string;
  status: 'collecting' | 'opening' | 'completed' | 'cancelled';
  startedAt: string;
  openingStartedAt?: string;
  completedAt?: string;
  stats: BonusHuntStatsData;
  entries: BonusHuntEntryData[];
}

export default function BonusHuntDetailPage() {
  const params = useParams();
  const huntId = params.id as string;

  const [hunt, setHunt] = useState<BonusHuntData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/bonus-hunts/${huntId}`);

      if (response.ok) {
        const data = await response.json();

        // Transform API data to match our interface
        const stats: BonusHuntStatsData = {
          totalCost: data.total_cost || 0,
          totalPayout: data.total_payout || 0,
          profitLoss: (data.total_payout || 0) - (data.total_cost || 0),
          roiPercentage: data.total_cost > 0
            ? Math.round(((data.total_payout - data.total_cost) / data.total_cost) * 100)
            : 0,
          bonusCount: data.entries?.length || 0,
          bonusesOpened: data.entries?.filter((e: any) => e.is_opened).length || 0,
          bonusesRemaining: data.entries?.filter((e: any) => !e.is_opened).length || 0,
          bestMultiplier: Math.max(...(data.entries?.filter((e: any) => e.multiplier).map((e: any) => e.multiplier) || [0])),
          worstMultiplier: Math.min(...(data.entries?.filter((e: any) => e.is_opened && e.multiplier).map((e: any) => e.multiplier) || [0])) || 0,
          avgMultiplier: data.avg_multiplier || 0,
          currentAvgNeeded: data.avg_needed || 0,
        };

        const entries: BonusHuntEntryData[] = (data.entries || []).map((entry: any, index: number) => ({
          id: entry.id,
          bonusHuntId: huntId,
          gameId: entry.game_id,
          gameName: entry.game_name || 'Unknown Game',
          position: index + 1,
          betAmount: entry.bet_amount || 0,
          isOpened: entry.is_opened || false,
          payout: entry.payout,
          multiplier: entry.multiplier,
        }));

        setHunt({
          id: data.id,
          sessionId: data.session_id || '',
          streamerId: data.streamer_id || '',
          streamerName: data.streamer_name || 'Unknown',
          status: data.status || 'collecting',
          startedAt: data.started_at || new Date().toISOString(),
          openingStartedAt: data.opening_started_at,
          completedAt: data.completed_at,
          stats,
          entries,
        });
      } else if (response.status === 404) {
        setError('Bonus hunt not found');
      } else {
        setError('Failed to load bonus hunt');
      }
    } catch (err) {
      console.error('Error fetching bonus hunt:', err);
      setError('Network error - please try again');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh if hunt is active
    const interval = setInterval(() => {
      if (hunt?.status === 'collecting' || hunt?.status === 'opening') {
        fetchData();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [huntId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'collecting':
        return <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/50 text-sm px-3 py-1">Collecting Bonuses</Badge>;
      case 'opening':
        return <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 text-sm px-3 py-1">Opening Phase</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50 text-sm px-3 py-1">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-500/20 text-gray-400 border-gray-500/50 text-sm px-3 py-1">Cancelled</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleOpenEntry = (entryId: string) => {
    console.log('Opening entry:', entryId);
    // In real app, this would call API to record payout
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-6 w-32 mb-6" />
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
            <div>
              <Skeleton className="h-10 w-64 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <Skeleton className="h-48 w-full mb-8" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !hunt) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <Link
            href="/bonus-hunts"
            className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Bonus Hunts
          </Link>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="py-12 text-center">
              <p className="text-destructive mb-4">{error || 'Bonus hunt not found'}</p>
              <Button variant="outline" onClick={fetchData}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Back Link */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/bonus-hunts"
            className="inline-flex items-center text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Bonus Hunts
          </Link>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-3xl font-bold text-white">{hunt.streamerName}&apos;s Bonus Hunt</h1>
              {getStatusBadge(hunt.status)}
            </div>
            <p className="text-slate-400">
              Started: {formatDate(hunt.startedAt)}
              {hunt.openingStartedAt && ` | Opening: ${formatDate(hunt.openingStartedAt)}`}
              {hunt.completedAt && ` | Completed: ${formatDate(hunt.completedAt)}`}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8">
          <BonusHuntStats stats={hunt.stats} status={hunt.status} />
        </div>

        {/* Entries */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">
            Bonus Entries ({hunt.stats.bonusesOpened}/{hunt.stats.bonusCount})
          </h2>
          {hunt.entries.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="py-8 text-center text-slate-400">
                No bonus entries recorded yet.
              </CardContent>
            </Card>
          ) : (
            <BonusHuntEntryList
              entries={hunt.entries}
              onOpen={handleOpenEntry}
              isOpeningPhase={hunt.status === 'opening'}
            />
          )}
        </div>
      </div>
    </div>
  );
}
