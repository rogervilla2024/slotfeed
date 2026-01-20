'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, Cpu, HardDrive, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface HealthMetric {
  timestamp: string;
  cpu: number;
  memory: number;
  responseTime: number;
  activeConnections: number;
  errorRate: number;
  uptime: number;
}

interface SystemMetrics {
  cpu: {
    current: number;
    average: number;
    peak: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  responseTime: {
    p50: number;
    p95: number;
    p99: number;
  };
  uptime: string;
  errors: {
    rate: number;
    count: number;
    trend: 'up' | 'down' | 'stable';
  };
}

export function SystemHealthPanel() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [history, setHistory] = useState<HealthMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/v1/admin/system-metrics');
        if (response.ok) {
          const data = await response.json();
          setMetrics(data.metrics);
          setHistory(data.history || []);
        }
      } catch (error) {
        console.error('Failed to fetch system metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Unable to fetch system metrics. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) {
      return <Badge variant="destructive">Critical</Badge>;
    }
    if (value >= thresholds.warning) {
      return <Badge variant="secondary">Warning</Badge>;
    }
    return <Badge variant="default">Healthy</Badge>;
  };

  const getCpuStatus = getStatusBadge(metrics.cpu.current, { warning: 70, critical: 85 });
  const getMemoryStatus = getStatusBadge(metrics.memory.percentage, { warning: 75, critical: 90 });
  const getErrorStatus = getStatusBadge(metrics.errors.rate, { warning: 1, critical: 5 });

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              CPU Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-3xl font-bold">{metrics.cpu.current.toFixed(1)}%</div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Avg: {metrics.cpu.average.toFixed(1)}%</span>
                <span>Peak: {metrics.cpu.peak.toFixed(1)}%</span>
              </div>
              <div className="mt-2">{getCpuStatus}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-3xl font-bold">
                {(metrics.memory.used / 1024).toFixed(1)}GB
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Total: {(metrics.memory.total / 1024).toFixed(1)}GB</span>
                <span>{metrics.memory.percentage.toFixed(1)}%</span>
              </div>
              <div className="mt-2">{getMemoryStatus}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-3xl font-bold">{metrics.responseTime.p50}ms</div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>P95: {metrics.responseTime.p95}ms</span>
                <span>P99: {metrics.responseTime.p99}ms</span>
              </div>
              <div className="mt-2">
                {metrics.responseTime.p95 < 500 ? (
                  <Badge variant="default">Excellent</Badge>
                ) : (
                  <Badge variant="secondary">Check</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Error Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-3xl font-bold">{metrics.errors.rate.toFixed(2)}%</div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Total: {metrics.errors.count} errors</span>
                <span>Trend: {metrics.errors.trend}</span>
              </div>
              <div className="mt-2">{getErrorStatus}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metrics History */}
      <Card>
        <CardHeader>
          <CardTitle>Metrics History</CardTitle>
          <CardDescription>24-hour system performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="cpu" className="space-y-4">
            <TabsList>
              <TabsTrigger value="cpu">CPU & Memory</TabsTrigger>
              <TabsTrigger value="response">Response Time</TabsTrigger>
              <TabsTrigger value="errors">Error Rate</TabsTrigger>
            </TabsList>

            <TabsContent value="cpu" className="space-y-4">
              {history.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                    />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="cpu"
                      stroke="#3b82f6"
                      fill="#93c5fd"
                      name="CPU %"
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="memory"
                      stroke="#ef4444"
                      fill="#fca5a5"
                      name="Memory %"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-muted-foreground">
                  No historical data available
                </div>
              )}
            </TabsContent>

            <TabsContent value="response" className="space-y-4">
              {history.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    />
                    <YAxis />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="responseTime"
                      stroke="#8b5cf6"
                      name="Response Time (ms)"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-muted-foreground">
                  No historical data available
                </div>
              )}
            </TabsContent>

            <TabsContent value="errors" className="space-y-4">
              {history.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    />
                    <YAxis />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="errorRate"
                      stroke="#ef4444"
                      name="Error Rate %"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-300 flex items-center justify-center text-muted-foreground">
                  No historical data available
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Uptime */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            System Uptime
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{metrics.uptime}</p>
          <p className="text-sm text-muted-foreground mt-2">
            System is running smoothly without major incidents.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
