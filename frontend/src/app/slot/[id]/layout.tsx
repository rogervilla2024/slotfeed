import { Metadata } from 'next';
import { generateGameMetadata } from '@/lib/seo-utils';

interface GameSEOData {
  gameId: string;
  gameName: string;
  provider: string;
  rtp: number;
  volatility: string;
  description?: string;
  metaDescription?: string;
  focusKeywords?: string[];
  imageUrl?: string;
  observedRtp?: number;
  totalSessions?: number;
}

async function fetchGameData(gameId: string): Promise<GameSEOData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${baseUrl}/api/v1/games/${gameId}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) return null;

    const game = await response.json();

    // Fetch content data for SEO
    const contentResponse = await fetch(`${baseUrl}/api/v1/games/${gameId}/content`, {
      next: { revalidate: 3600 },
    });

    let metaDescription = undefined;
    let focusKeywords = undefined;

    if (contentResponse.ok) {
      const content = await contentResponse.json();
      metaDescription = content.meta_description;
      focusKeywords = content.focus_keywords;
    }

    return {
      gameId,
      gameName: game.name || 'Unknown Game',
      provider: game.provider?.name || 'Unknown Provider',
      rtp: game.rtp || 96.0,
      volatility: game.volatility || 'high',
      metaDescription,
      focusKeywords,
      imageUrl: game.thumbnail_url,
    };
  } catch (error) {
    console.error(`Failed to fetch game data for ${gameId}:`, error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const gameData = await fetchGameData(params.id);

  if (!gameData) {
    return {
      title: 'Slot Game | LiveSlotData',
      description: 'Track slot game performance with real-time analytics and streamer insights on LiveSlotData.',
    };
  }

  return generateGameMetadata(gameData);
}

export default function SlotLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
