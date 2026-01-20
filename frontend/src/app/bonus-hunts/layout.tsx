/**
 * Bonus Hunts Layout
 * Provides static metadata for the bonus hunts listing page
 */

import { Metadata } from 'next';

const SITE_URL = 'https://liveslotdata.com';

export const metadata: Metadata = {
  title: 'Bonus Hunt Tracker - Live & Completed Hunts',
  description:
    'Track bonus hunts from top slot streamers. See collected bonuses, opening results, ROI calculations, and best multipliers. Live updates during active hunts.',
  keywords: [
    'bonus hunt',
    'bonus opening',
    'bonus hunt tracker',
    'slot bonuses',
    'bonus hunt ROI',
    'bonus hunt results',
    'streamer bonus hunt',
  ],
  openGraph: {
    title: 'Bonus Hunt Tracker | LiveSlotData',
    description: 'Track slot bonus hunts with live updates, ROI calculations, and results.',
    url: `${SITE_URL}/bonus-hunts`,
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/api/og?type=bonushunts`,
        width: 1200,
        height: 630,
        alt: 'Bonus Hunt Tracker',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bonus Hunt Tracker',
    description: 'Track bonus hunts with live updates and ROI calculations.',
  },
  alternates: {
    canonical: `${SITE_URL}/bonus-hunts`,
  },
};

export default function BonusHuntsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
