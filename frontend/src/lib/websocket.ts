'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface WebSocketMessage {
  type: string;
  data?: Record<string, unknown>;
  channel?: string;
  timestamp?: string;
}

export interface UseWebSocketOptions {
  url: string;
  channels?: string[];
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  enabled?: boolean;
}

export function useWebSocket({
  url,
  channels = ['all'],
  onMessage,
  onConnect,
  onDisconnect,
  onError,
  reconnectInterval = 3000,
  maxReconnectAttempts = 10,
  enabled = false, // Disabled by default
}: UseWebSocketOptions) {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    // Don't connect if disabled
    if (!enabled || !url) {
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setStatus('connecting');

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setStatus('connected');
        reconnectAttemptsRef.current = 0;
        channels.forEach(channel => {
          ws.send(JSON.stringify({ type: 'subscribe', channel }));
        });
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          onMessage?.(message);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      ws.onclose = () => {
        setStatus('disconnected');
        onDisconnect?.();
        if (enabled && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (error) => {
        setStatus('error');
        onError?.(error);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setStatus('error');
    }
  }, [url, channels, onMessage, onConnect, onDisconnect, onError, reconnectInterval, maxReconnectAttempts, enabled]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus('disconnected');
  }, []);

  const subscribe = useCallback((channel: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'subscribe', channel }));
    }
  }, []);

  const unsubscribe = useCallback((channel: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'unsubscribe', channel }));
    }
  }, []);

  const ping = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'ping' }));
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
      const pingInterval = setInterval(ping, 30000);
      return () => {
        clearInterval(pingInterval);
        disconnect();
      };
    }
  }, [connect, disconnect, ping, enabled]);

  return {
    status,
    lastMessage,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    ping,
    isConnected: status === 'connected',
  };
}

// Specialized hooks - all disabled by default
export function useLiveUpdates(onUpdate?: (message: WebSocketMessage) => void) {
  return useWebSocket({
    url: '',
    channels: ['all'],
    onMessage: onUpdate,
    enabled: false,
  });
}

export function useStreamUpdates(sessionId: string, onUpdate?: (message: WebSocketMessage) => void) {
  return useWebSocket({
    url: '',
    onMessage: onUpdate,
    enabled: false,
  });
}

export function useBigWinsUpdates(onUpdate?: (message: WebSocketMessage) => void) {
  return useWebSocket({
    url: '',
    onMessage: onUpdate,
    enabled: false,
  });
}
