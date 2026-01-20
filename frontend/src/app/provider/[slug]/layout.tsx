/**
 * Provider Detail Layout
 * Provides dynamic metadata for game provider pages
 */

import { Metadata } from 'next';

const SITE_URL = 'https://liveslotdata.com';
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ProviderData {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  websiteUrl?: string;
  description?: string;
  totalGames: number;
  avgRtp: number;
  popularGames?: Array<{
    id: string;
    name: string;
    rtp: number;
  }>;
}

async function getProvider(slug: string): Promise<ProviderData | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/providers/${slug}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching provider:', error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const provider = await getProvider(params.slug);

  if (!provider) {
    return {
      title: 'Provider Not Found | LiveSlotData',
      description: 'The requested game provider could not be found.',
      robots: { index: false, follow: false },
    };
  }

  const { name, totalGames, avgRtp, description, logoUrl, popularGames } = provider;

  const popularGameNames = popularGames?.slice(0, 3).map((g) => g.name).join(', ') || '';

  const metaDescription =
    description ||
    `${name} slot games on LiveSlotData: ${totalGames} games, ${avgRtp.toFixed(2)}% average RTP. Popular: ${popularGameNames}. Track RTP, big wins, and streamer data.`;

  const title = `${name} Slots - ${totalGames} Games & RTP Analytics`;
  const canonicalUrl = `${SITE_URL}/provider/${params.slug}`;

  return {
    title,
    description: metaDescription.substring(0, 160),
    keywords: [
      name,
      `${name} slots`,
      `${name} games`,
      `${name} RTP`,
      'slot provider',
      'slot games',
      'casino games',
      ...(popularGames?.slice(0, 5).map((g) => g.name) || []),
    ],
    openGraph: {
      title: `${name} Slots | LiveSlotData`,
      description: `${totalGames} slot games from ${name} with ${avgRtp.toFixed(2)}% avg RTP`,
      url: canonicalUrl,
      type: 'website',
      images: logoUrl
        ? [{ url: logoUrl, width: 400, height: 400, alt: `${name} logo` }]
        : [
            {
              url: `${SITE_URL}/api/og?type=provider&name=${encodeURIComponent(name)}&games=${totalGames}&rtp=${avgRtp}`,
              width: 1200,
              height: 630,
              alt: `${name} Slots`,
            },
          ],
      siteName: 'LiveSlotData',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} Slots`,
      description: `${totalGames} games, ${avgRtp.toFixed(2)}% avg RTP`,
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

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
