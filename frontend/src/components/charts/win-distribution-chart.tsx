'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { ChartWrapper, ChartSkeleton } from './chart-wrapper';
import { chartColors, chartTheme, formatChartValue, getResponsiveChartSettings } from '@/lib/chart-config';
import { WinDistributionData, WinDistributionBin, ChartCommonProps } from '@/types/charts';
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

interface WinDistributionChartProps extends ChartCommonProps {
  /** Win distribution bins data */
  data: WinDistributionBin[];
  /** Game name for context */
  gameName?: string;
}

/**
 * Win Distribution Chart Component
 * Shows histogram of win multipliers
 */
export function WinDistributionChart({
  data,
  gameName,
  height = 350,
  isLoading = false,
  error = null,
}: WinDistributionChartProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const chartSettings = getResponsiveChartSettings(isMobile);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        totalWins: 0,
        avgMultiplier: 0,
        medianMultiplier: 0,
        maxMultiplier: 0,
        distribution: 'unknown' as const,
      };
    }

    const totalWins = data.reduce((sum, bin) => sum + bin.count, 0);
    const avgMultiplier = data.reduce((sum, bin) => sum + bin.count * ((bin.minMultiplier + bin.maxMultiplier) / 2), 0) / totalWins;

    // Median
    let cumulativeCount = 0;
    let medianMultiplier = 0;
    for (const bin of data) {
      cumulativeCount += bin.count;
      if (cumulativeCount >= totalWins / 2) {
        medianMultiplier = (bin.minMultiplier + bin.maxMultiplier) / 2;
        break;
      }
    }

    const maxMultiplier = Math.max(...data.map((b) => b.maxMultiplier));

    // Determine distribution shape
    const firstBinPercentage = data[0]?.percentage || 0;
    const distribution =
      firstBinPercentage > 50
        ? 'very_skewed' // Most wins are small
        : firstBinPercentage > 40
        ? 'skewed' // Many small wins
        : firstBinPercentage > 20
        ? 'normal' // Balanced
        : 'heavy_tail'; // Many big wins

    return { totalWins, avgMultiplier, medianMultiplier, maxMultiplier, distribution };
  }, [data]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload as WinDistributionBin;
      return (
        <div
          className="bg-background border border-border rounded-lg p-3 shadow-lg"
          style={chartTheme.tooltip.contentStyle}
        >
          <p className="text-sm font-semibold text-foreground">{point.range}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Wins:{' '}
            <span className="text-foreground font-semibold">{point.count}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Percentage:{' '}
            <span className="text-foreground">{point.percentage.toFixed(1)}%</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Total Value:{' '}
            <span className="text-win">
              {formatChartValue(point.totalValue, 'currency')}
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
        title="Win Distribution"
        isEmpty={true}
        emptyMessage="No win data available yet. Need more game sessions to analyze win patterns."
      />
    );
  }

  const getDistributionDescription = (dist: typeof stats.distribution) => {
    switch (dist) {
      case 'very_skewed':
        return 'Very skewed - mostly small wins with rare big ones';
      case 'skewed':
        return 'Skewed - more small wins than large ones';
      case 'normal':
        return 'Balanced - healthy distribution of win sizes';
      case 'heavy_tail':
        return 'Heavy-tail - many big wins relative to small ones';
      default:
        return 'Unknown pattern';
    }
  };

  return (
    <ChartWrapper
      title="Win Multiplier Distribution"
      description={`Analysis of ${stats.totalWins} wins across ${data.length} multiplier ranges`}
      isLoading={isLoading}
      error={error}
      isEmpty={!data || data.length === 0}
      footer={`Avg: ${stats.avgMultiplier.toFixed(2)}x | Median: ${stats.medianMultiplier.toFixed(2)}x | Max: ${stats.maxMultiplier.toFixed(1)}x`}
    >
      <ResponsiveContainer width="100%" height={chartSettings.height || height}>
        <ComposedChart
          data={data}
          margin={chartSettings.margin}
          animationDuration={chartSettings.animationDuration}
        >
          <defs>
            <linearGradient id="winGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColors.series2} stopOpacity={0.7} />
              <stop offset="95%" stopColor={chartColors.series2} stopOpacity={0.3} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke={chartTheme.grid.stroke}
            strokeOpacity={chartTheme.grid.strokeOpacity}
          />

          <XAxis
            dataKey="range"
            angle={isMobile ? -45 : 0}
            height={isMobile ? 80 : 40}
            tick={{ fill: chartTheme.axis.fill, fontSize: chartSettings.fontSize }}
            stroke={chartTheme.axis.stroke}
          />

          <YAxis
            yAxisId="left"
            label={{
              value: 'Win Count',
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
              value: 'Percentage (%)',
              angle: 90,
              position: 'insideRight',
              fill: chartTheme.axis.fill,
            }}
            tick={{ fill: chartTheme.axis.fill, fontSize: chartSettings.fontSize }}
            stroke={chartTheme.axis.stroke}
            width={isMobile ? 40 : 60}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Win count bars */}
          <Bar
            yAxisId="left"
            dataKey="count"
            fill="url(#winGradient)"
            name="Win Count"
            isAnimationActive={!isMobile}
            animationDuration={400}
            radius={[8, 8, 0, 0]}
          />

          {/* Percentage line */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="percentage"
            stroke={chartColors.hot}
            strokeWidth={2}
            dot={false}
            isAnimationActive={!isMobile}
            animationDuration={400}
            name="Percentage"
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
          label="Total Wins"
          value={stats.totalWins.toString()}
        />
        <StatCard
          label="Average Multiplier"
          value={`${stats.avgMultiplier.toFixed(2)}x`}
        />
        <StatCard
          label="Median Multiplier"
          value={`${stats.medianMultiplier.toFixed(2)}x`}
        />
        <StatCard
          label="Max Multiplier"
          value={`${stats.maxMultiplier.toFixed(1)}x`}
        />
      </div>

      {/* Distribution interpretation */}
      <div className="mt-4 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
        <p className="font-semibold text-foreground mb-1">📊 Distribution Pattern:</p>
        <p>{getDistributionDescription(stats.distribution)}</p>
        {stats.distribution === 'very_skewed' && (
          <p className="mt-2">
            Most wins are small (low multiplier). Big wins (100x+) are rare but impactful.
          </p>
        )}
        {stats.distribution === 'heavy_tail' && (
          <p className="mt-2">
            Unusually high proportion of big wins. This could indicate hot slot or lucky streaks.
          </p>
        )}
        {stats.distribution === 'normal' && (
          <p className="mt-2">
            Healthy balance - this distribution suggests the slot is behaving normally.
          </p>
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
