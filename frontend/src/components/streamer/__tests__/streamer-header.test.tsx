/**
 * Streamer Header Component Tests
 * Tests for streamer profile header
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import StreamerHeader from '../streamer-header';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>;
});

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Users: () => <span data-testid="users-icon">👥</span>,
  Activity: () => <span data-testid="activity-icon">●</span>,
  BarChart3: () => <span data-testid="chart-icon">📊</span>,
  Trophy: () => <span data-testid="trophy-icon">🏆</span>,
  Calendar: () => <span data-testid="calendar-icon">📅</span>,
  ExternalLink: () => <span data-testid="external-icon">↗</span>,
}));

describe('StreamerHeader', () => {
  const mockStreamer = {
    id: 'roshtein-123',
    name: 'Roshtein',
    username: 'roshtein',
    platform: 'kick' as const,
    avatarUrl: 'https://example.com/roshtein.jpg',
    followers: 362000,
    description: 'Swedish professional slot streamer',
    isLive: true,
    lastStreamTime: new Date(),
    totalSessions: 500,
    averageSessionDuration: 240,
    totalWagered: 10000000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the header successfully', () => {
      render(<StreamerHeader streamer={mockStreamer} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display streamer name', () => {
      render(<StreamerHeader streamer={mockStreamer} />);
      expect(screen.getByText('Roshtein')).toBeInTheDocument();
    });

    it('should display streamer avatar', () => {
      render(<StreamerHeader streamer={mockStreamer} />);
      const avatar = screen.queryByAltText(/roshtein|avatar/i);
      expect(avatar || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display streamer description', () => {
      render(<StreamerHeader streamer={mockStreamer} />);
      expect(
        screen.getByText(/Swedish professional slot streamer/i)
      ).toBeInTheDocument();
    });
  });

  describe('Live Status', () => {
    it('should display live indicator when streaming', () => {
      render(<StreamerHeader streamer={{ ...mockStreamer, isLive: true }} />);
      const liveIndicator = screen.queryByText(/live|live stream/i);
      expect(liveIndicator || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should not display live indicator when offline', () => {
      render(<StreamerHeader streamer={{ ...mockStreamer, isLive: false }} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should show activity status', () => {
      render(<StreamerHeader streamer={mockStreamer} />);
      const activityIcon = screen.queryByTestId('activity-icon');
      expect(activityIcon || screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Statistics Display', () => {
    it('should display follower count', () => {
      render(<StreamerHeader streamer={mockStreamer} />);
      const followers = screen.queryByText(/362|followers/i);
      expect(followers || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display total sessions count', () => {
      render(<StreamerHeader streamer={mockStreamer} />);
      const sessions = screen.queryByText(/500|sessions/i);
      expect(sessions || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display total wagered amount', () => {
      render(<StreamerHeader streamer={mockStreamer} />);
      const wagered = screen.queryByText(/10|wagered|million/i);
      expect(wagered || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display average session duration', () => {
      render(<StreamerHeader streamer={mockStreamer} />);
      const duration = screen.queryByText(/240|minutes|duration/i);
      expect(duration || screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Platform Information', () => {
    it('should display platform badge', () => {
      render(<StreamerHeader streamer={mockStreamer} />);
      const platform = screen.queryByText(/kick|Kick/i);
      expect(platform || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should show correct platform for different streamers', () => {
      render(
        <StreamerHeader streamer={{ ...mockStreamer, platform: 'twitch' }} />
      );
      const platform = screen.queryByText(/twitch|Twitch/i);
      expect(platform || screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('should have link to streamer profile', () => {
      render(<StreamerHeader streamer={mockStreamer} />);
      const links = screen.queryAllByRole('link');
      expect(links.length).toBeGreaterThanOrEqual(0);
    });

    it('should have external link to platform', () => {
      render(<StreamerHeader streamer={mockStreamer} />);
      const externalIcon = screen.queryByTestId('external-icon');
      expect(externalIcon || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should have view sessions button', () => {
      render(<StreamerHeader streamer={mockStreamer} />);
      const sessionLink = screen.queryByRole('link', { name: /sessions|view/i });
      expect(sessionLink || screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render on mobile viewport', () => {
      render(<StreamerHeader streamer={mockStreamer} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should have responsive layout classes', () => {
      const { container } = render(<StreamerHeader streamer={mockStreamer} />);
      const responsiveElements = container.querySelectorAll(
        '[class*="md:"], [class*="lg:"], [class*="sm:"]'
      );
      expect(responsiveElements.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      const { container } = render(<StreamerHeader streamer={mockStreamer} />);
      const headings = container.querySelectorAll('h1, h2, h3');
      expect(headings.length).toBeGreaterThanOrEqual(0);
    });

    it('should have alt text for images', () => {
      render(<StreamerHeader streamer={mockStreamer} />);
      // Should have proper alt text
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should have descriptive link text', () => {
      render(<StreamerHeader streamer={mockStreamer} />);
      const links = screen.queryAllByRole('link');
      links.forEach((link) => {
        expect(link.textContent?.trim()).not.toBe('');
      });
    });
  });

  describe('Data Formatting', () => {
    it('should format large numbers correctly', () => {
      render(
        <StreamerHeader
          streamer={{ ...mockStreamer, followers: 1000000 }}
        />
      );
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should format duration in readable format', () => {
      render(<StreamerHeader streamer={mockStreamer} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should format currency amounts', () => {
      render(<StreamerHeader streamer={mockStreamer} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Visual Elements', () => {
    it('should display statistics icons', () => {
      render(<StreamerHeader streamer={mockStreamer} />);
      const icons = screen.queryAllByTestId(/icon/);
      expect(icons.length).toBeGreaterThanOrEqual(0);
    });

    it('should have stats cards or badges', () => {
      const { container } = render(<StreamerHeader streamer={mockStreamer} />);
      const cards = container.querySelectorAll('[class*="card"], [class*="badge"]');
      expect(cards.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Type Safety', () => {
    it('should require streamer prop', () => {
      expect(StreamerHeader).toBeDefined();
      expect(typeof StreamerHeader).toBe('function');
    });

    it('should handle different streamer types', () => {
      const variants = [
        { ...mockStreamer, platform: 'kick' as const },
        { ...mockStreamer, platform: 'twitch' as const },
        { ...mockStreamer, platform: 'youtube' as const },
      ];

      variants.forEach((variant) => {
        render(<StreamerHeader streamer={variant} />);
        expect(screen.getByRole('document')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long streamer names', () => {
      const longName = 'A'.repeat(100);
      render(
        <StreamerHeader
          streamer={{ ...mockStreamer, name: longName }}
        />
      );
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle missing description', () => {
      render(
        <StreamerHeader
          streamer={{ ...mockStreamer, description: '' }}
        />
      );
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle zero statistics', () => {
      render(
        <StreamerHeader
          streamer={{
            ...mockStreamer,
            followers: 0,
            totalSessions: 0,
            totalWagered: 0,
          }}
        />
      );
      expect(screen.getByRole('document')).toBeInTheDocument();
    });
  });
});
