'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { ChartWrapper, ChartSkeleton } from './chart-wrapper';
import { chartColors, chartTheme, formatChartValue, getResponsiveChartSettings } from '@/lib/chart-config';
import { BonusFrequencyData, BonusFrequencyBucket, ChartCommonProps } from '@/types/charts';
import { useMediaQuery } from '@/lib/hooks/use-media-query';

const BarChart = dynamic(
  () => import('recharts').then((mod) => mod.BarChart),
  { ssr: false }
);
const Bar = dynamic(
  () => import('recharts').then((mod) => mod.Bar),
  { ssr: false }
);
const Line = dynamic(
  () => import('recharts').then((mod) => mod.Line),
  { ssr: false }
);
const ComposedChart = dynamic(
  () => import('recharts').then((mod) => mod.ComposedChart),
  { ssr: false }
);
const XAxis = dynamic(
  () => import('recharts').then((mod) => mod.XAxis),
  { ssr: false }
);
const YAxis = dynamic(
  () => import('recharts').then((mod) => mod.YAxis),
  { ssr: false }
);
const CartesianGrid = dynamic(
  () => import('recharts').then((mod) => mod.CartesianGrid),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import('recharts').then((mod) => mod.Tooltip),
  { ssr: false }
);
const Legend = dynamic(
  () => import('recharts').then((mod) => mod.Legend),
  { ssr: false }
);
const ResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);
const ReferenceLine = dynamic(
  () => import('recharts').then((mod) => mod.ReferenceLine),
  { ssr: false }
);

interface BonusFrequencyChartProps extends ChartCommonProps {
  /** Bonus frequency data */
  data: BonusFrequencyBucket[];
  /** Game name for context */
  gameName?: string;
  /** Average bonus frequency line */
  averageFrequency?: number;
}

/**
 * Bonus Frequency Chart Component
 * Shows how often bonuses hit over time in different periods
 */
export function BonusFrequencyChart({
  data,
  gameName,
  averageFrequency,
  height = 300,
  isLoading = false,
  error = null,
}: BonusFrequencyChartProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const chartSettings = getResponsiveChartSettings(isMobile);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        totalBonuses: 0,
        avgBonusCount: 0,
        maxBonusCount: 0,
        minBonusCount: 0,
        trend: 'stable' as const,
      };
    }

    const counts = data.map((d) => d.bonusCount);
    const totalBonuses = counts.reduce((a, b) => a + b, 0);
    const avgBonusCount = totalBonuses / counts.length;
    const maxBonusCount = Math.max(...counts);
    const minBonusCount = Math.min(...counts);

    // Determine trend
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (data.length >= 2) {
      const firstCount = data[0].bonusCount;
      const lastCount = data[data.length - 1].bonusCount;
      const diff = lastCount - firstCount;
      if (Math.abs(diff) > avgBonusCount * 0.2) {
        trend = diff > 0 ? 'increasing' : 'decreasing';
      }
    }

    return { totalBonuses, avgBonusCount, maxBonusCount, minBonusCount, trend };
  }, [data]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload as BonusFrequencyBucket;
      return (
        <div
          className="bg-background border border-border rounded-lg p-3 shadow-lg"
          style={chartTheme.tooltip.contentStyle}
        >
          <p className="text-sm font-semibold text-foreground">{point.timeRange}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Bonuses:{' '}
            <span className="text-foreground font-semibold">{point.bonusCount}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Avg Multiplier:{' '}
            <span className="text-foreground">{point.avgMultiplier.toFixed(2)}x</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Total Payout:{' '}
            <span className="text-win">
              {formatChartValue(point.totalPayout, 'currency')}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return <ChartSkeleton height={chartSettings.height} />;
  }

  if (!data || data.length === 0) {
    return (
      <ChartWrapper
        title="Bonus Frequency"
        isEmpty={true}
        emptyMessage="No bonus data available yet. Need more game sessions for this analysis."
      />
    );
  }

  return (
    <ChartWrapper
      title="Bonus Hit Frequency"
      description={`Bonus distribution over ${data.length} time periods`}
      isLoading={isLoading}
      error={error}
      isEmpty={!data || data.length === 0}
      footer={`Total Bonuses: ${stats.totalBonuses} | Avg per Period: ${stats.avgBonusCount.toFixed(1)} | Trend: ${
        stats.trend === 'increasing'
          ? '📈 Getting More Frequent'
          : stats.trend === 'decreasing'
          ? '📉 Getting Less Frequent'
          : '➡️ Stable'
      }`}
    >
      <ResponsiveContainer width="100%" height={chartSettings.height || height}>
        <ComposedChart
          data={data}
          margin={chartSettings.margin}
          animationDuration={chartSettings.animationDuration}
        >
          <defs>
            <linearGradient id="bonusGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColors.series1} stopOpacity={0.7} />
              <stop offset="95%" stopColor={chartColors.series1} stopOpacity={0.3} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke={chartTheme.grid.stroke}
            strokeOpacity={chartTheme.grid.strokeOpacity}
          />

          <XAxis
            dataKey="timeRange"
            tick={{ fill: chartTheme.axis.fill, fontSize: chartSettings.fontSize }}
            stroke={chartTheme.axis.stroke}
          />

          <YAxis
            yAxisId="left"
            label={{
              value: 'Bonus Count',
              angle: -90,
              position: 'insideLeft',
              fill: chartTheme.axis.fill,
            }}
            tick={{ fill: chartTheme.axis.fill, fontSize: chartSettings.fontSize }}
            stroke={chartTheme.axis.stroke}
            width={isMobile ? 40 : 60}
          />

          <YAxis
            yAxisId="right"
            orientation="right"
            label={{
              value: 'Avg Multiplier',
              angle: 90,
              position: 'insideRight',
              fill: chartTheme.axis.fill,
            }}
            tick={{ fill: chartTheme.axis.fill, fontSize: chartSettings.fontSize }}
            stroke={chartTheme.axis.stroke}
            width={isMobile ? 40 : 60}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Average line */}
          {averageFrequency && (
            <ReferenceLine
              y={averageFrequency}
              stroke={chartTheme.grid.stroke}
              strokeDasharray="5 5"
              label={{
                value: `Expected: ${averageFrequency.toFixed(1)}`,
                fill: chartTheme.axis.fill,
                fontSize: 11,
                offset: 10,
              }}
            />
          )}

          {/* Bonus count bars */}
          <Bar
            yAxisId="left"
            dataKey="bonusCount"
            fill="url(#bonusGradient)"
            name="Bonus Count"
            isAnimationActive={!isMobile}
            animationDuration={400}
            radius={[8, 8, 0, 0]}
          />

          {/* Average multiplier line */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="avgMultiplier"
            stroke={chartColors.hot}
            strokeWidth={2}
            dot={false}
            isAnimationActive={!isMobile}
            animationDuration={400}
            name="Avg Multiplier"
          />

          <Legend
            wrapperStyle={chartTheme.legend.wrapperStyle}
            verticalAlign="bottom"
            height={36}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
        <StatCard
          label="Total Bonuses"
          value={stats.totalBonuses.toString()}
        />
        <StatCard
          label="Avg per Period"
          value={stats.avgBonusCount.toFixed(1)}
        />
        <StatCard
          label="Highest Period"
          value={stats.maxBonusCount.toString()}
        />
        <StatCard
          label="Lowest Period"
          value={stats.minBonusCount.toString()}
        />
      </div>

      {/* Interpretation */}
      <div className="mt-4 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
        <p className="font-semibold text-foreground mb-1">🎲 What This Means:</p>
        <p>
          {stats.avgBonusCount > 20
            ? 'Very frequent bonuses - expect regular hits!'
            : stats.avgBonusCount > 10
            ? 'Good bonus frequency - decent hit rate'
            : 'Lower bonus frequency - may require patience'}
        </p>
        {stats.trend === 'increasing' && (
          <p className="mt-2">📈 Bonuses are becoming MORE frequent - good sign!</p>
        )}
        {stats.trend === 'decreasing' && (
          <p className="mt-2">📉 Bonuses are becoming LESS frequent - variance at play</p>
        )}
      </div>
    </ChartWrapper>
  );
}

/**
 * Stat card for displaying key metrics
 */
function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
