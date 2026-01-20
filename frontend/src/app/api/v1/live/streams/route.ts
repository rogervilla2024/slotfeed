import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');

    // Build backend URL
    let backendUrl = `${BACKEND_URL}/api/v1/live/streams`;
    if (platform) {
      backendUrl += `?platform=${platform}`;
    }

    // Proxy to FastAPI backend
    const response = await fetch(backendUrl, {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store', // Don't cache, always get fresh data
    });

    if (!response.ok) {
      console.error('Backend error:', response.status, response.statusText);
      return NextResponse.json([], { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying to backend:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
