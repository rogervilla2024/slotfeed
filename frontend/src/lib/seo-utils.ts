/**
 * SEO Utilities
 * Functions for generating SEO metadata, structured data, and rich snippets
 */

import { Metadata } from 'next'

interface GameSEOData {
  gameId: string
  gameName: string
  provider: string
  rtp: number
  volatility: string
  description?: string
  metaDescription?: string
  focusKeywords?: string[]
  imageUrl?: string
  observedRtp?: number
  totalSessions?: number
}

/**
 * Generate metadata for a slot game page
 */
export function generateGameMetadata(data: GameSEOData): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://liveslotdata.com'
  const gameUrl = `${baseUrl}/slot/${data.gameId}`

  // Generate title (60 chars max for optimal display in SERPs)
  const title = `${data.gameName} Slot: ${data.rtp}% RTP Review & Strategy Guide`

  // Generate meta description (160 chars max)
  const metaDescription =
    data.metaDescription ||
    `${data.gameName} slot game review: ${data.rtp}% RTP, ${data.volatility} volatility. Strategy guide, bonus features, and streamer insights.`

  // Generate keywords
  const keywords = data.focusKeywords || [
    data.gameName,
    `${data.gameName} slot`,
    `${data.gameName} RTP`,
    `${data.gameName} strategy`,
    data.provider,
    `${data.volatility} volatility slot`,
    'slot strategy',
    'slot review',
  ]

  return {
    title: title,
    description: metaDescription.substring(0, 160),
    keywords: keywords.join(', '),
    openGraph: {
      title: title,
      description: metaDescription.substring(0, 160),
      url: gameUrl,
      type: 'website',
      images: [
        {
          url: data.imageUrl || `${baseUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: `${data.gameName} slot game`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: metaDescription.substring(0, 160),
      images: [data.imageUrl || `${baseUrl}/og-image.png`],
    },
    alternates: {
      canonical: gameUrl,
    },
  }
}

/**
 * Generate JSON-LD structured data for a game
 */
export function generateGameStructuredData(data: GameSEOData) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://liveslotdata.com'

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Game',
    name: data.gameName,
    url: `${baseUrl}/slot/${data.gameId}`,
    image: data.imageUrl || `${baseUrl}/og-image.png`,
    description:
      data.description ||
      `${data.gameName} slot game with ${data.rtp}% RTP and ${data.volatility} volatility`,
    gameCategory: 'Slot Machine',
    releaseDate: new Date().toISOString().split('T')[0],
    publisher: {
      '@type': 'Organization',
      name: data.provider,
      logo: `${baseUrl}/logo.png`,
    },
    author: {
      '@type': 'Organization',
      name: 'LiveSlotData',
      url: baseUrl,
    },
    isAccessibleForFree: true,
    inLanguage: 'en-US',
  }

  // Add aggregate rating if we have observed RTP data
  if (data.observedRtp && data.totalSessions) {
    const ratingValue = Math.min(5, (data.observedRtp / 96) * 5)
    ;(schema as any).aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: ratingValue.toFixed(1),
      ratingCount: data.totalSessions,
      bestRating: '5',
      worstRating: '1',
    }
  }

  return schema
}

/**
 * Generate breadcrumb structured data
 */
export function generateBreadcrumbSchema(gameName: string, provider?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://liveslotdata.com'

  const breadcrumbs = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: baseUrl,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Slots',
      item: `${baseUrl}/slots`,
    },
  ]

  if (provider) {
    breadcrumbs.push({
      '@type': 'ListItem',
      position: 3,
      name: provider,
      item: `${baseUrl}/provider/${provider.toLowerCase().replace(/\s+/g, '-')}`,
    })
  }

  breadcrumbs.push({
    '@type': 'ListItem',
    position: breadcrumbs.length + 1,
    name: gameName,
    item: `${baseUrl}/slot/${gameName.toLowerCase().replace(/\s+/g, '-')}`,
  })

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs,
  }
}

/**
 * Generate FAQ structured data
 */
export function generateFAQSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is RTP in slot games?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'RTP (Return to Player) is the percentage of all wagered money a slot machine will pay back to players over time. For example, a 96% RTP means that for every $100 wagered, the game is expected to return $96 over a large number of spins.',
        },
      },
      {
        '@type': 'Question',
        name: 'What does volatility mean in slots?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Volatility (also called variance) describes how often and how much a slot game pays. Low volatility games have frequent small wins, while high volatility games have rare but large wins.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I improve my chances at slots?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Slot outcomes are determined by RNG (Random Number Generator) technology, so individual outcomes cannot be predicted or improved. However, you can manage your bankroll, understand the game mechanics, and play responsibly.',
        },
      },
    ],
  }
}

/**
 * Generate canonical URL
 */
export function generateCanonicalUrl(gameId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://liveslotdata.com'
  return `${baseUrl}/slot/${gameId}`
}

/**
 * Generate robots meta tag
 */
export function generateRobotsMeta(isPublished: boolean): string {
  if (!isPublished) {
    return 'noindex, nofollow'
  }
  return 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
}

/**
 * Extract reading time from content
 */
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200
  const wordCount = content.split(/\s+/).length
  return Math.ceil(wordCount / wordsPerMinute)
}

/**
 * Generate OG image URL with game data
 */
export function generateOGImageUrl(
  gameName: string,
  rtp: number,
  volatility: string
): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://liveslotdata.com'

  // In production, this could use an image generation service like Vercel OG Images
  // For now, return a placeholder
  const params = new URLSearchParams({
    title: gameName,
    rtp: rtp.toString(),
    volatility,
  })

  return `${baseUrl}/api/og?${params.toString()}`
}

/**
 * Format description for SEO (ensure it's within limits)
 */
export function formatSEODescription(description: string, maxLength: number = 160): string {
  if (description.length <= maxLength) {
    return description
  }

  // Truncate and add ellipsis
  return description.substring(0, maxLength - 3) + '...'
}

/**
 * Validate SEO data completeness
 */
export function validateSEOData(data: GameSEOData): {
  valid: boolean
  issues: string[]
} {
  const issues: string[] = []

  if (!data.gameId) issues.push('Missing gameId')
  if (!data.gameName) issues.push('Missing gameName')
  if (!data.provider) issues.push('Missing provider')
  if (!data.rtp || data.rtp < 85 || data.rtp > 100) issues.push('Invalid RTP range')
  if (!data.volatility) issues.push('Missing volatility')

  if (data.metaDescription && data.metaDescription.length > 160) {
    issues.push('Meta description too long (> 160 chars)')
  }

  if (data.focusKeywords && data.focusKeywords.length < 3) {
    issues.push('Insufficient keywords (minimum 3)')
  }

  return {
    valid: issues.length === 0,
    issues,
  }
}
