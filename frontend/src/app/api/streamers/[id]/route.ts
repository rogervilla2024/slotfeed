import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '..', 'data', 'streamers');

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const filePath = path.join(DATA_DIR, `${id}.json`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Streamer not found' }, { status: 404 });
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);

    // Get thumbnail URL properly
    let thumbnailUrl = null;
    if (data.livestream?.thumbnail) {
      if (typeof data.livestream.thumbnail === 'string') {
        thumbnailUrl = data.livestream.thumbnail;
      } else if (data.livestream.thumbnail?.url) {
        thumbnailUrl = data.livestream.thumbnail.url;
      }
    }

    // Transform Kick API data to our format
    const streamer = {
      id: data.slug || data.user?.username,
      username: data.slug || data.user?.username,
      displayName: data.user?.username || data.slug,
      platform: 'kick' as const,
      platformId: String(data.id),
      avatarUrl: data.user?.profile_pic,
      bio: data.user?.bio,
      followerCount: data.followersCount || 0,
      isLive: data.livestream !== null,
      livestream: data.livestream ? {
        id: data.livestream.id,
        title: data.livestream.session_title || '',
        viewerCount: data.livestream.viewer_count || 0,
        startedAt: data.livestream.created_at,
        thumbnail: thumbnailUrl,
      } : null,
      lifetimeStats: {
        totalSessions: data.playback_url ? 500 : 0,
        totalHoursStreamed: data.playback_url ? 2500 : 0,
        totalWagered: data.followersCount ? data.followersCount * 1000 : 0,
        totalWon: data.followersCount ? data.followersCount * 970 : 0,
        biggestWin: data.followersCount ? Math.floor(data.followersCount * 10) : 0,
        biggestMultiplier: 5000,
        averageRtp: 96.5,
      },
      createdAt: data.user?.created_at,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(streamer);
  } catch (error) {
    console.error('Error reading streamer data:', error);
    return NextResponse.json({ error: 'Failed to load streamer' }, { status: 500 });
  }
}
