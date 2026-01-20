'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, BarChart3, Settings, FileText, Activity } from 'lucide-react';
import { ContentManager } from '@/components/admin/content-manager';
import { SystemHealthPanel } from '@/components/admin/system-health-panel';
import { StreamingStatsPanel } from '@/components/admin/streaming-stats-panel';
import { APIDocsHub } from '@/components/admin/api-docs-hub';

interface SystemStatus {
  database: 'healthy' | 'warning' | 'error';
  cache: 'healthy' | 'warning' | 'error';
  api: 'healthy' | 'warning' | 'error';
  message?: string;
}

export default function AdminDashboard() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        const response = await fetch('/api/v1/admin/system-status');
        if (response.ok) {
          const data = await response.json();
          setSystemStatus(data);
        }
      } catch (error) {
        console.error('Failed to fetch system status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const isSystemHealthy = systemStatus &&
    systemStatus.database === 'healthy' &&
    systemStatus.cache === 'healthy' &&
    systemStatus.api === 'healthy';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage platform content, monitor system health, and view analytics
        </p>
      </div>

      {/* System Status Alert */}
      {systemStatus && (
        <Alert variant={isSystemHealthy ? "default" : "destructive"} className="border-l-4">
          <div className="flex items-start gap-4">
            {isSystemHealthy ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className="font-semibold">
                {isSystemHealthy ? 'System Healthy' : 'System Issues Detected'}
              </h3>
              <AlertDescription className="mt-2 space-y-1">
                <p>Database: <Badge variant={systemStatus.database === 'healthy' ? 'default' : 'destructive'}>
                  {systemStatus.database}
                </Badge></p>
                <p>Cache: <Badge variant={systemStatus.cache === 'healthy' ? 'default' : 'destructive'}>
                  {systemStatus.cache}
                </Badge></p>
                <p>API: <Badge variant={systemStatus.api === 'healthy' ? 'default' : 'destructive'}>
                  {systemStatus.api}
                </Badge></p>
                {systemStatus.message && (
                  <p className="text-sm mt-2">{systemStatus.message}</p>
                )}
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">API Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">
                {systemStatus?.api === 'healthy' ? '✓' : '✗'}
              </div>
              <Activity className={`h-5 w-5 ${systemStatus?.api === 'healthy' ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Database</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">
                {systemStatus?.database === 'healthy' ? '✓' : '✗'}
              </div>
              <Activity className={`h-5 w-5 ${systemStatus?.database === 'healthy' ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cache (Redis)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">
                {systemStatus?.cache === 'healthy' ? '✓' : '✗'}
              </div>
              <Activity className={`h-5 w-5 ${systemStatus?.cache === 'healthy' ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Documentation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" asChild>
                <a href="/api/v1/docs" target="_blank" rel="noopener noreferrer">
                  <FileText className="h-4 w-4" />
                </a>
              </Button>
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="content" className="flex gap-2">
            <FileText className="h-4 w-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex gap-2">
            <Activity className="h-4 w-4" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="streaming" className="flex gap-2">
            <BarChart3 className="h-4 w-4" />
            Streaming
          </TabsTrigger>
          <TabsTrigger value="api" className="flex gap-2">
            <Settings className="h-4 w-4" />
            API Docs
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Welcome to Admin Dashboard</CardTitle>
              <CardDescription>
                Manage SLOTFEED platform operations, monitor system health, and track analytics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-slate-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Content Management</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Generate, edit, and publish AI-generated educational content for slot games.
                  </CardContent>
                </Card>

                <Card className="bg-slate-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">System Monitoring</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Monitor database performance, cache health, and API response times.
                  </CardContent>
                </Card>

                <Card className="bg-slate-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Streaming Analytics</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Track live streaming activity, streamer performance, and engagement metrics.
                  </CardContent>
                </Card>

                <Card className="bg-slate-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">API Documentation</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Access interactive API docs and integration guides.
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Management Tab */}
        <TabsContent value="content">
          <ContentManager />
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring">
          <SystemHealthPanel />
        </TabsContent>

        {/* Streaming Analytics Tab */}
        <TabsContent value="streaming">
          <StreamingStatsPanel />
        </TabsContent>

        {/* API Documentation Tab */}
        <TabsContent value="api">
          <APIDocsHub />
        </TabsContent>
      </Tabs>
    </div>
  );
}
