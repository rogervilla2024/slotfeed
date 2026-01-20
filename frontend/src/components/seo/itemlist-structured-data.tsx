/**
 * ItemList Structured Data Component
 * Generates ItemList JSON-LD markup for ranked lists and tables
 *
 * Test: https://search.google.com/test/rich-results
 * Docs: https://developers.google.com/search/docs/appearance/structured-data/carousel
 *
 * This can enable carousel displays and featured snippets for lists
 */

interface ItemListStructuredDataProps {
  /** List name/title */
  name: string;
  /** List description */
  description?: string;
  /** Items in the list */
  items: ListItem[];
  /** Type of items (for proper schema type) */
  itemType: 'Person' | 'Game' | 'Thing' | 'Product';
}

interface ListItem {
  /** Item name */
  name: string;
  /** Item URL */
  url: string;
  /** Item image */
  image?: string;
  /** Item description */
  description?: string;
  /** Additional properties (for extended schema) */
  additionalProperties?: Record<string, unknown>;
}

export function ItemListStructuredData({
  name,
  description,
  items,
  itemType,
}: ItemListStructuredDataProps) {
  if (!items || items.length === 0) {
    return null;
  }

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    description,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': itemType,
        name: item.name,
        url: item.url,
        image: item.image,
        description: item.description,
        ...item.additionalProperties,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(itemListSchema),
      }}
    />
  );
}

/**
 * Streamer Leaderboard - specialized for streamer rankings
 */
interface StreamerRankingItem {
  rank: number;
  name: string;
  username: string;
  platform: 'kick' | 'twitch' | 'youtube';
  avatarUrl?: string;
  followers?: number;
  profitLoss?: number;
  roi?: number;
  totalSessions?: number;
}

interface StreamerLeaderboardProps {
  /** Leaderboard title */
  title: string;
  /** Ranking type for description */
  rankingType: 'profit' | 'roi' | 'sessions' | 'wagered';
  /** Streamers list */
  streamers: StreamerRankingItem[];
}

export function StreamerLeaderboardStructuredData({
  title,
  rankingType,
  streamers,
}: StreamerLeaderboardProps) {
  if (!streamers || streamers.length === 0) {
    return null;
  }

  const rankingDescriptions = {
    profit: 'ranked by total profit/loss',
    roi: 'ranked by return on investment percentage',
    sessions: 'ranked by number of streaming sessions',
    wagered: 'ranked by total amount wagered',
  };

  const items: ListItem[] = streamers.map((streamer) => ({
    name: streamer.name,
    url: `https://liveslotdata.com/streamer/${streamer.username}`,
    image: streamer.avatarUrl,
    description: `${streamer.name} - ${streamer.platform.toUpperCase()} streamer${
      streamer.followers ? ` with ${streamer.followers.toLocaleString()} followers` : ''
    }`,
    additionalProperties: {
      jobTitle: 'Slot Streamer',
      memberOf: {
        '@type': 'Organization',
        name: streamer.platform.charAt(0).toUpperCase() + streamer.platform.slice(1),
      },
    },
  }));

  return (
    <ItemListStructuredData
      name={title}
      description={`Top slot streamers ${rankingDescriptions[rankingType]}. Updated in real-time from live stream data.`}
      items={items}
      itemType="Person"
    />
  );
}

/**
 * Slot Games List - for slot listings and hot/cold pages
 */
interface SlotGameItem {
  id: string;
  name: string;
  slug: string;
  provider?: string;
  rtp: number;
  volatility: string;
  thumbnailUrl?: string;
  status?: 'hot' | 'neutral' | 'cold';
}

interface SlotGamesListProps {
  /** List title */
  title: string;
  /** List description */
  description?: string;
  /** Games list */
  games: SlotGameItem[];
}

export function SlotGamesListStructuredData({
  title,
  description,
  games,
}: SlotGamesListProps) {
  if (!games || games.length === 0) {
    return null;
  }

  const items: ListItem[] = games.map((game) => ({
    name: game.name,
    url: `https://liveslotdata.com/slot/${game.slug}`,
    image: game.thumbnailUrl,
    description: `${game.name}${game.provider ? ` by ${game.provider}` : ''} - ${game.rtp}% RTP, ${game.volatility} volatility`,
    additionalProperties: {
      gameCategory: 'Slot Machine',
      publisher: game.provider
        ? {
            '@type': 'Organization',
            name: game.provider,
          }
        : undefined,
    },
  }));

  return (
    <ItemListStructuredData
      name={title}
      description={description || `Slot games with real-time statistics and performance data.`}
      items={items}
      itemType="Game"
    />
  );
}

/**
 * Hot/Cold Slots List - for hot-cold page
 */
interface HotColdSlotItem {
  id: string;
  name: string;
  slug: string;
  provider?: string;
  status: 'hot' | 'cold';
  score: number;
  observedRtp: number;
  theoreticalRtp: number;
}

interface HotColdListProps {
  /** Type of list */
  type: 'hot' | 'cold';
  /** Slots list */
  slots: HotColdSlotItem[];
}

export function HotColdSlotsStructuredData({ type, slots }: HotColdListProps) {
  if (!slots || slots.length === 0) {
    return null;
  }

  const title =
    type === 'hot'
      ? 'Hot Slots - Currently Performing Above RTP'
      : 'Cold Slots - Currently Performing Below RTP';

  const description =
    type === 'hot'
      ? 'Slot games that are currently paying above their theoretical RTP based on recent stream data.'
      : 'Slot games that are currently paying below their theoretical RTP based on recent stream data.';

  const items: ListItem[] = slots.map((slot) => ({
    name: slot.name,
    url: `https://liveslotdata.com/slot/${slot.slug}`,
    description: `${slot.name} - Observed RTP: ${slot.observedRtp.toFixed(2)}% vs Theoretical: ${slot.theoreticalRtp.toFixed(2)}%`,
    additionalProperties: {
      gameCategory: 'Slot Machine',
    },
  }));

  return (
    <ItemListStructuredData
      name={title}
      description={description}
      items={items}
      itemType="Game"
    />
  );
}

/**
 * Big Wins List - for big wins gallery
 */
interface BigWinItem {
  id: string;
  streamerName: string;
  gameName: string;
  amount: number;
  multiplier: number;
  timestamp: string;
  videoUrl: string;
  thumbnailUrl?: string;
}

interface BigWinsListProps {
  /** List title */
  title: string;
  /** Wins list */
  wins: BigWinItem[];
  /** Sort type for description */
  sortedBy?: 'multiplier' | 'amount' | 'recent';
}

export function BigWinsListStructuredData({
  title,
  wins,
  sortedBy = 'multiplier',
}: BigWinsListProps) {
  if (!wins || wins.length === 0) {
    return null;
  }

  const sortDescriptions = {
    multiplier: 'sorted by highest multiplier',
    amount: 'sorted by largest payout',
    recent: 'sorted by most recent',
  };

  const items: ListItem[] = wins.map((win) => ({
    name: `${win.streamerName} - ${win.gameName} ${win.multiplier}x Win`,
    url: win.videoUrl,
    image: win.thumbnailUrl,
    description: `$${win.amount.toLocaleString()} win with ${win.multiplier}x multiplier on ${win.gameName}`,
  }));

  return (
    <ItemListStructuredData
      name={title}
      description={`Biggest slot wins from top streamers, ${sortDescriptions[sortedBy]}. Watch the clips and see the action.`}
      items={items}
      itemType="Thing"
    />
  );
}
