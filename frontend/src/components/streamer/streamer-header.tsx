'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/utils';
import type { Streamer } from '@/types';
import { ExternalLink, Bell, Play } from 'lucide-react';
import { useState } from 'react';

interface StreamerHeaderProps {
  streamer: Streamer & {
    livestream?: { id: number; title: string; viewerCount: number };
    socialLinks?: {
      kick?: string;
      twitch?: string;
      youtube?: string;
      twitter?: string;
      discord?: string;
    };
  };
  className?: string;
}

export function StreamerHeader({ streamer, className }: StreamerHeaderProps) {
  const [alertSet, setAlertSet] = useState(false);

  const platformColors: Record<string, string> = {
    kick: 'bg-kick text-white',
    twitch: 'bg-twitch text-white',
    youtube: 'bg-youtube text-white',
  };

  // Safe platform access with fallback
  const platform = streamer.platform || 'kick';

  const getPlatformUrl = () => {
    // First try to use the actual platform URL from socialLinks
    if (streamer.socialLinks) {
      const socialUrl = streamer.socialLinks[platform as keyof typeof streamer.socialLinks];
      if (socialUrl) return socialUrl;
    }

    // Fallback to constructing URL from username
    switch (platform) {
      case 'kick':
        return `https://kick.com/${streamer.username}`;
      case 'twitch':
        return `https://twitch.tv/${streamer.username}`;
      case 'youtube':
        return `https://youtube.com/@${streamer.username}`;
      default:
        return `https://kick.com/${streamer.username}`;
    }
  };

  // Safe platform display name
  const platformDisplayName = platform.charAt(0).toUpperCase() + platform.slice(1);

  const handleWatchLive = () => {
    window.open(getPlatformUrl(), '_blank');
  };

  const handleSetAlert = () => {
    setAlertSet(!alertSet);
    // TODO: Implement actual alert system
  };

  const handleViewOnPlatform = () => {
    window.open(getPlatformUrl(), '_blank');
  };

  return (
    <div className={className}>
      <div className="flex items-start gap-6">
        <Avatar className="h-24 w-24 border-4 border-primary">
          <AvatarImage src={streamer.avatarUrl} alt={streamer.displayName} />
          <AvatarFallback className="text-2xl">
            {streamer.displayName?.slice(0, 2).toUpperCase() || '??'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{streamer.displayName}</h1>
            {streamer.isLive && (
              <Badge variant="live" className="gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                LIVE
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 text-muted-foreground">
            <Badge className={platformColors[platform] || 'bg-primary text-white'}>
              {platformDisplayName}
            </Badge>
            <span>@{streamer.username}</span>
            <span>{formatNumber(streamer.followerCount)} followers</span>
          </div>

          {streamer.livestream && (
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="text-foreground font-medium">{streamer.livestream.viewerCount?.toLocaleString()}</span> watching now
            </p>
          )}

          {streamer.bio && (
            <p className="mt-3 text-muted-foreground max-w-2xl">{streamer.bio}</p>
          )}

          <div className="flex gap-3 mt-4">
            {streamer.isLive && (
              <Button onClick={handleWatchLive} className="gap-2">
                <Play className="h-4 w-4" />
                Watch Live
              </Button>
            )}
            <Button
              variant={alertSet ? "default" : "outline"}
              onClick={handleSetAlert}
              className="gap-2"
            >
              <Bell className={`h-4 w-4 ${alertSet ? 'fill-current' : ''}`} />
              {alertSet ? 'Alert Set' : 'Set Alert'}
            </Button>
            <Button variant="outline" onClick={handleViewOnPlatform} className="gap-2">
              <ExternalLink className="h-4 w-4" />
              View on {platformDisplayName}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
