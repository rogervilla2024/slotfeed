'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { ChartWrapper, ChartSkeleton } from './chart-wrapper';
import { chartColors, chartTheme, formatChartValue, getResponsiveChartSettings } from '@/lib/chart-config';
import { RTPDataPoint, ChartCommonProps } from '@/types/charts';
import { useMediaQuery } from '@/lib/hooks/use-media-query';

const AreaChart = dynamic(
  () => import('recharts').then((mod) => mod.AreaChart),
  { ssr: false }
);
const Area = dynamic(
  () => import('recharts').then((mod) => mod.Area),
  { ssr: false }
);
const Line = dynamic(
  () => import('recharts').then((mod) => mod.Line),
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

interface RTPTrendChartProps extends ChartCommonProps {
  /** Array of RTP data points */
  data: RTPDataPoint[];
  /** Theoretical RTP (usually constant) */
  theoreticalRtp: number;
  /** Game ID for context */
  gameId?: string;
  /** Game name for display */
  gameName?: string;
}

/**
 * RTP Trend Chart Component
 * Compares observed vs theoretical RTP over time
 * Shows variance and confidence intervals
 */
export function RTPTrendChart({
  data,
  theoreticalRtp,
  gameId,
  gameName,
  height = 350,
  isLoading = false,
  error = null,
}: RTPTrendChartProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const chartSettings = getResponsiveChartSettings(isMobile);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        minRtp: theoreticalRtp,
        maxRtp: theoreticalRtp,
        avgRtp: theoreticalRtp,
        currentRtp: theoreticalRtp,
        trend: 'stable' as const,
      };
    }

    const observedRtps = data.map((d) => d.observedRtp);
    const minRtp = Math.min(...observedRtps, theoreticalRtp);
    const maxRtp = Math.max(...observedRtps, theoreticalRtp);
    const avgRtp = observedRtps.reduce((a, b) => a + b, 0) / observedRtps.length;
    const currentRtp = data[data.length - 1]?.observedRtp ?? theoreticalRtp;

    // Determine trend
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (data.length >= 2) {
      const firstRtp = data[0].observedRtp;
      const lastRtp = currentRtp;
      const diff = lastRtp - firstRtp;
      if (Math.abs(diff) > 0.5) {
        trend = diff > 0 ? 'increasing' : 'decreasing';
      }
    }

    return { minRtp, maxRtp, avgRtp, currentRtp, trend };
  }, [data, theoreticalRtp]);

  // Format date for X-axis
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload as RTPDataPoint;
      return (
        <div
          className="bg-background border border-border rounded-lg p-3 shadow-lg"
          style={chartTheme.tooltip.contentStyle}
        >
          <p className="text-sm font-semibold text-foreground">{point.date}</p>
          <p className="text-sm mt-2">
            <span className="text-muted-foreground">Observed:</span>{' '}
            <span
              className={
                point.observedRtp >= theoreticalRtp ? 'text-win' : 'text-loss'
              }
            >
              {point.observedRtp.toFixed(2)}%
            </span>
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Theoretical:</span>{' '}
            <span className="text-neutral">{point.theoreticalRtp.toFixed(2)}%</span>
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Difference:{' '}
            <span className={point.observedRtp >= point.theoreticalRtp ? 'text-win' : 'text-loss'}>
              {(point.observedRtp - point.theoreticalRtp).toFixed(2)}%
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            Sample: {point.sampleSize.toLocaleString()} spins
          </p>
          {point.confidence && (
            <p className="text-xs text-muted-foreground">
              Confidence: {point.confidence.toFixed(0)}%
            </p>
          )}
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
        title="RTP Trend"
        isEmpty={true}
        emptyMessage="No RTP data available yet. More game data is needed for this analysis."
      />
    );
  }

  return (
    <ChartWrapper
      title="RTP Trend Analysis"
      description={`Comparing observed vs theoretical RTP (${theoreticalRtp.toFixed(2)}%)`}
      isLoading={isLoading}
      error={error}
      isEmpty={!data || data.length === 0}
      footer={`Trend: ${
        stats.trend === 'increasing'
          ? '📈 Getting Hotter'
          : stats.trend === 'decreasing'
          ? '📉 Cooling Down'
          : '➡️ Stable'
      } | Avg: ${stats.avgRtp.toFixed(2)}%`}
    >
      <ResponsiveContainer width="100%" height={chartSettings.height || height}>
        <AreaChart
          data={data}
          margin={chartSettings.margin}
          animationDuration={chartSettings.animationDuration}
        >
          <defs>
            {/* Gradient for observed above theoretical */}
            <linearGradient id="gradientAbove" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColors.win} stopOpacity={0.2} />
              <stop offset="95%" stopColor={chartColors.win} stopOpacity={0} />
            </linearGradient>

            {/* Gradient for observed below theoretical */}
            <linearGradient id="gradientBelow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColors.loss} stopOpacity={0.2} />
              <stop offset="95%" stopColor={chartColors.loss} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke={chartTheme.grid.stroke}
            strokeOpacity={chartTheme.grid.strokeOpacity}
          />

          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fill: chartTheme.axis.fill, fontSize: chartSettings.fontSize }}
            stroke={chartTheme.axis.stroke}
          />

          <YAxis
            domain={[
              Math.floor(stats.minRtp - 1),
              Math.ceil(stats.maxRtp + 1),
            ]}
            label={{
              value: 'RTP (%)',
              angle: -90,
              position: 'insideLeft',
              fill: chartTheme.axis.fill,
            }}
            tick={{ fill: chartTheme.axis.fill, fontSize: chartSettings.fontSize }}
            stroke={chartTheme.axis.stroke}
            width={isMobile ? 35 : 45}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Theoretical RTP reference line */}
          <ReferenceLine
            y={theoreticalRtp}
            stroke={chartColors.neutral}
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{
              value: `Theoretical: ${theoreticalRtp.toFixed(2)}%`,
              fill: chartTheme.axis.fill,
              fontSize: 11,
              offset: 10,
            }}
          />

          {/* Observed RTP area */}
          <Area
            type="monotone"
            dataKey="observedRtp"
            stroke={chartColors.series1}
            fill="url(#gradientAbove)"
            isAnimationActive={!isMobile}
            animationDuration={400}
            dot={data.length <= 10}
            name="Observed RTP"
          />

          {/* Theoretical RTP line */}
          <Line
            type="monotone"
            dataKey="theoreticalRtp"
            stroke={chartColors.neutral}
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            isAnimationActive={false}
            name="Theoretical RTP"
          />

          <Legend
            wrapperStyle={chartTheme.legend.wrapperStyle}
            verticalAlign="bottom"
            height={36}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
        <StatCard
          label="Current RTP"
          value={`${stats.currentRtp.toFixed(2)}%`}
          isPositive={stats.currentRtp >= theoreticalRtp}
        />
        <StatCard
          label="Average RTP"
          value={`${stats.avgRtp.toFixed(2)}%`}
          isPositive={stats.avgRtp >= theoreticalRtp}
        />
        <StatCard
          label="Min RTP"
          value={`${stats.minRtp.toFixed(2)}%`}
        />
        <StatCard
          label="Max RTP"
          value={`${stats.maxRtp.toFixed(2)}%`}
        />
      </div>

      {/* Variance interpretation */}
      <div className="mt-4 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
        <p className="font-semibold text-foreground mb-1">📊 Interpretation:</p>
        <p>
          {Math.abs(stats.currentRtp - theoreticalRtp) <= 1
            ? "✓ Observed RTP is very close to theoretical. The slot is behaving as expected."
            : stats.currentRtp > theoreticalRtp
            ? "🔥 This slot is running hotter than expected (higher RTP). Continue playing!"
            : "❄️ This slot is running cooler than expected (lower RTP). Variance is working against you."}
        </p>
        <p className="mt-2 text-xs">
          Note: RTP differences within ±2% are normal variance. Larger differences require more spins to validate.
        </p>
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
  isPositive,
}: {
  label: string;
  value: string;
  isPositive?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`text-lg font-semibold ${
          isPositive === undefined
            ? 'text-foreground'
            : isPositive
            ? 'text-win'
            : 'text-loss'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
