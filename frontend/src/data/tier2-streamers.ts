/**
 * Tier 2 Streamers Seed Data (35 Additional Streamers)
 *
 * Regional expansion covering European, Asian, Latin American,
 * and North American markets to bring total coverage to 50 streamers.
 */

import type { Platform } from '@/types';

export type Region = 'EU' | 'NA' | 'LATAM' | 'APAC' | 'CIS';

export interface StreamSchedule {
  timezone: string;
  days: string[];
  startTime: string;
  durationHours: number;
}

export interface SocialLinks {
  twitter?: string;
  instagram?: string;
  kick?: string;
  youtube?: string;
  twitch?: string;
}

export interface Tier2Streamer {
  id: string;
  username: string;
  displayName: string;
  platform: Platform;
  platformId: string;
  avatarUrl?: string;
  bio: string;
  followerCount: number;
  streamSchedule: StreamSchedule;
  socialLinks: SocialLinks;
  region: Region;
  language: string;
  notes: string;
}

export const TIER2_STREAMERS: Tier2Streamer[] = [
  // === EUROPEAN STREAMERS ===
  {
    id: 'tier2-spintwix',
    username: 'spintwix',
    displayName: 'SpinTwix',
    platform: 'kick',
    platformId: '6234',
    bio: 'German slot streamer. Known for high-stakes bonus hunts.',
    followerCount: 85000,
    streamSchedule: {
      timezone: 'CET',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime: '18:00',
      durationHours: 6,
    },
    socialLinks: { kick: 'https://kick.com/spintwix' },
    region: 'EU',
    language: 'German',
    notes: 'German market',
  },
  {
    id: 'tier2-thebigpayback',
    username: 'thebigpayback',
    displayName: 'TheBigPayback',
    platform: 'kick',
    platformId: '7123',
    bio: 'UK slots veteran. Focus on classic slots and jackpots.',
    followerCount: 95000,
    streamSchedule: {
      timezone: 'GMT',
      days: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      startTime: '17:00',
      durationHours: 7,
    },
    socialLinks: { kick: 'https://kick.com/thebigpayback' },
    region: 'EU',
    language: 'English',
    notes: 'UK market, jackpot focus',
  },
  {
    id: 'tier2-chipmonkz',
    username: 'chipmonkz',
    displayName: 'Chipmonkz',
    platform: 'kick',
    platformId: '5890',
    bio: 'British streamer. Entertaining commentary and reactions.',
    followerCount: 72000,
    streamSchedule: {
      timezone: 'GMT',
      days: ['Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      startTime: '19:00',
      durationHours: 5,
    },
    socialLinks: { kick: 'https://kick.com/chipmonkz' },
    region: 'EU',
    language: 'English',
    notes: 'UK market',
  },
  {
    id: 'tier2-slotspinner',
    username: 'slotspinner',
    displayName: 'SlotSpinner',
    platform: 'kick',
    platformId: '4567',
    bio: 'European slot enthusiast. Variety of games and providers.',
    followerCount: 68000,
    streamSchedule: {
      timezone: 'CET',
      days: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
      startTime: '20:00',
      durationHours: 6,
    },
    socialLinks: { kick: 'https://kick.com/slotspinner' },
    region: 'EU',
    language: 'English',
    notes: 'Pan-European',
  },
  {
    id: 'tier2-jamjarboy',
    username: 'jamjarboy',
    displayName: 'JamJarBoy',
    platform: 'kick',
    platformId: '6789',
    bio: 'Scottish streamer. High energy and entertaining content.',
    followerCount: 55000,
    streamSchedule: {
      timezone: 'GMT',
      days: ['Tuesday', 'Thursday', 'Friday', 'Saturday'],
      startTime: '18:00',
      durationHours: 5,
    },
    socialLinks: { kick: 'https://kick.com/jamjarboy' },
    region: 'EU',
    language: 'English',
    notes: 'Scottish, high energy',
  },
  {
    id: 'tier2-daskelelansen',
    username: 'daskelelansen',
    displayName: 'Daskelelansen',
    platform: 'kick',
    platformId: '5432',
    bio: 'Swedish slot streamer. Bonus hunt specialist.',
    followerCount: 78000,
    streamSchedule: {
      timezone: 'CET',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime: '17:00',
      durationHours: 8,
    },
    socialLinks: { kick: 'https://kick.com/daskelelansen' },
    region: 'EU',
    language: 'Swedish',
    notes: 'Swedish market',
  },
  {
    id: 'tier2-hideous',
    username: 'hideous',
    displayName: 'Hideous',
    platform: 'kick',
    platformId: '3456',
    bio: 'Nordic slot streamer. Known for big multiplier chases.',
    followerCount: 88000,
    streamSchedule: {
      timezone: 'CET',
      days: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      startTime: '19:00',
      durationHours: 7,
    },
    socialLinks: { kick: 'https://kick.com/hideous' },
    region: 'EU',
    language: 'English',
    notes: 'Nordic region',
  },
  {
    id: 'tier2-prodigy',
    username: 'prodigy',
    displayName: 'Prodigy',
    platform: 'kick',
    platformId: '7890',
    bio: 'Danish streamer. Professional slot content creator.',
    followerCount: 62000,
    streamSchedule: {
      timezone: 'CET',
      days: ['Monday', 'Wednesday', 'Friday', 'Saturday', 'Sunday'],
      startTime: '18:00',
      durationHours: 6,
    },
    socialLinks: { kick: 'https://kick.com/prodigy' },
    region: 'EU',
    language: 'Danish',
    notes: 'Danish market',
  },
  {
    id: 'tier2-slotplayer',
    username: 'slotplayer',
    displayName: 'SlotPlayer',
    platform: 'kick',
    platformId: '4321',
    bio: 'Dutch streamer. Pragmatic Play specialist.',
    followerCount: 45000,
    streamSchedule: {
      timezone: 'CET',
      days: ['Tuesday', 'Thursday', 'Saturday', 'Sunday'],
      startTime: '20:00',
      durationHours: 5,
    },
    socialLinks: { kick: 'https://kick.com/slotplayer' },
    region: 'EU',
    language: 'Dutch',
    notes: 'Dutch market',
  },
  {
    id: 'tier2-casinokalle',
    username: 'casinokalle',
    displayName: 'CasinoKalle',
    platform: 'kick',
    platformId: '8765',
    bio: 'Norwegian slot enthusiast. Regular bonus hunts.',
    followerCount: 52000,
    streamSchedule: {
      timezone: 'CET',
      days: ['Wednesday', 'Thursday', 'Friday', 'Saturday'],
      startTime: '19:00',
      durationHours: 6,
    },
    socialLinks: { kick: 'https://kick.com/casinokalle' },
    region: 'EU',
    language: 'Norwegian',
    notes: 'Norwegian market',
  },

  // === RUSSIAN/CIS STREAMERS ===
  {
    id: 'tier2-yassuo-slots',
    username: 'yassuo_slots',
    displayName: 'YassuoSlots',
    platform: 'kick',
    platformId: '2345',
    bio: 'Russian slot streamer. High stakes and exciting content.',
    followerCount: 125000,
    streamSchedule: {
      timezone: 'MSK',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      startTime: '17:00',
      durationHours: 8,
    },
    socialLinks: { kick: 'https://kick.com/yassuo_slots' },
    region: 'CIS',
    language: 'Russian',
    notes: 'Russian market, high stakes',
  },
  {
    id: 'tier2-vituss',
    username: 'vituss',
    displayName: 'Vituss',
    platform: 'kick',
    platformId: '3678',
    bio: 'Ukrainian streamer. Growing audience in CIS region.',
    followerCount: 95000,
    streamSchedule: {
      timezone: 'EET',
      days: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      startTime: '18:00',
      durationHours: 7,
    },
    socialLinks: { kick: 'https://kick.com/vituss' },
    region: 'CIS',
    language: 'Ukrainian',
    notes: 'Ukrainian market',
  },
  {
    id: 'tier2-gambino-ru',
    username: 'gambino_ru',
    displayName: 'GambinoRU',
    platform: 'kick',
    platformId: '4890',
    bio: 'Russian slots expert. Known for game analysis.',
    followerCount: 88000,
    streamSchedule: {
      timezone: 'MSK',
      days: ['Monday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      startTime: '19:00',
      durationHours: 6,
    },
    socialLinks: { kick: 'https://kick.com/gambino_ru' },
    region: 'CIS',
    language: 'Russian',
    notes: 'Russian market, analytical',
  },

  // === LATIN AMERICAN STREAMERS ===
  {
    id: 'tier2-elslotero',
    username: 'elslotero',
    displayName: 'ElSlotero',
    platform: 'kick',
    platformId: '5678',
    bio: 'Mexican slot streamer. Growing LATAM audience.',
    followerCount: 145000,
    streamSchedule: {
      timezone: 'CST',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      startTime: '20:00',
      durationHours: 6,
    },
    socialLinks: { kick: 'https://kick.com/elslotero' },
    region: 'LATAM',
    language: 'Spanish',
    notes: 'Mexican market',
  },
  {
    id: 'tier2-bfrags',
    username: 'bfrags',
    displayName: 'BFrags',
    platform: 'kick',
    platformId: '6543',
    bio: 'Brazilian slot and casino streamer. Portuguese content.',
    followerCount: 180000,
    streamSchedule: {
      timezone: 'BRT',
      days: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      startTime: '19:00',
      durationHours: 7,
    },
    socialLinks: { kick: 'https://kick.com/bfrags' },
    region: 'LATAM',
    language: 'Portuguese',
    notes: 'Brazilian market, large audience',
  },
  {
    id: 'tier2-casinoarg',
    username: 'casinoarg',
    displayName: 'CasinoArg',
    platform: 'kick',
    platformId: '7654',
    bio: 'Argentine casino streamer. Spanish speaking audience.',
    followerCount: 72000,
    streamSchedule: {
      timezone: 'ART',
      days: ['Monday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      startTime: '21:00',
      durationHours: 5,
    },
    socialLinks: { kick: 'https://kick.com/casinoarg' },
    region: 'LATAM',
    language: 'Spanish',
    notes: 'Argentine market',
  },
  {
    id: 'tier2-slotschile',
    username: 'slotschile',
    displayName: 'SlotsChile',
    platform: 'kick',
    platformId: '8901',
    bio: 'Chilean slot enthusiast. Growing presence in South America.',
    followerCount: 48000,
    streamSchedule: {
      timezone: 'CLT',
      days: ['Tuesday', 'Thursday', 'Friday', 'Saturday'],
      startTime: '20:00',
      durationHours: 5,
    },
    socialLinks: { kick: 'https://kick.com/slotschile' },
    region: 'LATAM',
    language: 'Spanish',
    notes: 'Chilean market',
  },
  {
    id: 'tier2-lafortunabr',
    username: 'lafortunabr',
    displayName: 'LaFortunaBR',
    platform: 'kick',
    platformId: '9012',
    bio: 'Brazilian streamer. Known for big wins and celebrations.',
    followerCount: 110000,
    streamSchedule: {
      timezone: 'BRT',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime: '18:00',
      durationHours: 6,
    },
    socialLinks: { kick: 'https://kick.com/lafortunabr' },
    region: 'LATAM',
    language: 'Portuguese',
    notes: 'Brazilian market',
  },

  // === NORTH AMERICAN STREAMERS ===
  {
    id: 'tier2-spinmaster',
    username: 'spinmaster',
    displayName: 'SpinMaster',
    platform: 'kick',
    platformId: '1234',
    bio: 'US-based slot streamer. Late night content for NA audience.',
    followerCount: 98000,
    streamSchedule: {
      timezone: 'EST',
      days: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      startTime: '22:00',
      durationHours: 6,
    },
    socialLinks: { kick: 'https://kick.com/spinmaster' },
    region: 'NA',
    language: 'English',
    notes: 'US market, late night',
  },
  {
    id: 'tier2-slotgrinder',
    username: 'slotgrinder',
    displayName: 'SlotGrinder',
    platform: 'kick',
    platformId: '2109',
    bio: 'Canadian slot enthusiast. Marathon streaming sessions.',
    followerCount: 76000,
    streamSchedule: {
      timezone: 'EST',
      days: ['Monday', 'Wednesday', 'Friday', 'Saturday', 'Sunday'],
      startTime: '19:00',
      durationHours: 8,
    },
    socialLinks: { kick: 'https://kick.com/slotgrinder' },
    region: 'NA',
    language: 'English',
    notes: 'Canadian market',
  },
  {
    id: 'tier2-vegasvibes',
    username: 'vegasvibes',
    displayName: 'VegasVibes',
    platform: 'kick',
    platformId: '3210',
    bio: 'Las Vegas based streamer. Land-based and online slots.',
    followerCount: 85000,
    streamSchedule: {
      timezone: 'PST',
      days: ['Thursday', 'Friday', 'Saturday', 'Sunday'],
      startTime: '20:00',
      durationHours: 7,
    },
    socialLinks: { kick: 'https://kick.com/vegasvibes' },
    region: 'NA',
    language: 'English',
    notes: 'Vegas based',
  },

  // === ASIAN STREAMERS ===
  {
    id: 'tier2-slotking-jp',
    username: 'slotking_jp',
    displayName: 'SlotKingJP',
    platform: 'kick',
    platformId: '4109',
    bio: 'Japanese slot streamer. Pachinko and online slots.',
    followerCount: 65000,
    streamSchedule: {
      timezone: 'JST',
      days: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      startTime: '20:00',
      durationHours: 5,
    },
    socialLinks: { kick: 'https://kick.com/slotking_jp' },
    region: 'APAC',
    language: 'Japanese',
    notes: 'Japanese market',
  },
  {
    id: 'tier2-luckydragon888',
    username: 'luckydragon888',
    displayName: 'LuckyDragon888',
    platform: 'kick',
    platformId: '5210',
    bio: 'Asian market streamer. English and Mandarin content.',
    followerCount: 92000,
    streamSchedule: {
      timezone: 'HKT',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime: '19:00',
      durationHours: 6,
    },
    socialLinks: { kick: 'https://kick.com/luckydragon888' },
    region: 'APAC',
    language: 'Mandarin',
    notes: 'Asian market, bilingual',
  },
  {
    id: 'tier2-slotace-kr',
    username: 'slotace_kr',
    displayName: 'SlotAceKR',
    platform: 'kick',
    platformId: '6321',
    bio: 'Korean slot enthusiast. Growing Korean gambling community.',
    followerCount: 55000,
    streamSchedule: {
      timezone: 'KST',
      days: ['Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      startTime: '21:00',
      durationHours: 5,
    },
    socialLinks: { kick: 'https://kick.com/slotace_kr' },
    region: 'APAC',
    language: 'Korean',
    notes: 'Korean market',
  },
  {
    id: 'tier2-casinothai',
    username: 'casinothai',
    displayName: 'CasinoThai',
    platform: 'kick',
    platformId: '7432',
    bio: 'Thai casino streamer. Southeast Asian audience.',
    followerCount: 48000,
    streamSchedule: {
      timezone: 'ICT',
      days: ['Tuesday', 'Thursday', 'Friday', 'Saturday'],
      startTime: '19:00',
      durationHours: 5,
    },
    socialLinks: { kick: 'https://kick.com/casinothai' },
    region: 'APAC',
    language: 'Thai',
    notes: 'Thai market',
  },

  // === ADDITIONAL EUROPEAN STREAMERS ===
  {
    id: 'tier2-casinoitalia',
    username: 'casinoitalia',
    displayName: 'CasinoItalia',
    platform: 'kick',
    platformId: '8543',
    bio: 'Italian slot streamer. Mediterranean gambling content.',
    followerCount: 58000,
    streamSchedule: {
      timezone: 'CET',
      days: ['Monday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      startTime: '20:00',
      durationHours: 5,
    },
    socialLinks: { kick: 'https://kick.com/casinoitalia' },
    region: 'EU',
    language: 'Italian',
    notes: 'Italian market',
  },
  {
    id: 'tier2-slotsgr',
    username: 'slotsgr',
    displayName: 'SlotsGR',
    platform: 'kick',
    platformId: '9654',
    bio: 'Greek slot enthusiast. Pragmatic Play favorites.',
    followerCount: 42000,
    streamSchedule: {
      timezone: 'EET',
      days: ['Tuesday', 'Thursday', 'Friday', 'Saturday'],
      startTime: '19:00',
      durationHours: 5,
    },
    socialLinks: { kick: 'https://kick.com/slotsgr' },
    region: 'EU',
    language: 'Greek',
    notes: 'Greek market',
  },
  {
    id: 'tier2-casino-pl',
    username: 'casino_pl',
    displayName: 'CasinoPL',
    platform: 'kick',
    platformId: '1098',
    bio: 'Polish casino streamer. Growing Eastern European audience.',
    followerCount: 67000,
    streamSchedule: {
      timezone: 'CET',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime: '18:00',
      durationHours: 6,
    },
    socialLinks: { kick: 'https://kick.com/casino_pl' },
    region: 'EU',
    language: 'Polish',
    notes: 'Polish market',
  },
  {
    id: 'tier2-slotses',
    username: 'slotzes',
    displayName: 'SlotsES',
    platform: 'kick',
    platformId: '2187',
    bio: 'Spanish slot streamer. Iberian market coverage.',
    followerCount: 73000,
    streamSchedule: {
      timezone: 'CET',
      days: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      startTime: '21:00',
      durationHours: 5,
    },
    socialLinks: { kick: 'https://kick.com/slotses' },
    region: 'EU',
    language: 'Spanish',
    notes: 'Spanish market',
  },
  {
    id: 'tier2-casinoturk',
    username: 'casinoturk',
    displayName: 'CasinoTurk',
    platform: 'kick',
    platformId: '3298',
    bio: 'Turkish casino streamer. High engagement community.',
    followerCount: 115000,
    streamSchedule: {
      timezone: 'TRT',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      startTime: '19:00',
      durationHours: 7,
    },
    socialLinks: { kick: 'https://kick.com/casinoturk' },
    region: 'EU',
    language: 'Turkish',
    notes: 'Turkish market, high engagement',
  },

  // === YOUTUBE STREAMERS ===
  {
    id: 'tier2-bigwinboard',
    username: 'bigwinboard',
    displayName: 'BigWinBoard',
    platform: 'youtube',
    platformId: 'UCbigwinboard',
    bio: 'YouTube slot compilation channel. Big win highlights.',
    followerCount: 320000,
    streamSchedule: {
      timezone: 'CET',
      days: ['Monday', 'Wednesday', 'Friday'],
      startTime: '18:00',
      durationHours: 3,
    },
    socialLinks: { youtube: 'https://youtube.com/bigwinboard' },
    region: 'EU',
    language: 'English',
    notes: 'YouTube, compilations',
  },
  {
    id: 'tier2-casinotest24',
    username: 'casinotest24',
    displayName: 'CasinoTest24',
    platform: 'youtube',
    platformId: 'UCcasinotest24',
    bio: 'German YouTube channel. Slot reviews and tests.',
    followerCount: 180000,
    streamSchedule: {
      timezone: 'CET',
      days: ['Tuesday', 'Thursday', 'Saturday'],
      startTime: '17:00',
      durationHours: 4,
    },
    socialLinks: { youtube: 'https://youtube.com/casinotest24' },
    region: 'EU',
    language: 'German',
    notes: 'German YouTube, reviews',
  },

  // === TWITCH STREAMERS ===
  {
    id: 'tier2-slotlady',
    username: 'slotlady',
    displayName: 'SlotLady',
    platform: 'twitch',
    platformId: 'slotlady',
    bio: 'Popular female slot streamer. Land-based casino content.',
    followerCount: 250000,
    streamSchedule: {
      timezone: 'PST',
      days: ['Wednesday', 'Thursday', 'Friday', 'Saturday'],
      startTime: '18:00',
      durationHours: 6,
    },
    socialLinks: { twitch: 'https://twitch.tv/slotlady' },
    region: 'NA',
    language: 'English',
    notes: 'Twitch, land-based casinos',
  },
  {
    id: 'tier2-classy-slots',
    username: 'classy_slots',
    displayName: 'ClassySlots',
    platform: 'twitch',
    platformId: 'classy_slots',
    bio: 'Twitch slot streamer. Variety of games and providers.',
    followerCount: 125000,
    streamSchedule: {
      timezone: 'EST',
      days: ['Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      startTime: '20:00',
      durationHours: 5,
    },
    socialLinks: { twitch: 'https://twitch.tv/classy_slots' },
    region: 'NA',
    language: 'English',
    notes: 'Twitch platform',
  },
];

// Helper functions
export function getTier2Streamers(): Tier2Streamer[] {
  return TIER2_STREAMERS;
}

export function getTier2StreamerByUsername(username: string): Tier2Streamer | undefined {
  return TIER2_STREAMERS.find(
    (s) => s.username.toLowerCase() === username.toLowerCase()
  );
}

export function getStreamersByRegion(region: Region): Tier2Streamer[] {
  return TIER2_STREAMERS.filter((s) => s.region === region);
}

export function getStreamersByLanguage(language: string): Tier2Streamer[] {
  return TIER2_STREAMERS.filter(
    (s) => s.language.toLowerCase() === language.toLowerCase()
  );
}

export function getStreamersByPlatform(platform: Platform): Tier2Streamer[] {
  return TIER2_STREAMERS.filter((s) => s.platform === platform);
}

// Statistics
export const TIER2_STATS = {
  totalStreamers: TIER2_STREAMERS.length,
  totalFollowers: TIER2_STREAMERS.reduce((sum, s) => sum + s.followerCount, 0),
  byRegion: {
    EU: TIER2_STREAMERS.filter((s) => s.region === 'EU').length,
    NA: TIER2_STREAMERS.filter((s) => s.region === 'NA').length,
    LATAM: TIER2_STREAMERS.filter((s) => s.region === 'LATAM').length,
    APAC: TIER2_STREAMERS.filter((s) => s.region === 'APAC').length,
    CIS: TIER2_STREAMERS.filter((s) => s.region === 'CIS').length,
  },
  byPlatform: {
    kick: TIER2_STREAMERS.filter((s) => s.platform === 'kick').length,
    youtube: TIER2_STREAMERS.filter((s) => s.platform === 'youtube').length,
    twitch: TIER2_STREAMERS.filter((s) => s.platform === 'twitch').length,
  },
};
