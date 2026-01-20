import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '..', 'data', 'streamers');

export async function GET() {
  try {
    // Read all streamer JSON files
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));

    const streamers = files.map(file => {
      const filePath = path.join(DATA_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      // Transform Kick API data to our format
      return {
        id: data.slug || data.user?.username,
        username: data.slug || data.user?.username,
        displayName: data.user?.username || data.slug,
        platform: 'kick',
        platformId: String(data.id),
        avatarUrl: data.user?.profile_pic,
        bio: data.user?.bio,
        followerCount: data.followersCount || 0,
        isLive: data.livestream !== null,
        livestream: data.livestream ? {
          id: data.livestream.id,
          title: data.livestream.session_title,
          viewerCount: data.livestream.viewer_count,
          startedAt: data.livestream.created_at,
          thumbnail: data.livestream.thumbnail?.url,
        } : null,
        lifetimeStats: {
          totalSessions: 0,
          totalHoursStreamed: 0,
          totalWagered: 0,
          totalWon: 0,
          biggestWin: 0,
          biggestMultiplier: 0,
          averageRtp: 0,
        },
        createdAt: data.user?.created_at,
        updatedAt: new Date().toISOString(),
      };
    });

    return NextResponse.json(streamers);
  } catch (error) {
    console.error('Error reading streamer data:', error);
    return NextResponse.json({ error: 'Failed to load streamers' }, { status: 500 });
  }
}
