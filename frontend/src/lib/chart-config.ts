/**
 * Shared Chart Configuration
 * Centralized theming and styling for all recharts components
 */

export const chartColors = {
  // Primary action colors
  primary: '#8b5cf6', // Purple - main brand
  secondary: '#06b6d4', // Cyan - secondary

  // Win/Loss colors
  win: '#10b981', // Green - profits/positive
  loss: '#ef4444', // Red - losses/negative
  neutral: '#6b7280', // Gray - neutral state

  // Hot/Cold indicators
  hot: '#f59e0b', // Orange - hot slots (warming)
  cold: '#3b82f6', // Blue - cold slots (cooling)
  hotter: '#dc2626', // Dark red - very hot
  colder: '#1e40af', // Dark blue - very cold

  // Chart series
  series1: '#8b5cf6', // Purple
  series2: '#06b6d4', // Cyan
  series3: '#f59e0b', // Amber
  series4: '#ec4899', // Pink
  series5: '#10b981', // Green

  // UI backgrounds
  background: '#1f2937', // Dark gray bg
  surface: '#111827', // Darker surface
  border: '#374151', // Gray border
  text: '#f3f4f6', // Light text
  textMuted: '#9ca3af', // Muted text

  // Gradients
  gradientGreenStart: '#10b981',
  gradientGreenEnd: '#059669',
  gradientRedStart: '#ef4444',
  gradientRedEnd: '#dc2626',
  gradientBlueStart: '#3b82f6',
  gradientBlueEnd: '#1d4ed8',
} as const;

export const chartTheme = {
  // Font settings
  fontSize: 12,
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  fontSizeSmall: 11,
  fontSizeLarge: 14,
  fontWeight: {
    normal: 400,
    semibold: 600,
    bold: 700,
  },

  // Grid configuration
  grid: {
    stroke: '#374151',
    strokeDasharray: '3 3',
    strokeOpacity: 0.5,
    vertical: {
      stroke: '#374151',
      strokeDasharray: '3 3',
      strokeOpacity: 0.3,
    },
  },

  // Axis configuration
  axis: {
    stroke: '#6b7280',
    fill: '#9ca3af',
    fontSize: 12,
  },

  // Tooltip styling
  tooltip: {
    contentStyle: {
      backgroundColor: '#111827',
      border: '1px solid #374151',
      borderRadius: '8px',
      padding: '8px 12px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
    },
    labelStyle: {
      color: '#f3f4f6',
      fontWeight: 600,
      marginBottom: '4px',
    },
    itemStyle: {
      color: '#f3f4f6',
      padding: '2px 0',
    },
    wrapperStyle: {
      outline: 'none',
    },
    cursorStyle: {
      fill: 'rgba(139, 92, 246, 0.1)',
    },
  },

  // Legend styling
  legend: {
    wrapperStyle: {
      paddingTop: '20px',
      color: '#f3f4f6',
    },
    iconType: 'line' as const,
  },

  // ResponsiveContainer padding
  margin: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
  },

  // Animation settings
  animation: {
    enabled: true,
    duration: 400,
    easing: 'natural' as const,
  },

  // Chart dimensions
  minHeight: 300,
  minWidth: 280,
};

/**
 * Get color for volatility level
 */
export function getVolatilityColor(volatility: string): string {
  switch (volatility?.toLowerCase()) {
    case 'low':
      return chartColors.win;
    case 'medium':
      return chartColors.series3;
    case 'high':
      return chartColors.loss;
    case 'very_high':
    case 'veryhigh':
      return chartColors.hotter;
    default:
      return chartColors.neutral;
  }
}

/**
 * Get color for hot/cold status
 */
export function getHotColdColor(status: 'hot' | 'cold' | 'neutral'): string {
  switch (status) {
    case 'hot':
      return chartColors.hot;
    case 'cold':
      return chartColors.cold;
    case 'neutral':
    default:
      return chartColors.neutral;
  }
}

/**
 * Format value for chart display
 */
export function formatChartValue(value: number, type: 'currency' | 'percentage' | 'number' | 'multiplier'): string {
  switch (type) {
    case 'currency':
      if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
      return `$${value.toFixed(0)}`;

    case 'percentage':
      return `${value.toFixed(2)}%`;

    case 'multiplier':
      return `${value.toFixed(1)}x`;

    case 'number':
    default:
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
      return value.toLocaleString();
  }
}

/**
 * Get responsive settings based on screen size
 */
export function getResponsiveChartSettings(isMobile: boolean) {
  return {
    animationDuration: isMobile ? 0 : 400,
    margin: isMobile
      ? { top: 10, right: 10, bottom: 10, left: 10 }
      : chartTheme.margin,
    fontSize: isMobile ? 10 : chartTheme.fontSize,
    height: isMobile ? 250 : 300,
  };
}

/**
 * Merge custom config with default theme
 */
export function mergeChartConfig(custom: Partial<typeof chartTheme>) {
  return {
    ...chartTheme,
    ...custom,
    grid: { ...chartTheme.grid, ...custom.grid },
    axis: { ...chartTheme.axis, ...custom.axis },
    tooltip: { ...chartTheme.tooltip, ...custom.tooltip },
    legend: { ...chartTheme.legend, ...custom.legend },
    animation: { ...chartTheme.animation, ...custom.animation },
  };
}
