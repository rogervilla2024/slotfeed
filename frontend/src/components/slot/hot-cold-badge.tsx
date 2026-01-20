'use client';

import React from 'react';
import { Flame, Snowflake } from 'lucide-react';

type HotColdStatus = 'hot' | 'cold' | 'neutral';

interface HotColdBadgeProps {
  status: HotColdStatus;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function HotColdBadge({ status, score, size = 'sm' }: HotColdBadgeProps) {
  const getStyles = () => {
    const baseClasses = 'inline-flex items-center gap-1 rounded-full font-semibold transition-colors';

    switch (size) {
      case 'sm':
        return `${baseClasses} px-2 py-1 text-xs`;
      case 'md':
        return `${baseClasses} px-3 py-1.5 text-sm`;
      case 'lg':
        return `${baseClasses} px-4 py-2 text-base`;
      default:
        return baseClasses;
    }
  };

  const getStatusStyles = () => {
    switch (status) {
      case 'hot':
        return 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30';
      case 'cold':
        return 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30';
      case 'neutral':
        return 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border border-gray-500/30';
      default:
        return '';
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'hot':
        return <Flame className={size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'} />;
      case 'cold':
        return <Snowflake className={size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'} />;
      default:
        return <span className={size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'}>─</span>;
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'hot':
        return 'Hot';
      case 'cold':
        return 'Cold';
      case 'neutral':
        return 'Neutral';
      default:
        return '';
    }
  };

  return (
    <div className={`${getStyles()} ${getStatusStyles()}`} title={`Score: ${score?.toFixed(1) || 'N/A'}`}>
      {getIcon()}
      <span>{getLabel()}</span>
      {score !== undefined && <span className="opacity-75">({score.toFixed(1)})</span>}
    </div>
  );
}

interface LiveIndicatorProps {
  streamersCount: number;
  size?: 'sm' | 'md';
}

export function LiveIndicator({ streamersCount, size = 'sm' }: LiveIndicatorProps) {
  if (streamersCount === 0) return null;

  const baseClasses = 'inline-flex items-center gap-1 rounded-full font-semibold bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30';
  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';

  return (
    <div className={`${baseClasses} ${sizeClasses}`}>
      <span className="h-2 w-2 bg-purple-500 rounded-full animate-pulse" />
      <span>{streamersCount} {streamersCount === 1 ? 'streamer' : 'streamers'}</span>
    </div>
  );
}
