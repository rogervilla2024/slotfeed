/**
 * Phase 13-3: Forecast Visualizer Component
 *
 * Displays time-series forecasts for:
 * - RTP predictions with confidence intervals
 * - Bonus frequency trends
 * - Volatility forecasting
 */

'use client';

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Cell,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { useMLForecast } from '@/lib/hooks/use-ml-analytics';

interface ForecastVisualizerProps {
  gameId: string;
  gameName: string;
  theoreticalRtp?: number;
  period?: '7d' | '30d' | '90d';
}

export function ForecastVisualizer({
  gameId,
  gameName,
  theoreticalRtp = 96.5,
  period = '30d',
}: ForecastVisualizerProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>(period);

  const {
    rtpForecast,
    bonusFrequencyForecast,
    volatilityForecast,
    isLoading,
    error,
  } = useMLForecast(gameId, selectedPeriod);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Predictive Analytics</CardTitle>
          <CardDescription>Loading forecast data...</CardDescription>
        </CardHeader>
        <CardContent className="h-96 flex items-center justify-center">
          <div className="text-muted-foreground">Loading forecasts...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            Forecast Error
          </CardTitle>
        </CardHeader>
        <CardContent className="text-orange-800">
          {error.message || 'Failed to load forecast data'}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex gap-2 justify-end">
        <Badge
          variant={selectedPeriod === '7d' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setSelectedPeriod('7d')}
        >
          7 Days
        </Badge>
        <Badge
          variant={selectedPeriod === '30d' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setSelectedPeriod('30d')}
        >
          30 Days
        </Badge>
        <Badge
          variant={selectedPeriod === '90d' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setSelectedPeriod('90d')}
        >
          90 Days
        </Badge>
      </div>

      <Tabs defaultValue="rtp" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rtp">RTP Forecast</TabsTrigger>
          <TabsTrigger value="bonus">Bonus Frequency</TabsTrigger>
          <TabsTrigger value="volatility">Volatility</TabsTrigger>
        </TabsList>

        {/* RTP Forecast Tab */}
        <TabsContent value="rtp">
          <Card>
            <CardHeader>
              <CardTitle>{gameName} - RTP Forecast</CardTitle>
              <CardDescription>
                Historical vs Predicted RTP with {selectedPeriod} confidence interval
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rtpForecast ? (
                <>
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground">Theoretical RTP</div>
                      <div className="text-2xl font-bold">{theoreticalRtp.toFixed(2)}%</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground">Forecasted RTP</div>
                      <div className="text-2xl font-bold">{rtpForecast.forecasted_value.toFixed(2)}%</div>
                      <div className={`text-xs mt-1 ${
                        rtpForecast.forecasted_value > theoreticalRtp
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {rtpForecast.forecasted_value > theoreticalRtp ? '↑' : '↓'}{' '}
                        {Math.abs(
                          rtpForecast.forecasted_value - theoreticalRtp
                        ).toFixed(2)}%
                      </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground">Confidence</div>
                      <div className="text-2xl font-bold">
                        {(rtpForecast.confidence * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Model: {rtpForecast.model_type}
                      </div>
                    </div>
                  </div>

                  {/* RTP Trend Chart */}
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={rtpForecast.forecast_data}>
                      <defs>
                        <linearGradient
                          id="colorForecast"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient
                          id="colorUpper"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="period"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis
                        domain={[90, 103]}
                        style={{ fontSize: '12px' }}
                      />
                      <Tooltip
                        formatter={(value: number) => `${value.toFixed(2)}%`}
                        labelStyle={{ color: '#000' }}
                      />
                      <Legend />
                      {/* Historical */}
                      <Line
                        type="monotone"
                        dataKey="historical"
                        stroke="#64748b"
                        dot={false}
                        strokeWidth={2}
                        name="Historical RTP"
                        isAnimationActive={false}
                      />
                      {/* Theoretical */}
                      <Line
                        type="monotone"
                        dataKey="theoretical"
                        stroke="#fbbf24"
                        dot={false}
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        name="Theoretical RTP"
                        isAnimationActive={false}
                      />
                      {/* Forecast */}
                      <Area
                        type="monotone"
                        dataKey="forecast"
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill="url(#colorForecast)"
                        strokeWidth={2}
                        name="Forecasted RTP"
                        isAnimationActive={false}
                      />
                      {/* Confidence Interval Upper */}
                      <Area
                        type="monotone"
                        dataKey="upper_bound"
                        stroke="none"
                        fill="url(#colorUpper)"
                        strokeWidth={0}
                        name="Confidence Interval"
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>

                  {/* Insights */}
                  <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-blue-900 mb-2">
                      Forecast Insights
                    </div>
                    <ul className="text-sm text-blue-800 space-y-1">
                      {rtpForecast.forecast_data && rtpForecast.forecast_data.length > 0 && (
                        <>
                          <li>
                            • Trend: {
                              rtpForecast.forecast_data[
                                rtpForecast.forecast_data.length - 1
                              ]?.forecast >
                              rtpForecast.forecast_data[0]?.forecast
                                ? '↑ Upward'
                                : '↓ Downward'
                            }
                          </li>
                          <li>
                            • Accuracy: {(rtpForecast.mape * 100).toFixed(1)}% MAPE
                          </li>
                          <li>
                            • Recommendation: {rtpForecast.recommendation}
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No forecast data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bonus Frequency Forecast Tab */}
        <TabsContent value="bonus">
          <Card>
            <CardHeader>
              <CardTitle>{gameName} - Bonus Frequency Forecast</CardTitle>
              <CardDescription>
                Expected bonus hits per 100 spins
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bonusFrequencyForecast ? (
                <>
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground">Current Frequency</div>
                      <div className="text-2xl font-bold">
                        {bonusFrequencyForecast.current_value.toFixed(3)}
                      </div>
                      <div className="text-xs text-muted-foreground">per 100 spins</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground">Forecasted Frequency</div>
                      <div className="text-2xl font-bold">
                        {bonusFrequencyForecast.forecasted_value.toFixed(3)}
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        {bonusFrequencyForecast.forecasted_value > bonusFrequencyForecast.current_value
                          ? '↑ Increasing'
                          : '↓ Decreasing'}
                      </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground">Confidence</div>
                      <div className="text-2xl font-bold">
                        {(bonusFrequencyForecast.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  {/* Bonus Frequency Chart */}
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={bonusFrequencyForecast.forecast_data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" style={{ fontSize: '12px' }} />
                      <YAxis style={{ fontSize: '12px' }} />
                      <Tooltip
                        formatter={(value: number) => value.toFixed(3)}
                        labelStyle={{ color: '#000' }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="historical"
                        stroke="#64748b"
                        strokeWidth={2}
                        name="Historical Frequency"
                        isAnimationActive={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="forecast"
                        stroke="#10b981"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Forecasted Frequency"
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>

                  {/* Insights */}
                  <div className="mt-6 bg-green-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-green-900 mb-2">
                      Bonus Trend Insights
                    </div>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>
                        • Expected spins until next bonus:{' '}
                        {(100 / bonusFrequencyForecast.forecasted_value).toFixed(0)}
                      </li>
                      <li>• Trend: {bonusFrequencyForecast.recommendation}</li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No bonus frequency data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Volatility Forecast Tab */}
        <TabsContent value="volatility">
          <Card>
            <CardHeader>
              <CardTitle>{gameName} - Volatility Forecast</CardTitle>
              <CardDescription>
                Predicted variance and stability of returns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {volatilityForecast ? (
                <>
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground">Current Volatility</div>
                      <div className="text-2xl font-bold">
                        {volatilityForecast.current_value.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">Standard Deviation</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground">Forecasted Volatility</div>
                      <div className="text-2xl font-bold">
                        {volatilityForecast.forecasted_value.toFixed(2)}
                      </div>
                      <div className={`text-xs mt-1 ${
                        volatilityForecast.forecasted_value > volatilityForecast.current_value
                          ? 'text-orange-600'
                          : 'text-green-600'
                      }`}>
                        {volatilityForecast.forecasted_value > volatilityForecast.current_value
                          ? '↑ Increasing Risk'
                          : '↓ Decreasing Risk'}
                      </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground">Confidence</div>
                      <div className="text-2xl font-bold">
                        {(volatilityForecast.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  {/* Volatility Chart */}
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={volatilityForecast.forecast_data}>
                      <defs>
                        <linearGradient
                          id="colorVol"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" style={{ fontSize: '12px' }} />
                      <YAxis style={{ fontSize: '12px' }} />
                      <Tooltip
                        formatter={(value: number) => value.toFixed(2)}
                        labelStyle={{ color: '#000' }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="forecast"
                        stroke="#f97316"
                        fill="url(#colorVol)"
                        strokeWidth={2}
                        name="Forecasted Volatility"
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>

                  {/* Insights */}
                  <div className="mt-6 bg-orange-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-orange-900 mb-2">
                      Volatility Insights
                    </div>
                    <ul className="text-sm text-orange-800 space-y-1">
                      <li>• {volatilityForecast.recommendation}</li>
                      <li>
                        • Risk Level:{' '}
                        {volatilityForecast.forecasted_value > 20
                          ? 'HIGH'
                          : volatilityForecast.forecasted_value > 10
                            ? 'MEDIUM'
                            : 'LOW'}
                      </li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No volatility data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
