'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ChatStatsProps {
  totalMessages: number;
  uniqueChatters: number;
  totalEmotes: number;
  avgSentiment: number | null; // -1 to 1
  peakMessagesPerMinute: number;
  peakHypeScore: number | null;
  className?: string;
}

export function ChatStats({
  totalMessages,
  uniqueChatters,
  totalEmotes,
  avgSentiment,
  peakMessagesPerMinute,
  peakHypeScore,
  className,
}: ChatStatsProps) {
  const getSentimentConfig = () => {
    if (avgSentiment === null) {
      return { label: 'N/A', color: 'text-muted-foreground', icon: '-' };
    }
    if (avgSentiment >= 0.3) {
      return { label: 'Positive', color: 'text-green-500', icon: '+' };
    }
    if (avgSentiment <= -0.3) {
      return { label: 'Negative', color: 'text-red-500', icon: '-' };
    }
    return { label: 'Neutral', color: 'text-yellow-500', icon: '~' };
  };

  const sentimentConfig = getSentimentConfig();

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const stats = [
    {
      label: 'Total Messages',
      value: formatNumber(totalMessages),
      icon: '💬',
    },
    {
      label: 'Unique Chatters',
      value: formatNumber(uniqueChatters),
      icon: '👥',
    },
    {
      label: 'Total Emotes',
      value: formatNumber(totalEmotes),
      icon: '🎭',
    },
    {
      label: 'Avg Sentiment',
      value: avgSentiment !== null ? avgSentiment.toFixed(2) : 'N/A',
      icon: sentimentConfig.icon,
      color: sentimentConfig.color,
      sublabel: sentimentConfig.label,
    },
    {
      label: 'Peak Activity',
      value: `${peakMessagesPerMinute}/min`,
      icon: '📈',
    },
    {
      label: 'Peak Hype',
      value: peakHypeScore !== null ? `${Math.round(peakHypeScore * 100)}%` : 'N/A',
      icon: '🔥',
    },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Chat Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="p-3 rounded-lg bg-muted/50 text-center"
            >
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className={`text-xl font-bold ${stat.color || ''}`}>
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
              {stat.sublabel && (
                <div className={`text-xs ${stat.color}`}>{stat.sublabel}</div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
