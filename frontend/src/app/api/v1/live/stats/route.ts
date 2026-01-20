import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET() {
  try {
    const backendUrl = `${BACKEND_URL}/api/v1/live/stats`;

    const response = await fetch(backendUrl, {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({
        activeStreamers: 0,
        totalViewers: 0,
        platforms: { kick: 0, twitch: 0, youtube: 0 }
      }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying stats:', error);
    return NextResponse.json({
      activeStreamers: 0,
      totalViewers: 0,
      platforms: { kick: 0, twitch: 0, youtube: 0 }
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
