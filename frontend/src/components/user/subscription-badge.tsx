'use client';

import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/contexts/auth-context';
import type { SubscriptionTier } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

interface SubscriptionBadgeProps {
  tier?: SubscriptionTier;
  className?: string;
  showLabel?: boolean;
}

const tierConfig: Record<SubscriptionTier, { label: string; className: string; icon: string }> = {
  free: {
    label: 'Free',
    className: 'bg-muted text-muted-foreground',
    icon: '',
  },
  pro: {
    label: 'Pro',
    className: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
    icon: '⭐',
  },
  premium: {
    label: 'Premium',
    className: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
    icon: '👑',
  },
};

export function SubscriptionBadge({
  tier: tierProp,
  className,
  showLabel = true,
}: SubscriptionBadgeProps) {
  const { tier: contextTier } = useSubscription();
  const tier = tierProp ?? contextTier;
  const config = tierConfig[tier];

  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
    >
      {config.icon && <span className="mr-1">{config.icon}</span>}
      {showLabel && config.label}
    </Badge>
  );
}
