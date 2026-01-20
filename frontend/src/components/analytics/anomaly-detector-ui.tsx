'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, AlertCircle, CheckCircle2, TrendingDown, Zap, Activity } from 'lucide-react';

interface Anomaly {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  confidence: number;
  description: string;
  affectedMetrics: string[];
  expectedValue?: number;
  observedValue?: number;
  deviationStd?: number;
  recommendation?: string;
  detectedAt: string;
}

interface AnomalyDetectorUIProps {
  gameId: string;
  anomalies?: Anomaly[];
  loading?: boolean;
  period?: '24h' | '7d' | '30d';
}

const ANOMALY_COLORS = {
  critical: { bg: '#fee2e2', border: '#fecaca', text: '#991b1b', icon: '#dc2626' },
  high: { bg: '#fed7aa', border: '#fdba74', text: '#92400e', icon: '#ea580c' },
  medium: { bg: '#fef3c7', border: '#fcd34d', text: '#78350f', icon: '#eab308' },
  low: { bg: '#cffafe', border: '#a5f3fc', text: '#164e63', icon: '#06b6d4' },
};

const ANOMALY_ICONS = {
  rtp_spike: TrendingDown,
  rtp_drop: TrendingDown,
  bonus_drought: Zap,
  bonus_clustering: Zap,
  variance_excess: Activity,
  balance_volatility_spike: Activity,
  unusual_bet_pattern: AlertCircle,
};

export function AnomalyDetectorUI({
  gameId,
  anomalies = [],
  loading = false,
  period = '24h',
}: AnomalyDetectorUIProps) {
  const [expandedAnomalyIdx, setExpandedAnomalyIdx] = useState<number | null>(null);

  // Mock data if none provided
  const displayAnomalies: Anomaly[] = anomalies.length > 0 ? anomalies : [
    {
      type: 'rtp_spike',
      severity: 'high',
      score: 0.82,
      confidence: 0.89,
      description: 'RTP significantly above expected for this hour',
      affectedMetrics: ['observed_rtp'],
      expectedValue: 96.48,
      observedValue: 104.2,
      deviationStd: 2.5,
      recommendation: 'Monitor for regression to mean',
      detectedAt: new Date(Date.now() - 30 * 60000).toISOString(),
    },
    {
      type: 'bonus_drought',
      severity: 'medium',
      score: 0.65,
      confidence: 0.76,
      description: 'Bonus hits significantly below frequency pattern',
      affectedMetrics: ['bonus_frequency_per_100spins'],
      expectedValue: 0.64,
      observedValue: 0.21,
      recommendation: 'Wait for pattern break or consider switching games',
      detectedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
  ];

  const criticalCount = displayAnomalies.filter(a => a.severity === 'critical').length;
  const highCount = displayAnomalies.filter(a => a.severity === 'high').length;
  const mediumCount = displayAnomalies.filter(a => a.severity === 'medium').length;
  const lowCount = displayAnomalies.filter(a => a.severity === 'low').length;

  const getSeverityBadgeColor = (severity: string) => {
    const colors = {
      critical: 'bg-red-600 text-white hover:bg-red-700',
      high: 'bg-orange-600 text-white hover:bg-orange-700',
      medium: 'bg-yellow-600 text-white hover:bg-yellow-700',
      low: 'bg-cyan-600 text-white hover:bg-cyan-700',
    };
    return colors[severity as keyof typeof colors] || colors.low;
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'medium':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'low':
        return <AlertCircle className="h-5 w-5 text-cyan-600" />;
      default:
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }
  };

  const getRecommendationColor = (severity: string) => {
    const colors = {
      critical: 'bg-red-50 border-red-200 text-red-900',
      high: 'bg-orange-50 border-orange-200 text-orange-900',
      medium: 'bg-yellow-50 border-yellow-200 text-yellow-900',
      low: 'bg-cyan-50 border-cyan-200 text-cyan-900',
    };
    return colors[severity as keyof typeof colors] || colors.low;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Total</div>
            <div className="text-2xl font-bold mt-1">{displayAnomalies.length}</div>
            <div className="text-xs text-muted-foreground mt-1">Anomalies</div>
          </CardContent>
        </Card>

        <Card className={criticalCount > 0 ? 'border-red-200 bg-red-50' : ''}>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Critical</div>
            <div className="text-2xl font-bold mt-1 text-red-600">{criticalCount}</div>
            {criticalCount === 0 && <div className="text-xs text-green-600 mt-1">✓ None</div>}
          </CardContent>
        </Card>

        <Card className={highCount > 0 ? 'border-orange-200 bg-orange-50' : ''}>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">High</div>
            <div className="text-2xl font-bold mt-1 text-orange-600">{highCount}</div>
          </CardContent>
        </Card>

        <Card className={mediumCount > 0 ? 'border-yellow-200 bg-yellow-50' : ''}>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Medium</div>
            <div className="text-2xl font-bold mt-1 text-yellow-600">{mediumCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-xs text-muted-foreground">Period</div>
            <div className="text-lg font-bold mt-1">{period}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
              Detected Anomalies
            </span>
            {displayAnomalies.length > 0 && (
              <Badge variant="outline" className="bg-orange-100 text-orange-800">
                {displayAnomalies.length} active
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Machine learning anomaly detection for {gameId} ({period})
          </CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : displayAnomalies.length === 0 ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-900">No Anomalies Detected</AlertTitle>
              <AlertDescription className="text-green-800">
                Game metrics are within normal ranges for the {period} period.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {displayAnomalies.map((anomaly, idx) => (
                <div
                  key={idx}
                  className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md`}
                  style={{
                    backgroundColor: ANOMALY_COLORS[anomaly.severity].bg,
                    borderColor: ANOMALY_COLORS[anomaly.severity].border,
                  }}
                  onClick={() => setExpandedAnomalyIdx(expandedAnomalyIdx === idx ? null : idx)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      {getSeverityIcon(anomaly.severity)}

                      <div className="flex-1">
                        <h4
                          className="font-semibold"
                          style={{ color: ANOMALY_COLORS[anomaly.severity].text }}
                        >
                          {anomaly.type.replace(/_/g, ' ')}
                        </h4>
                        <p
                          className="text-sm mt-1"
                          style={{ color: ANOMALY_COLORS[anomaly.severity].text }}
                        >
                          {anomaly.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Badge className={getSeverityBadgeColor(anomaly.severity)}>
                        {anomaly.severity}
                      </Badge>
                      <div className="text-sm font-semibold" style={{ color: ANOMALY_COLORS[anomaly.severity].icon }}>
                        {(anomaly.score * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  {/* Quick Info */}
                  <div className="flex flex-wrap gap-3 text-xs mb-3">
                    <span>
                      <strong>Confidence:</strong> {(anomaly.confidence * 100).toFixed(0)}%
                    </span>
                    <span>
                      <strong>Metrics:</strong> {anomaly.affectedMetrics.join(', ')}
                    </span>
                    <span>
                      <strong>Detected:</strong> {formatTime(anomaly.detectedAt)}
                    </span>
                  </div>

                  {/* Expanded Details */}
                  {expandedAnomalyIdx === idx && (
                    <div className="mt-4 pt-4 border-t border-current border-opacity-20 space-y-3">
                      {anomaly.expectedValue !== undefined && anomaly.observedValue !== undefined && (
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-xs font-semibold opacity-75">Expected</p>
                            <p className="text-base font-bold">{anomaly.expectedValue.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold opacity-75">Observed</p>
                            <p className="text-base font-bold">{anomaly.observedValue.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold opacity-75">Deviation</p>
                            <p className="text-base font-bold">{anomaly.deviationStd?.toFixed(2)}σ</p>
                          </div>
                        </div>
                      )}

                      {anomaly.recommendation && (
                        <div className={`p-3 rounded border ${getRecommendationColor(anomaly.severity)}`}>
                          <p className="font-semibold text-sm mb-1">💡 Recommendation</p>
                          <p className="text-sm">{anomaly.recommendation}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button className="flex-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
                          View Details
                        </button>
                        <button className="flex-1 px-3 py-1 text-xs border rounded hover:bg-white hover:bg-opacity-20">
                          Dismiss
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Box */}
      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-900">About Anomaly Detection</AlertTitle>
        <AlertDescription className="text-blue-800 text-sm">
          Our system uses Isolation Forest machine learning combined with statistical z-score analysis to detect unusual
          patterns in real-time. Anomalies are scored 0-1 (higher = more anomalous) and categorized by severity to help
          prioritize monitoring.
        </AlertDescription>
      </Alert>
    </div>
  );
}
