/**
 * Phase 13-4: Advanced Dashboard Component
 *
 * Real-time ML analytics dashboard with:
 * - Live metrics and KPIs
 * - Real-time alerts
 * - Game status monitoring
 * - Opportunity tracking
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  useDashboardWebSocket,
  useAlertStream,
} from '@/lib/hooks/use-dashboard-websocket';
import {
  AlertCircle,
  Zap,
  TrendingUp,
  Activity,
  Flame,
  Snowflake,
  Bell,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export function AdvancedDashboard() {
  const { isConnected, dashboardState, error: wsError } = useDashboardWebSocket();
  const { alerts, isConnected: alertStreamConnected, acknowledgeAlert } = useAlertStream();
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  const metrics = dashboardState.metrics;
  const games = dashboardState.games;

  // Calculate alert statistics
  const alertStats = useMemo(() => {
    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };

    alerts.forEach((alert) => {
      byType[alert.type] = (byType[alert.type] || 0) + 1;
      bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1;
    });

    return { byType, bySeverity };
  }, [alerts]);

  // Hot/cold game analysis
  const gameStats = useMemo(() => {
    if (!games.length) return { hot: 0, cold: 0, normal: 0 };

    return {
      hot: games.filter((g) => g.status === 'hot').length,
      cold: games.filter((g) => g.status === 'cold').length,
      normal: games.filter((g) => g.status === 'normal').length,
    };
  }, [games]);

  // Top opportunities
  const topOpportunities = useMemo(() => {
    return games
      .filter((g) => g.status === 'hot' && g.prediction_confidence > 0.65)
      .sort(
        (a, b) =>
          (b.prediction_confidence - a.prediction_confidence) ||
          (b.current_rtp - b.theoretical_rtp - (a.current_rtp - a.theoretical_rtp))
      )
      .slice(0, 5);
  }, [games]);

  // Risk zones
  const riskZones = useMemo(() => {
    return games
      .filter((g) => g.anomaly_score >= 0.7)
      .sort((a, b) => b.anomaly_score - a.anomaly_score)
      .slice(0, 5);
  }, [games]);

  if (!isConnected) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Connecting to live dashboard... {wsError && `Error: ${wsError.message}`}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Connection Status */}
      <div className="flex gap-4 justify-end">
        <Badge variant={isConnected ? 'default' : 'destructive'} className="gap-2">
          <Activity className="w-3 h-3" />
          {isConnected ? 'Live' : 'Connecting'}
        </Badge>
        <Badge
          variant={alertStreamConnected ? 'default' : 'outline'}
          className="gap-2"
        >
          <Bell className="w-3 h-3" />
          Alerts {alertStreamConnected ? 'Active' : 'Buffered'}
        </Badge>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="opportunities">
            Opportunities
            {topOpportunities.length > 0 && (
              <Badge className="ml-2" variant="default">
                {topOpportunities.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts
            {alerts.length > 0 && (
              <Badge className="ml-2" variant="destructive">
                {alerts.filter((a) => !a.read).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="risks">Risk Zones</TabsTrigger>
          <TabsTrigger value="games">All Games</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {metrics && (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      Games Tracked
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {metrics.total_games_tracked}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {gameStats.hot} hot, {gameStats.cold} cold
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      Active Anomalies
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {metrics.games_with_anomalies}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Games with detected anomalies
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      Opportunities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {metrics.active_opportunities}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Hot slots available now
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      Model Accuracy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(metrics.accuracy_rate * 100).toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Prediction accuracy
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* RTP Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>RTP Distribution</CardTitle>
                    <CardDescription>
                      Average: {metrics.avg_rtp.toFixed(2)}%
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart
                        data={[
                          {
                            name: 'Average',
                            value: metrics.avg_rtp,
                          },
                          {
                            name: 'Highest',
                            value: metrics.highest_rtp,
                          },
                          {
                            name: 'Lowest',
                            value: metrics.lowest_rtp,
                          },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[90, 100]} />
                        <Tooltip
                          formatter={(value: number) => `${value.toFixed(2)}%`}
                        />
                        <Bar dataKey="value" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Game Status Breakdown</CardTitle>
                    <CardDescription>
                      Distribution across hot, cold, and normal
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Hot', value: gameStats.hot },
                            { name: 'Normal', value: gameStats.normal },
                            { name: 'Cold', value: gameStats.cold },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#ef4444" />
                          <Cell fill="#64748b" />
                          <Cell fill="#3b82f6" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Opportunities Tab */}
        <TabsContent value="opportunities">
          <Card>
            <CardHeader>
              <CardTitle>Top Opportunities</CardTitle>
              <CardDescription>
                Hot games with high prediction confidence
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topOpportunities.length > 0 ? (
                <div className="space-y-4">
                  {topOpportunities.map((game) => (
                    <div
                      key={game.game_id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-green-50 to-emerald-50"
                    >
                      <div className="flex-1">
                        <div className="font-semibold flex items-center gap-2">
                          <Flame className="w-4 h-4 text-red-600" />
                          {game.game_name}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          RTP: {game.current_rtp.toFixed(2)}% (vs {game.theoretical_rtp.toFixed(2)}%)
                          • Confidence: {(game.prediction_confidence * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Bonus probability next 100 spins:{' '}
                          {(game.bonus_probability_next_100 * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-green-600">HOT</Badge>
                        <div className="text-sm font-semibold text-green-600 mt-2">
                          +{(game.current_rtp - game.theoretical_rtp).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hot opportunities at the moment
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>
                Real-time notifications from the ML analytics engine
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length > 0 ? (
                <div className="space-y-3">
                  {alerts.slice(0, 20).map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        alert.read
                          ? 'bg-gray-50 opacity-60'
                          : 'bg-white border-left-4'
                      } ${
                        alert.severity === 'critical'
                          ? 'border-l-4 border-l-red-600'
                          : alert.severity === 'high'
                            ? 'border-l-4 border-l-orange-600'
                            : alert.severity === 'medium'
                              ? 'border-l-4 border-l-yellow-600'
                              : 'border-l-4 border-l-blue-600'
                      }`}
                      onClick={() =>
                        setExpandedAlert(
                          expandedAlert === alert.id ? null : alert.id
                        )
                      }
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {alert.read && (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            )}
                            <span className="font-semibold text-sm">
                              {alert.title}
                            </span>
                            <Badge
                              variant="outline"
                              className={
                                alert.severity === 'critical'
                                  ? 'bg-red-100 text-red-800'
                                  : alert.severity === 'high'
                                    ? 'bg-orange-100 text-orange-800'
                                    : alert.severity === 'medium'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-blue-100 text-blue-800'
                              }
                            >
                              {alert.severity.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {alert.message}
                          </p>

                          {expandedAlert === alert.id && (
                            <div className="mt-3 space-y-2 bg-gray-50 p-3 rounded text-sm">
                              <div>
                                <span className="font-semibold">Recommendation:</span>
                                <p className="text-muted-foreground mt-1">
                                  {alert.recommendation}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {new Date(alert.timestamp).toLocaleString()}
                              </div>
                              {!alert.read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    acknowledgeAlert(alert.id);
                                  }}
                                  className="text-blue-600 hover:underline text-sm mt-2"
                                >
                                  Mark as Read
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No alerts at the moment
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Zones Tab */}
        <TabsContent value="risks">
          <Card>
            <CardHeader>
              <CardTitle>Risk Zones</CardTitle>
              <CardDescription>
                Games with high anomaly scores - consider avoiding
              </CardDescription>
            </CardHeader>
            <CardContent>
              {riskZones.length > 0 ? (
                <div className="space-y-4">
                  {riskZones.map((game) => (
                    <div
                      key={game.game_id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-red-50 to-orange-50"
                    >
                      <div className="flex-1">
                        <div className="font-semibold flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          {game.game_name}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Anomaly Score: {game.anomaly_score.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          RTP: {game.current_rtp.toFixed(2)}% • Volatility: {game.volatility}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive">RISKY</Badge>
                        <div className="text-sm font-semibold text-red-600 mt-2">
                          {(game.anomaly_score * 100).toFixed(0)}% Risk
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No risk zones detected - all clear!
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Games Tab */}
        <TabsContent value="games">
          <Card>
            <CardHeader>
              <CardTitle>All Tracked Games</CardTitle>
              <CardDescription>
                Real-time status of all {games.length} games
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-semibold">Game</th>
                      <th className="text-right py-2 font-semibold">RTP</th>
                      <th className="text-right py-2 font-semibold">vs Theory</th>
                      <th className="text-center py-2 font-semibold">Status</th>
                      <th className="text-right py-2 font-semibold">Confidence</th>
                      <th className="text-right py-2 font-semibold">Anomaly</th>
                    </tr>
                  </thead>
                  <tbody>
                    {games.map((game) => (
                      <tr key={game.game_id} className="border-b hover:bg-gray-50">
                        <td className="py-3">{game.game_name}</td>
                        <td className="text-right">
                          {game.current_rtp.toFixed(2)}%
                        </td>
                        <td
                          className={`text-right font-semibold ${
                            game.current_rtp > game.theoretical_rtp
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {(game.current_rtp - game.theoretical_rtp).toFixed(2)}%
                        </td>
                        <td className="text-center">
                          {game.status === 'hot' && (
                            <Badge className="bg-red-100 text-red-800">
                              HOT
                            </Badge>
                          )}
                          {game.status === 'cold' && (
                            <Badge className="bg-blue-100 text-blue-800">
                              COLD
                            </Badge>
                          )}
                          {game.status === 'normal' && (
                            <Badge className="bg-gray-100 text-gray-800">
                              NORMAL
                            </Badge>
                          )}
                        </td>
                        <td className="text-right">
                          {(game.prediction_confidence * 100).toFixed(0)}%
                        </td>
                        <td className="text-right">
                          {game.anomaly_score.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
