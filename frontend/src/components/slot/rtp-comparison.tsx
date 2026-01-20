'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RTPComparisonProps {
  theoreticalRtp: number;
  observedRtp: number;
  sampleSize: number;
  className?: string;
}

export function RTPComparison({
  theoreticalRtp,
  observedRtp,
  sampleSize,
  className,
}: RTPComparisonProps) {
  const difference = observedRtp - theoreticalRtp;
  const percentageDiff = ((difference / theoreticalRtp) * 100).toFixed(2);

  const getStatusColor = () => {
    if (difference >= 2) return 'text-win';
    if (difference <= -2) return 'text-loss';
    return 'text-muted-foreground';
  };

  const getStatusBadge = () => {
    if (difference >= 2) return { text: 'Above Expected', variant: 'win' as const };
    if (difference <= -2) return { text: 'Below Expected', variant: 'loss' as const };
    return { text: 'As Expected', variant: 'secondary' as const };
  };

  const status = getStatusBadge();

  // Calculate bar widths for visual comparison
  const maxRtp = Math.max(theoreticalRtp, observedRtp, 100);
  const theoreticalWidth = (theoreticalRtp / maxRtp) * 100;
  const observedWidth = (observedRtp / maxRtp) * 100;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>RTP Analysis</CardTitle>
          <Badge variant={status.variant}>{status.text}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main comparison */}
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">Theoretical RTP</div>
            <div className="text-3xl font-bold">{theoreticalRtp.toFixed(2)}%</div>
            <div className="text-xs text-muted-foreground">Provider stated</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-1">Observed RTP</div>
            <div className={`text-3xl font-bold ${getStatusColor()}`}>
              {observedRtp.toFixed(2)}%
            </div>
            <div className="text-xs text-muted-foreground">From {sampleSize.toLocaleString()} spins</div>
          </div>
        </div>

        {/* Visual bar comparison */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Theoretical</span>
              <span>{theoreticalRtp.toFixed(2)}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary/50 rounded-full"
                style={{ width: `${theoreticalWidth}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Observed</span>
              <span className={getStatusColor()}>{observedRtp.toFixed(2)}%</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  difference >= 0 ? 'bg-win' : 'bg-loss'
                }`}
                style={{ width: `${observedWidth}%` }}
              />
            </div>
          </div>
        </div>

        {/* Difference */}
        <div className="pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Difference</span>
            <div className={`text-lg font-semibold ${getStatusColor()}`}>
              {difference >= 0 ? '+' : ''}{difference.toFixed(2)}%
              <span className="text-sm ml-1">({percentageDiff}% variance)</span>
            </div>
          </div>
        </div>

        {/* Confidence note */}
        <div className="text-xs text-muted-foreground text-center">
          {sampleSize < 1000
            ? 'Low sample size - results may not be statistically significant'
            : sampleSize < 10000
            ? 'Moderate sample size - results are reasonably reliable'
            : 'High sample size - results are statistically significant'}
        </div>
      </CardContent>
    </Card>
  );
}
