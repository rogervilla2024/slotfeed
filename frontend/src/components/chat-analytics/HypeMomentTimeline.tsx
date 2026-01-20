'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type HypeTriggerType = 'big_win' | 'chat_spike' | 'viewer_spike' | 'emote_spam' | 'bonus_trigger' | 'jackpot' | 'manual';

interface HypeMoment {
  id: string;
  detectedAt: Date;
  triggerType: HypeTriggerType;
  hypeScore: number;
  chatVelocity?: number;
  viewerSpike?: number;
  clipUrl?: string;
}

interface HypeMomentTimelineProps {
  moments: HypeMoment[];
  className?: string;
}

export function HypeMomentTimeline({
  moments,
  className,
}: HypeMomentTimelineProps) {
  const getTriggerConfig = (type: HypeTriggerType) => {
    const configs: Record<HypeTriggerType, { label: string; icon: string; color: string }> = {
      big_win: { label: 'Big Win', icon: '💰', color: 'bg-yellow-500' },
      chat_spike: { label: 'Chat Spike', icon: '💬', color: 'bg-blue-500' },
      viewer_spike: { label: 'Viewer Spike', icon: '👥', color: 'bg-purple-500' },
      emote_spam: { label: 'Emote Spam', icon: '🎉', color: 'bg-pink-500' },
      bonus_trigger: { label: 'Bonus', icon: '🎰', color: 'bg-green-500' },
      jackpot: { label: 'Jackpot', icon: '🎯', color: 'bg-orange-500' },
      manual: { label: 'Manual', icon: '📌', color: 'bg-gray-500' },
    };
    return configs[type];
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getHypeIntensity = (score: number): string => {
    if (score >= 0.8) return 'INSANE';
    if (score >= 0.6) return 'HIGH';
    if (score >= 0.4) return 'MEDIUM';
    return 'LOW';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Hype Moments</CardTitle>
          <Badge variant="secondary">{moments.length} moments</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {moments.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No hype moments detected yet
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />

            <div className="space-y-4">
              {moments.map((moment, index) => {
                const config = getTriggerConfig(moment.triggerType);
                const intensity = getHypeIntensity(moment.hypeScore);

                return (
                  <div key={moment.id} className="relative flex items-start gap-4 pl-8">
                    {/* Timeline dot */}
                    <div className={`absolute left-2.5 w-3 h-3 rounded-full ${config.color} border-2 border-background`} />

                    {/* Content */}
                    <div className="flex-1 bg-muted/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{config.icon}</span>
                          <span className="font-medium">{config.label}</span>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              intensity === 'INSANE' ? 'border-purple-500 text-purple-500' :
                              intensity === 'HIGH' ? 'border-orange-500 text-orange-500' :
                              intensity === 'MEDIUM' ? 'border-yellow-500 text-yellow-500' :
                              'border-green-500 text-green-500'
                            }`}
                          >
                            {intensity}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(moment.detectedAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Hype: {Math.round(moment.hypeScore * 100)}%</span>
                        {moment.chatVelocity && (
                          <span>Chat: {moment.chatVelocity}/min</span>
                        )}
                        {moment.viewerSpike && (
                          <span>+{moment.viewerSpike} viewers</span>
                        )}
                      </div>

                      {moment.clipUrl && (
                        <a
                          href={moment.clipUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
                        >
                          Watch Clip
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
