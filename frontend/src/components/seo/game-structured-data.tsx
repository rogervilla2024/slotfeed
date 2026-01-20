/**
 * Game Structured Data Component
 * Generates JSON-LD markup for SEO
 *
 * Test: https://search.google.com/test/rich-results
 * Docs: https://schema.org/VideoGame (Game type)
 *
 * NOTE: AggregateRating removed - Google is cautious about
 * review/rating markup on gambling-related content
 */

interface GameStructuredDataProps {
  gameId: string;
  gameName: string;
  rtp: number;
  volatility: string;
  provider?: string;
  thumbnailUrl?: string;
  maxMultiplier?: number;
  /** Total spins tracked (for credibility) */
  totalSpins?: number;
}

export function GameStructuredData({
  gameId,
  gameName,
  rtp,
  volatility,
  provider,
  thumbnailUrl,
  maxMultiplier,
  totalSpins,
}: GameStructuredDataProps) {
  // Build comprehensive description
  let description = `${gameName} is a ${volatility} volatility slot game with ${rtp}% RTP`;
  if (provider) {
    description += ` by ${provider}`;
  }
  if (maxMultiplier) {
    description += `. Maximum win potential: ${maxMultiplier.toLocaleString()}x`;
  }
  description += '. View real-time statistics, streamer performance, and strategy guides on LiveSlotData.';

  // Schema.org Game schema (without rating - gambling content caution)
  const gameSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Game',
    name: gameName,
    url: `https://liveslotdata.com/slot/${gameId}`,
    image: thumbnailUrl || 'https://liveslotdata.com/og-image.png',
    description,
    genre: 'Slot Machine',
    gamePlatform: 'Online Casino',
    applicationCategory: 'Game',
    isAccessibleForFree: false, // Requires money to play
    inLanguage: 'en',
  };

  // Add publisher info if provider is known
  if (provider) {
    gameSchema.publisher = {
      '@type': 'Organization',
      name: provider,
    };

    gameSchema.author = {
      '@type': 'Organization',
      name: provider,
    };
  }

  // Add game-specific properties
  gameSchema.gameItem = [
    {
      '@type': 'Thing',
      name: 'RTP',
      description: `${rtp}% Return to Player`,
    },
    {
      '@type': 'Thing',
      name: 'Volatility',
      description: `${volatility.charAt(0).toUpperCase() + volatility.slice(1)} volatility`,
    },
  ];

  if (maxMultiplier) {
    (gameSchema.gameItem as any[]).push({
      '@type': 'Thing',
      name: 'Max Win',
      description: `${maxMultiplier.toLocaleString()}x maximum multiplier`,
    });
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(gameSchema),
      }}
    />
  );
}

/**
 * Slot Game with Breadcrumb - complete slot page schema
 */
interface SlotPageSchemaProps {
  gameId: string;
  gameName: string;
  rtp: number;
  volatility: string;
  provider?: string;
  thumbnailUrl?: string;
  maxMultiplier?: number;
}

export function SlotPageStructuredData({
  gameId,
  gameName,
  rtp,
  volatility,
  provider,
  thumbnailUrl,
  maxMultiplier,
}: SlotPageSchemaProps) {
  // Breadcrumb schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://liveslotdata.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Slots',
        item: 'https://liveslotdata.com/slots',
      },
      ...(provider
        ? [
            {
              '@type': 'ListItem',
              position: 3,
              name: provider,
              item: `https://liveslotdata.com/provider/${provider.toLowerCase().replace(/\s+/g, '-')}`,
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: gameName,
              item: `https://liveslotdata.com/slot/${gameId}`,
            },
          ]
        : [
            {
              '@type': 'ListItem',
              position: 3,
              name: gameName,
              item: `https://liveslotdata.com/slot/${gameId}`,
            },
          ]),
    ],
  };

  return (
    <>
      <GameStructuredData
        gameId={gameId}
        gameName={gameName}
        rtp={rtp}
        volatility={volatility}
        provider={provider}
        thumbnailUrl={thumbnailUrl}
        maxMultiplier={maxMultiplier}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
    </>
  );
}
