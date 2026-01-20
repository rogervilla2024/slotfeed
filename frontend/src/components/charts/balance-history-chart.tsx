'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { ChartWrapper, ChartSkeleton } from './chart-wrapper';
import { chartColors, chartTheme, formatChartValue, getResponsiveChartSettings } from '@/lib/chart-config';
import { BalanceDataPoint, ChartCommonProps } from '@/types/charts';
import { useMediaQuery } from '@/lib/hooks/use-media-query';

// Dynamic import for recharts (client-side only)
const LineChart = dynamic(
  () => import('recharts').then((mod) => mod.LineChart),
  { ssr: false }
);
const Line = dynamic(
  () => import('recharts').then((mod) => mod.Line),
  { ssr: false }
);
const Area = dynamic(
  () => import('recharts').then((mod) => mod.Area),
  { ssr: false }
);
const AreaChart = dynamic(
  () => import('recharts').then((mod) => mod.AreaChart),
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

interface BalanceHistoryChartProps extends ChartCommonProps {
  /** Array of balance data points */
  data: BalanceDataPoint[];
  /** Starting balance */
  startBalance: number;
  /** Current balance */
  currentBalance: number;
  /** Peak balance reached during session */
  peakBalance?: number;
  /** Lowest balance reached during session */
  lowestBalance?: number;
  /** Show peak/low markers */
  showMarkers?: boolean;
  /** Y-axis min/max values (optional, auto-scales if not provided) */
  yMin?: number;
  yMax?: number;
}

/**
 * Balance History Chart Component
 * Displays balance changes over time during a session/stream
 * Uses LineChart with Area fill for visual appeal
 */
export function BalanceHistoryChart({
  data,
  startBalance,
  currentBalance,
  peakBalance,
  lowestBalance,
  showMarkers = true,
  yMin,
  yMax,
  height = 300,
  isLoading = false,
  error = null,
  ...props
}: BalanceHistoryChartProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const chartSettings = getResponsiveChartSettings(isMobile);

  // Determine if session is profitable or not
  const isProfit = currentBalance >= startBalance;

  // Calculate Y-axis bounds if not provided
  const bounds = useMemo(() => {
    if (!data || data.length === 0) {
      return { min: startBalance * 0.9, max: startBalance * 1.1 };
    }

    const minVal = yMin ?? Math.min(...data.map((d) => d.balance), startBalance);
    const maxVal = yMax ?? Math.max(...data.map((d) => d.balance), startBalance);
    const padding = (maxVal - minVal) * 0.1;

    return {
      min: Math.floor((minVal - padding) / 10) * 10,
      max: Math.ceil((maxVal + padding) / 10) * 10,
    };
  }, [data, startBalance, yMin, yMax]);

  // Format time for X-axis
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload as BalanceDataPoint;
      return (
        <div
          className="bg-background border border-border rounded-lg p-3 shadow-lg"
          style={chartTheme.tooltip.contentStyle}
        >
          <p className="text-sm font-semibold text-foreground">
            {formatTime(point.timestamp)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Balance:{' '}
            <span
              className={point.balance >= startBalance ? 'text-win' : 'text-loss'}
            >
              {formatChartValue(point.balance, 'currency')}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            Change:{' '}
            <span
              className={point.change >= 0 ? 'text-win' : 'text-loss'}
            >
              {formatChartValue(point.change, 'currency')} ({point.changePercent.toFixed(1)}%)
            </span>
          </p>
          {point.bet && (
            <p className="text-xs text-muted-foreground mt-1">
              Bet: {formatChartValue(point.bet, 'currency')}
            </p>
          )}
          {point.win && (
            <p className="text-xs text-muted-foreground">
              Win: {formatChartValue(point.win, 'currency')}
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
        title="Balance History"
        description="Track your balance changes over time"
        isEmpty={true}
        emptyMessage="No balance data available for this session"
      />
    );
  }

  return (
    <ChartWrapper
      title="Balance History"
      description={`${formatChartValue(startBalance, 'currency')} → ${formatChartValue(
        currentBalance,
        'currency'
      )}`}
      isLoading={isLoading}
      error={error}
      isEmpty={!data || data.length === 0}
      emptyMessage="No balance data available"
    >
      <ResponsiveContainer width="100%" height={chartSettings.height || height}>
        <AreaChart
          data={data}
          margin={chartSettings.margin}
          animationDuration={chartSettings.animationDuration}
        >
          <defs>
            {/* Gradient for profit area */}
            <linearGradient id="gradientProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColors.win} stopOpacity={0.3} />
              <stop offset="95%" stopColor={chartColors.win} stopOpacity={0} />
            </linearGradient>

            {/* Gradient for loss area */}
            <linearGradient id="gradientLoss" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColors.loss} stopOpacity={0.3} />
              <stop offset="95%" stopColor={chartColors.loss} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke={chartTheme.grid.stroke}
            strokeOpacity={chartTheme.grid.strokeOpacity}
          />

          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTime}
            tick={{ fill: chartTheme.axis.fill, fontSize: chartSettings.fontSize }}
            stroke={chartTheme.axis.stroke}
          />

          <YAxis
            domain={[bounds.min, bounds.max]}
            tickFormatter={(value) => formatChartValue(value, 'currency')}
            tick={{ fill: chartTheme.axis.fill, fontSize: chartSettings.fontSize }}
            stroke={chartTheme.axis.stroke}
            width={isMobile ? 40 : 60}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Start balance reference line */}
          <ReferenceLine
            y={startBalance}
            stroke={chartTheme.grid.stroke}
            strokeDasharray="5 5"
            label={{
              value: 'Start',
              fill: chartTheme.axis.fill,
              fontSize: 11,
              offset: 10,
            }}
          />

          {/* Break-even line if session is profitable */}
          {isProfit && (
            <ReferenceLine
              y={startBalance}
              stroke={chartColors.win}
              strokeDasharray="5 5"
              opacity={0.3}
            />
          )}

          {/* Area chart showing balance */}
          <Area
            type="monotone"
            dataKey="balance"
            stroke={isProfit ? chartColors.win : chartColors.loss}
            fill={isProfit ? 'url(#gradientProfit)' : 'url(#gradientLoss)'}
            isAnimationActive={!isMobile}
            animationDuration={400}
            dot={false}
            name="Balance"
          />

          {/* Peak balance reference line */}
          {showMarkers && peakBalance && peakBalance > startBalance && (
            <ReferenceLine
              y={peakBalance}
              stroke={chartColors.hot}
              strokeDasharray="3 3"
              label={{
                value: `Peak: ${formatChartValue(peakBalance, 'currency')}`,
                fill: chartColors.hot,
                fontSize: 11,
                offset: 10,
              }}
            />
          )}

          {/* Lowest balance reference line */}
          {showMarkers && lowestBalance && lowestBalance < startBalance && (
            <ReferenceLine
              y={lowestBalance}
              stroke={chartColors.loss}
              strokeDasharray="3 3"
              label={{
                value: `Low: ${formatChartValue(lowestBalance, 'currency')}`,
                fill: chartColors.loss,
                fontSize: 11,
                offset: -15,
              }}
            />
          )}

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
          label="Starting Balance"
          value={formatChartValue(startBalance, 'currency')}
        />
        <StatCard
          label="Current Balance"
          value={formatChartValue(currentBalance, 'currency')}
          isPositive={currentBalance >= startBalance}
        />
        {peakBalance && (
          <StatCard
            label="Peak Balance"
            value={formatChartValue(peakBalance, 'currency')}
            isPositive
          />
        )}
        {lowestBalance && (
          <StatCard
            label="Lowest Balance"
            value={formatChartValue(lowestBalance, 'currency')}
            isPositive={false}
          />
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
