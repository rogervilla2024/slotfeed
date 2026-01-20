/**
 * Person Structured Data Component
 * Generates Person JSON-LD markup for streamer profiles
 *
 * Test: https://search.google.com/test/rich-results
 * Docs: https://developers.google.com/search/docs/appearance/structured-data/person
 *
 * This helps Google understand streamer profiles and may show knowledge panel info
 */

interface PersonStructuredDataProps {
  /** Person's display name */
  name: string;
  /** Person's username/slug */
  username: string;
  /** Profile image URL */
  image?: string;
  /** Bio/description */
  description?: string;
  /** Job title */
  jobTitle?: string;
  /** Streaming platform */
  platform: 'kick' | 'twitch' | 'youtube';
  /** Platform profile URL */
  platformUrl: string;
  /** Follower count */
  followerCount?: number;
  /** Social links */
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    discord?: string;
    youtube?: string;
  };
  /** Currently live */
  isLive?: boolean;
  /** Known for / notable achievements */
  knowsAbout?: string[];
}

export function PersonStructuredData({
  name,
  username,
  image,
  description,
  jobTitle = 'Slot Streamer',
  platform,
  platformUrl,
  followerCount,
  socialLinks,
  isLive,
  knowsAbout,
}: PersonStructuredDataProps) {
  const platformNames = {
    kick: 'Kick',
    twitch: 'Twitch',
    youtube: 'YouTube',
  };

  const sameAs: string[] = [platformUrl];
  if (socialLinks?.twitter) sameAs.push(socialLinks.twitter);
  if (socialLinks?.instagram) sameAs.push(socialLinks.instagram);
  if (socialLinks?.youtube) sameAs.push(socialLinks.youtube);

  const personSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    alternateName: username,
    url: `https://liveslotdata.com/streamer/${username}`,
    image: image || `https://liveslotdata.com/api/og/streamer/${username}`,
    description:
      description ||
      `${name} is a slot streamer on ${platformNames[platform]}${
        followerCount ? ` with ${followerCount.toLocaleString()} followers` : ''
      }. Watch live streams and track real-time statistics on LiveSlotData.`,
    jobTitle,
    sameAs,
    worksFor: {
      '@type': 'Organization',
      name: platformNames[platform],
      url:
        platform === 'kick'
          ? 'https://kick.com'
          : platform === 'twitch'
          ? 'https://twitch.tv'
          : 'https://youtube.com',
    },
  };

  // Add follower count as interaction statistic
  if (followerCount && followerCount > 0) {
    personSchema.interactionStatistic = {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/FollowAction',
      userInteractionCount: followerCount,
    };
  }

  // Add known expertise
  if (knowsAbout && knowsAbout.length > 0) {
    personSchema.knowsAbout = knowsAbout;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(personSchema),
      }}
    />
  );
}

/**
 * ProfilePage schema - for the full streamer profile page
 */
interface StreamerProfilePageProps {
  /** Streamer data */
  streamer: {
    name: string;
    username: string;
    platform: 'kick' | 'twitch' | 'youtube';
    platformUrl: string;
    avatarUrl?: string;
    bio?: string;
    followerCount?: number;
    isLive?: boolean;
    socialLinks?: {
      twitter?: string;
      instagram?: string;
      discord?: string;
      youtube?: string;
    };
  };
  /** Lifetime stats */
  stats?: {
    totalSessions: number;
    totalHoursStreamed: number;
    totalWagered: number;
    totalWon: number;
    biggestWin: number;
    averageRtp: number;
  };
  /** Favorite games */
  favoriteGames?: string[];
}

export function StreamerProfilePageStructuredData({
  streamer,
  stats,
  favoriteGames,
}: StreamerProfilePageProps) {
  const platformNames = {
    kick: 'Kick',
    twitch: 'Twitch',
    youtube: 'YouTube',
  };

  // Build description with stats
  let description = `${streamer.name} is a slot streamer on ${platformNames[streamer.platform]}`;
  if (streamer.followerCount) {
    description += ` with ${streamer.followerCount.toLocaleString()} followers`;
  }
  description += '.';

  if (stats) {
    description += ` Lifetime stats: ${stats.totalSessions} sessions, ${stats.totalHoursStreamed.toFixed(0)} hours streamed`;
    if (stats.biggestWin > 0) {
      description += `, biggest win $${stats.biggestWin.toLocaleString()}`;
    }
    description += '.';
  }

  // Build sameAs array
  const sameAs: string[] = [streamer.platformUrl];
  if (streamer.socialLinks?.twitter) sameAs.push(streamer.socialLinks.twitter);
  if (streamer.socialLinks?.instagram) sameAs.push(streamer.socialLinks.instagram);
  if (streamer.socialLinks?.youtube) sameAs.push(streamer.socialLinks.youtube);

  const profilePageSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    dateCreated: new Date().toISOString(),
    dateModified: new Date().toISOString(),
    mainEntity: {
      '@type': 'Person',
      name: streamer.name,
      alternateName: streamer.username,
      url: `https://liveslotdata.com/streamer/${streamer.username}`,
      image: streamer.avatarUrl || `https://liveslotdata.com/api/og/streamer/${streamer.username}`,
      description,
      jobTitle: 'Slot Streamer',
      sameAs,
      worksFor: {
        '@type': 'Organization',
        name: platformNames[streamer.platform],
      },
      knowsAbout: favoriteGames || ['Slot Machines', 'Online Casino', 'Live Streaming'],
      interactionStatistic: streamer.followerCount
        ? {
            '@type': 'InteractionCounter',
            interactionType: 'https://schema.org/FollowAction',
            userInteractionCount: streamer.followerCount,
          }
        : undefined,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(profilePageSchema),
      }}
    />
  );
}

/**
 * BreadcrumbList for streamer pages
 */
interface StreamerBreadcrumbProps {
  streamerName: string;
  streamerUsername: string;
  currentPage?: 'profile' | 'sessions' | 'games';
}

export function StreamerBreadcrumbStructuredData({
  streamerName,
  streamerUsername,
  currentPage = 'profile',
}: StreamerBreadcrumbProps) {
  const breadcrumbItems = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://liveslotdata.com',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Streamers',
      item: 'https://liveslotdata.com/streamers',
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: streamerName,
      item: `https://liveslotdata.com/streamer/${streamerUsername}`,
    },
  ];

  if (currentPage === 'sessions') {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 4,
      name: 'Sessions',
      item: `https://liveslotdata.com/streamer/${streamerUsername}/sessions`,
    });
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(breadcrumbSchema),
      }}
    />
  );
}
