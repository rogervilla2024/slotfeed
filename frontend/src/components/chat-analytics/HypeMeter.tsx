'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface HypeMeterProps {
  hypeScore: number; // 0 to 1
  messagesPerMinute: number;
  uniqueChatters: number;
  isLive: boolean;
  className?: string;
}

export function HypeMeter({
  hypeScore,
  messagesPerMinute,
  uniqueChatters,
  isLive,
  className,
}: HypeMeterProps) {
  const getHypeConfig = () => {
    if (hypeScore >= 0.8) {
      return {
        label: 'INSANE',
        color: 'from-purple-500 to-pink-500',
        textColor: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/50',
        pulseColor: 'bg-purple-500',
      };
    }
    if (hypeScore >= 0.6) {
      return {
        label: 'HIGH',
        color: 'from-orange-500 to-red-500',
        textColor: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/50',
        pulseColor: 'bg-orange-500',
      };
    }
    if (hypeScore >= 0.4) {
      return {
        label: 'MEDIUM',
        color: 'from-yellow-500 to-orange-500',
        textColor: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/50',
        pulseColor: 'bg-yellow-500',
      };
    }
    if (hypeScore >= 0.2) {
      return {
        label: 'LOW',
        color: 'from-green-500 to-yellow-500',
        textColor: 'text-green-500',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/50',
        pulseColor: 'bg-green-500',
      };
    }
    return {
      label: 'CHILL',
      color: 'from-blue-500 to-green-500',
      textColor: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/50',
      pulseColor: 'bg-blue-500',
    };
  };

  const config = getHypeConfig();
  const percentage = Math.round(hypeScore * 100);

  return (
    <Card className={`${className} ${config.bgColor} ${config.borderColor} border`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Hype Meter</CardTitle>
          <div className="flex items-center gap-2">
            {isLive && (
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${config.pulseColor} animate-pulse`} />
                <span className="text-xs text-muted-foreground">LIVE</span>
              </div>
            )}
            <Badge className={`bg-gradient-to-r ${config.color} text-white border-0`}>
              {config.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main meter */}
        <div className="relative pt-4">
          {/* Meter background */}
          <div className="h-8 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${config.color} transition-all duration-500 rounded-full`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Percentage label */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-white drop-shadow-lg">
              {percentage}%
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="text-center">
            <div className={`text-2xl font-bold ${config.textColor}`}>
              {messagesPerMinute}
            </div>
            <div className="text-xs text-muted-foreground">msgs/min</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${config.textColor}`}>
              {uniqueChatters}
            </div>
            <div className="text-xs text-muted-foreground">chatters</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
