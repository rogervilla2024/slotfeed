'use client';

import { useAuth, useSubscription } from '@/contexts/auth-context';
import { SubscriptionPlans, SubscriptionBadge } from '@/components/user';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';
import { format } from 'date-fns';

export default function SubscriptionPage() {
  const { user, profile, isLoading } = useAuth();
  const { tier, isExpired } = useSubscription();

  useEffect(() => {
    if (!isLoading && !user) {
      redirect('/auth/login');
    }
  }, [user, isLoading]);

  if (isLoading) {
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

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Subscription</h1>
        <p className="text-muted-foreground mt-2">
          Manage your subscription and billing
        </p>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              Current Plan
              <SubscriptionBadge tier={tier} />
            </CardTitle>
            <CardDescription>
              {tier === 'free'
                ? 'Upgrade to unlock more features'
                : isExpired
                ? 'Your subscription has expired'
                : `Your subscription is active${
                    profile?.subscriptionExpiresAt
                      ? ` until ${format(profile.subscriptionExpiresAt, 'MMMM d, yyyy')}`
                      : ''
                  }`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {tier === 'free' ? (
                <p>
                  You&apos;re on the free plan. Upgrade to Pro or Premium to unlock
                  advanced features like Hot/Cold indicators, Bonus Hunt tracking,
                  and API access.
                </p>
              ) : (
                <p>
                  Thank you for being a {tier === 'pro' ? 'Pro' : 'Premium'} subscriber!
                  You have access to all {tier === 'premium' ? 'platform' : 'Pro'} features.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-2xl font-bold mb-4">Available Plans</h2>
          <SubscriptionPlans />
        </div>
      </div>
    </main>
  );
}
