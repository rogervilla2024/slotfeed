/**
 * Leaderboards Layout
 * Provides static metadata for the leaderboards page
 */

import { Metadata } from 'next';

const SITE_URL = 'https://liveslotdata.com';

export const metadata: Metadata = {
  title: 'Slot Streamer Leaderboards - Rankings & Stats',
  description:
    'See the top slot streamers ranked by profit, RTP, wagered amounts, and session activity. Real-time leaderboards updated from live stream data. Daily, weekly, monthly, and all-time rankings.',
  keywords: [
    'slot leaderboard',
    'streamer rankings',
    'top streamers',
    'best RTP',
    'biggest profits',
    'slot stats',
    'streamer comparison',
    'gambling leaderboard',
  ],
  openGraph: {
    title: 'Streamer Leaderboards | LiveSlotData',
    description:
      'Real-time rankings of slot streamers by profit, RTP, and activity. See who is winning big.',
    url: `${SITE_URL}/leaderboards`,
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/api/og?type=leaderboards`,
        width: 1200,
        height: 630,
        alt: 'Slot Streamer Leaderboards',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Slot Streamer Leaderboards',
    description: 'See the top slot streamers ranked by profit, RTP, and activity.',
  },
  alternates: {
    canonical: `${SITE_URL}/leaderboards`,
  },
};

export default function LeaderboardsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
