'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { TrendingUp, TrendingDown, Clock, Calendar, Zap, AlertCircle } from 'lucide-react';

interface PatternAnalyzerProps {
  gameId: string;
  period?: '1d' | '7d' | '30d' | '90d';
}

export function PatternAnalyzer({ gameId, period = '7d' }: PatternAnalyzerProps) {
  const [selectedTab, setSelectedTab] = useState('overview');

  // Mock data - would be fetched from API in production
  const patternData = {
    timeOfDay: [
      { hour: '00-04', rtp: 95.8, bonus: 0.58, count: 45 },
      { hour: '04-08', rtp: 95.9, bonus: 0.61, count: 52 },
      { hour: '08-12', rtp: 96.1, bonus: 0.63, count: 78 },
      { hour: '12-16', rtp: 96.2, bonus: 0.62, count: 95 },
      { hour: '16-20', rtp: 96.5, bonus: 0.68, count: 102 },
      { hour: '20-24', rtp: 97.2, bonus: 0.72, count: 115 },
    ],
    dayOfWeek: [
      { day: 'Mon', rtp: 96.3, sessions: 45, variance: 0.8 },
      { day: 'Tue', rtp: 96.2, sessions: 42, variance: 0.75 },
      { day: 'Wed', rtp: 96.1, sessions: 48, variance: 0.82 },
      { day: 'Thu', rtp: 96.4, sessions: 51, variance: 0.85 },
      { day: 'Fri', rtp: 96.5, sessions: 58, variance: 0.9 },
      { day: 'Sat', rtp: 96.8, sessions: 67, variance: 1.1 },
      { day: 'Sun', rtp: 96.9, sessions: 72, variance: 1.05 },
    ],
    bonusPattern: {
      avgSpins: 156,
      clusteringScore: 0.65,
      variance: 0.34,
      frequency: 0.64,
    },
    volatilityTrend: [
      { period: '1-3', volatility: 11.2, trend: 'increasing' },
      { period: '4-6', volatility: 12.1, trend: 'increasing' },
      { period: '7-9', volatility: 12.8, trend: 'stable' },
      { period: '10-12', volatility: 12.5, trend: 'decreasing' },
      { period: '13-15', volatility: 11.9, trend: 'decreasing' },
      { period: '16-18', volatility: 12.4, trend: 'increasing' },
      { period: '19-21', volatility: 12.6, trend: 'stable' },
    ]
  };

  const radarData = [
    { metric: 'RTP', value: 96.5, theoreticalRtp: 96.48 },
    { metric: 'Volatility', value: 12.5, confidence: 0.84 },
    { metric: 'Bonus Freq', value: 0.64, target: 0.63 },
    { metric: 'Variance', value: 85, normalizedMax: 100 },
    { metric: 'Sample Size', value: 405, normalizedMax: 500 },
    { metric: 'Confidence', value: 83, normalizedMax: 100 },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Overall Confidence</div>
            <div className="text-3xl font-bold mt-2">83%</div>
            <div className="text-xs text-green-600 mt-2">✓ High confidence</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Patterns Detected</div>
            <div className="text-3xl font-bold mt-2">12</div>
            <div className="text-xs text-muted-foreground mt-2">Across all types</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Significance</div>
            <div className="text-3xl font-bold mt-2" style={{ color: '#ea580c' }}>MEDIUM</div>
            <div className="text-xs text-orange-600 mt-2">Monitor closely</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Sessions Analyzed</div>
            <div className="text-3xl font-bold mt-2">405</div>
            <div className="text-xs text-muted-foreground mt-2">Last {period}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="time-of-day">Time-of-Day</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="bonus">Bonus Patterns</TabsTrigger>
          <TabsTrigger value="volatility">Volatility</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Pattern Overview</CardTitle>
              <CardDescription>Multi-dimensional pattern analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Radar Chart */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-4">Pattern Strength Analysis</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="Current" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Key Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold">Positive Patterns</h4>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li>✓ RTP trending above theoretical</li>
                    <li>✓ Bonus clustering detected (0.65 score)</li>
                    <li>✓ Evening peak hours highly consistent</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <h4 className="font-semibold">Items to Monitor</h4>
                  </div>
                  <ul className="space-y-2 text-sm">
                    <li>⚠ Early morning hours show lower RTP</li>
                    <li>⚠ Weekend variance slightly elevated</li>
                    <li>⚠ Volatility trend increasing (potential risk)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time-of-Day Tab */}
        <TabsContent value="time-of-day">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Time-of-Day Effects
              </CardTitle>
              <CardDescription>RTP and bonus frequency by hour of day</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* RTP by Hour */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">RTP Trend Throughout Day</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={patternData.timeOfDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis domain={[95, 98]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="rtp" stroke="#3b82f6" strokeWidth={2} name="Observed RTP" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Bonus Frequency by Hour */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">Bonus Frequency by Hour</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={patternData.timeOfDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="bonus" fill="#10b981" name="Bonus Frequency" />
                    <Bar dataKey="count" fill="#6b7280" name="Session Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Peak Hours */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">Peak Hours (20-24:00)</h4>
                  <p className="text-2xl font-bold text-green-600 mb-2">97.2%</p>
                  <p className="text-sm text-muted-foreground">Avg RTP during peak hours</p>
                  <Badge className="mt-3 bg-green-100 text-green-900">Recommended</Badge>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-orange-900 mb-2">Low Hours (02-06:00)</h4>
                  <p className="text-2xl font-bold text-orange-600 mb-2">95.8%</p>
                  <p className="text-sm text-muted-foreground">Avg RTP during off-peak</p>
                  <Badge className="mt-3 bg-orange-100 text-orange-900">Avoid</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weekly Tab */}
        <TabsContent value="weekly">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Weekly Patterns
              </CardTitle>
              <CardDescription>RTP and activity by day of week</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={patternData.dayOfWeek}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis yAxisId="left" domain={[95.5, 97]} />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="rtp" fill="#3b82f6" name="RTP %" />
                  <Bar yAxisId="right" dataKey="sessions" fill="#8b5cf6" name="Sessions" />
                </BarChart>
              </ResponsiveContainer>

              {/* Weekday vs Weekend */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 bg-blue-50">
                  <h4 className="font-semibold mb-2">Weekdays (Mon-Fri)</h4>
                  <p className="text-sm text-muted-foreground mb-2">Average RTP</p>
                  <p className="text-2xl font-bold text-blue-600">96.3%</p>
                  <p className="text-xs text-muted-foreground mt-2">285 sessions, variance: 0.15</p>
                </div>

                <div className="border rounded-lg p-4 bg-purple-50">
                  <h4 className="font-semibold mb-2">Weekends (Sat-Sun)</h4>
                  <p className="text-sm text-muted-foreground mb-2">Average RTP</p>
                  <p className="text-2xl font-bold text-purple-600">96.8%</p>
                  <p className="text-xs text-muted-foreground mt-2">120 sessions, variance: 0.25</p>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-amber-50">
                <h4 className="font-semibold text-amber-900 mb-2">⚠ Weekend Insight</h4>
                <p className="text-sm text-amber-800">
                  Weekends show higher RTP (0.5% above weekdays) but with higher variance. Consider larger stake sizes on weekends with careful bankroll management.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bonus Patterns Tab */}
        <TabsContent value="bonus">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Bonus Hit Patterns
              </CardTitle>
              <CardDescription>Bonus frequency and clustering analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Avg Spins/Bonus</p>
                  <p className="text-2xl font-bold mt-2">{patternData.bonusPattern.avgSpins}</p>
                  <p className="text-xs text-muted-foreground mt-2">Expected interval</p>
                </div>

                <div className="border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Clustering Score</p>
                  <p className="text-2xl font-bold mt-2">{(patternData.bonusPattern.clusteringScore * 100).toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground mt-2">How clustered (0-100)</p>
                </div>

                <div className="border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Frequency</p>
                  <p className="text-2xl font-bold mt-2">{patternData.bonusPattern.frequency.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-2">Per 100 spins</p>
                </div>

                <div className="border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Variance</p>
                  <p className="text-2xl font-bold mt-2">{(patternData.bonusPattern.variance * 100).toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground mt-2">Spread of intervals</p>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-green-50">
                <h4 className="font-semibold text-green-900 mb-2">✓ Bonus Pattern Insight</h4>
                <p className="text-sm text-green-800">
                  Clustering score of 0.65 indicates moderate bonus clustering. Bonuses tend to come in groups rather than randomly distributed. This suggests strategic play during bonus streaks could be beneficial.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Volatility Tab */}
        <TabsContent value="volatility">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Volatility Trends
              </CardTitle>
              <CardDescription>Balance volatility patterns over time</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={patternData.volatilityTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="volatility" stroke="#ef4444" strokeWidth={2} name="Balance Volatility" />
                </LineChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Average</p>
                  <p className="text-2xl font-bold mt-2">12.5</p>
                  <p className="text-xs text-muted-foreground mt-2">Balance fluctuation</p>
                </div>

                <div className="border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Peak Hour</p>
                  <p className="text-2xl font-bold mt-2">22:00</p>
                  <p className="text-xs text-muted-foreground mt-2">Highest volatility</p>
                </div>

                <div className="border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Trend</p>
                  <p className="text-2xl font-bold mt-2">Increasing</p>
                  <p className="text-xs text-orange-600 mt-2">⚠ Rising volatility</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
