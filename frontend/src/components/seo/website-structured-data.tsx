/**
 * WebSite Structured Data Component
 * Generates WebSite JSON-LD markup for global site info
 *
 * Test: https://search.google.com/test/rich-results
 * Docs: https://developers.google.com/search/docs/appearance/structured-data/sitelinks-searchbox
 *
 * This enables sitelinks searchbox in Google Search
 */

const SITE_URL = 'https://liveslotdata.com';
const SITE_NAME = 'LiveSlotData';

interface WebSiteStructuredDataProps {
  /** Enable search action for sitelinks searchbox */
  enableSearch?: boolean;
  /** Search URL template (must contain {search_term_string}) */
  searchUrlTemplate?: string;
}

export function WebSiteStructuredData({
  enableSearch = true,
  searchUrlTemplate = `${SITE_URL}/search?q={search_term_string}`,
}: WebSiteStructuredDataProps) {
  const websiteSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    alternateName: ['LiveSlotData', 'Live Slot Data', 'Slot Streaming Analytics'],
    url: SITE_URL,
    description:
      'Real-time slot streaming analytics platform. Track live streamers like Roshtein, Trainwreckstv, ClassyBeef. Analyze RTP, discover hot slots, and get big win alerts.',
    inLanguage: 'en-US',
    publisher: {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
        width: 512,
        height: 512,
        caption: SITE_NAME,
      },
      sameAs: [
        'https://twitter.com/liveslotdata',
        'https://discord.gg/liveslotdata',
      ],
    },
    copyrightYear: new Date().getFullYear(),
    copyrightHolder: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
  };

  if (enableSearch) {
    websiteSchema.potentialAction = {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: searchUrlTemplate,
      },
      'query-input': 'required name=search_term_string',
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(websiteSchema),
      }}
    />
  );
}

/**
 * Organization Schema - for brand information
 */
export function OrganizationStructuredData() {
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      '@id': `${SITE_URL}/#logo`,
      url: `${SITE_URL}/logo.png`,
      width: 512,
      height: 512,
      caption: SITE_NAME,
    },
    image: `${SITE_URL}/og-image.png`,
    description:
      'LiveSlotData is a real-time analytics platform for slot streaming. Track live streamers, analyze RTP, discover hot slots, and get big win alerts from Kick, Twitch & YouTube streams.',
    foundingDate: '2024',
    sameAs: [
      'https://twitter.com/liveslotdata',
      'https://discord.gg/liveslotdata',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'support@liveslotdata.com',
      availableLanguage: ['English'],
    },
    areaServed: {
      '@type': 'Place',
      name: 'Worldwide',
    },
    knowsAbout: [
      'Slot Machine Analytics',
      'Casino Streaming',
      'RTP Analysis',
      'Live Streaming Data',
      'Gambling Statistics',
      'Slot Streamers',
      'Kick Streaming',
      'Bonus Hunts',
    ],
    slogan: 'Real-Time Slot Streaming Analytics',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(orgSchema),
      }}
    />
  );
}

/**
 * WebPage Schema - for individual pages
 */
interface WebPageStructuredDataProps {
  /** Page title */
  name: string;
  /** Page description */
  description: string;
  /** Page URL */
  url: string;
  /** Page type */
  type?:
    | 'WebPage'
    | 'AboutPage'
    | 'ContactPage'
    | 'FAQPage'
    | 'CollectionPage'
    | 'ItemPage'
    | 'ProfilePage'
    | 'SearchResultsPage';
  /** Date published */
  datePublished?: string;
  /** Date modified */
  dateModified?: string;
  /** Primary image */
  primaryImage?: string;
  /** Breadcrumb items */
  breadcrumbs?: Array<{ name: string; url: string }>;
}

export function WebPageStructuredData({
  name,
  description,
  url,
  type = 'WebPage',
  datePublished,
  dateModified,
  primaryImage,
  breadcrumbs,
}: WebPageStructuredDataProps) {
  const schemas: Record<string, unknown>[] = [];

  // WebPage schema
  const pageSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': type,
    '@id': `${url}/#webpage`,
    name,
    description,
    url,
    inLanguage: 'en-US',
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
  };

  if (datePublished) {
    pageSchema.datePublished = datePublished;
  }

  if (dateModified) {
    pageSchema.dateModified = dateModified;
  }

  if (primaryImage) {
    pageSchema.primaryImageOfPage = {
      '@type': 'ImageObject',
      url: primaryImage,
    };
  }

  schemas.push(pageSchema);

  // BreadcrumbList schema
  if (breadcrumbs && breadcrumbs.length > 0) {
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    };
    schemas.push(breadcrumbSchema);
  }

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema),
          }}
        />
      ))}
    </>
  );
}

/**
 * SoftwareApplication Schema - for PWA/app listing
 */
export function SoftwareApplicationStructuredData() {
  const appSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${SITE_URL}/#app`,
    name: SITE_NAME,
    applicationCategory: 'EntertainmentApplication',
    operatingSystem: 'Web Browser, iOS, Android',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    description:
      'Real-time slot streaming analytics. Track live streamers like Roshtein and Trainwreckstv, analyze RTP, and get alerts for big wins.',
    screenshot: `${SITE_URL}/screenshots/dashboard.png`,
    featureList: [
      'Live stream tracking from Kick, Twitch & YouTube',
      'Real-time RTP analysis',
      'Hot/cold slot indicators',
      'Big win alerts and notifications',
      'Streamer leaderboards',
      'Bonus hunt tracking',
      'Session history and analytics',
    ],
    provider: {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(appSchema),
      }}
    />
  );
}
