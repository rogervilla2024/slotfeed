/**
 * ML Analytics Configuration
 * Centralized configuration for machine learning features
 */

export const ML_CONFIG = {
  // Update intervals (milliseconds)
  intervals: {
    predictions: 60000, // 1 minute
    anomalies: 300000, // 5 minutes
    patterns: 600000, // 10 minutes
    models: 1800000, // 30 minutes
  },

  // Cache TTL
  cache: {
    predictions: 3600, // 1 hour
    anomalies: 1800, // 30 minutes
    patterns: 3600, // 1 hour
    insights: 300, // 5 minutes
  },

  // Model thresholds
  thresholds: {
    anomaly_critical: 0.9,
    anomaly_high: 0.7,
    anomaly_medium: 0.5,
    anomaly_low: 0.3,

    opportunity_confidence: 0.7,
    prediction_confidence: 0.8,
  },

  // Feature importance settings
  features: {
    top_n: 10, // Show top 10 features
    min_importance: 0.01,
  },

  // API endpoints
  api: {
    base: '/api/v1/ml-analytics',
    predictions: '/api/v1/ml-analytics/rtp-predictions',
    anomalies: '/api/v1/ml-analytics/anomalies',
    patterns: '/api/v1/ml-analytics/patterns',
    models: '/api/v1/ml-analytics/models',
    insights: '/api/v1/ml-analytics/insights',
  },

  // Severity levels
  anomaly_severity: {
    critical: { label: 'Critical', color: '#dc2626', priority: 1 },
    high: { label: 'High', color: '#ea580c', priority: 2 },
    medium: { label: 'Medium', color: '#eab308', priority: 3 },
    low: { label: 'Low', color: '#06b6d4', priority: 4 },
  },

  // Trend indicators
  trends: {
    up: { label: 'Trending Up', icon: '📈', color: '#10b981' },
    down: { label: 'Trending Down', icon: '📉', color: '#ef4444' },
    stable: { label: 'Stable', icon: '➡️', color: '#6b7280' },
  },

  // Time horizons for RTP predictions
  horizons: {
    '1h': '1 Hour',
    '24h': '24 Hours',
    '7d': '7 Days',
  },

  // Period options
  periods: [
    { value: '1h', label: '1 Hour' },
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
  ],
};

export const ANOMALY_TYPES = {
  rtp_spike: 'RTP Spike',
  rtp_drop: 'RTP Drop',
  bonus_drought: 'Bonus Drought',
  variance_excess: 'Excessive Variance',
  win_distribution_anomaly: 'Win Distribution Anomaly',
  balance_volatility_spike: 'Balance Volatility Spike',
  unusual_bet_pattern: 'Unusual Bet Pattern',
};

export const OPPORTUNITY_TYPES = {
  hot_slot: 'Hot Slot',
  RTP_above_theoretical: 'RTP Above Theoretical',
  bonus_due: 'Bonus Due Soon',
  favorable_volatility: 'Favorable Volatility',
  low_variance_opportunity: 'Low Variance Opportunity',
};

// Format functions
export function formatConfidence(confidence: number): string {
  return `${(confidence * 100).toFixed(1)}%`;
}

export function formatRTP(rtp: number): string {
  return `${rtp.toFixed(2)}%`;
}

export function getAnomalySeverityColor(severity: string): string {
  return ML_CONFIG.anomaly_severity[severity as keyof typeof ML_CONFIG.anomaly_severity]?.color || '#6b7280';
}

export function getAnomalySeverityLabel(severity: string): string {
  return ML_CONFIG.anomaly_severity[severity as keyof typeof ML_CONFIG.anomaly_severity]?.label || severity;
}

export function getTrendEmoji(trend: string): string {
  return ML_CONFIG.trends[trend as keyof typeof ML_CONFIG.trends]?.icon || '➡️';
}

export function getTrendColor(trend: string): string {
  return ML_CONFIG.trends[trend as keyof typeof ML_CONFIG.trends]?.color || '#6b7280';
}
