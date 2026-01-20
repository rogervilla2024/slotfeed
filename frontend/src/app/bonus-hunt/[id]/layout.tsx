/**
 * Bonus Hunt Detail Layout
 * Provides dynamic metadata for bonus hunt detail pages
 */

import { Metadata } from 'next';

const SITE_URL = 'https://liveslotdata.com';
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface BonusHuntData {
  id: string;
  streamer: {
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  startedAt: string;
  endedAt?: string;
  status: 'collecting' | 'opening' | 'completed' | 'cancelled';
  totalCost: number;
  totalPayout: number;
  roiPercentage: number;
  bonusCount: number;
  bonusesOpened: number;
  bestMultiplier: number;
  worstMultiplier: number;
  avgMultiplier: number;
}

async function getBonusHunt(huntId: string): Promise<BonusHuntData | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/bonus-hunts/${huntId}`, {
      next: { revalidate: 60 }, // Cache for 1 minute (hunts can be live)
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching bonus hunt:', error);
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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getStatusEmoji(status: string): string {
  switch (status) {
    case 'collecting':
      return 'Collecting';
    case 'opening':
      return 'Opening LIVE';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const hunt = await getBonusHunt(params.id);

  if (!hunt) {
    return {
      title: 'Bonus Hunt Not Found | LiveSlotData',
      description: 'The requested bonus hunt could not be found.',
      robots: { index: false, follow: false },
    };
  }

  const { streamer, startedAt, totalCost, totalPayout, roiPercentage, bonusCount, status, bestMultiplier } = hunt;
  const dateStr = formatDate(startedAt);
  const isLive = status === 'collecting' || status === 'opening';

  const title = isLive
    ? `${streamer.displayName} Bonus Hunt LIVE - ${bonusCount} Bonuses`
    : `${streamer.displayName} Bonus Hunt - ${dateStr}`;

  const description = hunt.status === 'completed'
    ? `${streamer.displayName}'s bonus hunt: ${formatCurrency(totalCost)} invested, ${formatCurrency(totalPayout)} payout, ${roiPercentage.toFixed(0)}% ROI. Best: ${bestMultiplier.toFixed(0)}x from ${bonusCount} bonuses.`
    : `${streamer.displayName}'s ${getStatusEmoji(status)} bonus hunt with ${bonusCount} bonuses. Cost: ${formatCurrency(totalCost)}. Track live results on LiveSlotData.`;

  const canonicalUrl = `${SITE_URL}/bonus-hunt/${params.id}`;

  return {
    title,
    description: description.substring(0, 160),
    keywords: [
      streamer.displayName,
      `${streamer.displayName} bonus hunt`,
      'bonus hunt',
      'bonus opening',
      'slot bonus',
      'bonus hunt results',
      'bonus ROI',
      dateStr,
    ],
    openGraph: {
      title: `${streamer.displayName} Bonus Hunt | LiveSlotData`,
      description,
      url: canonicalUrl,
      type: 'article',
      images: [
        {
          url: `${SITE_URL}/api/og?type=bonushunt&streamer=${encodeURIComponent(streamer.displayName)}&bonuses=${bonusCount}&roi=${roiPercentage}`,
          width: 1200,
          height: 630,
          alt: `${streamer.displayName} Bonus Hunt`,
        },
      ],
      siteName: 'LiveSlotData',
      publishedTime: startedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: `${bonusCount} bonuses, ${roiPercentage.toFixed(0)}% ROI`,
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

export default function BonusHuntLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
