/**
 * Phase 13-4: Alert Notification Center
 *
 * Real-time alert notifications with:
 * - Toast-style notifications
 * - Notification history
 * - Severity-based filtering
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useAlertStream,
  DashboardAlert,
} from '@/lib/hooks/use-dashboard-websocket';
import {
  Bell,
  X,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Trash2,
} from 'lucide-react';

export function AlertNotificationCenter() {
  const { alerts, isConnected, acknowledgeAlert } = useAlertStream();
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Filter alerts
  const filteredAlerts = useMemo(() => {
    let filtered = alerts.filter((a) => !dismissedAlerts.has(a.id));

    if (activeFilter !== 'all') {
      filtered = filtered.filter((a) => a.severity === activeFilter);
    }

    return filtered;
  }, [alerts, dismissedAlerts, activeFilter]);

  // Count by severity
  const severityCount = useMemo(() => {
    const counts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };

    alerts.forEach((a) => {
      counts[a.severity] = (counts[a.severity] || 0) + 1;
    });

    return counts;
  }, [alerts]);

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts((prev) => new Set([...prev, alertId]));
  };

  const clearAll = () => {
    setDismissedAlerts(new Set(alerts.map((a) => a.id)));
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <Bell className={`w-4 h-4 ${isConnected ? 'text-blue-600' : 'text-red-600'}`} />
        <span className="text-sm text-blue-800">
          {isConnected
            ? 'Connected to alert stream - receiving real-time notifications'
            : 'Connecting to alert stream...'}
        </span>
      </div>

      {/* Alert Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Alert Notifications</CardTitle>
              <CardDescription>
                {filteredAlerts.length} alert
                {filteredAlerts.length !== 1 ? 's' : ''} {activeFilter !== 'all' ? 'matching filter' : ''}
              </CardDescription>
            </div>
            {alerts.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Severity Tabs */}
          <Tabs value={activeFilter} onValueChange={setActiveFilter}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">
                All ({alerts.length})
              </TabsTrigger>
              <TabsTrigger
                value="critical"
                className="text-red-600"
              >
                Critical ({severityCount.critical})
              </TabsTrigger>
              <TabsTrigger
                value="high"
                className="text-orange-600"
              >
                High ({severityCount.high})
              </TabsTrigger>
              <TabsTrigger
                value="medium"
                className="text-yellow-600"
              >
                Medium ({severityCount.medium})
              </TabsTrigger>
              <TabsTrigger
                value="low"
                className="text-blue-600"
              >
                Low ({severityCount.low})
              </TabsTrigger>
              <TabsTrigger
                value="info"
                className="text-gray-600"
              >
                Info ({severityCount.info})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeFilter} className="space-y-3 mt-4">
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onDismiss={dismissAlert}
                    onAcknowledge={acknowledgeAlert}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {activeFilter === 'all'
                    ? 'No alerts'
                    : `No ${activeFilter} severity alerts`}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Unread Summary */}
      {alerts.filter((a) => !a.read).length > 0 && (
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="text-sm text-orange-900">
              You have{' '}
              <span className="font-bold">
                {alerts.filter((a) => !a.read).length}
              </span>{' '}
              unread alert{alerts.filter((a) => !a.read).length !== 1 ? 's' : ''}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Individual alert card component
 */
function AlertCard({
  alert,
  onDismiss,
  onAcknowledge,
}: {
  alert: DashboardAlert;
  onDismiss: (id: string) => void;
  onAcknowledge: (id: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const severityStyles: Record<string, { bg: string; border: string; icon: React.ReactNode }> = {
    critical: {
      bg: 'bg-red-50',
      border: 'border-l-4 border-l-red-600',
      icon: <AlertCircle className="w-5 h-5 text-red-600" />,
    },
    high: {
      bg: 'bg-orange-50',
      border: 'border-l-4 border-l-orange-600',
      icon: <AlertTriangle className="w-5 h-5 text-orange-600" />,
    },
    medium: {
      bg: 'bg-yellow-50',
      border: 'border-l-4 border-l-yellow-600',
      icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
    },
    low: {
      bg: 'bg-blue-50',
      border: 'border-l-4 border-l-blue-600',
      icon: <Info className="w-5 h-5 text-blue-600" />,
    },
    info: {
      bg: 'bg-gray-50',
      border: 'border-l-4 border-l-gray-600',
      icon: <Info className="w-5 h-5 text-gray-600" />,
    },
  };

  const style = severityStyles[alert.severity] || severityStyles.info;

  return (
    <div
      className={`${style.bg} ${style.border} p-4 rounded transition-all cursor-pointer`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 pt-1">{style.icon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold text-sm">{alert.title}</h4>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {alert.message}
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(alert.id);
              }}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 mt-2">
            <Badge
              variant="outline"
              className={
                alert.severity === 'critical'
                  ? 'bg-red-100 text-red-800'
                  : alert.severity === 'high'
                    ? 'bg-orange-100 text-orange-800'
                    : alert.severity === 'medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-blue-100 text-blue-800'
              }
            >
              {alert.severity.toUpperCase()}
            </Badge>

            {alert.game_id && (
              <Badge variant="secondary" className="text-xs">
                {alert.game_id}
              </Badge>
            )}

            {alert.read && (
              <Badge variant="outline" className="gap-1 text-xs">
                <CheckCircle2 className="w-3 h-3" />
                Read
              </Badge>
            )}
          </div>

          {/* Expanded content */}
          {isExpanded && (
            <div className="mt-3 space-y-3 pt-3 border-t">
              <div>
                <h5 className="text-sm font-semibold mb-1">Recommendation</h5>
                <p className="text-sm text-muted-foreground">
                  {alert.recommendation}
                </p>
              </div>

              <div>
                <h5 className="text-sm font-semibold mb-1">Alert Value</h5>
                <p className="text-sm font-mono text-muted-foreground">
                  {alert.value.toFixed(4)}
                </p>
              </div>

              <div>
                <h5 className="text-sm font-semibold mb-1">Timestamp</h5>
                <p className="text-xs text-muted-foreground">
                  {new Date(alert.timestamp).toLocaleString()}
                </p>
              </div>

              {!alert.read && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAcknowledge(alert.id);
                  }}
                  className="w-full"
                >
                  Mark as Read
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
