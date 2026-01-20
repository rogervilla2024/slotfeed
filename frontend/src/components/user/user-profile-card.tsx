'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserAvatar } from './user-avatar';
import { SubscriptionBadge } from './subscription-badge';
import { useAuth } from '@/contexts/auth-context';
import { format } from 'date-fns';
import { Settings, Bell, CreditCard } from 'lucide-react';
import Link from 'next/link';

export function UserProfileCard() {
  const { profile, user } = useAuth();

  if (!user || !profile) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <UserAvatar size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <span>{profile.displayName ?? 'User'}</span>
              <SubscriptionBadge />
            </div>
            <p className="text-sm font-normal text-muted-foreground">
              {user.email}
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Member since</p>
              <p className="font-medium">
                {format(profile.createdAt, 'MMM d, yyyy')}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Favorite Streamers</p>
              <p className="font-medium">
                {profile.preferences.favoriteStreamers.length || 'None'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Favorite Games</p>
              <p className="font-medium">
                {profile.preferences.favoriteGames.length || 'None'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Alert Rules</p>
              <p className="font-medium">0 active</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/profile/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/profile/alerts">
                <Bell className="mr-2 h-4 w-4" />
                Manage Alerts
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/profile/subscription">
                <CreditCard className="mr-2 h-4 w-4" />
                Subscription
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
