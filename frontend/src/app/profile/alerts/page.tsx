'use client';

import { useState, useEffect } from 'react';
import { useAuth, useSubscription } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { SUBSCRIPTION_FEATURES } from '@/lib/supabase/types';
import { redirect } from 'next/navigation';
import { Bell, Plus, Zap, Users, TrendingUp, MessageSquare, Send, RefreshCw, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { DiscordIntegration } from '@/components/profile/discord-integration';

interface AlertRule {
  id: string;
  type: string;
  name: string;
  config: Record<string, any>;
  is_active: boolean;
  created_at: string;
}

const ALERT_TYPES = [
  {
    id: 'big_win',
    name: 'Big Win Alert',
    description: 'Get notified when a streamer hits a win above a certain multiplier',
    icon: Zap,
  },
  {
    id: 'streamer_live',
    name: 'Streamer Live Alert',
    description: 'Get notified when a specific streamer goes live',
    icon: Users,
  },
  {
    id: 'hot_slot',
    name: 'Hot Slot Alert',
    description: 'Get notified when a slot becomes hot based on recent performance',
    icon: TrendingUp,
    proOnly: true,
  },
];

export default function AlertsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { tier, isPro } = useSubscription();
  const maxAlerts = SUBSCRIPTION_FEATURES[tier].alertRules;

  const [activeAlerts, setActiveAlerts] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/alerts/rules?user_id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setActiveAlerts(data || []);
      } else {
        setError('Failed to load alerts');
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      redirect('/auth/login');
    }
    if (user?.id) {
      fetchAlerts();
    }
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-muted rounded mb-4" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const remainingAlerts = maxAlerts === Infinity ? 'Unlimited' : maxAlerts - activeAlerts.length;

  const handleDeleteAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/v1/alerts/rules/${alertId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setActiveAlerts(activeAlerts.filter(a => a.id !== alertId));
      }
    } catch (err) {
      console.error('Error deleting alert:', err);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Notifications & Alerts</h1>
          <p className="text-muted-foreground mt-2">
            Configure notifications via Discord, Telegram, and email
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAlerts} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="discord" className="max-w-3xl">
        <TabsList className="mb-6">
          <TabsTrigger value="discord" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Discord
          </TabsTrigger>
          <TabsTrigger value="telegram" className="gap-2">
            <Send className="h-4 w-4" />
            Telegram
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <Bell className="h-4 w-4" />
            Alert Rules
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discord">
          <DiscordIntegration userId={user?.id} />
        </TabsContent>

        <TabsContent value="telegram">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#0088cc] flex items-center justify-center">
                  <Send className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>Telegram Integration</CardTitle>
                  <CardDescription>
                    Receive notifications via Telegram bot
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Connect with our Telegram bot to receive instant notifications on your phone.
              </p>
              <Button className="bg-[#0088cc] hover:bg-[#006699]">
                <Send className="h-4 w-4 mr-2" />
                Connect Telegram
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Your Alerts
              </CardTitle>
              <CardDescription>
                {typeof remainingAlerts === 'number'
                  ? `${remainingAlerts} of ${maxAlerts} alert slots remaining`
                  : 'Unlimited alert slots available'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-destructive mb-4">{error}</p>
                  <Button variant="outline" onClick={fetchAlerts}>
                    Try Again
                  </Button>
                </div>
              ) : activeAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    You don&apos;t have any alerts set up yet.
                  </p>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Alert
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{alert.name}</p>
                          <Badge variant={alert.is_active ? 'default' : 'secondary'}>
                            {alert.is_active ? 'Active' : 'Paused'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{alert.type}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAlert(alert.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div>
            <h2 className="text-2xl font-bold mb-4">Available Alert Types</h2>
            <div className="grid gap-4">
              {ALERT_TYPES.map((alertType) => {
                const Icon = alertType.icon;
                const isLocked = alertType.proOnly && !isPro;

                return (
                  <Card key={alertType.id} className={isLocked ? 'opacity-75' : ''}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Icon className="h-5 w-5" />
                        {alertType.name}
                        {alertType.proOnly && (
                          <Badge variant="outline" className="ml-auto">
                            Pro+
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{alertType.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLocked ? (
                        <Button variant="outline" asChild>
                          <Link href="/profile/subscription">
                            Upgrade to Pro
                          </Link>
                        </Button>
                      ) : (
                        <Button variant="outline">
                          <Plus className="mr-2 h-4 w-4" />
                          Create Alert
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {tier === 'free' && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle>Need More Alerts?</CardTitle>
                <CardDescription>
                  Upgrade to Pro for 10 alert rules or Premium for unlimited alerts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/profile/subscription">View Plans</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}
