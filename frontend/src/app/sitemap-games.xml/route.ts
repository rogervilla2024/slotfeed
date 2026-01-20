/**
 * Dynamic Sitemap for Games/Slots
 * Generates sitemap-games.xml with all game detail URLs
 */

import { NextResponse } from 'next/server';

const SITE_URL = 'https://liveslotdata.com';
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Game {
  id: string;
  slug: string;
  name: string;
  updated_at?: string;
  provider?: {
    slug: string;
  };
}

interface Provider {
  id: string;
  slug: string;
  name: string;
  updated_at?: string;
}

export async function GET() {
  try {
    // Fetch all games and providers from the API
    const [gamesResponse, providersResponse] = await Promise.all([
      fetch(`${BACKEND_URL}/api/v1/games?limit=1000&is_active=true`, {
        next: { revalidate: 3600 },
      }),
      fetch(`${BACKEND_URL}/api/v1/providers?limit=100`, {
        next: { revalidate: 3600 },
      }),
    ]);

    let games: Game[] = [];
    let providers: Provider[] = [];

    if (gamesResponse.ok) {
      const data = await gamesResponse.json();
      games = data.games || data.items || data || [];
    }

    if (providersResponse.ok) {
      const data = await providersResponse.json();
      providers = data.providers || data.items || data || [];
    }

    // Generate XML sitemap
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${providers
    .map(
      (provider) => `
  <url>
    <loc>${SITE_URL}/provider/${encodeURIComponent(provider.slug)}</loc>
    <lastmod>${provider.updated_at || new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
    )
    .join('')}
  ${games
    .map(
      (game) => `
  <url>
    <loc>${SITE_URL}/slot/${encodeURIComponent(game.slug || game.id)}</loc>
    <lastmod>${game.updated_at || new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
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
    console.error('Error generating games sitemap:', error);

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
