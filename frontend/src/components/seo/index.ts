/**
 * SEO Structured Data Components
 *
 * This module exports all structured data components for Google Rich Results.
 *
 * ## Testing Your Schema
 * 1. Google Rich Results Test: https://search.google.com/test/rich-results
 * 2. Schema.org Validator: https://validator.schema.org/
 *
 * ## Implementation Checklist
 * - [ ] WebSite schema in layout.tsx (global)
 * - [ ] FAQPage schema in slot/[id] and guides pages
 * - [ ] BroadcastEvent schema for live streamers
 * - [ ] VideoObject schema in big-wins page
 * - [ ] ItemList schema in leaderboard and hot-cold pages
 * - [ ] HowTo schema in guides page
 * - [ ] Article schema for daily summaries
 * - [ ] Person schema in streamer profiles
 * - [ ] Game schema in slot pages
 *
 * ## Priority Order (by traffic potential)
 * 1. FAQPage - High search volume for "X RTP", "how to" queries
 * 2. BroadcastEvent - "X streamer live" queries + LIVE badge
 * 3. VideoObject - Video carousel in search results
 * 4. ItemList - Featured snippets for rankings
 * 5. HowTo - Step-by-step rich snippets
 * 6. Article - Google News eligibility
 * 7. Person - Knowledge panel potential
 * 8. WebSite - Sitelinks searchbox
 */

// Game/Slot schemas
export {
  GameStructuredData,
  SlotPageStructuredData,
} from './game-structured-data';

// FAQ schema
export {
  FAQStructuredData,
  generateSlotFAQs,
  generateRTPFAQs,
  type FAQItem,
} from './faq-structured-data';

// Broadcast/Livestream schemas
export {
  BroadcastStructuredData,
  MultipleBroadcastsStructuredData,
} from './broadcast-structured-data';

// Video schemas
export {
  VideoStructuredData,
  BigWinVideoStructuredData,
  VideoListStructuredData,
} from './video-structured-data';

// ItemList/Ranking schemas
export {
  ItemListStructuredData,
  StreamerLeaderboardStructuredData,
  SlotGamesListStructuredData,
  HotColdSlotsStructuredData,
  BigWinsListStructuredData,
} from './itemlist-structured-data';

// HowTo/Guide schemas
export {
  HowToStructuredData,
  BankrollManagementHowTo,
  ReadingStatsHowTo,
  UnderstandingVolatilityHowTo,
  UsingLiveSlotDataHowTo,
  type HowToStep,
} from './howto-structured-data';

// Article schemas
export {
  ArticleStructuredData,
  BigWinsDailySummary,
  SessionRecapArticle,
  HotSlotAlertArticle,
} from './article-structured-data';

// Person/Streamer schemas
export {
  PersonStructuredData,
  StreamerProfilePageStructuredData,
  StreamerBreadcrumbStructuredData,
} from './person-structured-data';

// Website/Global schemas
export {
  WebSiteStructuredData,
  OrganizationStructuredData,
  WebPageStructuredData,
  SoftwareApplicationStructuredData,
} from './website-structured-data';
