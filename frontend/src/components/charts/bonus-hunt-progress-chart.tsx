'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { ChartWrapper, ChartSkeleton } from './chart-wrapper';
import { chartColors, chartTheme, formatChartValue, getResponsiveChartSettings } from '@/lib/chart-config';
import { BonusHuntProgressData, BonusHuntChartPoint, ChartCommonProps } from '@/types/charts';
import { useMediaQuery } from '@/lib/hooks/use-media-query';

const ComposedChart = dynamic(
  () => import('recharts').then((mod) => mod.ComposedChart),
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

interface BonusHuntProgressChartProps extends ChartCommonProps {
  /** Bonus hunt data */
  bonusHunt: BonusHuntProgressData;
}

/**
 * Bonus Hunt Progress Chart Component
 * Shows progression of bonus hunt with accumulated cost/payout and ROI
 * Uses stacked bars and line overlay for ROI tracking
 */
export function BonusHuntProgressChart({
  bonusHunt,
  height = 350,
  isLoading = false,
  error = null,
}: BonusHuntProgressChartProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const chartSettings = getResponsiveChartSettings(isMobile);

  // Transform data for chart
  const chartData = useMemo(() => {
    const points: BonusHuntChartPoint[] = [];
    let cumulativeCost = 0;
    let cumulativePayout = 0;

    bonusHunt.entries.forEach((entry, index) => {
      cumulativeCost += entry.cost;
      cumulativePayout += entry.payout;
      const roi = cumulativeCost > 0 ? ((cumulativePayout - cumulativeCost) / cumulativeCost) * 100 : 0;

      points.push({
        entryNumber: index + 1,
        cumulativeCost,
        cumulativePayout,
        cumulativeProfit: cumulativePayout - cumulativeCost,
        roi,
        status: entry.status,
      });
    });

    return points;
  }, [bonusHunt.entries]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload as BonusHuntChartPoint;
      return (
        <div
          className="bg-background border border-border rounded-lg p-3 shadow-lg"
          style={chartTheme.tooltip.contentStyle}
        >
          <p className="text-sm font-semibold text-foreground">Entry #{point.entryNumber}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Cost:{' '}
            <span className="text-foreground">
              {formatChartValue(point.cumulativeCost, 'currency')}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            Payout:{' '}
            <span
              className={point.cumulativePayout >= point.cumulativeCost ? 'text-win' : 'text-loss'}
            >
              {formatChartValue(point.cumulativePayout, 'currency')}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            Profit:{' '}
            <span
              className={point.cumulativeProfit >= 0 ? 'text-win' : 'text-loss'}
            >
              {formatChartValue(point.cumulativeProfit, 'currency')}
            </span>
          </p>
          <p className="text-sm font-semibold mt-2">
            ROI:{' '}
            <span
              className={point.roi >= 0 ? 'text-win' : 'text-loss'}
            >
              {point.roi.toFixed(1)}%
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

  if (!bonusHunt.entries || bonusHunt.entries.length === 0) {
    return (
      <ChartWrapper
        title="Bonus Hunt Progress"
        isEmpty={true}
        emptyMessage="No bonus entries yet. Add bonuses to see progress tracking."
      />
    );
  }

  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'collecting':
        return 'text-amber-500';
      case 'opening':
        return 'text-blue-500';
      case 'completed':
        return 'text-green-500';
      case 'cancelled':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const statusEmoji = {
    collecting: '🎯',
    opening: '🎬',
    completed: '✅',
    cancelled: '❌',
  };

  return (
    <ChartWrapper
      title={`${bonusHunt.gameName} - Bonus Hunt Progress`}
      description={`${bonusHunt.streamerName} • ${statusEmoji[bonusHunt.status as keyof typeof statusEmoji]} ${
        bonusHunt.status.charAt(0).toUpperCase() + bonusHunt.status.slice(1)
      }`}
      isLoading={isLoading}
      error={error}
      isEmpty={!bonusHunt.entries || bonusHunt.entries.length === 0}
      footer={`Total Cost: ${formatChartValue(bonusHunt.totalCost, 'currency')} | Total Payout: ${formatChartValue(
        bonusHunt.totalPayout,
        'currency'
      )} | Final ROI: ${bonusHunt.roiPercent.toFixed(1)}%`}
    >
      <ResponsiveContainer width="100%" height={chartSettings.height || height}>
        <ComposedChart
          data={chartData}
          margin={chartSettings.margin}
          animationDuration={chartSettings.animationDuration}
        >
          <defs>
            {/* Profit gradient */}
            <linearGradient id="gradientProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColors.win} stopOpacity={0.7} />
              <stop offset="95%" stopColor={chartColors.win} stopOpacity={0.4} />
            </linearGradient>

            {/* Loss gradient */}
            <linearGradient id="gradientLoss" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColors.loss} stopOpacity={0.7} />
              <stop offset="95%" stopColor={chartColors.loss} stopOpacity={0.4} />
            </linearGradient>

            {/* Cost gradient */}
            <linearGradient id="gradientCost" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColors.series3} stopOpacity={0.7} />
              <stop offset="95%" stopColor={chartColors.series3} stopOpacity={0.4} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke={chartTheme.grid.stroke}
            strokeOpacity={chartTheme.grid.strokeOpacity}
          />

          <XAxis
            dataKey="entryNumber"
            label={{
              value: 'Bonus Entry Number',
              position: 'insideBottomRight',
              offset: -5,
              fill: chartTheme.axis.fill,
              fontSize: 12,
            }}
            tick={{ fill: chartTheme.axis.fill, fontSize: chartSettings.fontSize }}
            stroke={chartTheme.axis.stroke}
          />

          <YAxis
            yAxisId="left"
            label={{
              value: 'Amount ($)',
              angle: -90,
              position: 'insideLeft',
              fill: chartTheme.axis.fill,
              fontSize: 12,
            }}
            tick={{ fill: chartTheme.axis.fill, fontSize: chartSettings.fontSize }}
            stroke={chartTheme.axis.stroke}
            width={isMobile ? 40 : 60}
          />

          <YAxis
            yAxisId="right"
            orientation="right"
            label={{
              value: 'ROI (%)',
              angle: 90,
              position: 'insideRight',
              fill: chartTheme.axis.fill,
              fontSize: 12,
            }}
            tick={{ fill: chartTheme.axis.fill, fontSize: chartSettings.fontSize }}
            stroke={chartTheme.axis.stroke}
            width={isMobile ? 40 : 60}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Break-even line */}
          {bonusHunt.breakEvenPoint && (
            <ReferenceLine
              x={bonusHunt.breakEvenPoint}
              stroke={chartColors.hot}
              strokeDasharray="3 3"
              label={{
                value: `Break-even: Entry ${bonusHunt.breakEvenPoint}`,
                fill: chartColors.hot,
                fontSize: 11,
                offset: 10,
              }}
            />
          )}

          {/* Zero ROI line */}
          <ReferenceLine
            yAxisId="right"
            y={0}
            stroke={chartTheme.grid.stroke}
            strokeDasharray="5 5"
            label={{
              value: '0% ROI',
              fill: chartTheme.axis.fill,
              fontSize: 11,
              offset: 10,
            }}
          />

          {/* Stacked bars showing cost and profit */}
          <Bar
            yAxisId="left"
            dataKey="cumulativeCost"
            fill={chartColors.series3}
            name="Cumulative Cost"
            stackId="amount"
            isAnimationActive={!isMobile}
            animationDuration={400}
            opacity={0.6}
          />

          <Bar
            yAxisId="left"
            dataKey="cumulativeProfit"
            fill={(entry: any) => entry.cumulativeProfit >= 0 ? chartColors.win : chartColors.loss}
            name="Cumulative Profit"
            stackId="amount"
            isAnimationActive={!isMobile}
            animationDuration={400}
            opacity={0.8}
          />

          {/* ROI line overlay */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="roi"
            stroke={chartColors.series1}
            strokeWidth={2}
            dot={false}
            isAnimationActive={!isMobile}
            animationDuration={400}
            name="ROI (%)"
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
          label="Total Entries"
          value={bonusHunt.totalEntries.toString()}
        />
        <StatCard
          label="Total Cost"
          value={formatChartValue(bonusHunt.totalCost, 'currency')}
        />
        <StatCard
          label="Total Payout"
          value={formatChartValue(bonusHunt.totalPayout, 'currency')}
          isPositive={bonusHunt.totalProfit >= 0}
        />
        <StatCard
          label="Final ROI"
          value={`${bonusHunt.roiPercent.toFixed(1)}%`}
          isPositive={bonusHunt.roiPercent >= 0}
        />
      </div>

      {/* Progress information */}
      <div className="mt-4 p-3 bg-muted rounded-lg text-xs space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Opened:</span>
          <span className="font-semibold text-foreground">
            {bonusHunt.entries.filter((e) => e.status === 'opened').length} / {bonusHunt.totalEntries}
          </span>
        </div>
        <div className="w-full bg-background rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{
              width: `${(bonusHunt.entries.filter((e) => e.status === 'opened').length / bonusHunt.totalEntries) * 100
              }%`,
            }}
          />
        </div>
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
