'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { user, profile, isLoading, updateProfile, updatePreferences } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      redirect('/auth/login');
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName ?? '');
    }
  }, [profile]);

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

  if (!user || !profile) {
    return null;
  }

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setMessage(null);

    const { error } = await updateProfile({ displayName });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    }

    setIsSaving(false);
  };

  const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
    await updatePreferences({ theme });
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Customize your account preferences
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your display name and profile picture
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {message && (
              <div
                className={`p-3 text-sm rounded-md ${
                  message.type === 'success'
                    ? 'bg-green-500/10 text-green-500'
                    : 'bg-red-500/10 text-red-500'
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user.email ?? ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <Button onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize the look and feel of the app
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="flex gap-2">
                {(['light', 'dark', 'system'] as const).map((theme) => (
                  <Button
                    key={theme}
                    variant={profile.preferences.theme === theme ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleThemeChange(theme)}
                  >
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Configure which notifications you receive
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Big Win Alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified when streamers hit big wins
                  </p>
                </div>
                <Button
                  variant={profile.preferences.notifications.bigWins ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    updatePreferences({
                      notifications: {
                        ...profile.preferences.notifications,
                        bigWins: !profile.preferences.notifications.bigWins,
                      },
                    })
                  }
                >
                  {profile.preferences.notifications.bigWins ? 'On' : 'Off'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Streamer Live Alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified when your favorite streamers go live
                  </p>
                </div>
                <Button
                  variant={profile.preferences.notifications.streamerLive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    updatePreferences({
                      notifications: {
                        ...profile.preferences.notifications,
                        streamerLive: !profile.preferences.notifications.streamerLive,
                      },
                    })
                  }
                >
                  {profile.preferences.notifications.streamerLive ? 'On' : 'Off'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Hot Slot Alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified when slots are running hot (Pro+)
                  </p>
                </div>
                <Button
                  variant={profile.preferences.notifications.hotSlots ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    updatePreferences({
                      notifications: {
                        ...profile.preferences.notifications,
                        hotSlots: !profile.preferences.notifications.hotSlots,
                      },
                    })
                  }
                >
                  {profile.preferences.notifications.hotSlots ? 'On' : 'Off'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
