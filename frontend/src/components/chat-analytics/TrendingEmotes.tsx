'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EmoteData {
  name: string;
  count: number;
  percentage: number;
}

interface TrendingEmotesProps {
  emotes: EmoteData[];
  isLive?: boolean;
  className?: string;
}

export function TrendingEmotes({
  emotes,
  isLive = false,
  className,
}: TrendingEmotesProps) {
  const getEmoteEmoji = (name: string): string => {
    const emojiMap: Record<string, string> = {
      'LUL': '😂',
      'KEKW': '🤣',
      'PogChamp': '😲',
      'Pog': '😮',
      'OMEGALUL': '🤣',
      'LULW': '😆',
      'Kappa': '😏',
      'monkaS': '😰',
      'monkaW': '😨',
      'PepeLaugh': '🐸',
      'POGGERS': '🎉',
      'Sadge': '😢',
      'Copium': '🎭',
      'COPIUM': '🎭',
      'EZ': '😎',
      'GG': '🏆',
      'W': '✅',
      'L': '❌',
    };
    return emojiMap[name] || '🎭';
  };

  const maxCount = emotes.length > 0 ? emotes[0].count : 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Trending Emotes</CardTitle>
          {isLive && (
            <Badge variant="outline" className="text-xs">
              Live
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {emotes.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            No emotes yet
          </div>
        ) : (
          <div className="space-y-2">
            {emotes.slice(0, 5).map((emote, index) => (
              <div key={emote.name} className="flex items-center gap-2">
                <div className="w-6 text-center font-bold text-muted-foreground">
                  #{index + 1}
                </div>
                <div className="text-xl">{getEmoteEmoji(emote.name)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{emote.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {emote.count.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300 rounded-full"
                      style={{ width: `${(emote.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
