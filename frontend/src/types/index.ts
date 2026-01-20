export type Platform = 'kick' | 'twitch' | 'youtube';

export interface StreamerSocialLinks {
  kick?: string;
  twitch?: string;
  youtube?: string;
  twitter?: string;
  discord?: string;
}

export interface Streamer {
  id: string;
  username: string;
  displayName: string;
  platform: Platform;
  platformId: string;
  avatarUrl?: string;
  bio?: string;
  followerCount: number;
  isLive: boolean;
  lifetimeStats: StreamerLifetimeStats;
  socialLinks?: StreamerSocialLinks;
  createdAt: Date;
  updatedAt: Date;
}

export interface StreamerLifetimeStats {
  totalSessions: number;
  totalHoursStreamed: number;
  totalWagered: number;
  totalWon: number;
  biggestWin: number;
  biggestMultiplier: number;
  averageRtp: number;
}

export interface Session {
  id: string;
  streamerId: string;
  streamer?: Streamer;
  startTime: Date;
  endTime?: Date;
  startBalance: number;
  currentBalance: number;
  peakBalance: number;
  lowestBalance: number;
  totalWagered: number;
  status: 'live' | 'ended';
  streamUrl?: string;
  thumbnailUrl?: string;
}

export interface GameSession {
  id: string;
  sessionId: string;
  gameId: string;
  game?: Game;
  startTime: Date;
  endTime?: Date;
  startBalance: number;
  endBalance: number;
  totalBets: number;
  totalWins: number;
  bonusCount: number;
  bigWinCount: number;
}

export interface Game {
  id: string;
  name: string;
  slug: string;
  providerId: string;
  provider?: Provider;
  rtp: number;
  volatility: 'low' | 'medium' | 'high' | 'very_high';
  maxMultiplier: number;
  thumbnailUrl?: string;
  ocrTemplateId?: string;
  isActive: boolean;
}

export interface Provider {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  gameCount: number;
}

export interface BalanceEvent {
  id: string;
  sessionId: string;
  gameSessionId?: string;
  timestamp: Date;
  balance: number;
  bet?: number;
  win?: number;
  multiplier?: number;
  confidence: number;
}

export interface BigWin {
  id: string;
  sessionId: string;
  gameId: string;
  streamerId: string;
  streamer?: Streamer;
  game?: Game;
  betAmount: number;
  winAmount: number;
  multiplier: number;
  screenshotUrl?: string;
  timestamp: Date;
  isVerified: boolean;
}

export interface LiveStreamData {
  session: Session;
  streamer: Streamer;
  currentGame?: Game;
  recentWins: BigWin[];
  viewerCount: number;
  sessionProfitLoss: {
    amount: number;
    percentage: number;
    isProfit: boolean;
  };
}

export interface LeaderboardEntry {
  rank: number;
  streamerId: string;
  streamer: Streamer;
  value: number;
  category: 'biggest_win' | 'best_rtp' | 'most_wagered' | 'most_active';
  period: 'daily' | 'weekly' | 'monthly' | 'all_time';
}

export interface AlertRule {
  id: string;
  userId: string;
  type: 'big_win' | 'streamer_live' | 'hot_slot';
  conditions: Record<string, unknown>;
  channels: ('telegram' | 'discord' | 'email')[];
  isActive: boolean;
}

export interface HotColdIndicator {
  gameId: string;
  game: Game;
  status: 'hot' | 'neutral' | 'cold';
  score: number;
  recentRtp: number;
  sampleSize: number;
  lastUpdated: Date;
}
