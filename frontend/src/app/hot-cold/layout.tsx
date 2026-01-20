/**
 * Hot/Cold Slots Layout
 * Provides static metadata for the hot-cold indicators page
 */

import { Metadata } from 'next';

const SITE_URL = 'https://liveslotdata.com';

export const metadata: Metadata = {
  title: 'Hot & Cold Slots - Real-Time RTP Performance',
  description:
    'Discover which slots are running hot or cold right now. Compare observed RTP vs theoretical RTP based on live streamer data. Updated every hour with real session data.',
  keywords: [
    'hot slots',
    'cold slots',
    'slot RTP',
    'slot performance',
    'best slots today',
    'slot trends',
    'RTP tracker',
    'slot analytics',
    'which slots are hot',
  ],
  openGraph: {
    title: 'Hot & Cold Slots | LiveSlotData',
    description:
      'See which slots are running hot or cold based on real-time streamer data. Compare observed vs theoretical RTP.',
    url: `${SITE_URL}/hot-cold`,
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/api/og?type=hotcold`,
        width: 1200,
        height: 630,
        alt: 'Hot & Cold Slots',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hot & Cold Slots',
    description: 'Real-time slot performance data. See which games are running hot or cold.',
  },
  alternates: {
    canonical: `${SITE_URL}/hot-cold`,
  },
};

export default function HotColdLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
