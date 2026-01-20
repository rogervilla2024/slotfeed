/**
 * Tier 1 Streamers - Priority list from CLAUDE.md
 *
 * This module contains the initial data for the top 15 slot streamers
 * that SLOTFEED will track.
 */

import type { Streamer } from '@/types';

export interface StreamerSeedData extends Omit<Streamer, 'createdAt' | 'updatedAt'> {
  streamSchedule?: {
    timezone: string;
    days: string[];
    startTime: string;
    durationHours: number;
  };
  socialLinks?: Record<string, string>;
  notes?: string;
}

export const TIER1_STREAMERS: StreamerSeedData[] = [
  {
    id: 'roshtein',
    username: 'roshtein',
    displayName: 'Roshtein',
    platform: 'kick',
    platformId: '1047',
    avatarUrl: 'https://files.kick.com/images/user/1047/profile_image/conversion/roshtein-fullsize.webp',
    bio: 'King of slot streaming. Known for massive bets and legendary wins.',
    followerCount: 362000,
    isLive: false,
    lifetimeStats: {
      totalSessions: 1250,
      totalHoursStreamed: 8500,
      totalWagered: 150000000,
      totalWon: 145000000,
      biggestWin: 2500000,
      biggestMultiplier: 25000,
      averageRtp: 96.67,
    },
    streamSchedule: {
      timezone: 'CET',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      startTime: '18:00',
      durationHours: 8,
    },
    socialLinks: {
      twitter: 'https://twitter.com/roloshtein',
      instagram: 'https://instagram.com/roshtein',
      kick: 'https://kick.com/roshtein',
    },
    notes: 'Tier 1 priority - highest engagement',
  },
  {
    id: 'trainwreckstv',
    username: 'trainwreckstv',
    displayName: 'Trainwreckstv',
    platform: 'kick',
    platformId: '4',
    avatarUrl: 'https://files.kick.com/images/user/4/profile_image/conversion/trainwrecks.webp',
    bio: 'Kick co-founder. Known for marathon gambling sessions and high-stakes slots.',
    followerCount: 494000,
    isLive: false,
    lifetimeStats: {
      totalSessions: 890,
      totalHoursStreamed: 6200,
      totalWagered: 500000000,
      totalWon: 485000000,
      biggestWin: 15000000,
      biggestMultiplier: 50000,
      averageRtp: 97.0,
    },
    streamSchedule: {
      timezone: 'PST',
      days: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      startTime: '22:00',
      durationHours: 12,
    },
    socialLinks: {
      twitter: 'https://twitter.com/trainwreckstv',
      kick: 'https://kick.com/trainwreckstv',
    },
    notes: 'Kick co-founder, massive audience',
  },
  {
    id: 'classybeef',
    username: 'classybeef',
    displayName: 'ClassyBeef',
    platform: 'kick',
    platformId: '2156',
    avatarUrl: 'https://files.kick.com/images/user/2156/profile_image/conversion/classybeef.webp',
    bio: '6-person streaming team. 24/7 slot content with rotating hosts.',
    followerCount: 194000,
    isLive: false,
    lifetimeStats: {
      totalSessions: 2100,
      totalHoursStreamed: 15000,
      totalWagered: 300000000,
      totalWon: 290000000,
      biggestWin: 5000000,
      biggestMultiplier: 35000,
      averageRtp: 96.67,
    },
    streamSchedule: {
      timezone: 'CET',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      startTime: '00:00',
      durationHours: 24,
    },
    socialLinks: {
      twitter: 'https://twitter.com/classybeef',
      kick: 'https://kick.com/classybeef',
    },
    notes: '24/7 streaming operation, team-based',
  },
  {
    id: 'xposed',
    username: 'xposed',
    displayName: 'Xposed',
    platform: 'kick',
    platformId: '1823',
    avatarUrl: 'https://files.kick.com/images/user/1823/profile_image/conversion/xposed.webp',
    bio: 'High RTP focus streamer. Known for strategic slot play.',
    followerCount: 300000,
    isLive: false,
    lifetimeStats: {
      totalSessions: 650,
      totalHoursStreamed: 3200,
      totalWagered: 80000000,
      totalWon: 79200000,
      biggestWin: 850000,
      biggestMultiplier: 8500,
      averageRtp: 99.0,
    },
    streamSchedule: {
      timezone: 'EST',
      days: ['Monday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      startTime: '20:00',
      durationHours: 6,
    },
    socialLinks: {
      twitter: 'https://twitter.com/xposedyt',
      kick: 'https://kick.com/xposed',
    },
    notes: 'RTP-focused content',
  },
  {
    id: 'deuceace',
    username: 'deuceace',
    displayName: 'DeuceAce',
    platform: 'kick',
    platformId: '3421',
    avatarUrl: 'https://files.kick.com/images/user/3421/profile_image/conversion/deuceace.webp',
    bio: 'Strategic slot analysis and bonus hunting expert.',
    followerCount: 177000,
    isLive: false,
    lifetimeStats: {
      totalSessions: 420,
      totalHoursStreamed: 2100,
      totalWagered: 45000000,
      totalWon: 43650000,
      biggestWin: 620000,
      biggestMultiplier: 6200,
      averageRtp: 97.0,
    },
    streamSchedule: {
      timezone: 'CET',
      days: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      startTime: '19:00',
      durationHours: 7,
    },
    socialLinks: {
      twitter: 'https://twitter.com/deuceace',
      kick: 'https://kick.com/deuceace',
    },
    notes: 'Strategic analysis focus',
  },
  {
    id: 'casinodaddy',
    username: 'casinodaddy',
    displayName: 'CasinoDaddy',
    platform: 'kick',
    platformId: '2897',
    avatarUrl: 'https://files.kick.com/images/user/2897/profile_image/conversion/casinodaddy.webp',
    bio: 'Swedish brothers team. Energetic slot entertainment.',
    followerCount: 220000,
    isLive: false,
    lifetimeStats: {
      totalSessions: 1800,
      totalHoursStreamed: 12000,
      totalWagered: 200000000,
      totalWon: 194000000,
      biggestWin: 3200000,
      biggestMultiplier: 22000,
      averageRtp: 97.0,
    },
    streamSchedule: {
      timezone: 'CET',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      startTime: '17:00',
      durationHours: 10,
    },
    socialLinks: {
      twitter: 'https://twitter.com/casinodaddy',
      kick: 'https://kick.com/casinodaddy',
    },
    notes: 'Swedish brothers, team content',
  },
  {
    id: 'mellstroy',
    username: 'mellstroy',
    displayName: 'Mellstroy',
    platform: 'kick',
    platformId: '987',
    avatarUrl: 'https://files.kick.com/images/user/987/profile_image/conversion/mellstroy.webp',
    bio: 'Russian streamer. Very active with high engagement.',
    followerCount: 452000,
    isLive: false,
    lifetimeStats: {
      totalSessions: 950,
      totalHoursStreamed: 5800,
      totalWagered: 350000000,
      totalWon: 336000000,
      biggestWin: 8500000,
      biggestMultiplier: 42000,
      averageRtp: 96.0,
    },
    streamSchedule: {
      timezone: 'MSK',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      startTime: '16:00',
      durationHours: 10,
    },
    socialLinks: {
      kick: 'https://kick.com/mellstroy',
    },
    notes: 'Russian market, very active',
  },
  {
    id: 'maherco',
    username: 'maherco',
    displayName: 'Maherco',
    platform: 'kick',
    platformId: '4521',
    avatarUrl: 'https://files.kick.com/images/user/4521/profile_image/conversion/maherco.webp',
    bio: 'High viewer engagement. Consistent streaming schedule.',
    followerCount: 100000,
    isLive: false,
    lifetimeStats: {
      totalSessions: 380,
      totalHoursStreamed: 2400,
      totalWagered: 25000000,
      totalWon: 24250000,
      biggestWin: 420000,
      biggestMultiplier: 4200,
      averageRtp: 97.0,
    },
    streamSchedule: {
      timezone: 'CET',
      days: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      startTime: '18:00',
      durationHours: 8,
    },
    socialLinks: {
      kick: 'https://kick.com/maherco',
    },
    notes: '35K avg viewers - high engagement',
  },
  {
    id: 'bidule',
    username: 'bidule',
    displayName: 'Bidule',
    platform: 'kick',
    platformId: '3654',
    avatarUrl: 'https://files.kick.com/images/user/3654/profile_image/conversion/bidule.webp',
    bio: 'French streamer. Popular in European market.',
    followerCount: 150000,
    isLive: false,
    lifetimeStats: {
      totalSessions: 520,
      totalHoursStreamed: 2600,
      totalWagered: 55000000,
      totalWon: 53350000,
      biggestWin: 750000,
      biggestMultiplier: 7500,
      averageRtp: 97.0,
    },
    streamSchedule: {
      timezone: 'CET',
      days: ['Monday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      startTime: '20:00',
      durationHours: 6,
    },
    socialLinks: {
      twitter: 'https://twitter.com/bidulecasino',
      kick: 'https://kick.com/bidule',
    },
    notes: 'French streamer, EU market',
  },
  {
    id: 'fruityslots',
    username: 'fruityslots',
    displayName: 'FruitySlots',
    platform: 'kick',
    platformId: '2987',
    avatarUrl: 'https://files.kick.com/images/user/2987/profile_image/conversion/fruityslots.webp',
    bio: 'UK-based team. Known for slot reviews and bonus hunting.',
    followerCount: 180000,
    isLive: false,
    lifetimeStats: {
      totalSessions: 1200,
      totalHoursStreamed: 8000,
      totalWagered: 120000000,
      totalWon: 116400000,
      biggestWin: 1800000,
      biggestMultiplier: 18000,
      averageRtp: 97.0,
    },
    streamSchedule: {
      timezone: 'GMT',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime: '16:00',
      durationHours: 8,
    },
    socialLinks: {
      twitter: 'https://twitter.com/fruityslots',
      kick: 'https://kick.com/fruityslots',
    },
    notes: 'UK team, slot reviews focus',
  },
  {
    id: 'nickslots',
    username: 'nickslots',
    displayName: 'NickSlots',
    platform: 'youtube',
    platformId: 'UCnickslots',
    avatarUrl: 'https://yt3.googleusercontent.com/nickslots.jpg',
    bio: 'OG slot streamer. Known for charity work and professional content.',
    followerCount: 450000,
    isLive: false,
    lifetimeStats: {
      totalSessions: 680,
      totalHoursStreamed: 2700,
      totalWagered: 35000000,
      totalWon: 34300000,
      biggestWin: 520000,
      biggestMultiplier: 5200,
      averageRtp: 98.0,
    },
    streamSchedule: {
      timezone: 'GMT',
      days: ['Tuesday', 'Thursday', 'Saturday'],
      startTime: '19:00',
      durationHours: 4,
    },
    socialLinks: {
      twitter: 'https://twitter.com/nickslots',
      youtube: 'https://youtube.com/nickslots',
    },
    notes: 'YouTube primary, charity focus',
  },
  {
    id: 'letsgiveitaspin',
    username: 'letsgiveitaspin',
    displayName: 'LetsGiveItASpin',
    platform: 'kick',
    platformId: '4123',
    avatarUrl: 'https://files.kick.com/images/user/4123/profile_image/conversion/letsgiveitaspin.webp',
    bio: 'Professional casino streamer. High production quality.',
    followerCount: 200000,
    isLive: false,
    lifetimeStats: {
      totalSessions: 580,
      totalHoursStreamed: 2900,
      totalWagered: 65000000,
      totalWon: 63050000,
      biggestWin: 980000,
      biggestMultiplier: 9800,
      averageRtp: 97.0,
    },
    streamSchedule: {
      timezone: 'CET',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime: '18:00',
      durationHours: 6,
    },
    socialLinks: {
      twitter: 'https://twitter.com/likimax',
      kick: 'https://kick.com/letsgiveitaspin',
      youtube: 'https://youtube.com/letsgiveitaspin',
    },
    notes: 'Professional quality content',
  },
  {
    id: 'jarttu84',
    username: 'jarttu84',
    displayName: 'Jarttu84',
    platform: 'kick',
    platformId: '3890',
    avatarUrl: 'https://files.kick.com/images/user/3890/profile_image/conversion/jarttu84.webp',
    bio: 'Finnish streamer. Known for emotional and entertaining reactions.',
    followerCount: 120000,
    isLive: false,
    lifetimeStats: {
      totalSessions: 450,
      totalHoursStreamed: 2250,
      totalWagered: 28000000,
      totalWon: 27160000,
      biggestWin: 380000,
      biggestMultiplier: 3800,
      averageRtp: 97.0,
    },
    streamSchedule: {
      timezone: 'EET',
      days: ['Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      startTime: '19:00',
      durationHours: 6,
    },
    socialLinks: {
      twitter: 'https://twitter.com/jarttu84',
      kick: 'https://kick.com/jarttu84',
    },
    notes: 'Finnish, emotional content',
  },
  {
    id: 'vondice',
    username: 'vondice',
    displayName: 'VonDice',
    platform: 'kick',
    platformId: '5123',
    avatarUrl: 'https://files.kick.com/images/user/5123/profile_image/conversion/vondice.webp',
    bio: 'Collaborates with Roshtein. High-stakes slot player.',
    followerCount: 90000,
    isLive: false,
    lifetimeStats: {
      totalSessions: 320,
      totalHoursStreamed: 1600,
      totalWagered: 18000000,
      totalWon: 17460000,
      biggestWin: 290000,
      biggestMultiplier: 2900,
      averageRtp: 97.0,
    },
    streamSchedule: {
      timezone: 'CET',
      days: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      startTime: '20:00',
      durationHours: 5,
    },
    socialLinks: {
      kick: 'https://kick.com/vondice',
    },
    notes: 'Roshtein collaborator',
  },
  {
    id: 'westcol',
    username: 'westcol',
    displayName: 'Westcol',
    platform: 'kick',
    platformId: '876',
    avatarUrl: 'https://files.kick.com/images/user/876/profile_image/conversion/westcol.webp',
    bio: 'Latin America #1 streamer. Massive Spanish-speaking audience.',
    followerCount: 1700000,
    isLive: false,
    lifetimeStats: {
      totalSessions: 780,
      totalHoursStreamed: 4680,
      totalWagered: 180000000,
      totalWon: 172800000,
      biggestWin: 4200000,
      biggestMultiplier: 28000,
      averageRtp: 96.0,
    },
    streamSchedule: {
      timezone: 'COT',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      startTime: '19:00',
      durationHours: 8,
    },
    socialLinks: {
      twitter: 'https://twitter.com/westcol',
      instagram: 'https://instagram.com/westcol',
      kick: 'https://kick.com/westcol',
    },
    notes: 'LATAM #1, massive audience',
  },
];

/**
 * Get all Tier 1 streamers
 */
export function getTier1Streamers(): StreamerSeedData[] {
  return TIER1_STREAMERS;
}

/**
 * Find a streamer by username
 */
export function getStreamerByUsername(username: string): StreamerSeedData | undefined {
  return TIER1_STREAMERS.find(
    (s) => s.username.toLowerCase() === username.toLowerCase()
  );
}

/**
 * Get streamer by ID
 */
export function getStreamerById(id: string): StreamerSeedData | undefined {
  return TIER1_STREAMERS.find((s) => s.id === id);
}

/**
 * Get total follower count across all Tier 1 streamers
 */
export function getTotalFollowers(): number {
  return TIER1_STREAMERS.reduce((sum, s) => sum + s.followerCount, 0);
}

/**
 * Get streamers by platform
 */
export function getStreamersByPlatform(
  platform: 'kick' | 'twitch' | 'youtube'
): StreamerSeedData[] {
  return TIER1_STREAMERS.filter((s) => s.platform === platform);
}
