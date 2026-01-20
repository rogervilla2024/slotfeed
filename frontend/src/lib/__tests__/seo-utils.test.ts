import {
  generateGameMetadata,
  generateGameStructuredData,
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateCanonicalUrl,
  generateRobotsMeta,
  calculateReadingTime,
  generateOGImageUrl,
  formatSEODescription,
  validateSEOData,
} from '../seo-utils';

describe('SEO Utilities', () => {
  const mockGameData = {
    gameId: 'sweet-bonanza',
    gameName: 'Sweet Bonanza',
    provider: 'Pragmatic Play',
    rtp: 96.48,
    volatility: 'high',
    metaDescription: 'Sweet Bonanza slot review with 96.48% RTP strategy guide',
    focusKeywords: ['sweet bonanza', 'sweet bonanza slot', 'sweet bonanza strategy'],
    imageUrl: 'https://example.com/games/sweet-bonanza.jpg',
    observedRtp: 95.82,
    totalSessions: 5000,
  };

  describe('generateGameMetadata', () => {
    it('should generate valid metadata with game data', () => {
      const metadata = generateGameMetadata(mockGameData);

      expect(metadata).toBeDefined();
      expect(metadata.title).toContain('Sweet Bonanza');
      expect(metadata.title).toContain('96.48%');
      expect(metadata.title).toContain('RTP Review');
      expect(metadata.description).toBeDefined();
      expect(metadata.keywords).toBeDefined();
    });

    it('should generate correct title format', () => {
      const metadata = generateGameMetadata(mockGameData);

      const title = metadata.title as string;
      expect(title.length).toBeLessThanOrEqual(60);
      expect(title).toMatch(/\d+(\.\d+)?%/); // Should contain RTP percentage
    });

    it('should generate description with 160 char limit', () => {
      const metadata = generateGameMetadata(mockGameData);

      const description = metadata.description as string;
      expect(description.length).toBeLessThanOrEqual(160);
    });

    it('should include open graph metadata', () => {
      const metadata = generateGameMetadata(mockGameData);

      expect(metadata.openGraph).toBeDefined();
      expect(metadata.openGraph?.title).toBeDefined();
      expect(metadata.openGraph?.images).toBeDefined();
      expect(metadata.openGraph?.images?.length).toBeGreaterThan(0);
    });

    it('should include twitter metadata', () => {
      const metadata = generateGameMetadata(mockGameData);

      expect(metadata.twitter).toBeDefined();
      expect(metadata.twitter?.card).toBe('summary_large_image');
    });

    it('should generate canonical URL', () => {
      const metadata = generateGameMetadata(mockGameData);

      expect(metadata.alternates).toBeDefined();
      expect(metadata.alternates?.canonical).toContain('sweet-bonanza');
    });

    it('should use custom meta description if provided', () => {
      const customDescription = 'My custom meta description';
      const data = { ...mockGameData, metaDescription: customDescription };

      const metadata = generateGameMetadata(data);
      expect(metadata.description).toContain(customDescription);
    });

    it('should use custom image if provided', () => {
      const metadata = generateGameMetadata(mockGameData);

      expect(metadata.openGraph?.images?.[0].url).toBe(mockGameData.imageUrl);
    });
  });

  describe('generateGameStructuredData', () => {
    it('should generate valid schema.org structured data', () => {
      const schema = generateGameStructuredData(mockGameData);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Game');
      expect(schema.name).toBe('Sweet Bonanza');
    });

    it('should include game details', () => {
      const schema = generateGameStructuredData(mockGameData);

      expect(schema.gameCategory).toBe('Slot Machine');
      expect(schema.inLanguage).toBe('en-US');
      expect(schema.isAccessibleForFree).toBe(true);
    });

    it('should include publisher information', () => {
      const schema = generateGameStructuredData(mockGameData);

      expect(schema.publisher).toBeDefined();
      expect(schema.publisher['@type']).toBe('Organization');
      expect(schema.publisher.name).toBe('Pragmatic Play');
    });

    it('should include aggregate rating when RTP data available', () => {
      const schema = generateGameStructuredData(mockGameData);

      expect(schema.aggregateRating).toBeDefined();
      expect(schema.aggregateRating['@type']).toBe('AggregateRating');
      expect(schema.aggregateRating.ratingValue).toBeDefined();
      expect(schema.aggregateRating.ratingCount).toBe(5000);
    });

    it('should not include aggregate rating without RTP data', () => {
      const dataWithoutRtp = { ...mockGameData, observedRtp: undefined, totalSessions: undefined };
      const schema = generateGameStructuredData(dataWithoutRtp);

      expect(schema.aggregateRating).toBeUndefined();
    });

    it('should calculate rating correctly', () => {
      const schema = generateGameStructuredData(mockGameData);

      // observedRtp / 96 * 5 = 95.82 / 96 * 5 ≈ 4.99
      const expectedRating = Math.min(5, (95.82 / 96) * 5);
      expect(parseFloat(schema.aggregateRating.ratingValue)).toBeCloseTo(expectedRating, 1);
    });
  });

  describe('generateBreadcrumbSchema', () => {
    it('should generate valid breadcrumb schema', () => {
      const schema = generateBreadcrumbSchema('Sweet Bonanza', 'Pragmatic Play');

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('BreadcrumbList');
      expect(schema.itemListElement).toBeDefined();
      expect(Array.isArray(schema.itemListElement)).toBe(true);
    });

    it('should include home breadcrumb', () => {
      const schema = generateBreadcrumbSchema('Sweet Bonanza');
      const home = schema.itemListElement.find((item) => item.name === 'Home');

      expect(home).toBeDefined();
      expect(home?.position).toBe(1);
    });

    it('should include slots breadcrumb', () => {
      const schema = generateBreadcrumbSchema('Sweet Bonanza');
      const slots = schema.itemListElement.find((item) => item.name === 'Slots');

      expect(slots).toBeDefined();
      expect(slots?.position).toBe(2);
    });

    it('should include provider breadcrumb when provided', () => {
      const schema = generateBreadcrumbSchema('Sweet Bonanza', 'Pragmatic Play');
      const provider = schema.itemListElement.find((item) => item.name === 'Pragmatic Play');

      expect(provider).toBeDefined();
      expect(provider?.position).toBe(3);
    });

    it('should include game breadcrumb', () => {
      const schema = generateBreadcrumbSchema('Sweet Bonanza', 'Pragmatic Play');
      const game = schema.itemListElement.find((item) => item.name === 'Sweet Bonanza');

      expect(game).toBeDefined();
      expect(game?.position).toBeGreaterThan(2);
    });

    it('should format provider slug correctly', () => {
      const schema = generateBreadcrumbSchema('Sweet Bonanza', 'Pragmatic Play');
      const provider = schema.itemListElement.find((item) => item.name === 'Pragmatic Play');

      expect(provider?.item).toContain('pragmatic-play');
    });

    it('should format game slug correctly', () => {
      const schema = generateBreadcrumbSchema('Sweet Bonanza');
      const game = schema.itemListElement.find((item) => item.name === 'Sweet Bonanza');

      expect(game?.item).toContain('sweet-bonanza');
    });
  });

  describe('generateFAQSchema', () => {
    it('should generate valid FAQ schema', () => {
      const schema = generateFAQSchema();

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('FAQPage');
      expect(schema.mainEntity).toBeDefined();
      expect(Array.isArray(schema.mainEntity)).toBe(true);
    });

    it('should include RTP question', () => {
      const schema = generateFAQSchema();
      const rtpQuestion = schema.mainEntity.find((q) =>
        q.name.toLowerCase().includes('rtp')
      );

      expect(rtpQuestion).toBeDefined();
      expect(rtpQuestion?.acceptedAnswer).toBeDefined();
    });

    it('should include volatility question', () => {
      const schema = generateFAQSchema();
      const volatilityQuestion = schema.mainEntity.find((q) =>
        q.name.toLowerCase().includes('volatility')
      );

      expect(volatilityQuestion).toBeDefined();
      expect(volatilityQuestion?.acceptedAnswer).toBeDefined();
    });

    it('should include strategy question', () => {
      const schema = generateFAQSchema();
      const strategyQuestion = schema.mainEntity.find((q) =>
        q.name.toLowerCase().includes('chances')
      );

      expect(strategyQuestion).toBeDefined();
      expect(strategyQuestion?.acceptedAnswer).toBeDefined();
    });

    it('should have proper schema structure for each question', () => {
      const schema = generateFAQSchema();

      schema.mainEntity.forEach((item) => {
        expect(item['@type']).toBe('Question');
        expect(item.name).toBeDefined();
        expect(item.acceptedAnswer).toBeDefined();
        expect(item.acceptedAnswer['@type']).toBe('Answer');
        expect(item.acceptedAnswer.text).toBeDefined();
      });
    });
  });

  describe('generateCanonicalUrl', () => {
    it('should generate valid canonical URL', () => {
      const url = generateCanonicalUrl('sweet-bonanza');

      expect(url).toContain('slotfeed.com');
      expect(url).toContain('sweet-bonanza');
      expect(url).toContain('/slot/');
    });

    it('should use environment URL if available', () => {
      const originalUrl = process.env.NEXT_PUBLIC_SITE_URL;
      process.env.NEXT_PUBLIC_SITE_URL = 'https://custom.com';

      const url = generateCanonicalUrl('test-game');
      expect(url).toContain('custom.com');

      process.env.NEXT_PUBLIC_SITE_URL = originalUrl;
    });
  });

  describe('generateRobotsMeta', () => {
    it('should return noindex for unpublished content', () => {
      const robots = generateRobotsMeta(false);

      expect(robots).toContain('noindex');
      expect(robots).toContain('nofollow');
    });

    it('should return index for published content', () => {
      const robots = generateRobotsMeta(true);

      expect(robots).toContain('index');
      expect(robots).toContain('follow');
      expect(robots).toContain('max-image-preview:large');
    });
  });

  describe('calculateReadingTime', () => {
    it('should calculate reading time correctly', () => {
      const content = 'word '.repeat(200); // 200 words
      const time = calculateReadingTime(content);

      expect(time).toBe(1); // 200 words / 200 wpm = 1 minute
    });

    it('should round up reading time', () => {
      const content = 'word '.repeat(250); // 250 words
      const time = calculateReadingTime(content);

      expect(time).toBe(2); // 250 / 200 = 1.25, rounded up to 2
    });

    it('should handle short content', () => {
      const content = 'word '.repeat(50);
      const time = calculateReadingTime(content);

      expect(time).toBe(1); // Minimum 1 minute
    });
  });

  describe('generateOGImageUrl', () => {
    it('should generate OG image URL with parameters', () => {
      const url = generateOGImageUrl('Sweet Bonanza', 96.48, 'high');

      expect(url).toContain('/api/og');
      expect(url).toContain('Sweet Bonanza');
      expect(url).toContain('96.48');
      expect(url).toContain('high');
    });

    it('should encode parameters correctly', () => {
      const url = generateOGImageUrl('Game With Spaces', 95.5, 'very high');

      expect(url).toContain('title=Game');
      expect(url).toContain('rtp=95.5');
    });
  });

  describe('formatSEODescription', () => {
    it('should return short description as-is', () => {
      const description = 'This is a short description';
      const result = formatSEODescription(description);

      expect(result).toBe(description);
    });

    it('should truncate long description at 160 chars', () => {
      const longDescription = 'a'.repeat(170);
      const result = formatSEODescription(longDescription, 160);

      expect(result.length).toBe(160);
      expect(result).toEndWith('...');
    });

    it('should respect custom max length', () => {
      const description = 'a'.repeat(150);
      const result = formatSEODescription(description, 100);

      expect(result.length).toBeLessThanOrEqual(100);
    });
  });

  describe('validateSEOData', () => {
    it('should validate complete SEO data', () => {
      const result = validateSEOData(mockGameData);

      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should report missing gameId', () => {
      const invalidData = { ...mockGameData, gameId: '' };
      const result = validateSEOData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.issues).toContain(expect.stringContaining('gameId'));
    });

    it('should report invalid RTP range', () => {
      const invalidData = { ...mockGameData, rtp: 105 };
      const result = validateSEOData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.issues.some((issue) => issue.includes('RTP'))).toBe(true);
    });

    it('should report meta description too long', () => {
      const invalidData = {
        ...mockGameData,
        metaDescription: 'a'.repeat(161),
      };
      const result = validateSEOData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.issues.some((issue) => issue.includes('Meta description'))).toBe(true);
    });

    it('should report insufficient keywords', () => {
      const invalidData = {
        ...mockGameData,
        focusKeywords: ['one', 'two'],
      };
      const result = validateSEOData(invalidData);

      expect(result.valid).toBe(false);
      expect(result.issues.some((issue) => issue.includes('keywords'))).toBe(true);
    });
  });
});
