import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '8';

    const backendUrl = `${BACKEND_URL}/api/v1/live/rtp-tracker?limit=${limit}`;

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
    console.error('Error proxying rtp-tracker:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
