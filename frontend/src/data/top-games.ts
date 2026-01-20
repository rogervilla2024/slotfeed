/**
 * Top 35 Slot Games - Seed data for SLOTFEED
 *
 * This module contains the initial data for the top slot games
 * and their providers. Data includes official RTP, volatility, and features.
 */

import type { Game, Provider } from '@/types';

export interface ProviderSeedData extends Omit<Provider, 'gameCount'> {
  website?: string;
  headquarters?: string;
  foundedYear?: number;
  notes?: string;
}

export interface GameSeedData extends Omit<Game, 'provider'> {
  providerSlug: string;
  features: string[];
  releaseDate?: string;
  theme?: string;
  paylines?: string | number;
  notes?: string;
}

// Game Providers
export const PROVIDERS: ProviderSeedData[] = [
  {
    id: 'pragmatic-play',
    name: 'Pragmatic Play',
    slug: 'pragmatic-play',
    logoUrl: 'https://pragmaticplay.com/logo.png',
    website: 'https://pragmaticplay.com',
    headquarters: 'Malta',
    foundedYear: 2015,
    notes: 'Leading provider, known for Sweet Bonanza, Gates of Olympus',
  },
  {
    id: 'hacksaw-gaming',
    name: 'Hacksaw Gaming',
    slug: 'hacksaw-gaming',
    logoUrl: 'https://hacksawgaming.com/logo.png',
    website: 'https://hacksawgaming.com',
    headquarters: 'Malta',
    foundedYear: 2018,
    notes: 'Known for Wanted Dead or a Wild, high volatility slots',
  },
  {
    id: 'playn-go',
    name: "Play'n GO",
    slug: 'playn-go',
    logoUrl: 'https://playngo.com/logo.png',
    website: 'https://playngo.com',
    headquarters: 'Sweden',
    foundedYear: 2005,
    notes: 'Classic provider, Book of Dead series',
  },
  {
    id: 'evolution',
    name: 'Evolution Gaming',
    slug: 'evolution',
    logoUrl: 'https://evolution.com/logo.png',
    website: 'https://evolution.com',
    headquarters: 'Malta',
    foundedYear: 2006,
    notes: 'Live casino leader, Crazy Time, Monopoly Live',
  },
  {
    id: 'netent',
    name: 'NetEnt',
    slug: 'netent',
    logoUrl: 'https://netent.com/logo.png',
    website: 'https://netent.com',
    headquarters: 'Sweden',
    foundedYear: 1996,
    notes: "Pioneer in online slots, Starburst, Gonzo's Quest",
  },
  {
    id: 'push-gaming',
    name: 'Push Gaming',
    slug: 'push-gaming',
    logoUrl: 'https://pushgaming.com/logo.png',
    website: 'https://pushgaming.com',
    headquarters: 'London',
    foundedYear: 2010,
    notes: "Jammin' Jars, innovative mechanics",
  },
  {
    id: 'nolimit-city',
    name: 'Nolimit City',
    slug: 'nolimit-city',
    logoUrl: 'https://nolimitcity.com/logo.png',
    website: 'https://nolimitcity.com',
    headquarters: 'Malta',
    foundedYear: 2014,
    notes: 'Ultra high volatility, Mental series',
  },
  {
    id: 'relax-gaming',
    name: 'Relax Gaming',
    slug: 'relax-gaming',
    logoUrl: 'https://relax-gaming.com/logo.png',
    website: 'https://relax-gaming.com',
    headquarters: 'Malta',
    foundedYear: 2010,
    notes: 'Money Train series',
  },
  {
    id: 'big-time-gaming',
    name: 'Big Time Gaming',
    slug: 'big-time-gaming',
    logoUrl: 'https://bigtimegaming.com/logo.png',
    website: 'https://bigtimegaming.com',
    headquarters: 'Australia',
    foundedYear: 2011,
    notes: 'Megaways inventor, Bonanza',
  },
  {
    id: 'blueprint-gaming',
    name: 'Blueprint Gaming',
    slug: 'blueprint-gaming',
    logoUrl: 'https://blueprintgaming.com/logo.png',
    website: 'https://blueprintgaming.com',
    headquarters: 'UK',
    foundedYear: 2001,
    notes: 'Eye of Horus Megaways',
  },
];

// Top 20 Slot Games
export const TOP_GAMES: GameSeedData[] = [
  // Pragmatic Play (7 games)
  {
    id: 'sweet-bonanza',
    name: 'Sweet Bonanza',
    slug: 'sweet-bonanza',
    providerId: 'pragmatic-play',
    providerSlug: 'pragmatic-play',
    rtp: 96.48,
    volatility: 'high',
    maxMultiplier: 21175,
    isActive: true,
    features: ['Tumble', 'Free Spins', 'Multipliers', 'Scatter Pays'],
    releaseDate: '2019-06-27',
    theme: 'Candy',
    paylines: 'Scatter Pays',
    notes: '#1 streamer slot, high multiplier potential',
  },
  {
    id: 'gates-of-olympus',
    name: 'Gates of Olympus',
    slug: 'gates-of-olympus',
    providerId: 'pragmatic-play',
    providerSlug: 'pragmatic-play',
    rtp: 96.5,
    volatility: 'high',
    maxMultiplier: 5000,
    isActive: true,
    features: ['Tumble', 'Free Spins', 'Multipliers', 'Ante Bet'],
    releaseDate: '2021-02-13',
    theme: 'Greek Mythology',
    paylines: 'Scatter Pays',
    notes: '#2 streamer slot, Zeus theme',
  },
  {
    id: 'sugar-rush',
    name: 'Sugar Rush',
    slug: 'sugar-rush',
    providerId: 'pragmatic-play',
    providerSlug: 'pragmatic-play',
    rtp: 96.5,
    volatility: 'high',
    maxMultiplier: 5000,
    isActive: true,
    features: ['Tumble', 'Free Spins', 'Multipliers', 'Grid'],
    releaseDate: '2022-07-28',
    theme: 'Candy',
    paylines: 'Cluster Pays',
    notes: 'Cluster pays mechanic, sweet theme',
  },
  {
    id: 'big-bass-bonanza',
    name: 'Big Bass Bonanza',
    slug: 'big-bass-bonanza',
    providerId: 'pragmatic-play',
    providerSlug: 'pragmatic-play',
    rtp: 96.71,
    volatility: 'high',
    maxMultiplier: 2100,
    isActive: true,
    features: ['Free Spins', 'Money Collect', 'Fisherman Wild'],
    releaseDate: '2020-12-04',
    theme: 'Fishing',
    paylines: 10,
    notes: 'Popular fishing series, many sequels',
  },
  {
    id: 'fruit-party',
    name: 'Fruit Party',
    slug: 'fruit-party',
    providerId: 'pragmatic-play',
    providerSlug: 'pragmatic-play',
    rtp: 96.47,
    volatility: 'high',
    maxMultiplier: 5000,
    isActive: true,
    features: ['Tumble', 'Free Spins', 'Random Multipliers'],
    releaseDate: '2020-07-30',
    theme: 'Fruit',
    paylines: 'Cluster Pays',
    notes: 'Cluster pays, similar to Sweet Bonanza',
  },
  {
    id: 'the-dog-house',
    name: 'The Dog House',
    slug: 'the-dog-house',
    providerId: 'pragmatic-play',
    providerSlug: 'pragmatic-play',
    rtp: 96.51,
    volatility: 'high',
    maxMultiplier: 6750,
    isActive: true,
    features: ['Sticky Wilds', 'Free Spins', 'Multipliers'],
    releaseDate: '2019-05-23',
    theme: 'Animals',
    paylines: 20,
    notes: 'Sticky wilds with multipliers',
  },
  {
    id: 'starlight-princess',
    name: 'Starlight Princess',
    slug: 'starlight-princess',
    providerId: 'pragmatic-play',
    providerSlug: 'pragmatic-play',
    rtp: 96.5,
    volatility: 'high',
    maxMultiplier: 5000,
    isActive: true,
    features: ['Tumble', 'Free Spins', 'Multipliers', 'Ante Bet'],
    releaseDate: '2022-01-20',
    theme: 'Fantasy',
    paylines: 'Scatter Pays',
    notes: 'Similar to Gates of Olympus, anime style',
  },

  // Hacksaw Gaming (3 games)
  {
    id: 'wanted-dead-or-a-wild',
    name: 'Wanted Dead or a Wild',
    slug: 'wanted-dead-or-a-wild',
    providerId: 'hacksaw-gaming',
    providerSlug: 'hacksaw-gaming',
    rtp: 96.38,
    volatility: 'very_high',
    maxMultiplier: 12500,
    isActive: true,
    features: ['Duel Feature', 'VS Spins', 'Dead or Wild Spins'],
    releaseDate: '2021-11-08',
    theme: 'Western',
    paylines: 'Variable',
    notes: 'Extremely high volatility, big win potential',
  },
  {
    id: 'chaos-crew',
    name: 'Chaos Crew',
    slug: 'chaos-crew',
    providerId: 'hacksaw-gaming',
    providerSlug: 'hacksaw-gaming',
    rtp: 96.28,
    volatility: 'very_high',
    maxMultiplier: 10000,
    isActive: true,
    features: ['Chaos Spins', 'Cranky/Sketchy Features'],
    releaseDate: '2021-05-20',
    theme: 'Urban',
    paylines: 'Cluster Pays',
    notes: 'Popular bonus buy slot',
  },
  {
    id: 'stick-em',
    name: "Stick 'Em",
    slug: 'stick-em',
    providerId: 'hacksaw-gaming',
    providerSlug: 'hacksaw-gaming',
    rtp: 96.25,
    volatility: 'very_high',
    maxMultiplier: 10000,
    isActive: true,
    features: ['Sticky Respins', 'Multipliers'],
    releaseDate: '2022-03-24',
    theme: 'Abstract',
    paylines: 5,
    notes: 'Simple mechanics, high volatility',
  },

  // Evolution (2 games)
  {
    id: 'crazy-time',
    name: 'Crazy Time',
    slug: 'crazy-time',
    providerId: 'evolution',
    providerSlug: 'evolution',
    rtp: 96.08,
    volatility: 'high',
    maxMultiplier: 25000,
    isActive: true,
    features: ['Coin Flip', 'Pachinko', 'Cash Hunt', 'Crazy Time Wheel'],
    releaseDate: '2020-07-01',
    theme: 'Game Show',
    paylines: 'Live Wheel',
    notes: 'Live game show format',
  },
  {
    id: 'monopoly-live',
    name: 'Monopoly Live',
    slug: 'monopoly-live',
    providerId: 'evolution',
    providerSlug: 'evolution',
    rtp: 96.23,
    volatility: 'medium',
    maxMultiplier: 10000,
    isActive: true,
    features: ['Mr. Monopoly', '2 Rolls', '4 Rolls', 'Chance'],
    releaseDate: '2019-04-01',
    theme: 'Board Game',
    paylines: 'Live Wheel',
    notes: 'Licensed Monopoly theme',
  },

  // Play'n GO (2 games)
  {
    id: 'book-of-dead',
    name: 'Book of Dead',
    slug: 'book-of-dead',
    providerId: 'playn-go',
    providerSlug: 'playn-go',
    rtp: 96.21,
    volatility: 'high',
    maxMultiplier: 5000,
    isActive: true,
    features: ['Expanding Symbols', 'Free Spins', 'Gamble'],
    releaseDate: '2016-01-28',
    theme: 'Egyptian',
    paylines: 10,
    notes: 'Classic slot, Rich Wilde series',
  },
  {
    id: 'reactoonz',
    name: 'Reactoonz',
    slug: 'reactoonz',
    providerId: 'playn-go',
    providerSlug: 'playn-go',
    rtp: 96.51,
    volatility: 'high',
    maxMultiplier: 4570,
    isActive: true,
    features: ['Cluster Pays', 'Fluctometer', 'Quantumeter', 'Gargantoon'],
    releaseDate: '2017-10-24',
    theme: 'Aliens',
    paylines: 'Cluster Pays',
    notes: 'Popular cluster pays slot',
  },

  // Nolimit City (2 games)
  {
    id: 'mental',
    name: 'Mental',
    slug: 'mental',
    providerId: 'nolimit-city',
    providerSlug: 'nolimit-city',
    rtp: 96.08,
    volatility: 'very_high',
    maxMultiplier: 66666,
    isActive: true,
    features: ['Lobotomy Spins', 'Mental Spins', 'xWays', 'xNudge'],
    releaseDate: '2022-04-18',
    theme: 'Horror',
    paylines: 'Variable',
    notes: 'Ultra high volatility, controversial theme',
  },
  {
    id: 'san-quentin',
    name: 'San Quentin',
    slug: 'san-quentin',
    providerId: 'nolimit-city',
    providerSlug: 'nolimit-city',
    rtp: 96.03,
    volatility: 'very_high',
    maxMultiplier: 150000,
    isActive: true,
    features: ['Lockdown Spins', 'Razor Split', 'xNudge Wilds'],
    releaseDate: '2021-02-01',
    theme: 'Prison',
    paylines: 'Variable',
    notes: 'Highest max win potential',
  },

  // Push Gaming (1 game)
  {
    id: 'jammin-jars',
    name: "Jammin' Jars",
    slug: 'jammin-jars',
    providerId: 'push-gaming',
    providerSlug: 'push-gaming',
    rtp: 96.83,
    volatility: 'high',
    maxMultiplier: 20000,
    isActive: true,
    features: ['Cluster Pays', 'Roaming Wilds', 'Rainbow Feature'],
    releaseDate: '2018-09-06',
    theme: 'Fruit',
    paylines: 'Cluster Pays',
    notes: 'Original cluster pays hit',
  },

  // Relax Gaming (1 game)
  {
    id: 'money-train-3',
    name: 'Money Train 3',
    slug: 'money-train-3',
    providerId: 'relax-gaming',
    providerSlug: 'relax-gaming',
    rtp: 96.1,
    volatility: 'very_high',
    maxMultiplier: 100000,
    isActive: true,
    features: ['Money Cart Bonus', 'Persistent Symbols', 'Bonus Buy'],
    releaseDate: '2022-09-22',
    theme: 'Western',
    paylines: 40,
    notes: 'Popular series, high max win',
  },

  // Big Time Gaming (1 game)
  {
    id: 'bonanza-megaways',
    name: 'Bonanza Megaways',
    slug: 'bonanza-megaways',
    providerId: 'big-time-gaming',
    providerSlug: 'big-time-gaming',
    rtp: 96.0,
    volatility: 'high',
    maxMultiplier: 10000,
    isActive: true,
    features: ['Megaways', 'Reactions', 'Free Spins', 'Unlimited Multiplier'],
    releaseDate: '2016-12-07',
    theme: 'Mining',
    paylines: 'Megaways (up to 117649)',
    notes: 'Original Megaways slot',
  },

  // NetEnt (1 game)
  {
    id: 'starburst',
    name: 'Starburst',
    slug: 'starburst',
    providerId: 'netent',
    providerSlug: 'netent',
    rtp: 96.09,
    volatility: 'low',
    maxMultiplier: 500,
    isActive: true,
    features: ['Expanding Wilds', 'Re-spins', 'Both Ways'],
    releaseDate: '2012-01-01',
    theme: 'Space/Gems',
    paylines: 10,
    notes: 'Classic slot, low volatility',
  },

  // ============= EXPANSION GAMES (15 more) =============

  // Pragmatic Play (4 more games)
  {
    id: 'gates-of-olympus-1000',
    name: 'Gates of Olympus 1000',
    slug: 'gates-of-olympus-1000',
    providerId: 'pragmatic-play',
    providerSlug: 'pragmatic-play',
    rtp: 96.50,
    volatility: 'very_high',
    maxMultiplier: 15000,
    isActive: true,
    features: ['Tumble', 'Free Spins', 'Multipliers', 'Ante Bet', '1000x Max Mult'],
    releaseDate: '2023-12-07',
    theme: 'Greek Mythology',
    paylines: 'Scatter Pays',
    notes: 'Enhanced version with 1000x multipliers in bonus',
  },
  {
    id: 'sweet-bonanza-1000',
    name: 'Sweet Bonanza 1000',
    slug: 'sweet-bonanza-1000',
    providerId: 'pragmatic-play',
    providerSlug: 'pragmatic-play',
    rtp: 96.53,
    volatility: 'very_high',
    maxMultiplier: 25000,
    isActive: true,
    features: ['Tumble', 'Free Spins', 'Multipliers', '1000x Max Mult'],
    releaseDate: '2024-02-22',
    theme: 'Candy',
    paylines: 'Scatter Pays',
    notes: 'Enhanced version with higher volatility',
  },
  {
    id: 'zeus-vs-hades',
    name: 'Zeus vs Hades: Gods of War',
    slug: 'zeus-vs-hades',
    providerId: 'pragmatic-play',
    providerSlug: 'pragmatic-play',
    rtp: 96.07,
    volatility: 'high',
    maxMultiplier: 15000,
    isActive: true,
    features: ['Zeus Spins', 'Hades Spins', 'Multipliers', 'Free Spins'],
    releaseDate: '2023-02-02',
    theme: 'Greek Mythology',
    paylines: 'Scatter Pays',
    notes: 'Dual feature mechanics, popular streamer slot',
  },
  {
    id: 'big-bass-splash',
    name: 'Big Bass Splash',
    slug: 'big-bass-splash',
    providerId: 'pragmatic-play',
    providerSlug: 'pragmatic-play',
    rtp: 96.71,
    volatility: 'high',
    maxMultiplier: 5000,
    isActive: true,
    features: ['Free Spins', 'Money Collect', 'Extra Fishermen', 'Lives System'],
    releaseDate: '2022-08-18',
    theme: 'Fishing',
    paylines: 10,
    notes: 'Popular sequel in the Big Bass series',
  },

  // Hacksaw Gaming (3 more games)
  {
    id: 'dork-unit',
    name: 'Dork Unit',
    slug: 'dork-unit',
    providerId: 'hacksaw-gaming',
    providerSlug: 'hacksaw-gaming',
    rtp: 96.27,
    volatility: 'very_high',
    maxMultiplier: 55555,
    isActive: true,
    features: ['Sticky Multipliers', 'Free Spins', 'Full Screen Wins'],
    releaseDate: '2022-07-21',
    theme: 'Cartoon/Characters',
    paylines: 'Cluster Pays',
    notes: 'Extremely high max win potential',
  },
  {
    id: 'rip-city',
    name: 'RIP City',
    slug: 'rip-city',
    providerId: 'hacksaw-gaming',
    providerSlug: 'hacksaw-gaming',
    rtp: 96.30,
    volatility: 'very_high',
    maxMultiplier: 10000,
    isActive: true,
    features: ['Grim Spins', 'RIP Spins', 'Multiplier Wilds'],
    releaseDate: '2023-09-07',
    theme: 'Horror/Urban',
    paylines: 10,
    notes: 'Dark theme with dual bonus features',
  },
  {
    id: 'hand-of-anubis',
    name: 'Hand of Anubis',
    slug: 'hand-of-anubis',
    providerId: 'hacksaw-gaming',
    providerSlug: 'hacksaw-gaming',
    rtp: 96.27,
    volatility: 'very_high',
    maxMultiplier: 15000,
    isActive: true,
    features: ['Sticky Multipliers', 'Free Spins', 'Expanding Wilds'],
    releaseDate: '2023-05-25',
    theme: 'Egyptian',
    paylines: 'Cluster Pays',
    notes: 'Egyptian themed high volatility slot',
  },

  // Nolimit City (3 more games)
  {
    id: 'tombstone-rip',
    name: 'Tombstone RIP',
    slug: 'tombstone-rip',
    providerId: 'nolimit-city',
    providerSlug: 'nolimit-city',
    rtp: 96.08,
    volatility: 'very_high',
    maxMultiplier: 300000,
    isActive: true,
    features: ['Boothill Spins', 'Hang Em High Spins', 'xNudge Wilds'],
    releaseDate: '2021-09-20',
    theme: 'Western',
    paylines: 'Variable',
    notes: 'Highest max win in the industry',
  },
  {
    id: 'fire-in-the-hole',
    name: 'Fire in the Hole',
    slug: 'fire-in-the-hole',
    providerId: 'nolimit-city',
    providerSlug: 'nolimit-city',
    rtp: 96.06,
    volatility: 'very_high',
    maxMultiplier: 60000,
    isActive: true,
    features: ['Lucky Wagon Spins', 'xBomb Wilds', 'Drill Feature'],
    releaseDate: '2020-10-12',
    theme: 'Mining',
    paylines: 'Variable',
    notes: 'Mining theme with explosive features',
  },
  {
    id: 'misery-mining',
    name: 'Misery Mining',
    slug: 'misery-mining',
    providerId: 'nolimit-city',
    providerSlug: 'nolimit-city',
    rtp: 96.07,
    volatility: 'very_high',
    maxMultiplier: 52550,
    isActive: true,
    features: ['Misery Spins', 'xNudge Wilds', 'Infectious'],
    releaseDate: '2023-10-16',
    theme: 'Mining/Horror',
    paylines: 'Variable',
    notes: 'Dark mining theme with high potential',
  },

  // Relax Gaming (2 more games)
  {
    id: 'money-train-4',
    name: 'Money Train 4',
    slug: 'money-train-4',
    providerId: 'relax-gaming',
    providerSlug: 'relax-gaming',
    rtp: 96.00,
    volatility: 'very_high',
    maxMultiplier: 150000,
    isActive: true,
    features: ['Money Cart Bonus', 'Persistent Symbols', 'Tommy Guns Feature'],
    releaseDate: '2024-04-02',
    theme: 'Western',
    paylines: 40,
    notes: 'Latest in the Money Train series',
  },
  {
    id: 'dream-drop-jackpot',
    name: 'Dream Drop Jackpot',
    slug: 'dream-drop-jackpot',
    providerId: 'relax-gaming',
    providerSlug: 'relax-gaming',
    rtp: 94.00,
    volatility: 'high',
    maxMultiplier: 25000000,
    isActive: true,
    features: ['Progressive Jackpot', 'Dream Drop Bonus', '5 Jackpot Tiers'],
    releaseDate: '2022-03-24',
    theme: 'Fantasy',
    paylines: 'Various',
    notes: 'Multi-million jackpot system',
  },

  // Big Time Gaming (2 more games)
  {
    id: 'danger-high-voltage-megaways',
    name: 'Danger! High Voltage Megaways',
    slug: 'danger-high-voltage-megaways',
    providerId: 'big-time-gaming',
    providerSlug: 'big-time-gaming',
    rtp: 96.22,
    volatility: 'high',
    maxMultiplier: 22960,
    isActive: true,
    features: ['Megaways', 'Gates of Hell', 'High Voltage Spins'],
    releaseDate: '2020-09-24',
    theme: 'Disco/Music',
    paylines: 'Megaways (up to 15746)',
    notes: 'Electric slide themed with dual bonuses',
  },
  {
    id: 'extra-chilli-megaways',
    name: 'Extra Chilli Megaways',
    slug: 'extra-chilli-megaways',
    providerId: 'big-time-gaming',
    providerSlug: 'big-time-gaming',
    rtp: 96.15,
    volatility: 'very_high',
    maxMultiplier: 20000,
    isActive: true,
    features: ['Megaways', 'Extra Spins', 'Gamble Feature'],
    releaseDate: '2018-08-15',
    theme: 'Mexican Food',
    paylines: 'Megaways (up to 117649)',
    notes: 'Megaways classic with gamble feature',
  },

  // Push Gaming (1 more game)
  {
    id: 'jammin-jars-2',
    name: "Jammin' Jars 2",
    slug: 'jammin-jars-2',
    providerId: 'push-gaming',
    providerSlug: 'push-gaming',
    rtp: 96.40,
    volatility: 'very_high',
    maxMultiplier: 50000,
    isActive: true,
    features: ['Cluster Pays', 'Giga Jar', 'Level Up Multipliers'],
    releaseDate: '2021-06-03',
    theme: 'Fruit/Disco',
    paylines: 'Cluster Pays',
    notes: 'Sequel with Giga Jar feature',
  },
];

/**
 * Get all providers
 */
export function getProviders(): ProviderSeedData[] {
  return PROVIDERS;
}

/**
 * Get all top games
 */
export function getTopGames(): GameSeedData[] {
  return TOP_GAMES;
}

/**
 * Find a game by slug
 */
export function getGameBySlug(slug: string): GameSeedData | undefined {
  return TOP_GAMES.find((g) => g.slug === slug);
}

/**
 * Get games by provider
 */
export function getGamesByProvider(providerSlug: string): GameSeedData[] {
  return TOP_GAMES.filter((g) => g.providerSlug === providerSlug);
}

/**
 * Get provider by slug
 */
export function getProviderBySlug(slug: string): ProviderSeedData | undefined {
  return PROVIDERS.find((p) => p.slug === slug);
}

/**
 * Get average RTP across all games
 */
export function getAverageRTP(): number {
  return TOP_GAMES.reduce((sum, g) => sum + g.rtp, 0) / TOP_GAMES.length;
}

/**
 * Get games by volatility
 */
export function getGamesByVolatility(
  volatility: 'low' | 'medium' | 'high' | 'very_high'
): GameSeedData[] {
  return TOP_GAMES.filter((g) => g.volatility === volatility);
}
