'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/contexts/auth-context';
import { SUBSCRIPTION_FEATURES, type SubscriptionTier } from '@/lib/supabase/types';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlanConfig {
  name: string;
  price: string;
  description: string;
  popular?: boolean;
}

const PLANS: Record<SubscriptionTier, PlanConfig> = {
  free: {
    name: 'Free',
    price: '$0',
    description: 'Basic access to live dashboards and stats',
  },
  pro: {
    name: 'Pro',
    price: '$9.99/mo',
    description: 'Advanced analytics and alerts for serious enthusiasts',
    popular: true,
  },
  premium: {
    name: 'Premium',
    price: '$24.99/mo',
    description: 'Full access with API and unlimited alerts',
  },
};

const FEATURE_LABELS: Record<string, string> = {
  leaderboardPeriod: 'Leaderboard History',
  alertRules: 'Alert Rules',
  hotColdIndicator: 'Hot/Cold Indicators',
  bonusHuntTracker: 'Bonus Hunt Tracker',
  apiAccess: 'API Access',
  dataExport: 'Data Export',
};

function formatFeatureValue(key: string, value: unknown): string | boolean {
  if (key === 'leaderboardPeriod') {
    const periods = value as string[];
    if (periods.length === 1) return '24 hours';
    if (periods.length === 3) return '30 days';
    return 'All-time';
  }
  if (key === 'alertRules') {
    return value === Infinity ? 'Unlimited' : `${value} max`;
  }
  if (key === 'apiAccess') {
    if (value === false) return false;
    return value === 'basic' ? 'Basic' : 'Full';
  }
  if (key === 'dataExport') {
    if (value === false) return false;
    return value === 'csv' ? 'CSV' : 'CSV + JSON';
  }
  return value as boolean;
}

export function SubscriptionPlans() {
  const { tier: currentTier, isPro, isPremium } = useSubscription();

  const handleUpgrade = (tier: SubscriptionTier) => {
    // TODO: Implement Stripe checkout
    console.log('Upgrade to', tier);
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {(Object.keys(PLANS) as SubscriptionTier[]).map((tier) => {
        const plan = PLANS[tier];
        const features = SUBSCRIPTION_FEATURES[tier];
        const isCurrent = tier === currentTier;

        return (
          <Card
            key={tier}
            className={cn(
              'relative',
              plan.popular && 'border-primary shadow-lg',
              isCurrent && 'bg-muted/50'
            )}
          >
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                Most Popular
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {plan.name}
                {isCurrent && (
                  <Badge variant="outline">Current</Badge>
                )}
              </CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-6">{plan.price}</div>
              <ul className="space-y-3">
                {Object.entries(features).map(([key, value]) => {
                  const formatted = formatFeatureValue(key, value);
                  const isAvailable = formatted !== false;

                  return (
                    <li key={key} className="flex items-center gap-2 text-sm">
                      {isAvailable ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={cn(!isAvailable && 'text-muted-foreground')}>
                        {FEATURE_LABELS[key]}
                        {typeof formatted === 'string' && `: ${formatted}`}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
            <CardFooter>
              {isCurrent ? (
                <Button disabled className="w-full">
                  Current Plan
                </Button>
              ) : tier === 'free' ? (
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={!isPro && !isPremium}
                >
                  Downgrade
                </Button>
              ) : (
                <Button
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => handleUpgrade(tier)}
                >
                  Upgrade to {plan.name}
                </Button>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
