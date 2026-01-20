/**
 * Streamer Profile Layout
 * Provides dynamic metadata for streamer profile pages
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';

const SITE_URL = 'https://liveslotdata.com';
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface StreamerData {
  id: string;
  username: string;
  displayName: string;
  platform: 'kick' | 'twitch' | 'youtube';
  avatarUrl?: string;
  bio?: string;
  followerCount: number;
  isLive: boolean;
  lifetimeStats: {
    totalSessions: number;
    totalHoursStreamed: number;
    totalWagered: number;
    totalWon: number;
    biggestWin: number;
    biggestMultiplier: number;
    averageRtp: number;
  };
}

async function getStreamer(username: string): Promise<StreamerData | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/streamers/${username}`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching streamer:', error);
    return null;
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}): Promise<Metadata> {
  const streamer = await getStreamer(params.username);

  if (!streamer) {
    return {
      title: 'Streamer Not Found',
      description: 'The requested streamer profile could not be found.',
      robots: { index: false, follow: false },
    };
  }

  const { displayName, platform, lifetimeStats, avatarUrl, followerCount, bio } = streamer;
  const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);

  // Create rich description with stats
  const description =
    bio ||
    `${displayName} slot streaming stats on ${platformName}: ${formatCurrency(lifetimeStats.totalWagered)} wagered, ${lifetimeStats.averageRtp.toFixed(2)}% RTP, ${lifetimeStats.totalSessions} sessions. Track live streams and session history.`;

  const title = `${displayName} - Slot Streamer Stats & Live Analytics`;

  const canonicalUrl = `${SITE_URL}/streamer/${params.username}`;

  return {
    title,
    description: description.substring(0, 160),
    keywords: [
      displayName,
      `${displayName} slots`,
      `${displayName} ${platform}`,
      `${displayName} stats`,
      `${displayName} RTP`,
      `${displayName} big wins`,
      'slot streamer',
      `${platform} streamer`,
      'slot streaming',
      'casino streamer',
    ],
    openGraph: {
      title: `${displayName} Stats | LiveSlotData`,
      description: `${displayName}'s slot streaming statistics: ${formatCurrency(lifetimeStats.totalWagered)} wagered, ${lifetimeStats.averageRtp.toFixed(2)}% lifetime RTP`,
      url: canonicalUrl,
      type: 'profile',
      images: avatarUrl
        ? [
            {
              url: avatarUrl,
              width: 400,
              height: 400,
              alt: `${displayName} avatar`,
            },
          ]
        : [
            {
              url: `${SITE_URL}/api/og?type=streamer&name=${encodeURIComponent(displayName)}&rtp=${lifetimeStats.averageRtp}`,
              width: 1200,
              height: 630,
              alt: `${displayName} Stats`,
            },
          ],
      siteName: 'LiveSlotData',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${displayName} - Slot Streamer Stats`,
      description: `Track ${displayName}'s slot streaming: ${formatNumber(followerCount)} followers, ${lifetimeStats.averageRtp.toFixed(2)}% RTP`,
      images: avatarUrl
        ? [avatarUrl]
        : [`${SITE_URL}/api/og?type=streamer&name=${encodeURIComponent(displayName)}`],
    },
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
    other: {
      'profile:username': params.username,
    },
  };
}

export default function StreamerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
