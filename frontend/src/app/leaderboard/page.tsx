'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Crown, TrendingUp, Coins, Users, Zap } from 'lucide-react';
import {
  StreamerLeaderboardStructuredData,
  WebPageStructuredData,
} from '@/components/seo';

interface Streamer {
  id: string;
  name: string;
  followers: number;
  totalSessions: number;
  totalWagered: number;
  totalPayouts: number;
  profitLoss: number;
  roi: number;
  averageRtp: number;
  platform: string;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'profit' | 'sessions' | 'roi' | 'wagered'>('profit');

  useEffect(() => {
    const fetchStreamers = async () => {
      try {
        const response = await fetch('/api/v1/streamers');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();

        // Map API response to Streamer type
        const mappedStreamers = (Array.isArray(data) ? data : data.streamers || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          followers: s.followers,
          totalSessions: s.totalSessions,
          totalWagered: s.totalWagered,
          totalPayouts: s.totalPayouts,
          profitLoss: s.profitLoss,
          roi: s.roi,
          averageRtp: s.averageRtp,
          platform: s.platform
        }));

        setStreamers(mappedStreamers);
      } catch (error) {
        console.error('Failed to fetch streamers:', error);
        setStreamers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStreamers();
  }, []);

  const sortedStreamers = useMemo(() => {
    const sorted = [...streamers];
    if (sortBy === 'profit') {
      sorted.sort((a, b) => b.profitLoss - a.profitLoss);
    } else if (sortBy === 'sessions') {
      sorted.sort((a, b) => b.totalSessions - a.totalSessions);
    } else if (sortBy === 'roi') {
      sorted.sort((a, b) => b.roi - a.roi);
    } else {
      sorted.sort((a, b) => b.totalWagered - a.totalWagered);
    }
    return sorted;
  }, [streamers, sortBy]);

  const topByProfit = sortedStreamers.slice(0, 5);
  const topByRoi = [...streamers].sort((a, b) => b.roi - a.roi).slice(0, 5);
  const topBySessions = [...streamers].sort((a, b) => b.totalSessions - a.totalSessions).slice(0, 5);

  const getRankBadge = (index: number) => {
    if (index === 0) return <Crown className="h-4 w-4 text-yellow-500" />;
    if (index === 1) return <Crown className="h-4 w-4 text-gray-400" />;
    if (index === 2) return <Crown className="h-4 w-4 text-orange-400" />;
    return <span className="text-lg font-bold">#{index + 1}</span>;
  };

  const getStreamerRow = (streamer: Streamer, index: number, highlightField?: string) => (
    <Link key={streamer.id} href={`/streamer/${streamer.name.toLowerCase()}`}>
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:border hover:border-primary/50 transition-all cursor-pointer hover:bg-muted/75">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center justify-center w-10">
            {getRankBadge(index)}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-lg">{streamer.name}</p>
            <p className="text-xs text-muted-foreground">{streamer.followers.toLocaleString()} followers</p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-right">
          {highlightField === 'profit' ? (
            <div className="min-w-[120px]">
              <p className={`text-lg font-bold ${streamer.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ${streamer.profitLoss.toFixed(0)}
              </p>
              <p className="text-xs text-muted-foreground">Profit/Loss</p>
            </div>
          ) : highlightField === 'roi' ? (
            <div className="min-w-[100px]">
              <p className={`text-lg font-bold ${streamer.roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {streamer.roi.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">ROI</p>
            </div>
          ) : highlightField === 'sessions' ? (
            <div className="min-w-[80px]">
              <p className="text-lg font-bold">{streamer.totalSessions}</p>
              <p className="text-xs text-muted-foreground">Sessions</p>
            </div>
          ) : (
            <div className="min-w-[120px]">
              <p className="text-lg font-bold">${(streamer.totalWagered / 1000000).toFixed(1)}M</p>
              <p className="text-xs text-muted-foreground">Wagered</p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );

  // Prepare streamer data for SEO
  const leaderboardData = topByProfit.map((s, idx) => ({
    rank: idx + 1,
    name: s.name,
    username: s.name.toLowerCase(),
    platform: 'kick' as const,
    followers: s.followers,
    profitLoss: s.profitLoss,
    roi: s.roi,
    totalSessions: s.totalSessions,
  }));

  return (
    <main className="min-h-screen bg-background">
      {/* SEO Structured Data */}
      <WebPageStructuredData
        name="Streamer Leaderboards - SlotFeed"
        description="Rank top slot streamers by profit, sessions, ROI, and total wagered. Track performance metrics and compare success across the community."
        url="https://slotfeed.com/leaderboard"
        type="CollectionPage"
        breadcrumbs={[
          { name: 'Home', url: 'https://slotfeed.com' },
          { name: 'Leaderboard', url: 'https://slotfeed.com/leaderboard' },
        ]}
      />
      <StreamerLeaderboardStructuredData
        title="Top Slot Streamers by Profit"
        rankingType="profit"
        streamers={leaderboardData}
      />

      <section className="bg-gradient-to-r from-primary/10 to-yellow-500/10 border-b border-border py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Crown className="h-8 w-8 text-yellow-500" />
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Leaderboards</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Rank top slot streamers by profit, sessions, ROI, and total wagered. Track performance metrics and compare success across the community.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8 md:py-12">
        <Tabs defaultValue="profit" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto gap-1 p-1">
            <TabsTrigger value="profit" className="py-2.5">Top Profits</TabsTrigger>
            <TabsTrigger value="roi" className="py-2.5">Best ROI</TabsTrigger>
            <TabsTrigger value="sessions" className="py-2.5">Most Sessions</TabsTrigger>
            <TabsTrigger value="wagered" className="py-2.5">Total Wagered</TabsTrigger>
          </TabsList>

          {/* Top Profits */}
          <TabsContent value="profit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  Top Earners
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">Streamers with the highest profits</p>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground py-8">Loading...</p>
                ) : (
                  <div className="space-y-2">
                    {topByProfit.map((streamer, idx) => getStreamerRow(streamer, idx, 'profit'))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Best ROI */}
          <TabsContent value="roi" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Best Return on Investment
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">Highest ROI percentage by streamer</p>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground py-8">Loading...</p>
                ) : (
                  <div className="space-y-2">
                    {topByRoi.map((streamer, idx) => getStreamerRow(streamer, idx, 'roi'))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Most Sessions */}
          <TabsContent value="sessions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Most Active
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">Streamers with the most sessions</p>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground py-8">Loading...</p>
                ) : (
                  <div className="space-y-2">
                    {topBySessions.map((streamer, idx) => getStreamerRow(streamer, idx, 'sessions'))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Total Wagered */}
          <TabsContent value="wagered" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Total Wagered
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">Streamers with highest total stakes</p>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground py-8">Loading...</p>
                ) : (
                  <div className="space-y-2">
                    {[...streamers]
                      .sort((a, b) => b.totalWagered - a.totalWagered)
                      .slice(0, 5)
                      .map((streamer, idx) => getStreamerRow(streamer, idx, 'wagered'))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Full Rankings Table */}
        <div className="mt-12">
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-muted/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">All Rankings</CardTitle>
                <Badge variant="secondary" className="font-normal">{streamers.length} streamers</Badge>
              </div>
              <p className="text-sm text-muted-foreground">Sorted by profit/loss</p>
            </CardHeader>
            <CardContent className="p-0 pt-0">
              {loading ? (
                <p className="text-muted-foreground py-8">Loading...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[700px]">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left p-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Rank</th>
                        <th className="text-left p-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Streamer</th>
                        <th className="text-right p-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Sessions</th>
                        <th className="text-right p-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Wagered</th>
                        <th className="text-right p-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Profit/Loss</th>
                        <th className="text-right p-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">ROI</th>
                        <th className="text-right p-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Avg RTP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedStreamers.map((streamer, idx) => (
                        <tr
                          key={streamer.id}
                          onClick={() => router.push(`/streamer/${streamer.name.toLowerCase()}`)}
                          className="border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                          <td className="p-4 font-bold text-muted-foreground">#{idx + 1}</td>
                          <td className="p-4">
                            <span className="font-semibold hover:text-primary transition-colors">{streamer.name}</span>
                          </td>
                          <td className="p-4 text-right tabular-nums">{streamer.totalSessions}</td>
                          <td className="p-4 text-right tabular-nums">${(streamer.totalWagered / 1000000).toFixed(1)}M</td>
                          <td className={`p-4 text-right font-semibold tabular-nums ${streamer.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {streamer.profitLoss >= 0 ? '+' : ''}${streamer.profitLoss.toLocaleString()}
                          </td>
                          <td className={`p-4 text-right font-semibold tabular-nums ${streamer.roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {streamer.roi >= 0 ? '+' : ''}{streamer.roi.toFixed(1)}%
                          </td>
                          <td className="p-4 text-right text-muted-foreground tabular-nums">
                            {streamer.averageRtp.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
