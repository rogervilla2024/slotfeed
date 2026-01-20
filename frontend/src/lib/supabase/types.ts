export type SubscriptionTier = 'free' | 'pro' | 'premium';

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  subscriptionTier: SubscriptionTier;
  subscriptionExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  preferences: UserPreferences;
}

export interface UserPreferences {
  favoriteStreamers: string[];
  favoriteGames: string[];
  notifications: NotificationSettings;
  theme: 'light' | 'dark' | 'system';
}

export interface NotificationSettings {
  bigWins: boolean;
  streamerLive: boolean;
  hotSlots: boolean;
  emailDigest: 'daily' | 'weekly' | 'never';
}

// Subscription tier features
export const SUBSCRIPTION_FEATURES: Record<SubscriptionTier, SubscriptionFeatures> = {
  free: {
    leaderboardPeriod: ['daily'],
    alertRules: 2,
    hotColdIndicator: false,
    bonusHuntTracker: false,
    apiAccess: false,
    dataExport: false,
  },
  pro: {
    leaderboardPeriod: ['daily', 'weekly', 'monthly'],
    alertRules: 10,
    hotColdIndicator: true,
    bonusHuntTracker: true,
    apiAccess: 'basic',
    dataExport: 'csv',
  },
  premium: {
    leaderboardPeriod: ['daily', 'weekly', 'monthly', 'all_time'],
    alertRules: Infinity,
    hotColdIndicator: true,
    bonusHuntTracker: true,
    apiAccess: 'full',
    dataExport: 'csv_json',
  },
};

export interface SubscriptionFeatures {
  leaderboardPeriod: ('daily' | 'weekly' | 'monthly' | 'all_time')[];
  alertRules: number;
  hotColdIndicator: boolean;
  bonusHuntTracker: boolean;
  apiAccess: false | 'basic' | 'full';
  dataExport: false | 'csv' | 'csv_json';
}

// Supabase database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          subscription_tier: SubscriptionTier;
          subscription_expires_at: string | null;
          preferences: UserPreferences;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: SubscriptionTier;
          subscription_expires_at?: string | null;
          preferences?: UserPreferences;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: SubscriptionTier;
          subscription_expires_at?: string | null;
          preferences?: UserPreferences;
          created_at?: string;
          updated_at?: string;
        };
      };
      alert_rules: {
        Row: {
          id: string;
          user_id: string;
          type: 'big_win' | 'streamer_live' | 'hot_slot';
          conditions: Record<string, unknown>;
          channels: string[];
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'big_win' | 'streamer_live' | 'hot_slot';
          conditions: Record<string, unknown>;
          channels: string[];
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'big_win' | 'streamer_live' | 'hot_slot';
          conditions?: Record<string, unknown>;
          channels?: string[];
          is_active?: boolean;
          created_at?: string;
        };
      };
    };
  };
}
