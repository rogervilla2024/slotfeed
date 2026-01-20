import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SessionsListContent } from '@/components/session/sessions-list-content';
import { api } from '@/lib/api';

interface PageProps {
  params: Promise<{
    username: string;
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
}

// Generate SEO metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;

  try {
    const streamer = await api.streamers.get(username);

    const title = `${streamer.displayName} Session History | All Streaming Sessions | SLOTFEED`;
    const description = `View complete session history for ${streamer.displayName}. Track ${streamer.lifetimeStats?.totalSessions || 0} streaming sessions with detailed balance changes, wagered amounts, and profit/loss analytics.`;

    const canonicalUrl = `https://slotfeed.com/streamer/${username}/sessions`;

    return {
      title,
      description,
      keywords: [
        streamer.displayName,
        'session history',
        'streaming sessions',
        'slot streaming',
        'gambling stats',
        'balance tracking',
        streamer.platform,
      ],
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        siteName: 'SLOTFEED',
        type: 'website',
        images: [
          {
            url: streamer.avatarUrl || '/og-default.png',
            width: 1200,
            height: 630,
            alt: `${streamer.displayName} session history`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [streamer.avatarUrl || '/og-default.png'],
      },
      alternates: {
        canonical: canonicalUrl,
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  } catch {
    return {
      title: `${username} Sessions | SLOTFEED`,
      description: 'Slot streaming session history and analytics.',
    };
  }
}

// Generate static paths for popular streamers
export async function generateStaticParams() {
  try {
    const streamers = await api.streamers.list({ limit: 50 });
    return streamers.map((s) => ({
      username: s.username,
    }));
  } catch {
    return [];
  }
}

export default async function SessionsListPage({ params, searchParams }: PageProps) {
  const { username } = await params;
  const { page } = await searchParams;
  const currentPage = parseInt(page || '1', 10);

  try {
    const [streamer, sessions] = await Promise.all([
      api.streamers.get(username),
      api.sessions.list({
        streamerId: username,
        limit: 20,
        offset: (currentPage - 1) * 20,
      }),
    ]);

    if (!streamer) {
      notFound();
    }

    // JSON-LD Structured Data
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${streamer.displayName} Session History`,
      description: `Complete streaming session history for ${streamer.displayName}`,
      url: `https://slotfeed.com/streamer/${username}/sessions`,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: sessions.length,
        itemListElement: sessions.slice(0, 10).map((session, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: `https://slotfeed.com/streamer/${username}/sessions/${session.id}`,
          name: `Session ${new Date(session.startTime).toLocaleDateString()}`,
        })),
      },
      isPartOf: {
        '@type': 'WebSite',
        name: 'SLOTFEED',
        url: 'https://slotfeed.com',
      },
    };

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <SessionsListContent
          streamer={streamer}
          sessions={sessions}
          currentPage={currentPage}
        />
      </>
    );
  } catch {
    // Fall back to client-side rendering
    return (
      <SessionsListContent
        username={username}
        currentPage={currentPage}
        useMockData={true}
      />
    );
  }
}
