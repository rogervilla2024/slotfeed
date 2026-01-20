'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, TrendingUp } from 'lucide-react';

interface ChartWrapperProps {
  /** Chart title */
  title: string;
  /** Optional description or subtitle */
  description?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
  /** Empty state flag */
  isEmpty?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** The chart component to render */
  children: React.ReactNode;
  /** Optional actions (e.g., refresh button, period selector) */
  actions?: React.ReactNode;
  /** Optional footer content */
  footer?: React.ReactNode;
  /** Chart height for skeleton */
  skeletonHeight?: number;
  /** Show last updated timestamp */
  lastUpdated?: Date;
  /** Custom className */
  className?: string;
}

/**
 * Wrapper component for all charts
 * Handles loading, error, and empty states consistently
 */
export function ChartWrapper({
  title,
  description,
  isLoading = false,
  error,
  isEmpty = false,
  emptyMessage = 'No data available',
  children,
  actions,
  footer,
  skeletonHeight = 300,
  lastUpdated,
  className,
}: ChartWrapperProps) {
  return (
    <Card className={className}>
      {/* Header with title and actions */}
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="space-y-1 flex-1">
          <CardTitle className="text-xl flex items-center gap-2">
            {title}
            {lastUpdated && (
              <span className="text-xs font-normal text-muted-foreground">
                (Updated {formatTimeAgo(lastUpdated)})
              </span>
            )}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>

        {/* Actions on the right */}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </CardHeader>

      {/* Chart content area */}
      <CardContent>
        {isLoading && <ChartSkeleton height={skeletonHeight} />}

        {error && <ChartError message={error} />}

        {isEmpty && !isLoading && !error && (
          <ChartEmpty message={emptyMessage} />
        )}

        {!isLoading && !error && !isEmpty && children}
      </CardContent>

      {/* Optional footer */}
      {footer && (
        <div className="px-6 py-4 border-t text-xs text-muted-foreground">
          {footer}
        </div>
      )}
    </Card>
  );
}

/**
 * Loading skeleton for charts
 */
export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-40" />
      </div>

      {/* Chart area skeleton */}
      <Skeleton
        className="w-full rounded-lg"
        style={{ height: `${height}px` }}
      />

      {/* Legend skeleton */}
      <div className="flex gap-4 pt-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

/**
 * Error state component
 */
export function ChartError({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="rounded-full bg-destructive/10 p-4">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-foreground">Unable to Load Chart</p>
        <p className="text-sm text-muted-foreground mt-1">{message}</p>
      </div>
    </div>
  );
}

/**
 * Empty state component
 */
export function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="rounded-full bg-muted p-4">
        <TrendingUp className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground text-center max-w-xs">
        {message}
      </p>
    </div>
  );
}

/**
 * Period selector component
 */
export interface PeriodSelectorOption {
  value: string;
  label: string;
}

interface PeriodSelectorProps {
  periods: PeriodSelectorOption[];
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  isLoading?: boolean;
}

export function PeriodSelector({
  periods,
  selectedPeriod,
  onPeriodChange,
  isLoading = false,
}: PeriodSelectorProps) {
  return (
    <div className="flex items-center gap-2 mt-6">
      <span className="text-sm text-muted-foreground">Period:</span>
      <div className="flex gap-2">
        {periods.map((period) => (
          <button
            key={period.value}
            onClick={() => onPeriodChange(period.value)}
            disabled={isLoading}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              selectedPeriod === period.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {period.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Helper function to format time ago
 */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
