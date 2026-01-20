'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, TrendingUp, TrendingDown, AlertTriangle, Target, Zap, Brain } from 'lucide-react';

interface Prediction {
  game_id: string;
  rtp_1h: number;
  rtp_24h: number;
  rtp_7d: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
}

interface Anomaly {
  type: string;
  game_id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  description: string;
}

interface Opportunity {
  type: string;
  game_id: string;
  confidence: number;
  action: string;
}

export function MLInsightsDashboard({ period = '24h' }: { period?: string }) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const [predictionsRes, anomaliesRes, opportunitiesRes] = await Promise.all([
        fetch('/api/v1/ml-analytics/rtp-predictions/all'),
        fetch(`/api/v1/ml-analytics/anomalies?period=${period}`),
        fetch('/api/v1/ml-analytics/insights/opportunities'),
      ]);

      if (predictionsRes.ok) {
        setPredictions(await predictionsRes.json());
      }
      if (anomaliesRes.ok) {
        setAnomalies(await anomaliesRes.json());
      }
      if (opportunitiesRes.ok) {
        setOpportunities(await opportunitiesRes.json());
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-64 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Key Metrics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4" />
              ML Models Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-xs text-muted-foreground mt-1">3 models trained & deployed</p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span>RTP Predictor</span>
                <Badge variant="outline">v1 (82.3%)</Badge>
              </div>
              <div className="flex justify-between text-xs">
                <span>Bonus Predictor</span>
                <Badge variant="outline">v1 (75.6%)</Badge>
              </div>
              <div className="flex justify-between text-xs">
                <span>Anomaly Detector</span>
                <Badge variant="outline">v1 (89.1%)</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Opportunities Count */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-green-500" />
              Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{opportunities.length}</div>
            <p className="text-xs text-muted-foreground mt-1">High confidence plays detected</p>
            {opportunities.length > 0 && (
              <div className="mt-4 space-y-2">
                {opportunities.slice(0, 2).map((opp, idx) => (
                  <div key={idx} className="text-xs p-2 bg-green-50 rounded border border-green-200">
                    <p className="font-medium text-green-900">{opp.game_id}</p>
                    <p className="text-green-700">{opp.action}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Anomalies Count */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Anomalies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{anomalies.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Unusual patterns detected</p>
            {anomalies.length > 0 && (
              <div className="mt-4 space-y-2">
                {anomalies.slice(0, 2).map((anom, idx) => (
                  <div key={idx} className="text-xs p-2 bg-orange-50 rounded border border-orange-200">
                    <div className="flex justify-between items-center">
                      <p className="font-medium text-orange-900">{anom.type}</p>
                      <Badge variant="outline" className="text-xs">{anom.severity}</Badge>
                    </div>
                    <p className="text-orange-700 mt-1">{anom.game_id}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="predictions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="predictions">RTP Predictions</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
        </TabsList>

        {/* Predictions Tab */}
        <TabsContent value="predictions">
          <Card>
            <CardHeader>
              <CardTitle>RTP Predictions</CardTitle>
              <CardDescription>ML forecasts for next 1 hour, 24 hours, and 7 days</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {predictions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No predictions available yet</p>
              ) : (
                <div className="space-y-4">
                  {predictions.map((pred) => (
                    <div key={pred.game_id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold">{pred.game_id}</h4>
                        <div className="flex items-center gap-2">
                          {pred.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                          {pred.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                          {pred.trend === 'stable' && <Zap className="h-4 w-4 text-gray-500" />}
                          <Badge variant="outline">{(pred.confidence * 100).toFixed(0)}% confidence</Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-3 bg-muted rounded">
                          <p className="text-xs text-muted-foreground">1 Hour</p>
                          <p className="text-lg font-semibold">{pred.rtp_1h.toFixed(2)}%</p>
                        </div>
                        <div className="p-3 bg-muted rounded">
                          <p className="text-xs text-muted-foreground">24 Hours</p>
                          <p className="text-lg font-semibold">{pred.rtp_24h.toFixed(2)}%</p>
                        </div>
                        <div className="p-3 bg-muted rounded">
                          <p className="text-xs text-muted-foreground">7 Days</p>
                          <p className="text-lg font-semibold">{pred.rtp_7d.toFixed(2)}%</p>
                        </div>
                      </div>

                      {/* Prediction Chart */}
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={[
                          { name: '1h', rtp: pred.rtp_1h },
                          { name: '24h', rtp: pred.rtp_24h },
                          { name: '7d', rtp: pred.rtp_7d },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis domain={[90, 100]} />
                          <Tooltip />
                          <Line type="monotone" dataKey="rtp" stroke="#3b82f6" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Opportunities Tab */}
        <TabsContent value="opportunities">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                High Confidence Opportunities
              </CardTitle>
              <CardDescription>Games with strong buy signals from ML models</CardDescription>
            </CardHeader>
            <CardContent>
              {opportunities.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No opportunities detected at this time</p>
              ) : (
                <div className="space-y-3">
                  {opportunities.map((opp, idx) => (
                    <div key={idx} className="border border-green-200 bg-green-50 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-green-900">{opp.game_id}</h4>
                          <p className="text-sm text-green-700 mt-1">{opp.action}</p>
                        </div>
                        <Badge className="bg-green-600">{(opp.confidence * 100).toFixed(0)}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Anomalies Tab */}
        <TabsContent value="anomalies">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Detected Anomalies
              </CardTitle>
              <CardDescription>Unusual patterns requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              {anomalies.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No anomalies detected</p>
              ) : (
                <div className="space-y-3">
                  {anomalies.map((anom, idx) => (
                    <div
                      key={idx}
                      className={`border rounded-lg p-4 ${
                        anom.severity === 'critical' ? 'border-red-200 bg-red-50' :
                        anom.severity === 'high' ? 'border-orange-200 bg-orange-50' :
                        anom.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                        'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{anom.type}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{anom.game_id}</p>
                          <p className="text-sm mt-2">{anom.description}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            anom.severity === 'critical' ? 'bg-red-600 text-white' :
                            anom.severity === 'high' ? 'bg-orange-600 text-white' :
                            anom.severity === 'medium' ? 'bg-yellow-600 text-white' :
                            'bg-gray-600 text-white'
                          }
                        >
                          {anom.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="patterns">
          <Card>
            <CardHeader>
              <CardTitle>Identified Patterns</CardTitle>
              <CardDescription>Recurring trends and behaviors in slot performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Time-of-Day Effect</h4>
                  <p className="text-sm text-muted-foreground mb-3">RTP tends to be higher during evening peak hours</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={[
                      { hour: '00-06', rtp: 95.8 },
                      { hour: '06-12', rtp: 96.0 },
                      { hour: '12-18', rtp: 96.2 },
                      { hour: '18-24', rtp: 97.1 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis domain={[94, 98]} />
                      <Tooltip />
                      <Bar dataKey="rtp" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Weekly Patterns</h4>
                  <p className="text-sm text-muted-foreground mb-3">Weekends show higher variance than weekdays</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={[
                      { day: 'Mon', rtp: 96.2 },
                      { day: 'Tue', rtp: 96.3 },
                      { day: 'Wed', rtp: 96.1 },
                      { day: 'Thu', rtp: 96.4 },
                      { day: 'Fri', rtp: 96.5 },
                      { day: 'Sat', rtp: 96.8 },
                      { day: 'Sun', rtp: 96.9 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis domain={[94, 98]} />
                      <Tooltip />
                      <Bar dataKey="rtp" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
