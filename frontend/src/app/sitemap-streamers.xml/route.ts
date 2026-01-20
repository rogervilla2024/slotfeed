/**
 * Dynamic Sitemap for Streamers
 * Generates sitemap-streamers.xml with all streamer profile URLs
 */

import { NextResponse } from 'next/server';

const SITE_URL = 'https://liveslotdata.com';
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Streamer {
  id: string;
  username: string;
  updated_at?: string;
  last_live_at?: string;
}

export async function GET() {
  try {
    // Fetch all active streamers from the API
    const response = await fetch(`${BACKEND_URL}/api/v1/streamers?limit=1000&is_active=true`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    let streamers: Streamer[] = [];

    if (response.ok) {
      const data = await response.json();
      streamers = data.streamers || data.items || data || [];
    }

    // Generate XML sitemap
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${streamers
    .map(
      (streamer) => `
  <url>
    <loc>${SITE_URL}/streamer/${encodeURIComponent(streamer.username)}</loc>
    <lastmod>${streamer.updated_at || streamer.last_live_at || new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}/streamer/${encodeURIComponent(streamer.username)}/sessions</loc>
    <lastmod>${streamer.last_live_at || new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>`
    )
    .join('')}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error generating streamers sitemap:', error);

    // Return empty sitemap on error
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  }
}
