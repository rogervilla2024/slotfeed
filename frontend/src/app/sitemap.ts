/**
 * Main Sitemap for LiveSlotData
 * Generates sitemap.xml with all static pages
 *
 * Dynamic content (streamers, games) are in separate sitemaps
 */

import { MetadataRoute } from 'next';

const SITE_URL = 'https://liveslotdata.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static pages with their update frequencies and priorities
  const staticPages: MetadataRoute.Sitemap = [
    // Homepage - highest priority, updates frequently
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    // Main listing pages - high priority
    {
      url: `${SITE_URL}/streamers`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/slots`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    // Analytics and live data pages
    {
      url: `${SITE_URL}/big-wins`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/leaderboards`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/hot-cold`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/bonus-hunts`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.7,
    },
    // Insights and analytics
    {
      url: `${SITE_URL}/rtp-insights`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/analytics`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.6,
    },
    // Tools
    {
      url: `${SITE_URL}/compare`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.5,
    },
    // Educational content
    {
      url: `${SITE_URL}/guides`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ];

  return staticPages;
}
