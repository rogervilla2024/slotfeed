/**
 * Big Wins Gallery Layout
 * Provides static metadata for the big wins page
 */

import { Metadata } from 'next';

const SITE_URL = 'https://liveslotdata.com';

export const metadata: Metadata = {
  title: 'Big Wins Gallery - Latest Slot Wins from Top Streamers',
  description:
    'Watch the biggest slot wins from top streamers. 100x+ multipliers, massive payouts, and epic moments from Kick, Twitch & YouTube. Updated in real-time with clips and screenshots.',
  keywords: [
    'big wins',
    'slot wins',
    'huge wins',
    'slot jackpot',
    'max win',
    'slot clips',
    'streamer wins',
    'slot highlights',
    'bonus wins',
    'mega win',
  ],
  openGraph: {
    title: 'Big Wins Gallery | LiveSlotData',
    description:
      'Epic slot wins from top streamers. Watch clips, see multipliers, and track the biggest payouts.',
    url: `${SITE_URL}/big-wins`,
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/api/og?type=bigwins`,
        width: 1200,
        height: 630,
        alt: 'Big Wins Gallery',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Big Wins Gallery',
    description: 'Epic slot wins from top streamers. Watch clips and see massive multipliers.',
  },
  alternates: {
    canonical: `${SITE_URL}/big-wins`,
  },
};

export default function BigWinsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
