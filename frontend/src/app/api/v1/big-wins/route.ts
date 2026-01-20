import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '10';
    const sort = searchParams.get('sort') || 'recent';

    const backendUrl = `${BACKEND_URL}/api/v1/live/big-wins?limit=${limit}&sort=${sort}`;

    const response = await fetch(backendUrl, {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json([], { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying big-wins:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
