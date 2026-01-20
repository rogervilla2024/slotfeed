import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SessionDetailContent } from '@/components/session/session-detail-content';
import { api } from '@/lib/api';

interface PageProps {
  params: Promise<{
    username: string;
    sessionId: string;
  }>;
}

// Generate SEO metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username, sessionId } = await params;

  try {
    const session = await api.sessions.get(sessionId);
    const streamer = await api.streamers.get(username);

    const sessionDate = new Date(session.startTime).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const profit = session.currentBalance - session.startBalance;
    const profitPercent = ((profit / session.startBalance) * 100).toFixed(1);
    const profitText = profit >= 0 ? `+$${profit.toLocaleString()}` : `-$${Math.abs(profit).toLocaleString()}`;

    const title = `${streamer.displayName} Session ${sessionDate} | ${profitText} (${profitPercent}%) | SLOTFEED`;
    const description = `Watch ${streamer.displayName}'s slot streaming session from ${sessionDate}. Started with $${session.startBalance.toLocaleString()}, ended with $${session.currentBalance.toLocaleString()}. Peak: $${session.peakBalance.toLocaleString()}, wagered $${session.totalWagered.toLocaleString()}.`;

    const canonicalUrl = `https://slotfeed.com/streamer/${username}/sessions/${sessionId}`;

    return {
      title,
      description,
      keywords: [
        streamer.displayName,
        'slot streaming',
        'casino session',
        sessionDate,
        'gambling stats',
        'slot statistics',
        streamer.platform,
      ],
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        siteName: 'SLOTFEED',
        type: 'article',
        publishedTime: session.startTime,
        modifiedTime: session.endTime || session.startTime,
        authors: [streamer.displayName],
        images: [
          {
            url: streamer.avatarUrl || '/og-default.png',
            width: 1200,
            height: 630,
            alt: `${streamer.displayName} session on ${sessionDate}`,
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
      title: `Session ${sessionId} | SLOTFEED`,
      description: 'Slot streaming session analytics and statistics.',
    };
  }
}

// Generate static paths for popular sessions
export async function generateStaticParams() {
  try {
    const streamers = await api.streamers.list({ limit: 50 });
    const params: { username: string; sessionId: string }[] = [];

    for (const streamer of streamers) {
      const sessions = await api.sessions.list({
        streamerId: streamer.id,
        limit: 10
      });

      for (const session of sessions) {
        params.push({
          username: streamer.username,
          sessionId: session.id,
        });
      }
    }

    return params;
  } catch {
    return [];
  }
}

export default async function SessionDetailPage({ params }: PageProps) {
  const { username, sessionId } = await params;

  try {
    const [session, streamer] = await Promise.all([
      api.sessions.get(sessionId),
      api.streamers.get(username),
    ]);

    if (!session || !streamer) {
      notFound();
    }

    // JSON-LD Structured Data for SEO
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: `${streamer.displayName} Slot Session`,
      description: `Slot streaming session by ${streamer.displayName}`,
      startDate: session.startTime,
      endDate: session.endTime || undefined,
      eventStatus: session.status === 'live'
        ? 'https://schema.org/EventScheduled'
        : 'https://schema.org/EventEnded',
      eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
      location: {
        '@type': 'VirtualLocation',
        url: `https://kick.com/${username}`,
      },
      performer: {
        '@type': 'Person',
        name: streamer.displayName,
        url: `https://slotfeed.com/streamer/${username}`,
      },
      organizer: {
        '@type': 'Organization',
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
        <SessionDetailContent
          session={session}
          streamer={streamer}
        />
      </>
    );
  } catch {
    // Fall back to client-side rendering
    return (
      <SessionDetailContent
        username={username}
        sessionId={sessionId}
      />
    );
  }
}
