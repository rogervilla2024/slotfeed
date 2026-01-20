/**
 * Streamers Directory Layout
 * Provides static metadata for the streamers listing page
 */

import { Metadata } from 'next';

const SITE_URL = 'https://liveslotdata.com';

export const metadata: Metadata = {
  title: 'Slot Streamers Directory - Live Stats & Rankings',
  description:
    'Browse all tracked slot streamers on Kick, Twitch & YouTube. See live status, follower counts, lifetime RTP, biggest wins, and detailed analytics for top streamers like Roshtein, Trainwreckstv, ClassyBeef.',
  keywords: [
    'slot streamers',
    'casino streamers',
    'kick streamers',
    'roshtein',
    'trainwreckstv',
    'classybeef',
    'xposed',
    'slot streaming',
    'live slots',
    'streamer stats',
  ],
  openGraph: {
    title: 'Slot Streamers | LiveSlotData',
    description:
      'Discover and track slot streamers with real-time stats. Live status, RTP analytics, session history, and more.',
    url: `${SITE_URL}/streamers`,
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/api/og?type=streamers`,
        width: 1200,
        height: 630,
        alt: 'Slot Streamers Directory',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Slot Streamers Directory',
    description: 'Track slot streamers with real-time stats, RTP analytics, and session history.',
  },
  alternates: {
    canonical: `${SITE_URL}/streamers`,
  },
};

export default function StreamersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
