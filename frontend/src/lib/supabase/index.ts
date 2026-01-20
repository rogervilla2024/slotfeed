// Client-side only exports (safe to import in 'use client' components)
export { createClient, getSupabaseClient, isSupabaseConfigured } from './client';
export type {
  UserProfile,
  UserPreferences,
  NotificationSettings,
  SubscriptionTier,
  SubscriptionFeatures,
} from './types';
export { SUBSCRIPTION_FEATURES } from './types';

// Note: Server-side exports (createServerSupabaseClient, updateSession) should be
// imported directly from their respective files to avoid client/server code mixing:
// import { createServerSupabaseClient } from '@/lib/supabase/server';
// import { updateSession } from '@/lib/supabase/middleware';
