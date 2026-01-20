'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
import type { UserProfile, SubscriptionTier, UserPreferences } from '@/lib/supabase/types';

// Database row type for users table
interface UserRow {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  subscription_tier: string;
  subscription_expires_at: string | null;
  preferences: UserPreferences;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'discord' | 'twitch') => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_PREFERENCES: UserPreferences = {
  favoriteStreamers: [],
  favoriteGames: [],
  notifications: {
    bigWins: true,
    streamerLive: true,
    hotSlots: false,
    emailDigest: 'weekly',
  },
  theme: 'system',
};

function rowToProfile(data: UserRow): UserProfile {
  return {
    id: data.id,
    email: data.email,
    displayName: data.display_name ?? undefined,
    avatarUrl: data.avatar_url ?? undefined,
    subscriptionTier: data.subscription_tier as SubscriptionTier,
    subscriptionExpiresAt: data.subscription_expires_at
      ? new Date(data.subscription_expires_at)
      : undefined,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    preferences: data.preferences ?? DEFAULT_PREFERENCES,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = getSupabaseClient();
  const supabaseConfigured = isSupabaseConfigured();

  // Fetch user profile from database
  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return rowToProfile(data as UserRow);
  };

  // Create user profile in database
  const createProfile = async (authUser: User): Promise<UserProfile | null> => {
    if (!supabase) return null;

    const newProfile = {
      id: authUser.id,
      email: authUser.email!,
      display_name: authUser.user_metadata?.display_name ?? authUser.user_metadata?.full_name ?? null,
      avatar_url: authUser.user_metadata?.avatar_url ?? null,
      subscription_tier: 'free',
      preferences: DEFAULT_PREFERENCES,
    };

    const { data, error } = await supabase
      .from('users')
      .insert(newProfile)
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      return null;
    }

    return rowToProfile(data as UserRow);
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      // If Supabase is not configured, skip auth initialization
      if (!supabase || !supabaseConfigured) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          let userProfile = await fetchProfile(currentSession.user.id);
          if (!userProfile) {
            userProfile = await createProfile(currentSession.user);
          }
          setProfile(userProfile);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Skip auth state listener if Supabase is not configured
    if (!supabase || !supabaseConfigured) {
      return;
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          let userProfile = await fetchProfile(currentSession.user.id);
          if (!userProfile && event === 'SIGNED_IN') {
            userProfile = await createProfile(currentSession.user);
          }
          setProfile(userProfile);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabaseConfigured]);

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Authentication is not configured') };
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    if (!supabase) {
      return { error: new Error('Authentication is not configured') };
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const signInWithOAuth = async (provider: 'google' | 'discord' | 'twitch') => {
    if (!supabase) {
      return { error: new Error('Authentication is not configured') };
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!supabase) {
      return { error: new Error('Authentication is not configured') };
    }
    if (!user) {
      return { error: new Error('Not authenticated') };
    }

    const dbUpdates: Record<string, unknown> = {};
    if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
    if (updates.preferences !== undefined) dbUpdates.preferences = updates.preferences;
    dbUpdates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('users')
      .update(dbUpdates)
      .eq('id', user.id);

    if (!error) {
      setProfile((prev) => prev ? { ...prev, ...updates } : null);
    }

    return { error };
  };

  const updatePreferences = async (preferences: Partial<UserPreferences>) => {
    if (!profile) {
      return { error: new Error('No profile found') };
    }

    const newPreferences = { ...profile.preferences, ...preferences };
    return updateProfile({ preferences: newPreferences });
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    signInWithOAuth,
    updateProfile,
    updatePreferences,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for checking subscription features
export function useSubscription() {
  const { profile } = useAuth();
  const tier = profile?.subscriptionTier ?? 'free';

  return {
    tier,
    isPro: tier === 'pro' || tier === 'premium',
    isPremium: tier === 'premium',
    isExpired: profile?.subscriptionExpiresAt
      ? new Date(profile.subscriptionExpiresAt) < new Date()
      : false,
  };
}
