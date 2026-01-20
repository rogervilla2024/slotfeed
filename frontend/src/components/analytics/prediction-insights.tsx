/**
 * Phase 13-3: Prediction Insights Component
 *
 * Displays real-time predictions for:
 * - Bonus hit probabilities
 * - Bonus hunt outcomes
 * - Session ROI predictions
 * - Drawdown risk analysis
 */

'use client';

import React, { useState } from 'react';
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
  ComposedChart,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, AlertTriangle, Zap } from 'lucide-react';
import { useMLPredictionsAdvanced } from '@/lib/hooks/use-ml-analytics';

interface PredictionInsightsProps {
  gameId?: string;
  sessionId?: string;
  bonusHuntId?: string;
  gameName?: string;
}

const SEVERITY_COLORS = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#991b1b',
};

const PROBABILITY_COLORS = [
  { value: 'high', color: '#10b981', label: 'Favorable' },
  { value: 'medium', color: '#f59e0b', label: 'Neutral' },
  { value: 'low', color: '#ef4444', label: 'Unfavorable' },
];

export function PredictionInsights({
  gameId,
  sessionId,
  bonusHuntId,
  gameName = 'Game',
}: PredictionInsightsProps) {
  const {
    bonusHitPrediction,
    huntOutcomePrediction,
    sessionROIPrediction,
    drawdownPrediction,
    isLoading,
    error,
  } = useMLPredictionsAdvanced({
    gameId,
    sessionId,
    bonusHuntId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Prediction Insights</CardTitle>
          <CardDescription>Loading predictions...</CardDescription>
        </CardHeader>
        <CardContent className="h-96 flex items-center justify-center">
          <div className="text-muted-foreground">Analyzing patterns...</div>
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
            Prediction Error
          </CardTitle>
        </CardHeader>
        <CardContent className="text-orange-800">
          {error.message || 'Failed to load predictions'}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="bonus-hit" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="bonus-hit">Bonus Hit</TabsTrigger>
          <TabsTrigger value="hunt-outcome">Hunt</TabsTrigger>
          <TabsTrigger value="session-roi">ROI</TabsTrigger>
          <TabsTrigger value="drawdown">Drawdown</TabsTrigger>
        </TabsList>

        {/* Bonus Hit Prediction Tab */}
        <TabsContent value="bonus-hit">
          <Card>
            <CardHeader>
              <CardTitle>Bonus Hit Prediction</CardTitle>
              <CardDescription>
                When will the next bonus hit based on historical patterns?
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bonusHitPrediction ? (
                <>
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                      <div className="text-sm font-medium text-blue-900 mb-1">
                        Expected Spins Until Bonus
                      </div>
                      <div className="text-3xl font-bold text-blue-600">
                        {bonusHitPrediction.expected_spins_until_bonus.toFixed(0)}
                      </div>
                      <div className="text-xs text-blue-700 mt-2">
                        Confidence: {(bonusHitPrediction.confidence * 100).toFixed(0)}%
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
                      <div className="text-sm font-medium text-purple-900 mb-1">
                        Expected Multiplier
                      </div>
                      <div className="text-3xl font-bold text-purple-600">
                        {bonusHitPrediction.expected_multiplier.toFixed(1)}x
                      </div>
                      <div className="text-xs text-purple-700 mt-2">
                        Estimated Payout: ${bonusHitPrediction.expected_payout.toFixed(0)}
                      </div>
                    </div>
                  </div>

                  {/* Probability Timeline */}
                  <div className="space-y-3 mb-6">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Next 100 Spins</span>
                        <Badge variant="outline">
                          {(bonusHitPrediction.probability_next_100spins * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${Math.min(
                              bonusHitPrediction.probability_next_100spins * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Next 200 Spins</span>
                        <Badge variant="outline">
                          {(bonusHitPrediction.probability_next_200spins * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${Math.min(
                              bonusHitPrediction.probability_next_200spins * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Next 500 Spins</span>
                        <Badge variant="outline">
                          {(bonusHitPrediction.probability_next_500spins * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{
                            width: `${Math.min(
                              bonusHitPrediction.probability_next_500spins * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Risk & Recommendation */}
                  <div className="grid grid-cols-2 gap-4">
                    {bonusHitPrediction.risk_assessment && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm font-medium mb-2 flex items-center gap-2">
                          {bonusHitPrediction.risk_assessment === 'low' && (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          )}
                          {bonusHitPrediction.risk_assessment === 'medium' && (
                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                          )}
                          {bonusHitPrediction.risk_assessment === 'high' && (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          )}
                          Risk Level
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {bonusHitPrediction.risk_assessment}
                        </Badge>
                      </div>
                    )}

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-sm font-medium mb-2">Model Type</div>
                      <Badge variant="outline">{bonusHitPrediction.model_type}</Badge>
                    </div>
                  </div>

                  {bonusHitPrediction.recommendation && (
                    <div className="mt-4 bg-blue-50 border border-blue-200 p-4 rounded-lg">
                      <div className="text-sm font-medium text-blue-900 mb-2">
                        Recommendation
                      </div>
                      <p className="text-sm text-blue-800">
                        {bonusHitPrediction.recommendation}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No bonus hit prediction available for this game
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hunt Outcome Prediction Tab */}
        <TabsContent value="hunt-outcome">
          <Card>
            <CardHeader>
              <CardTitle>Bonus Hunt Outcome Prediction</CardTitle>
              <CardDescription>
                Predicted final ROI and probability of profit
              </CardDescription>
            </CardHeader>
            <CardContent>
              {huntOutcomePrediction ? (
                <>
                  {/* Key Outcome Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className={`p-6 rounded-lg border ${
                      huntOutcomePrediction.predicted_final_roi > 0
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className={`text-sm font-medium mb-1 ${
                        huntOutcomePrediction.predicted_final_roi > 0
                          ? 'text-green-900'
                          : 'text-red-900'
                      }`}>
                        Predicted Final ROI
                      </div>
                      <div className={`text-3xl font-bold ${
                        huntOutcomePrediction.predicted_final_roi > 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {huntOutcomePrediction.predicted_final_roi.toFixed(1)}%
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
                      <div className="text-sm font-medium text-blue-900 mb-1">
                        Probability of Profit
                      </div>
                      <div className="text-3xl font-bold text-blue-600">
                        {(huntOutcomePrediction.probability_of_profit * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-blue-700 mt-2">
                        Confidence: {(huntOutcomePrediction.confidence * 100).toFixed(0)}%
                      </div>
                    </div>

                    <div className={`p-6 rounded-lg border ${
                      huntOutcomePrediction.risk_level === 'low'
                        ? 'bg-green-50 border-green-200'
                        : huntOutcomePrediction.risk_level === 'medium'
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-red-50 border-red-200'
                    }`}>
                      <div className={`text-sm font-medium mb-1 ${
                        huntOutcomePrediction.risk_level === 'low'
                          ? 'text-green-900'
                          : huntOutcomePrediction.risk_level === 'medium'
                            ? 'text-yellow-900'
                            : 'text-red-900'
                      }`}>
                        Risk Level
                      </div>
                      <Badge
                        variant="outline"
                        className={`capitalize ${
                          huntOutcomePrediction.risk_level === 'low'
                            ? 'bg-green-100 text-green-800'
                            : huntOutcomePrediction.risk_level === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {huntOutcomePrediction.risk_level}
                      </Badge>
                    </div>
                  </div>

                  {/* Completion Estimate */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">
                          Expected Remaining Spins
                        </div>
                        <div className="text-2xl font-bold">
                          {huntOutcomePrediction.expected_completion_spins}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">
                          Expected Completion Time
                        </div>
                        <div className="text-2xl font-bold">
                          {huntOutcomePrediction.expected_completion_time_minutes.toFixed(0)}m
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expected Outcomes */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-sm text-green-900 mb-1">Expected Win</div>
                      <div className="text-2xl font-bold text-green-600">
                        ${huntOutcomePrediction.expected_win.toFixed(2)}
                      </div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="text-sm text-red-900 mb-1">Expected Max Loss</div>
                      <div className="text-2xl font-bold text-red-600">
                        ${huntOutcomePrediction.expected_max_loss.toFixed(2)}
                      </div>
                      <div className="text-xs text-red-700 mt-1">
                        Probability: {(huntOutcomePrediction.max_loss_probability * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  {/* Continuation Recommendation */}
                  <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg">
                    <div className="text-sm font-medium text-indigo-900 mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Continuation Recommendation
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-indigo-600 h-3 rounded-full"
                            style={{
                              width: `${
                                huntOutcomePrediction.recommended_continuation_probability * 100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium text-indigo-900">
                        {(
                          huntOutcomePrediction.recommended_continuation_probability * 100
                        ).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-indigo-700 mt-2">
                      {huntOutcomePrediction.recommended_continuation_probability > 0.7
                        ? 'Strong recommendation to continue'
                        : huntOutcomePrediction.recommended_continuation_probability > 0.5
                          ? 'Neutral - your choice'
                          : 'Consider stopping to preserve balance'}
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No active bonus hunt to predict
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Session ROI Prediction Tab */}
        <TabsContent value="session-roi">
          <Card>
            <CardHeader>
              <CardTitle>Session ROI Prediction</CardTitle>
              <CardDescription>
                Predicted return on investment for this session
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sessionROIPrediction ? (
                <>
                  {/* ROI Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className={`p-6 rounded-lg border ${
                      sessionROIPrediction.predicted_roi > 0
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className={`text-sm font-medium mb-1 ${
                        sessionROIPrediction.predicted_roi > 0
                          ? 'text-green-900'
                          : 'text-red-900'
                      }`}>
                        Predicted ROI
                      </div>
                      <div className={`text-3xl font-bold ${
                        sessionROIPrediction.predicted_roi > 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {sessionROIPrediction.predicted_roi.toFixed(1)}%
                      </div>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 p-6 rounded-lg">
                      <div className="text-sm font-medium text-purple-900 mb-1">
                        Profit Probability
                      </div>
                      <div className="text-3xl font-bold text-purple-600">
                        {(sessionROIPrediction.probability_of_profit * 100).toFixed(0)}%
                      </div>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 p-6 rounded-lg">
                      <div className="text-sm font-medium text-orange-900 mb-1">
                        Expected Duration
                      </div>
                      <div className="text-3xl font-bold text-orange-600">
                        {sessionROIPrediction.expected_duration_hours.toFixed(1)}h
                      </div>
                    </div>
                  </div>

                  {/* Recommendation */}
                  {sessionROIPrediction.recommendation && (
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                      <div className="text-sm font-medium text-blue-900 mb-2">
                        Session Recommendation
                      </div>
                      <p className="text-sm text-blue-800">
                        {sessionROIPrediction.recommendation}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No session data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Drawdown Prediction Tab */}
        <TabsContent value="drawdown">
          <Card>
            <CardHeader>
              <CardTitle>Drawdown Risk Analysis</CardTitle>
              <CardDescription>
                Projected maximum balance decline (worst-case scenario)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {drawdownPrediction ? (
                <>
                  {/* Drawdown Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
                      <div className="text-sm font-medium text-red-900 mb-1">
                        Expected Max Drawdown
                      </div>
                      <div className="text-3xl font-bold text-red-600">
                        {drawdownPrediction.max_drawdown_percent.toFixed(1)}%
                      </div>
                      <div className="text-xs text-red-700 mt-2">
                        ${drawdownPrediction.max_drawdown_amount.toFixed(2)}
                      </div>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 p-6 rounded-lg">
                      <div className="text-sm font-medium text-orange-900 mb-1">
                        Drawdown Probability
                      </div>
                      <div className="text-3xl font-bold text-orange-600">
                        {(drawdownPrediction.drawdown_probability * 100).toFixed(0)}%
                      </div>
                    </div>

                    <div className={`p-6 rounded-lg border ${
                      drawdownPrediction.risk_tolerance === 'low'
                        ? 'bg-green-50 border-green-200'
                        : drawdownPrediction.risk_tolerance === 'medium'
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-red-50 border-red-200'
                    }`}>
                      <div className={`text-sm font-medium mb-1 ${
                        drawdownPrediction.risk_tolerance === 'low'
                          ? 'text-green-900'
                          : drawdownPrediction.risk_tolerance === 'medium'
                            ? 'text-yellow-900'
                            : 'text-red-900'
                      }`}>
                        Risk Tolerance
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {drawdownPrediction.risk_tolerance}
                      </Badge>
                    </div>
                  </div>

                  {/* Recovery Outlook */}
                  <div className="bg-blue-50 p-4 rounded-lg mb-6">
                    <div className="text-sm font-medium text-blue-900 mb-2">
                      Recovery Outlook
                    </div>
                    <div className="text-sm text-blue-800">
                      Expected recovery time:{' '}
                      <span className="font-bold">
                        {drawdownPrediction.expected_recovery_time_hours.toFixed(1)} hours
                      </span>
                    </div>
                    <div className="text-xs text-blue-700 mt-2">
                      Recovery probability: {(drawdownPrediction.recovery_probability * 100).toFixed(0)}%
                    </div>
                  </div>

                  {/* Bankroll Recommendation */}
                  {drawdownPrediction.recommended_bankroll && (
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                      <div className="text-sm font-medium text-green-900 mb-2">
                        Recommended Bankroll
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        ${drawdownPrediction.recommended_bankroll.toFixed(2)}
                      </div>
                      <p className="text-xs text-green-700 mt-2">
                        This should cover the expected max drawdown with buffer
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No drawdown prediction available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
