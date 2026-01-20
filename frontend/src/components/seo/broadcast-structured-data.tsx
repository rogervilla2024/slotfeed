/**
 * Broadcast Event Structured Data Component
 * Generates BroadcastEvent JSON-LD markup for live stream indication
 *
 * Test: https://search.google.com/test/rich-results
 * Docs: https://developers.google.com/search/docs/appearance/structured-data/video#livestream
 *
 * This enables the "LIVE" badge in Google Search results
 */

interface BroadcastStructuredDataProps {
  /** Streamer's display name */
  streamerName: string;
  /** Streamer's username/slug */
  streamerSlug: string;
  /** Stream title */
  title: string;
  /** Stream description */
  description?: string;
  /** Stream start time (ISO 8601) */
  startDate: string;
  /** Expected end time (ISO 8601) - optional but recommended */
  endDate?: string;
  /** Stream thumbnail URL */
  thumbnailUrl?: string;
  /** Platform name (Kick, Twitch, YouTube) */
  platform: 'kick' | 'twitch' | 'youtube';
  /** Platform stream URL */
  streamUrl: string;
  /** Current viewer count */
  viewerCount?: number;
  /** Is currently live */
  isLive: boolean;
}

export function BroadcastStructuredData({
  streamerName,
  streamerSlug,
  title,
  description,
  startDate,
  endDate,
  thumbnailUrl,
  platform,
  streamUrl,
  viewerCount,
  isLive,
}: BroadcastStructuredDataProps) {
  // Only render if stream is live
  if (!isLive) {
    return null;
  }

  const platformName = {
    kick: 'Kick',
    twitch: 'Twitch',
    youtube: 'YouTube',
  }[platform];

  const platformUrl = {
    kick: 'https://kick.com',
    twitch: 'https://twitch.tv',
    youtube: 'https://youtube.com',
  }[platform];

  // Calculate expected end date if not provided (assume 8 hour stream)
  const expectedEndDate =
    endDate || new Date(new Date(startDate).getTime() + 8 * 60 * 60 * 1000).toISOString();

  const broadcastSchema = {
    '@context': 'https://schema.org',
    '@type': 'BroadcastEvent',
    name: title || `${streamerName} Live Slot Stream`,
    description:
      description ||
      `Watch ${streamerName} playing slots live on ${platformName}. Real-time balance tracking and statistics available on LiveSlotData.`,
    isLiveBroadcast: true,
    startDate: startDate,
    endDate: expectedEndDate,
    videoFormat: 'HD',
    // Event being broadcast
    broadcastOfEvent: {
      '@type': 'Event',
      name: `${streamerName} Slot Streaming Session`,
      startDate: startDate,
      endDate: expectedEndDate,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
      location: {
        '@type': 'VirtualLocation',
        url: streamUrl,
      },
      performer: {
        '@type': 'Person',
        name: streamerName,
        url: `https://liveslotdata.com/streamer/${streamerSlug}`,
      },
      organizer: {
        '@type': 'Organization',
        name: 'LiveSlotData',
        url: 'https://liveslotdata.com',
      },
    },
    // Where the broadcast is published
    publishedOn: {
      '@type': 'BroadcastService',
      name: platformName,
      url: platformUrl,
      broadcaster: {
        '@type': 'Organization',
        name: platformName,
      },
    },
    // Video details
    video: {
      '@type': 'VideoObject',
      name: title || `${streamerName} Live Stream`,
      description:
        description ||
        `Live slot streaming session by ${streamerName} on ${platformName}`,
      thumbnailUrl:
        thumbnailUrl || `https://liveslotdata.com/api/og/streamer/${streamerSlug}`,
      uploadDate: startDate,
      contentUrl: streamUrl,
      embedUrl: streamUrl,
      publication: {
        '@type': 'BroadcastEvent',
        isLiveBroadcast: true,
        startDate: startDate,
        endDate: expectedEndDate,
      },
    },
  };

  // Add viewer count if available (as interactionStatistic)
  if (viewerCount && viewerCount > 0) {
    (broadcastSchema.video as any).interactionStatistic = {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/WatchAction',
      userInteractionCount: viewerCount,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(broadcastSchema),
      }}
    />
  );
}

/**
 * Multiple live streams component for homepage
 */
interface LiveStream {
  streamerName: string;
  streamerSlug: string;
  title: string;
  startDate: string;
  thumbnailUrl?: string;
  platform: 'kick' | 'twitch' | 'youtube';
  streamUrl: string;
  viewerCount?: number;
}

interface MultipleBroadcastsProps {
  streams: LiveStream[];
}

export function MultipleBroadcastsStructuredData({
  streams,
}: MultipleBroadcastsProps) {
  if (!streams || streams.length === 0) {
    return null;
  }

  return (
    <>
      {streams.map((stream, index) => (
        <BroadcastStructuredData
          key={`${stream.streamerSlug}-${index}`}
          streamerName={stream.streamerName}
          streamerSlug={stream.streamerSlug}
          title={stream.title}
          startDate={stream.startDate}
          thumbnailUrl={stream.thumbnailUrl}
          platform={stream.platform}
          streamUrl={stream.streamUrl}
          viewerCount={stream.viewerCount}
          isLive={true}
        />
      ))}
    </>
  );
}
