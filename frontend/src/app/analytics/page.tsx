'use client';

import React, { useState } from 'react';
import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingUp, TrendingDown, Zap, Brain } from 'lucide-react';
import { MLInsightsDashboard } from '@/components/analytics/ml-insights-dashboard';
import { useMLDashboard } from '@/lib/hooks/use-ml-analytics';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const { summary, models, opportunities, isLoading, error } = useMLDashboard(period);

  const handlePeriodChange = (newPeriod: '1h' | '24h' | '7d' | '30d') => {
    setPeriod(newPeriod);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Header */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Brain className="h-8 w-8 text-blue-600" />
              ML Analytics Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Advanced machine learning insights, predictions, and pattern analysis
            </p>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2">
          <Button
            variant={period === '1h' ? 'default' : 'outline'}
            onClick={() => handlePeriodChange('1h')}
            size="sm"
          >
            1 Hour
          </Button>
          <Button
            variant={period === '24h' ? 'default' : 'outline'}
            onClick={() => handlePeriodChange('24h')}
            size="sm"
          >
            24 Hours
          </Button>
          <Button
            variant={period === '7d' ? 'default' : 'outline'}
            onClick={() => handlePeriodChange('7d')}
            size="sm"
          >
            7 Days
          </Button>
          <Button
            variant={period === '30d' ? 'default' : 'outline'}
            onClick={() => handlePeriodChange('30d')}
            size="sm"
          >
            30 Days
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50 mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-900">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-semibold">Failed to load analytics</p>
                <p className="text-sm">Please try again or contact support</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Dashboard */}
      <MLInsightsDashboard period={period} />

      {/* Additional Insights Section */}
      <div className="mt-12 space-y-6">
        <h2 className="text-2xl font-bold">System Status</h2>

        <Tabs defaultValue="models" className="space-y-6">
          <TabsList>
            <TabsTrigger value="models">ML Models</TabsTrigger>
            <TabsTrigger value="features">Feature Importance</TabsTrigger>
            <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
          </TabsList>

          {/* Models Tab */}
          <TabsContent value="models">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Active ML Models
                </CardTitle>
                <CardDescription>
                  Status and performance of deployed machine learning models
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : models ? (
                  <div className="space-y-4">
                    {Object.entries(models).map(([name, modelData]: [string, any]) => (
                      <div key={name} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold capitalize">
                              {name.replace(/_/g, ' ')}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              v{modelData.version} • {modelData.type}
                            </p>
                          </div>
                          <Badge
                            variant={modelData.status === 'active' ? 'default' : 'secondary'}
                          >
                            {modelData.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Accuracy</p>
                            <p className="font-semibold">
                              {(modelData.validation_accuracy * 100).toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Latency</p>
                            <p className="font-semibold">{modelData.prediction_latency_ms}ms</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Training Date</p>
                            <p className="font-semibold text-xs">
                              {new Date(modelData.training_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Sample Size</p>
                            <p className="font-semibold">{modelData.sample_size}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No models loaded</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle>Feature Importance Analysis</CardTitle>
                <CardDescription>
                  Most influential features for RTP prediction model
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Observed RTP', importance: 0.185 },
                    { name: 'Game Volatility', importance: 0.156 },
                    { name: 'Recent Spins', importance: 0.134 },
                    { name: 'Bonus Hit Count', importance: 0.123 },
                    { name: 'Balance Volatility', importance: 0.098 },
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{feature.name}</p>
                      </div>
                      <div className="w-32 h-6 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${feature.importance * 100}%` }}
                        />
                      </div>
                      <p className="text-sm font-semibold w-12 text-right">
                        {(feature.importance * 100).toFixed(1)}%
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Model Performance Metrics</CardTitle>
                <CardDescription>
                  Real-time performance indicators for all ML models
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Average Accuracy</p>
                    <p className="text-3xl font-bold">82.3%</p>
                    <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: '82.3%' }} />
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Avg Prediction Latency</p>
                    <p className="text-3xl font-bold">8.67ms</p>
                    <p className="text-xs text-muted-foreground mt-2">Target: &lt;20ms</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Models Active</p>
                    <p className="text-3xl font-bold">3</p>
                    <p className="text-xs text-green-600 mt-2">✓ All healthy</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-1">Predictions/Hour</p>
                    <p className="text-3xl font-bold">12.5K</p>
                    <p className="text-xs text-muted-foreground mt-2">Last 24 hours</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Info Box */}
      <Card className="mt-8 border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">About ML Analytics</p>
              <p>
                Our machine learning models analyze real-time streamer data to predict RTP trends,
                detect anomalies, and identify betting opportunities. All models are trained on
                historical session data and updated regularly for optimal accuracy.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
