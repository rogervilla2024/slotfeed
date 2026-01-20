'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Zap, TrendingUp, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface StreamingStats {
  activeStreams: number;
  totalSessions: number;
  totalViewers: number;
  avgSessionDuration: string;
  topGames: Array<{
    name: string;
    plays: number;
    viewers: number;
  }>;
  topStreamers: Array<{
    username: string;
    followers: number;
    activeSession: boolean;
  }>;
  hourlyActivity: Array<{
    hour: string;
    streams: number;
    viewers: number;
  }>;
}

export function StreamingStatsPanel() {
  const [stats, setStats] = useState<StreamingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/v1/admin/streaming-stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch streaming stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 300000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (!stats) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Unable to fetch streaming statistics. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Active Streams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold">{stats.activeStreams}</div>
              <p className="text-xs text-muted-foreground">Live right now</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              Total Viewers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold">{stats.totalViewers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Currently watching</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Total Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold">{stats.totalSessions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">This period</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-500" />
              Avg Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-3xl font-bold">{stats.avgSessionDuration}</div>
              <p className="text-xs text-muted-foreground">Per session</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="games">Top Games</TabsTrigger>
          <TabsTrigger value="streamers">Top Streamers</TabsTrigger>
        </TabsList>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>24-Hour Activity</CardTitle>
              <CardDescription>Streams and viewers by hour</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.hourlyActivity.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.hourlyActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="streams" fill="#3b82f6" name="Streams" />
                    <Bar yAxisId="right" dataKey="viewers" fill="#8b5cf6" name="Viewers" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-muted-foreground">
                  No activity data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Games Tab */}
        <TabsContent value="games" className="space-y-4">
          <div className="space-y-3">
            {stats.topGames.map((game, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{game.name}</h4>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{game.plays} plays</span>
                        <span>{game.viewers.toLocaleString()} viewers</span>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      #{index + 1}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Top Streamers Tab */}
        <TabsContent value="streamers" className="space-y-4">
          <div className="space-y-3">
            {stats.topStreamers.map((streamer, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{streamer.username}</h4>
                        {streamer.activeSession && (
                          <Badge className="bg-red-600">LIVE</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {streamer.followers.toLocaleString()} followers
                      </p>
                    </div>
                    <Badge variant="secondary">
                      #{index + 1}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Insights Card */}
      <Card>
        <CardHeader>
          <CardTitle>Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Peak Hours: During peak streaming hours, consider increasing API rate limits
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
            <p className="text-sm font-medium text-green-900 dark:text-green-100">
              Growth Trend: Streaming activity is trending up
            </p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
            <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
              Top Games: Focus content creation on high-performing games
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
