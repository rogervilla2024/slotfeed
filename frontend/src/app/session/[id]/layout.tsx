/**
 * Session Detail Layout
 * Provides dynamic metadata for session detail pages
 */

import { Metadata } from 'next';

const SITE_URL = 'https://liveslotdata.com';
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface SessionData {
  id: string;
  streamer: {
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  platform: string;
  startedAt: string;
  endedAt?: string;
  durationMinutes: number;
  startingBalance: number;
  endingBalance: number;
  totalWagered: number;
  totalWon: number;
  netProfitLoss: number;
  sessionRtp: number;
  gamesPlayed: number;
  biggestWin: number;
  biggestMultiplier: number;
  peakViewers?: number;
  avgViewers?: number;
  thumbnailUrl?: string;
}

async function getSession(sessionId: string): Promise<SessionData | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/sessions/${sessionId}`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching session:', error);
    return null;
  }
}

function formatCurrency(amount: number): string {
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : amount > 0 ? '+' : '';
  return `${sign}$${absAmount.toLocaleString()}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const session = await getSession(params.id);

  if (!session) {
    return {
      title: 'Session Not Found | LiveSlotData',
      description: 'The requested session could not be found.',
      robots: { index: false, follow: false },
    };
  }

  const { streamer, startedAt, netProfitLoss, sessionRtp, gamesPlayed, durationMinutes } = session;
  const dateStr = formatDate(startedAt);
  const profitStr = formatCurrency(netProfitLoss);
  const durationStr = formatDuration(durationMinutes);

  const title = `${streamer.displayName} Session - ${dateStr}`;
  const description = `${streamer.displayName}'s slot session on ${dateStr}: ${profitStr} P/L, ${sessionRtp.toFixed(2)}% RTP, ${gamesPlayed} games played over ${durationStr}.`;

  const canonicalUrl = `${SITE_URL}/session/${params.id}`;

  return {
    title,
    description: description.substring(0, 160),
    keywords: [
      streamer.displayName,
      `${streamer.displayName} session`,
      'slot session',
      'streaming session',
      'slot results',
      'session recap',
      dateStr,
    ],
    openGraph: {
      title: `${streamer.displayName} Session | LiveSlotData`,
      description,
      url: canonicalUrl,
      type: 'article',
      images: session.thumbnailUrl
        ? [{ url: session.thumbnailUrl, width: 1280, height: 720, alt: `${streamer.displayName} session thumbnail` }]
        : [{ url: `${SITE_URL}/api/og?type=session&streamer=${encodeURIComponent(streamer.displayName)}&pnl=${netProfitLoss}&rtp=${sessionRtp}`, width: 1200, height: 630, alt: 'Session Stats' }],
      siteName: 'LiveSlotData',
      publishedTime: startedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${streamer.displayName} Session - ${dateStr}`,
      description: `${profitStr} P/L, ${sessionRtp.toFixed(2)}% RTP`,
    },
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function SessionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
