/**
 * Video Structured Data Component
 * Generates VideoObject JSON-LD markup for video rich results
 *
 * Test: https://search.google.com/test/rich-results
 * Docs: https://developers.google.com/search/docs/appearance/structured-data/video
 *
 * This enables video thumbnails and carousels in search results
 */

interface VideoStructuredDataProps {
  /** Video title */
  name: string;
  /** Video description */
  description: string;
  /** Thumbnail URL (must be crawlable) */
  thumbnailUrl: string;
  /** Upload/publish date (ISO 8601) */
  uploadDate: string;
  /** Video duration in ISO 8601 format (e.g., "PT1M30S" for 1min 30sec) */
  duration?: string;
  /** Direct video URL (for streaming platforms, use embed URL) */
  contentUrl?: string;
  /** Embed URL (for iframe embedding) */
  embedUrl?: string;
  /** Interaction statistics */
  viewCount?: number;
  /** Video has captions */
  hasCaptions?: boolean;
  /** Streamer/creator name */
  creatorName?: string;
  /** Platform name */
  platform?: string;
}

export function VideoStructuredData({
  name,
  description,
  thumbnailUrl,
  uploadDate,
  duration,
  contentUrl,
  embedUrl,
  viewCount,
  hasCaptions,
  creatorName,
  platform,
}: VideoStructuredDataProps) {
  const videoSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name,
    description,
    thumbnailUrl,
    uploadDate,
    publisher: {
      '@type': 'Organization',
      name: 'LiveSlotData',
      logo: {
        '@type': 'ImageObject',
        url: 'https://liveslotdata.com/logo.png',
        width: 512,
        height: 512,
      },
    },
  };

  // Add optional properties
  if (duration) {
    videoSchema.duration = duration;
  }

  if (contentUrl) {
    videoSchema.contentUrl = contentUrl;
  }

  if (embedUrl) {
    videoSchema.embedUrl = embedUrl;
  }

  if (viewCount && viewCount > 0) {
    videoSchema.interactionStatistic = {
      '@type': 'InteractionCounter',
      interactionType: { '@type': 'WatchAction' },
      userInteractionCount: viewCount,
    };
  }

  if (hasCaptions !== undefined) {
    videoSchema.caption = hasCaptions ? 'Available' : 'Not available';
  }

  if (creatorName) {
    videoSchema.creator = {
      '@type': 'Person',
      name: creatorName,
      url: `https://liveslotdata.com/streamer/${creatorName.toLowerCase()}`,
    };
  }

  if (platform) {
    videoSchema.potentialAction = {
      '@type': 'WatchAction',
      target: contentUrl || embedUrl,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(videoSchema),
      }}
    />
  );
}

/**
 * Big Win Video component - specialized for big win clips
 */
interface BigWinVideoProps {
  /** Win ID for unique identification */
  winId: string;
  /** Streamer name */
  streamerName: string;
  /** Game name */
  gameName: string;
  /** Win amount in dollars */
  winAmount: number;
  /** Win multiplier */
  multiplier: number;
  /** Win timestamp (ISO 8601) */
  timestamp: string;
  /** Video/clip URL */
  videoUrl: string;
  /** Thumbnail URL */
  thumbnailUrl?: string;
  /** Video duration in seconds */
  durationSeconds?: number;
  /** Platform (kick, twitch, youtube) */
  platform: 'kick' | 'twitch' | 'youtube';
}

export function BigWinVideoStructuredData({
  winId,
  streamerName,
  gameName,
  winAmount,
  multiplier,
  timestamp,
  videoUrl,
  thumbnailUrl,
  durationSeconds,
  platform,
}: BigWinVideoProps) {
  // Convert seconds to ISO 8601 duration
  const formatDuration = (seconds?: number): string | undefined => {
    if (!seconds) return undefined;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0 && secs > 0) {
      return `PT${mins}M${secs}S`;
    } else if (mins > 0) {
      return `PT${mins}M`;
    } else {
      return `PT${secs}S`;
    }
  };

  const platformName = {
    kick: 'Kick',
    twitch: 'Twitch',
    youtube: 'YouTube',
  }[platform];

  const title = `${streamerName} - ${gameName} ${multiplier}x Big Win ($${winAmount.toLocaleString()})`;
  const description = `Watch ${streamerName} hit an incredible ${multiplier}x multiplier on ${gameName}, winning $${winAmount.toLocaleString()}! Clip from ${platformName} stream.`;

  return (
    <VideoStructuredData
      name={title}
      description={description}
      thumbnailUrl={
        thumbnailUrl ||
        `https://liveslotdata.com/api/og/bigwin/${winId}`
      }
      uploadDate={timestamp}
      duration={formatDuration(durationSeconds)}
      contentUrl={videoUrl}
      embedUrl={videoUrl}
      creatorName={streamerName}
      platform={platformName}
    />
  );
}

/**
 * Multiple videos component - for video list pages
 */
interface VideoItem {
  id: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration?: string;
  contentUrl?: string;
  embedUrl?: string;
  creatorName?: string;
}

interface VideoListStructuredDataProps {
  videos: VideoItem[];
  listName?: string;
}

export function VideoListStructuredData({
  videos,
  listName,
}: VideoListStructuredDataProps) {
  if (!videos || videos.length === 0) {
    return null;
  }

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName || 'Video Collection',
    itemListElement: videos.map((video, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'VideoObject',
        name: video.name,
        description: video.description,
        thumbnailUrl: video.thumbnailUrl,
        uploadDate: video.uploadDate,
        duration: video.duration,
        contentUrl: video.contentUrl,
        embedUrl: video.embedUrl,
        creator: video.creatorName
          ? {
              '@type': 'Person',
              name: video.creatorName,
            }
          : undefined,
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
