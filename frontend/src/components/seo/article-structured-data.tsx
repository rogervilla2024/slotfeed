/**
 * Article Structured Data Component
 * Generates Article/NewsArticle JSON-LD markup for news content
 *
 * Test: https://search.google.com/test/rich-results
 * Docs: https://developers.google.com/search/docs/appearance/structured-data/article
 *
 * This enables article rich snippets and potential Google News inclusion
 */

interface ArticleStructuredDataProps {
  /** Article type */
  type: 'Article' | 'NewsArticle' | 'BlogPosting';
  /** Article headline (max 110 characters recommended) */
  headline: string;
  /** Article description */
  description: string;
  /** Main article image URL */
  image: string;
  /** Date published (ISO 8601) */
  datePublished: string;
  /** Date modified (ISO 8601) */
  dateModified?: string;
  /** Author name */
  authorName?: string;
  /** Author URL */
  authorUrl?: string;
  /** Article URL */
  url: string;
  /** Article body text (first 500 chars recommended) */
  articleBody?: string;
  /** Word count */
  wordCount?: number;
  /** Article section/category */
  articleSection?: string;
  /** Keywords */
  keywords?: string[];
}

export function ArticleStructuredData({
  type,
  headline,
  description,
  image,
  datePublished,
  dateModified,
  authorName,
  authorUrl,
  url,
  articleBody,
  wordCount,
  articleSection,
  keywords,
}: ArticleStructuredDataProps) {
  const articleSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': type,
    headline,
    description,
    image: {
      '@type': 'ImageObject',
      url: image,
    },
    datePublished,
    dateModified: dateModified || datePublished,
    url,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    publisher: {
      '@type': 'Organization',
      name: 'LiveSlotData',
      url: 'https://liveslotdata.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://liveslotdata.com/logo.png',
        width: 512,
        height: 512,
      },
    },
    author: {
      '@type': authorUrl ? 'Person' : 'Organization',
      name: authorName || 'LiveSlotData',
      url: authorUrl || 'https://liveslotdata.com',
    },
  };

  if (articleBody) {
    articleSchema.articleBody = articleBody;
  }

  if (wordCount) {
    articleSchema.wordCount = wordCount;
  }

  if (articleSection) {
    articleSchema.articleSection = articleSection;
  }

  if (keywords && keywords.length > 0) {
    articleSchema.keywords = keywords.join(', ');
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(articleSchema),
      }}
    />
  );
}

/**
 * Big Wins Daily Summary - NewsArticle for daily highlights
 */
interface BigWinsSummaryProps {
  /** Date of the summary (ISO 8601 date part only) */
  date: string;
  /** Total number of big wins */
  totalWins: number;
  /** Biggest win amount */
  biggestWinAmount: number;
  /** Biggest win streamer */
  biggestWinStreamer: string;
  /** Biggest win game */
  biggestWinGame: string;
  /** Biggest multiplier */
  biggestMultiplier: number;
  /** Summary text */
  summaryText?: string;
}

export function BigWinsDailySummary({
  date,
  totalWins,
  biggestWinAmount,
  biggestWinStreamer,
  biggestWinGame,
  biggestMultiplier,
}: BigWinsSummaryProps) {
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const headline = `Big Wins Highlights - ${formattedDate}`;
  const description = `${totalWins} big wins recorded today. Top win: $${biggestWinAmount.toLocaleString()} (${biggestMultiplier}x) by ${biggestWinStreamer} on ${biggestWinGame}.`;

  const articleBody = `
Today's slot streaming sessions produced ${totalWins} notable big wins across tracked streamers.

The biggest win of the day came from ${biggestWinStreamer}, who hit an incredible ${biggestMultiplier}x multiplier on ${biggestWinGame},
winning $${biggestWinAmount.toLocaleString()}.

All wins are verified from live stream data and represent wins of 100x or greater.
  `.trim();

  return (
    <ArticleStructuredData
      type="NewsArticle"
      headline={headline}
      description={description}
      image="https://liveslotdata.com/og-bigwins.png"
      datePublished={`${date}T00:00:00Z`}
      dateModified={new Date().toISOString()}
      url={`https://liveslotdata.com/big-wins?date=${date}`}
      articleBody={articleBody}
      articleSection="Big Wins"
      keywords={['big wins', 'slot wins', biggestWinGame, biggestWinStreamer]}
    />
  );
}

/**
 * Streamer Session Recap - Article for session summaries
 */
interface SessionRecapProps {
  /** Streamer name */
  streamerName: string;
  /** Session date (ISO 8601) */
  sessionDate: string;
  /** Session duration in hours */
  durationHours: number;
  /** Starting balance */
  startBalance: number;
  /** Ending balance */
  endBalance: number;
  /** Number of games played */
  gamesPlayed: number;
  /** Best performing game */
  bestGame?: string;
  /** Session URL */
  sessionUrl: string;
}

export function SessionRecapArticle({
  streamerName,
  sessionDate,
  durationHours,
  startBalance,
  endBalance,
  gamesPlayed,
  bestGame,
  sessionUrl,
}: SessionRecapProps) {
  const profit = endBalance - startBalance;
  const profitPercent = ((profit / startBalance) * 100).toFixed(1);
  const isProfit = profit >= 0;

  const formattedDate = new Date(sessionDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const headline = `${streamerName} Session Recap: ${isProfit ? '+' : ''}$${profit.toLocaleString()} (${formattedDate})`;
  const description = `${streamerName} streamed for ${durationHours.toFixed(1)} hours, playing ${gamesPlayed} games. ${
    isProfit
      ? `Finished up ${profitPercent}% with $${profit.toLocaleString()} profit.`
      : `Finished down ${Math.abs(parseFloat(profitPercent))}% with $${Math.abs(profit).toLocaleString()} loss.`
  }`;

  return (
    <ArticleStructuredData
      type="Article"
      headline={headline}
      description={description}
      image={`https://liveslotdata.com/api/og/streamer/${streamerName.toLowerCase()}`}
      datePublished={sessionDate}
      dateModified={sessionDate}
      authorName={streamerName}
      authorUrl={`https://liveslotdata.com/streamer/${streamerName.toLowerCase()}`}
      url={sessionUrl}
      articleSection="Session Recap"
      keywords={['session recap', streamerName, bestGame || 'slots'].filter(Boolean)}
    />
  );
}

/**
 * Hot Slot Alert - NewsArticle for hot slot notifications
 */
interface HotSlotAlertProps {
  /** Slot name */
  slotName: string;
  /** Slot slug */
  slotSlug: string;
  /** Provider name */
  provider?: string;
  /** Current observed RTP */
  observedRtp: number;
  /** Theoretical RTP */
  theoreticalRtp: number;
  /** Time period of observation */
  periodHours: number;
  /** Number of sessions analyzed */
  sessionCount: number;
  /** Alert timestamp */
  timestamp: string;
}

export function HotSlotAlertArticle({
  slotName,
  slotSlug,
  provider,
  observedRtp,
  theoreticalRtp,
  periodHours,
  sessionCount,
  timestamp,
}: HotSlotAlertProps) {
  const rtpDiff = observedRtp - theoreticalRtp;

  const headline = `${slotName} Running Hot: ${observedRtp.toFixed(2)}% RTP (${rtpDiff > 0 ? '+' : ''}${rtpDiff.toFixed(2)}% above theoretical)`;
  const description = `${slotName}${provider ? ` by ${provider}` : ''} has been performing ${rtpDiff.toFixed(2)}% above its theoretical RTP of ${theoreticalRtp}% over the last ${periodHours} hours based on ${sessionCount} streamer sessions.`;

  return (
    <ArticleStructuredData
      type="NewsArticle"
      headline={headline}
      description={description}
      image={`https://liveslotdata.com/api/og/slot/${slotSlug}`}
      datePublished={timestamp}
      dateModified={timestamp}
      url={`https://liveslotdata.com/slot/${slotSlug}`}
      articleSection="Hot Slots"
      keywords={['hot slot', slotName, provider || 'slots', 'RTP'].filter(Boolean)}
    />
  );
}
