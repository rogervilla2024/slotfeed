/**
 * Phase 13-4: Dashboard WebSocket Hook
 *
 * Manages real-time WebSocket connections for dashboard updates
 */

import { useEffect, useState, useCallback, useRef } from 'react';

export interface DashboardMetrics {
  total_games_tracked: number;
  games_with_anomalies: number;
  active_opportunities: number;
  avg_rtp: number;
  highest_rtp: number;
  lowest_rtp: number;
  total_predictions: number;
  accuracy_rate: number;
  timestamp: string;
}

export interface GameSnapshot {
  game_id: string;
  game_name: string;
  current_rtp: number;
  theoretical_rtp: number;
  volatility: string;
  last_bonus_spins: number;
  bonus_probability_next_100: number;
  prediction_confidence: number;
  anomaly_score: number;
  trend: 'up' | 'down' | 'stable';
  status: 'hot' | 'cold' | 'normal';
  timestamp: string;
}

export interface DashboardAlert {
  id: string;
  type: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  game_id?: string;
  title: string;
  message: string;
  value: number;
  recommendation: string;
  timestamp: string;
  read: boolean;
}

export interface DashboardState {
  metrics: DashboardMetrics | null;
  alerts: DashboardAlert[];
  games: GameSnapshot[];
  timestamp: string;
}

interface WebSocketMessage {
  type: string;
  data?: any;
  channel?: string;
  timestamp?: string;
}

export function useDashboardWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    metrics: null,
    alerts: [],
    games: [],
    timestamp: new Date().toISOString(),
  });
  const [error, setError] = useState<Error | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const subscriptionsRef = useRef<Set<string>>(new Set());

  // Connect to WebSocket
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/v1/ws/dashboard`;

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('Dashboard WebSocket connected');
          setIsConnected(true);
          setError(null);

          // Resubscribe to channels
          subscriptionsRef.current.forEach((channel) => {
            ws.send(
              JSON.stringify({
                action: 'subscribe',
                channel,
              })
            );
          });
        };

        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);

            switch (message.type) {
              case 'initial_state':
                setDashboardState(message.data || {
                  metrics: null,
                  alerts: [],
                  games: [],
                  timestamp: new Date().toISOString(),
                });
                break;

              case 'game_update':
                setDashboardState((prev) => ({
                  ...prev,
                  games: [
                    ...prev.games.filter((g) => g.game_id !== message.data.game_id),
                    message.data,
                  ],
                  timestamp: new Date().toISOString(),
                }));
                break;

              case 'metrics_update':
                setDashboardState((prev) => ({
                  ...prev,
                  metrics: message.data,
                  timestamp: new Date().toISOString(),
                }));
                break;

              case 'alert':
                setDashboardState((prev) => ({
                  ...prev,
                  alerts: [message.data, ...prev.alerts.slice(0, 49)],
                  timestamp: new Date().toISOString(),
                }));
                break;

              case 'ping':
                // Heartbeat, no action needed
                break;

              default:
                console.log('Unknown message type:', message.type);
            }
          } catch (err) {
            console.error('Failed to parse WebSocket message:', err);
          }
        };

        ws.onerror = (event) => {
          console.error('WebSocket error:', event);
          setError(new Error('WebSocket connection error'));
          setIsConnected(false);
        };

        ws.onclose = () => {
          console.log('Dashboard WebSocket disconnected');
          setIsConnected(false);

          // Attempt reconnection with exponential backoff
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
        };

        wsRef.current = ws;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('WebSocket connection failed'));
        setIsConnected(false);

        // Retry connection
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Subscribe to channel
  const subscribe = useCallback((channel: string) => {
    subscriptionsRef.current.add(channel);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          action: 'subscribe',
          channel,
        })
      );
    }
  }, []);

  // Unsubscribe from channel
  const unsubscribe = useCallback((channel: string) => {
    subscriptionsRef.current.delete(channel);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          action: 'unsubscribe',
          channel,
        })
      );
    }
  }, []);

  return {
    isConnected,
    dashboardState,
    error,
    subscribe,
    unsubscribe,
  };
}

/**
 * Hook for real-time alert streaming
 */
export function useAlertStream() {
  const [isConnected, setIsConnected] = useState(false);
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/v1/ws/alerts`;

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('Alert stream WebSocket connected');
          setIsConnected(true);
          setError(null);
        };

        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);

            if (message.type === 'alert') {
              setAlerts((prev) => [message.data, ...prev].slice(0, 100));
            }
          } catch (err) {
            console.error('Failed to parse alert message:', err);
          }
        };

        ws.onerror = (event) => {
          console.error('Alert stream error:', event);
          setError(new Error('Alert stream connection error'));
          setIsConnected(false);
        };

        ws.onclose = () => {
          console.log('Alert stream disconnected');
          setIsConnected(false);

          // Reconnect
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
        };

        wsRef.current = ws;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Alert stream connection failed'));
        setIsConnected(false);
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      const response = await fetch(
        `/api/v1/dashboard/alerts/${alertId}/acknowledge`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to acknowledge alert');
      }

      // Mark as read locally
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, read: true } : a))
      );
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  }, []);

  return {
    isConnected,
    alerts,
    error,
    acknowledgeAlert,
  };
}
