/**
 * Chart Data Types
 * TypeScript interfaces for all chart components
 */

// ============================================================================
// Balance & Session Data
// ============================================================================

export interface BalanceDataPoint {
  timestamp: number; // Unix timestamp
  balance: number; // Current balance
  change: number; // Change from start
  changePercent: number; // Percentage change
  bet?: number; // Bet amount (if available)
  win?: number; // Win amount (if available)
  gameId?: string; // Game being played
  description?: string; // Event description
}

export interface SessionBalance {
  startBalance: number;
  currentBalance: number;
  peakBalance: number;
  lowestBalance: number;
  profitLoss: number;
  profitLossPercent: number;
  totalWagered: number;
  startTime: Date;
  endTime?: Date;
}

// ============================================================================
// RTP & Statistics Data
// ============================================================================

export interface RTPDataPoint {
  date: string; // ISO date string
  timestamp: number; // Unix timestamp
  observedRtp: number; // Observed RTP percentage (0-100)
  theoreticalRtp: number; // Theoretical RTP (usually constant)
  sampleSize: number; // Number of spins in sample
  confidence: number; // Confidence interval (0-100)
  variance: number; // Standard deviation
}

export interface RTPTrendData {
  gameId: string;
  gameName: string;
  theoreticalRtp: number;
  dataPoints: RTPDataPoint[];
  minObservedRtp: number;
  maxObservedRtp: number;
  averageObservedRtp: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

// ============================================================================
// Bonus & Win Data
// ============================================================================

export interface BonusFrequencyBucket {
  timeRange: string; // e.g., "0:00-1:00" or "Mon" or "Day 1"
  timestamp: number; // Unix timestamp for start of bucket
  bonusCount: number; // Number of bonuses in this time period
  avgMultiplier: number; // Average bonus multiplier
  totalPayout: number; // Total payout from bonuses
  expectedCount?: number; // Expected count based on frequency
}

export interface BonusFrequencyData {
  gameId: string;
  gameName: string;
  period: '24h' | '7d' | '30d'; // Time period
  buckets: BonusFrequencyBucket[];
  totalBonuses: number;
  averageFrequency: number; // Spins per bonus
  frequencyTrend: 'increasing' | 'decreasing' | 'stable';
  lastUpdated: Date;
}

export interface WinDistributionBin {
  range: string; // e.g., "0-10x", "10-50x"
  minMultiplier: number;
  maxMultiplier: number;
  count: number; // Number of wins in this bin
  percentage: number; // Percentage of total wins
  totalValue: number; // Total payout for wins in bin
  expectedCount?: number; // Expected count from normal distribution
}

export interface WinDistributionData {
  gameId: string;
  gameName: string;
  bins: WinDistributionBin[];
  totalWins: number;
  avgMultiplier: number;
  medianMultiplier: number;
  stdDeviation: number;
  skewness: number; // -1 to 1, shows if skewed left/right
  kurtosis: number; // Shows if heavy-tailed
}

// ============================================================================
// Bonus Hunt Data
// ============================================================================

export interface BonusHuntEntryData {
  id: string;
  position: number; // 1-indexed
  cost: number; // Cost to play this entry
  payout: number; // Payout from this entry
  profit: number; // payout - cost
  multiplier: number; // Payout multiplier
  status: 'unopened' | 'opened' | 'pending';
  timestamp?: Date; // When opened
}

export interface BonusHuntProgressData {
  bonusHuntId: string;
  streamerName: string;
  gameName: string;
  totalEntries: number;
  entries: BonusHuntEntryData[];
  totalCost: number;
  totalPayout: number;
  totalProfit: number;
  roi: number; // Profit / Cost * 100
  roiPercent: number; // ROI as percentage
  status: 'collecting' | 'opening' | 'completed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  breakEvenPoint?: number; // Entry number at break-even
}

export interface BonusHuntChartPoint {
  entryNumber: number;
  cumulativeCost: number;
  cumulativePayout: number;
  cumulativeProfit: number;
  roi: number; // Current ROI at this point
  status: 'unopened' | 'opened';
}

// ============================================================================
// Streamer Performance Data
// ============================================================================

export interface StreamerGamePerformance {
  streamerId: string;
  streamerName: string;
  avatar?: string;
  platform: 'kick' | 'twitch' | 'youtube';
  sessionsPlayed: number;
  totalWagered: number;
  totalWon: number;
  rtp: number; // Observed RTP
  consistency: number; // 0-100: how consistent (low variance = high consistency)
  bonusHitRate: number; // Bonuses per spin
  bigWinRate: number; // Number of 100x+ wins
  avgWinMultiplier: number;
  biggestWin: number;
  timeLastPlayed: Date;
}

export interface StreamerRadarDimension {
  metric: 'rtp' | 'consistency' | 'bonusHitRate' | 'bigWinRate' | 'experience';
  value: number; // 0-100 normalized
  label: string;
  unit?: string;
}

// ============================================================================
// Hot/Cold Data
// ============================================================================

export interface HotColdGameData {
  gameId: string;
  gameName: string;
  status: 'hot' | 'cold' | 'neutral';
  score: number; // -100 to +100
  scorePercent: number; // 0-100 for visualization
  observedRtp: number; // Current observed RTP
  theoreticalRtp: number; // Expected RTP
  recentBigWins: number; // Count in last period
  avgBigWins: number; // Historical average
  trend: 'heating' | 'cooling' | 'stable';
  lastUpdated: Date;
  sampleSize: number; // Spins in sample
}

export interface HotColdTimeSeriesPoint {
  date: string; // ISO date
  timestamp: number;
  status: 'hot' | 'cold' | 'neutral';
  score: number;
  observedRtp: number;
}

// ============================================================================
// Generic Chart Props Types
// ============================================================================

export interface ChartCommonProps {
  height?: number; // Chart height in pixels
  width?: string | number; // Chart width
  responsive?: boolean; // Use ResponsiveContainer
  loading?: boolean; // Show loading state
  error?: string | null; // Error message
  isEmpty?: boolean; // Show empty state
}

export interface ChartPeriodSelectorProps {
  periods: Array<{ value: string; label: string }>;
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
}

// ============================================================================
// Chart Legend & Tooltip Data
// ============================================================================

export interface ChartLegendPayload {
  id: string;
  type?: string;
  name: string;
  color: string;
  value?: number | string;
}

export interface ChartTooltipPayload {
  dataKey: string;
  name: string;
  value: number | string;
  color: string;
  unit?: string;
}

// ============================================================================
// Aggregated Stats Data
// ============================================================================

export interface GameStatsAggregate {
  gameId: string;
  gameName: string;
  provider: string;
  rtp: number; // Theoretical RTP
  observedRtp: number; // Observed across all streamers
  totalSpins: number;
  totalWagered: number;
  totalWon: number;
  bonusFrequency: number; // Bonuses per spin
  avgBonusPayout: number;
  biggestWin: number;
  biggestMultiplier: number;
  winDistribution: WinDistributionData;
  hotColdStatus: HotColdGameData;
  streamerStats: StreamerGamePerformance[];
  lastUpdated: Date;
}

// ============================================================================
// Chart State Management
// ============================================================================

export interface ChartDataState {
  data: any[];
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  lastUpdated: Date | null;
}

export interface ChartInteractionState {
  hoveredIndex: number | null;
  selectedIndex: number | null;
  selectedRange: [number, number] | null;
}
