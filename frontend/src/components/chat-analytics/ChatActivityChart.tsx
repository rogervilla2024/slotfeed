'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DataPoint {
  time: Date;
  messages: number;
  hypeScore: number;
}

interface ChatActivityChartProps {
  data: DataPoint[];
  showHype?: boolean;
  className?: string;
}

export function ChatActivityChart({
  data,
  showHype = true,
  className,
}: ChatActivityChartProps) {
  if (data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Chat Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxMessages = Math.max(...data.map(d => d.messages), 1);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Simple bar chart implementation
  const barWidth = 100 / data.length;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Chat Activity</CardTitle>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-primary rounded" />
              <span>Messages</span>
            </div>
            {showHype && (
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-orange-500 rounded" />
                <span>Hype</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative h-48">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-6 w-10 flex flex-col justify-between text-xs text-muted-foreground">
            <span>{maxMessages}</span>
            <span>{Math.round(maxMessages / 2)}</span>
            <span>0</span>
          </div>

          {/* Chart area */}
          <div className="ml-12 h-full flex items-end gap-0.5">
            {data.map((point, index) => {
              const messageHeight = (point.messages / maxMessages) * 100;
              const hypeHeight = point.hypeScore * 100;

              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center group relative"
                  style={{ minWidth: 0 }}
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                    <div className="bg-popover text-popover-foreground rounded-md shadow-lg p-2 text-xs whitespace-nowrap">
                      <div className="font-medium">{formatTime(point.time)}</div>
                      <div>Messages: {point.messages}</div>
                      {showHype && <div>Hype: {Math.round(point.hypeScore * 100)}%</div>}
                    </div>
                  </div>

                  {/* Bar container */}
                  <div className="w-full h-[calc(100%-24px)] relative">
                    {/* Messages bar */}
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-primary/80 rounded-t transition-all duration-200 hover:bg-primary"
                      style={{ height: `${messageHeight}%` }}
                    />

                    {/* Hype line overlay */}
                    {showHype && index > 0 && (
                      <div
                        className="absolute w-full border-t-2 border-orange-500 pointer-events-none"
                        style={{ bottom: `${hypeHeight}%` }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* X-axis labels */}
          <div className="ml-12 flex justify-between text-xs text-muted-foreground mt-1">
            {data.length > 0 && (
              <>
                <span>{formatTime(data[0].time)}</span>
                {data.length > 4 && (
                  <span>{formatTime(data[Math.floor(data.length / 2)].time)}</span>
                )}
                <span>{formatTime(data[data.length - 1].time)}</span>
              </>
            )}
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-lg font-bold">
              {data.reduce((sum, d) => sum + d.messages, 0).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Total Messages</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              {Math.round(data.reduce((sum, d) => sum + d.messages, 0) / data.length)}
            </div>
            <div className="text-xs text-muted-foreground">Avg/Bucket</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">
              {maxMessages}
            </div>
            <div className="text-xs text-muted-foreground">Peak</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
