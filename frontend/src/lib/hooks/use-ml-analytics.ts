import { useEffect, useState } from 'react';
import useSWR from 'swr';

// Types for ML Analytics
export interface Prediction {
  game_id: string;
  rtp_1h: number;
  rtp_24h: number;
  rtp_7d: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
}

export interface Anomaly {
  type: string;
  game_id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  description: string;
}

export interface Opportunity {
  type: string;
  game_id: string;
  confidence: number;
  action: string;
}

export interface MLAnalyticsData {
  predictions: Prediction[];
  anomalies: Anomaly[];
  opportunities: Opportunity[];
  models_status: Record<string, any>;
  feature_importance: Record<string, number>;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useMLPredictions(gameId?: string) {
  const url = gameId ? `/api/v1/ml-analytics/rtp-predictions/${gameId}` : null;
  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 60 seconds
  });

  return {
    predictions: data,
    isLoading,
    error,
  };
}

export function useMLAnomalies(gameId?: string, period: string = '24h') {
  const url = gameId ? `/api/v1/ml-analytics/anomalies/${gameId}?period=${period}` : null;
  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  return {
    anomalies: data,
    isLoading,
    error,
  };
}

export function useMLOpportunities() {
  const { data, error, isLoading } = useSWR(
    `/api/v1/ml-analytics/insights/opportunities`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    opportunities: data,
    isLoading,
    error,
  };
}

export function useMLAnalyticsSummary(period: string = '24h') {
  const { data, error, isLoading } = useSWR(
    `/api/v1/ml-analytics/insights/summary?period=${period}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    summary: data,
    isLoading,
    error,
  };
}

export function useMLModelStatus() {
  const { data, error, isLoading } = useSWR(
    `/api/v1/ml-analytics/models/status`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes
    }
  );

  return {
    models: data,
    isLoading,
    error,
  };
}

export function useMLFeatureImportance(target: string = 'rtp') {
  const { data, error, isLoading } = useSWR(
    `/api/v1/ml-analytics/models/feature-importance?target=${target}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000,
    }
  );

  return {
    importance: data,
    isLoading,
    error,
  };
}

export function useMLGamePatterns(gameId: string, period: string = '7d') {
  const { data, error, isLoading } = useSWR(
    `/api/v1/ml-analytics/patterns/${gameId}?period=${period}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000,
    }
  );

  return {
    patterns: data,
    isLoading,
    error,
  };
}

export function useMLBonusHuntPrediction(huntId: string) {
  const { data, error, isLoading } = useSWR(
    `/api/v1/ml-analytics/bonus-hunts/${huntId}/prediction`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 seconds for active hunts
    }
  );

  return {
    prediction: data,
    isLoading,
    error,
  };
}

// Composite hook for dashboard
export function useMLDashboard(period: string = '24h') {
  const summary = useMLAnalyticsSummary(period);
  const models = useMLModelStatus();
  const opportunities = useMLOpportunities();

  const isLoading = summary.isLoading || models.isLoading || opportunities.isLoading;
  const error = summary.error || models.error || opportunities.error;

  return {
    summary: summary.summary,
    models: models.models,
    opportunities: opportunities.opportunities,
    isLoading,
    error,
  };
}

// =============================================
// PHASE 13-3: PREDICTIVE ANALYTICS HOOKS
// =============================================

export function useMLForecast(gameId: string, period: string = '30d') {
  const urlRtp = `/api/v1/ml-analytics/forecast/rtp/${gameId}?period=${period}`;
  const urlBonus = `/api/v1/ml-analytics/forecast/bonus-frequency/${gameId}?period=${period}`;
  const urlVol = `/api/v1/ml-analytics/forecast/volatility/${gameId}?period=${period}`;

  const { data: rtpData, error: rtpError, isLoading: rtpLoading } = useSWR(
    urlRtp,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 120000, // 2 minutes
    }
  );

  const { data: bonusData, error: bonusError, isLoading: bonusLoading } = useSWR(
    urlBonus,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 120000,
    }
  );

  const { data: volData, error: volError, isLoading: volLoading } = useSWR(
    urlVol,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 120000,
    }
  );

  const isLoading = rtpLoading || bonusLoading || volLoading;
  const error = rtpError || bonusError || volError;

  return {
    rtpForecast: rtpData,
    bonusFrequencyForecast: bonusData,
    volatilityForecast: volData,
    isLoading,
    error,
  };
}

interface PredictionOptions {
  gameId?: string;
  sessionId?: string;
  bonusHuntId?: string;
}

export function useMLPredictionsAdvanced(options: PredictionOptions) {
  const { gameId, sessionId, bonusHuntId } = options;

  const urlBonusHit = gameId ? `/api/v1/ml-analytics/predict/bonus-hit/${gameId}` : null;
  const urlHuntOutcome = bonusHuntId ? `/api/v1/ml-analytics/predict/hunt-outcome/${bonusHuntId}` : null;
  const urlSessionROI = sessionId ? `/api/v1/ml-analytics/predict/session-roi?session_id=${sessionId}` : null;
  const urlDrawdown = gameId ? `/api/v1/ml-analytics/predict/drawdown?game_id=${gameId}` : null;

  const { data: bonusHitData, error: bonusHitError, isLoading: bonusHitLoading } = useSWR(
    urlBonusHit,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 seconds
    }
  );

  const { data: huntData, error: huntError, isLoading: huntLoading } = useSWR(
    urlHuntOutcome,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  const { data: roiData, error: roiError, isLoading: roiLoading } = useSWR(
    urlSessionROI,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  const { data: drawdownData, error: drawdownError, isLoading: drawdownLoading } = useSWR(
    urlDrawdown,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  const isLoading = bonusHitLoading || huntLoading || roiLoading || drawdownLoading;
  const error = bonusHitError || huntError || roiError || drawdownError;

  return {
    bonusHitPrediction: bonusHitData,
    huntOutcomePrediction: huntData,
    sessionROIPrediction: roiData,
    drawdownPrediction: drawdownData,
    isLoading,
    error,
  };
}

export function useMLBetSizing(
  gameId: string,
  bankroll: number,
  volatility: string,
  riskTolerance: number,
  expectedRTP: number
) {
  const url = `/api/v1/ml-analytics/predict/optimal-bet-size?game_id=${gameId}&bankroll=${bankroll}&volatility=${volatility}&risk_tolerance=${riskTolerance}&expected_rtp=${expectedRTP}`;

  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 minute
  });

  return {
    recommendation: data,
    isLoading,
    error,
  };
}

export function useMLComprehensivePredictions(gameId: string) {
  const url = `/api/v1/ml-analytics/predictions/comprehensive?game_id=${gameId}`;

  const { data, error, isLoading } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  return {
    predictions: data,
    isLoading,
    error,
  };
}
