/**
 * Slots Directory Layout
 * Provides static metadata for the slots/games listing page
 */

import { Metadata } from 'next';

const SITE_URL = 'https://liveslotdata.com';

export const metadata: Metadata = {
  title: 'Slot Games Directory - RTP, Volatility & Stats',
  description:
    'Browse all slot games with real-time RTP data from streamer sessions. Compare Sweet Bonanza, Gates of Olympus, Sugar Rush, and 100+ more. Filter by provider, volatility, and performance.',
  keywords: [
    'slot games',
    'slot RTP',
    'sweet bonanza',
    'gates of olympus',
    'sugar rush',
    'pragmatic play',
    'hacksaw gaming',
    'slot volatility',
    'slot statistics',
    'best slots',
  ],
  openGraph: {
    title: 'Slot Games Directory | LiveSlotData',
    description:
      'Compare slot games with real RTP data from streamers. Find the best games by provider, volatility, and performance.',
    url: `${SITE_URL}/slots`,
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/api/og?type=slots`,
        width: 1200,
        height: 630,
        alt: 'Slot Games Directory',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Slot Games Directory',
    description: 'Compare slot games with real RTP data from live streamers.',
  },
  alternates: {
    canonical: `${SITE_URL}/slots`,
  },
};

export default function SlotsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
