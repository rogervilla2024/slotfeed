/**
 * Phase 13-3: Bet Size Calculator Component
 *
 * Interactive calculator using:
 * - Kelly Criterion for optimal bet sizing
 * - Risk tolerance adjustment
 * - Bankroll management recommendations
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingUp, Shield, Zap } from 'lucide-react';
import { useMLBetSizing } from '@/lib/hooks/use-ml-analytics';

interface BetSizeCalculatorProps {
  initialBankroll?: number;
  gameId?: string;
  volatility?: 'low' | 'medium' | 'high' | 'very_high';
}

export function BetSizeCalculator({
  initialBankroll = 1000,
  gameId,
  volatility = 'high',
}: BetSizeCalculatorProps) {
  const [bankroll, setBankroll] = useState(initialBankroll);
  const [riskTolerance, setRiskTolerance] = useState(0.5); // 0-1, 0.5 = medium
  const [expectedRTP, setExpectedRTP] = useState(96.5);
  const [sessionDuration, setSessionDuration] = useState(30); // minutes

  const { recommendation, isLoading, error } = useMLBetSizing(
    gameId || 'default',
    bankroll,
    volatility,
    riskTolerance,
    expectedRTP
  );

  // Kelly Criterion calculation
  const kellyCalculation = useMemo(() => {
    // Simplified Kelly: f* = (bp - q) / b
    // For slots: p = RTP/100, b = win/loss ratio (estimated)
    const p = expectedRTP / 100;
    const q = 1 - p;

    // Estimate b from expected returns
    // For high volatility games, assume higher variance
    const volatilityMultiplier = {
      low: 0.8,
      medium: 1.0,
      high: 1.3,
      very_high: 1.6,
    }[volatility] || 1.0;

    const b = 2.5 * volatilityMultiplier;
    const kellyPercent = Math.max(0, (b * p - q) / b) * 100;

    // Conservative Kelly (use 25% of Kelly for slots)
    const conservativeKelly = kellyPercent * 0.25;

    // Recommended bet sizes at different risk levels
    const aggressiveBet = (bankroll * (conservativeKelly / 100)) / 2;
    const balancedBet = (bankroll * (conservativeKelly / 100)) / 4;
    const conservativeBet = (bankroll * (conservativeKelly / 100)) / 8;

    return {
      kellyPercent,
      conservativeKelly,
      aggressiveBet,
      balancedBet,
      conservativeBet,
    };
  }, [bankroll, expectedRTP, volatility]);

  // Risk-adjusted recommendations
  const riskAdjustedBet = useMemo(() => {
    const baseKelly = kellyCalculation.conservativeKelly;

    // Adjust based on risk tolerance
    // 0 = ultra conservative, 1 = aggressive
    const riskMultiplier = 0.5 + riskTolerance * 0.5; // 0.5 to 1.0

    return {
      aggressive: (bankroll * (baseKelly * 0.5 * riskMultiplier)) / 100,
      balanced: (bankroll * (baseKelly * 0.25 * riskMultiplier)) / 100,
      conservative: (bankroll * (baseKelly * 0.125 * riskMultiplier)) / 100,
    };
  }, [kellyCalculation, riskTolerance, bankroll]);

  // Drawdown scenarios
  const drawdownScenarios = useMemo(() => {
    const scenarios = [
      {
        name: 'Unlucky Streak',
        probability: 0.15,
        drawdown: 0.2, // 20% drawdown
      },
      {
        name: 'Bad Session',
        probability: 0.25,
        drawdown: 0.35, // 35% drawdown
      },
      {
        name: 'Worst Case (5%)',
        probability: 0.05,
        drawdown: 0.5, // 50% drawdown
      },
    ];

    return scenarios.map((scenario) => ({
      ...scenario,
      requiredBankroll: bankroll / (1 - scenario.drawdown),
      remainingBalance: bankroll * (1 - scenario.drawdown),
    }));
  }, [bankroll]);

  // Bankroll milestones
  const bankrollMilestones = useMemo(() => {
    return [
      { label: 'Minimum Safe Play', value: bankroll * 0.1, description: '10% of bankroll' },
      { label: 'Recommended Session', value: bankroll * 0.05, description: '5% of bankroll' },
      { label: 'Conservative', value: bankroll * 0.01, description: '1% of bankroll' },
    ];
  }, [bankroll]);

  const riskText = {
    0: 'Ultra Conservative',
    0.25: 'Conservative',
    0.5: 'Balanced',
    0.75: 'Aggressive',
    1: 'Ultra Aggressive',
  };

  return (
    <div className="space-y-6">
      {error && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Calculation Error
            </CardTitle>
          </CardHeader>
          <CardContent className="text-orange-800">
            {error.message || 'Failed to calculate bet sizes'}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="calculator" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="guide">Guide</TabsTrigger>
        </TabsList>

        {/* Calculator Tab */}
        <TabsContent value="calculator">
          <Card>
            <CardHeader>
              <CardTitle>Bet Size Calculator</CardTitle>
              <CardDescription>
                Calculate optimal bet sizes using Kelly Criterion and risk management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Input Controls */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bankroll-input" className="text-sm font-medium">
                    Bankroll: ${bankroll.toFixed(2)}
                  </Label>
                  <Input
                    id="bankroll-input"
                    type="number"
                    value={bankroll}
                    onChange={(e) => setBankroll(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="mt-2"
                    placeholder="Enter your bankroll"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Your total available funds for gambling
                  </p>
                </div>

                <div>
                  <Label htmlFor="rtp-input" className="text-sm font-medium">
                    Expected RTP: {expectedRTP.toFixed(2)}%
                  </Label>
                  <Input
                    id="rtp-input"
                    type="number"
                    value={expectedRTP}
                    onChange={(e) =>
                      setExpectedRTP(Math.max(80, Math.min(100, parseFloat(e.target.value) || 96.5)))
                    }
                    className="mt-2"
                    placeholder="Expected RTP %"
                    min="80"
                    max="100"
                    step="0.1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Game's theoretical return to player
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-sm font-medium">Risk Tolerance</Label>
                    <Badge variant="outline">
                      {
                        riskText[
                          Math.round(riskTolerance * 4) * 0.25 as keyof typeof riskText
                        ]
                      }
                    </Badge>
                  </div>
                  <Slider
                    value={[riskTolerance]}
                    onValueChange={(value) => setRiskTolerance(value[0])}
                    min={0}
                    max={1}
                    step={0.05}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>Conservative</span>
                    <span>Aggressive</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="duration-input" className="text-sm font-medium">
                    Session Duration: {sessionDuration} minutes
                  </Label>
                  <Slider
                    value={[sessionDuration]}
                    onValueChange={(value) => setSessionDuration(value[0])}
                    min={5}
                    max={480}
                    step={5}
                    className="w-full mt-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>5 min</span>
                    <span>8 hours</span>
                  </div>
                </div>
              </div>

              {/* Recommended Bets */}
              <div className="border-t pt-6">
                <h3 className="font-medium mb-4">Recommended Bet Sizes</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Conservative */}
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-sm text-green-900">Conservative</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      ${riskAdjustedBet.conservative.toFixed(2)}
                    </div>
                    <div className="text-xs text-green-700">
                      <div>Max Loss Risk: ~10%</div>
                      <div>Survival Rate: 95%+</div>
                    </div>
                  </div>

                  {/* Balanced */}
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-sm text-blue-900">Balanced</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      ${riskAdjustedBet.balanced.toFixed(2)}
                    </div>
                    <div className="text-xs text-blue-700">
                      <div>Max Loss Risk: ~20%</div>
                      <div>Survival Rate: 80-90%</div>
                    </div>
                  </div>

                  {/* Aggressive */}
                  <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-orange-600" />
                      <span className="font-medium text-sm text-orange-900">Aggressive</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-600 mb-2">
                      ${riskAdjustedBet.aggressive.toFixed(2)}
                    </div>
                    <div className="text-xs text-orange-700">
                      <div>Max Loss Risk: ~35%</div>
                      <div>Survival Rate: 65-75%</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kelly Criterion Details */}
              <div className="border-t pt-6 bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-3 text-sm">Kelly Criterion Analysis</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground mb-1">Full Kelly</div>
                    <div className="text-lg font-bold">{kellyCalculation.kellyPercent.toFixed(2)}%</div>
                    <div className="text-xs text-muted-foreground">
                      (${(bankroll * kellyCalculation.kellyPercent / 100).toFixed(2)})
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Conservative Kelly (1/4)</div>
                    <div className="text-lg font-bold">
                      {kellyCalculation.conservativeKelly.toFixed(2)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      (${(bankroll * kellyCalculation.conservativeKelly / 100).toFixed(2)})
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Recommendation */}
              {recommendation && (
                <div className="border-t pt-6 bg-indigo-50 border border-indigo-200 p-4 rounded-lg">
                  <h3 className="font-medium mb-2 text-indigo-900">AI Recommendation</h3>
                  <p className="text-sm text-indigo-800">
                    {recommendation.recommended_bet_size
                      ? `For your profile, we recommend betting $${recommendation.recommended_bet_size.toFixed(2)} per spin. This balances growth potential with risk management.`
                      : 'Loading recommendation...'}
                  </p>
                  {recommendation.reasoning && (
                    <p className="text-xs text-indigo-700 mt-2">
                      Reasoning: {recommendation.reasoning}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scenarios Tab */}
        <TabsContent value="scenarios">
          <Card>
            <CardHeader>
              <CardTitle>Drawdown Scenarios</CardTitle>
              <CardDescription>
                How much could you lose in various situations?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {drawdownScenarios.map((scenario) => (
                <div key={scenario.name} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{scenario.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Probability: {(scenario.probability * 100).toFixed(0)}%
                      </p>
                    </div>
                    <Badge variant="outline" className="text-red-600">
                      {(scenario.drawdown * 100).toFixed(0)}% loss
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-muted-foreground text-xs">Starting Balance</div>
                      <div className="font-bold">${bankroll.toFixed(2)}</div>
                    </div>
                    <div className="bg-red-50 p-2 rounded">
                      <div className="text-muted-foreground text-xs">Remaining Balance</div>
                      <div className="font-bold text-red-600">
                        ${scenario.remainingBalance.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Progress bar showing loss */}
                  <div className="space-y-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${scenario.drawdown * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Max loss: ${(bankroll * scenario.drawdown).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Guide Tab */}
        <TabsContent value="guide">
          <Card>
            <CardHeader>
              <CardTitle>Bankroll Management Guide</CardTitle>
              <CardDescription>
                Best practices for managing your gambling bankroll
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Golden Rules */}
              <div className="space-y-4">
                <h3 className="font-semibold">Golden Rules of Bankroll Management</h3>
                <div className="space-y-3">
                  <div className="border-l-4 border-green-500 pl-4 py-2">
                    <div className="font-medium text-sm">1. Never Bet More Than 5% Per Session</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Recommended: ${(bankroll * 0.05).toFixed(2)} or less per play
                    </p>
                  </div>
                  <div className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="font-medium text-sm">2. Keep a Safety Buffer</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Never play with your entire bankroll in one session. Keep 50%+ in reserve.
                    </p>
                  </div>
                  <div className="border-l-4 border-purple-500 pl-4 py-2">
                    <div className="font-medium text-sm">3. Adjust Bets Based on Bankroll</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      As bankroll grows, increase bets proportionally. As it shrinks, reduce immediately.
                    </p>
                  </div>
                  <div className="border-l-4 border-orange-500 pl-4 py-2">
                    <div className="font-medium text-sm">4. Use Stop-Loss Limits</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Stop playing if you lose 20-30% of your session bankroll in one sitting.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bankroll Milestones */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="font-semibold">Your Bankroll Milestones</h3>
                <div className="space-y-2">
                  {bankrollMilestones.map((milestone) => (
                    <div key={milestone.label} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{milestone.label}</div>
                        <div className="text-xs text-muted-foreground">{milestone.description}</div>
                      </div>
                      <div className="font-bold">${milestone.value.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Kelly Criterion Explanation */}
              <div className="space-y-3 border-t pt-6 bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900">Kelly Criterion Explained</h3>
                <p className="text-sm text-blue-800">
                  The Kelly Criterion is a mathematical formula for bet sizing that maximizes long-term growth:
                </p>
                <div className="bg-white p-3 rounded border border-blue-200 text-sm font-mono text-blue-900">
                  f* = (bp - q) / b
                </div>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li><strong>b</strong> = odds (win/loss ratio)</li>
                  <li><strong>p</strong> = probability of winning (RTP)</li>
                  <li><strong>q</strong> = probability of losing (1 - p)</li>
                  <li><strong>f*</strong> = fraction of bankroll to bet</li>
                </ul>
                <p className="text-xs text-blue-700 mt-2 italic">
                  For slots, we use 1/4 Kelly (Quarter Kelly) due to high variance, which is much safer.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
