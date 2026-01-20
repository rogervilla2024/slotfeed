import React from 'react';
import { render, screen } from '@testing-library/react';
import { BigWinCard, BigWinCardSkeleton } from '../big-win-card';
import type { BigWin } from '@/types';

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div data-testid="card" className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div data-testid="card-content" className={className}>{children}</div>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span data-testid="badge" data-variant={variant} className={className}>{children}</span>
  ),
}));

jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className }: any) => <div data-testid="avatar" className={className}>{children}</div>,
  AvatarImage: ({ src, alt }: any) => <img data-testid="avatar-image" src={src} alt={alt} />,
  AvatarFallback: ({ children, className }: any) => (
    <span data-testid="avatar-fallback" className={className}>{children}</span>
  ),
}));

jest.mock('@/lib/utils', () => ({
  formatCurrency: (amount: number) => `$${amount.toLocaleString()}`,
  formatNumber: (n: number) => n.toLocaleString(),
}));

const mockBigWin: BigWin = {
  id: 'win-1',
  sessionId: 'session-1',
  gameId: 'sweet-bonanza',
  streamerId: 'roshtein',
  streamer: {
    id: 'roshtein',
    username: 'roshtein',
    displayName: 'Roshtein',
    platform: 'kick' as const,
    platformId: 'roshtein',
    followerCount: 362000,
    isLive: true,
    lifetimeStats: {
      totalSessions: 1000,
      totalHoursStreamed: 5000,
      totalWagered: 5000000,
      totalWon: 5500000,
      biggestWin: 100000,
      biggestMultiplier: 5000,
      averageRtp: 96.5,
    },
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-08'),
  },
  game: {
    id: 'sweet-bonanza',
    name: 'Sweet Bonanza',
    slug: 'sweet-bonanza',
    providerId: 'pragmatic-play',
    rtp: 96.48,
    volatility: 'medium' as const,
    maxMultiplier: 21100,
    isActive: true,
  },
  betAmount: 10,
  winAmount: 5000,
  multiplier: 500,
  timestamp: new Date('2026-01-08T10:00:00Z'),
  isVerified: true,
};

describe('BigWinCard', () => {
  describe('Rendering', () => {
    it('renders card container', () => {
      render(<BigWinCard bigWin={mockBigWin} />);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('renders card content', () => {
      render(<BigWinCard bigWin={mockBigWin} />);
      expect(screen.getByTestId('card-content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<BigWinCard bigWin={mockBigWin} className="custom-class" />);
      const card = container.querySelector('[data-testid="card"]');
      expect(card).toHaveClass('custom-class');
    });
  });

  describe('Win Amount Display', () => {
    it('displays win amount in currency format', () => {
      render(<BigWinCard bigWin={mockBigWin} />);
      expect(screen.getByText('$5,000')).toBeInTheDocument();
    });

    it('displays bet amount in currency format', () => {
      render(<BigWinCard bigWin={mockBigWin} />);
      expect(screen.getByText('$10')).toBeInTheDocument();
    });

    it('displays small bet amounts', () => {
      const win = { ...mockBigWin, betAmount: 0.1, winAmount: 50 };
      render(<BigWinCard bigWin={win} />);
      expect(screen.getByText('$0')).toBeInTheDocument(); // Formatted with no decimals
    });

    it('displays large win amounts', () => {
      const win = { ...mockBigWin, betAmount: 100, winAmount: 500000 };
      render(<BigWinCard bigWin={win} />);
      expect(screen.getByText('$500,000')).toBeInTheDocument();
    });

    it('displays very large win amounts', () => {
      const win = { ...mockBigWin, betAmount: 1000, winAmount: 10000000 };
      render(<BigWinCard bigWin={win} />);
      expect(screen.getByText('$10,000,000')).toBeInTheDocument();
    });

    it('formats currency with thousands separator', () => {
      const win = { ...mockBigWin, betAmount: 50, winAmount: 25000 };
      render(<BigWinCard bigWin={win} />);
      expect(screen.getByText('$25,000')).toBeInTheDocument();
    });
  });

  describe('Win Tier Classification', () => {
    it('displays BIG WIN badge for 100-499x multiplier', () => {
      const win = { ...mockBigWin, multiplier: 250 };
      render(<BigWinCard bigWin={win} />);
      expect(screen.getByText(/BIG WIN/)).toBeInTheDocument();
      expect(screen.getByText('🎰')).toBeInTheDocument();
    });

    it('displays MEGA WIN badge for 500-999x multiplier', () => {
      const win = { ...mockBigWin, multiplier: 750 };
      render(<BigWinCard bigWin={win} />);
      expect(screen.getByText(/MEGA WIN/)).toBeInTheDocument();
      expect(screen.getByText('🔥')).toBeInTheDocument();
    });

    it('displays ULTRA WIN badge for 1000-4999x multiplier', () => {
      const win = { ...mockBigWin, multiplier: 2000 };
      render(<BigWinCard bigWin={win} />);
      expect(screen.getByText(/ULTRA WIN/)).toBeInTheDocument();
      expect(screen.getByText('💎')).toBeInTheDocument();
    });

    it('displays LEGENDARY badge for 5000x+ multiplier', () => {
      const win = { ...mockBigWin, multiplier: 5000 };
      render(<BigWinCard bigWin={win} />);
      expect(screen.getByText(/LEGENDARY/)).toBeInTheDocument();
      expect(screen.getByText('👑')).toBeInTheDocument();
    });

    it('displays correct multiplier badge', () => {
      render(<BigWinCard bigWin={mockBigWin} />);
      expect(screen.getByText('500x')).toBeInTheDocument();
    });

    it('formats large multipliers with commas', () => {
      const win = { ...mockBigWin, multiplier: 50000 };
      render(<BigWinCard bigWin={win} />);
      expect(screen.getByText('50,000x')).toBeInTheDocument();
    });
  });

  describe('Streamer Information', () => {
    it('displays streamer display name', () => {
      render(<BigWinCard bigWin={mockBigWin} />);
      expect(screen.getByText('Roshtein')).toBeInTheDocument();
    });

    it('displays streamer platform', () => {
      render(<BigWinCard bigWin={mockBigWin} />);
      expect(screen.getByText('kick')).toBeInTheDocument();
    });

    it('displays streamer avatar fallback when no avatar URL', () => {
      render(<BigWinCard bigWin={mockBigWin} />);
      expect(screen.getByTestId('avatar-fallback')).toBeInTheDocument();
    });

    it('shows streamer initials in avatar fallback', () => {
      render(<BigWinCard bigWin={mockBigWin} />);
      expect(screen.getByText('RO')).toBeInTheDocument();
    });

    it('displays streamer avatar image when URL provided', () => {
      const win = {
        ...mockBigWin,
        streamer: { ...mockBigWin.streamer, avatarUrl: 'https://avatar.url/ro.png' },
      };
      render(<BigWinCard bigWin={win} />);
      expect(screen.getByTestId('avatar-image')).toHaveAttribute('src', 'https://avatar.url/ro.png');
    });

    it('displays Unknown when streamer name missing', () => {
      const win = { ...mockBigWin, streamer: { ...mockBigWin.streamer, displayName: undefined } };
      render(<BigWinCard bigWin={win} />);
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    it('handles ?? fallback for missing streamer initials', () => {
      const win = {
        ...mockBigWin,
        streamer: { ...mockBigWin.streamer, displayName: undefined },
      };
      render(<BigWinCard bigWin={win} />);
      expect(screen.getByText('??')).toBeInTheDocument();
    });
  });

  describe('Game Information', () => {
    it('displays game name', () => {
      render(<BigWinCard bigWin={mockBigWin} />);
      expect(screen.getByText('Sweet Bonanza')).toBeInTheDocument();
    });

    it('displays Unknown Game when game missing', () => {
      const win = { ...mockBigWin, game: undefined };
      render(<BigWinCard bigWin={win} />);
      expect(screen.getByText('Unknown Game')).toBeInTheDocument();
    });

    it('displays different game names', () => {
      const win = { ...mockBigWin, game: { ...mockBigWin.game, name: 'Gates of Olympus' } };
      render(<BigWinCard bigWin={win} />);
      expect(screen.getByText('Gates of Olympus')).toBeInTheDocument();
    });
  });

  describe('Timestamp Display', () => {
    it('displays "Just now" for recent wins', () => {
      const now = new Date();
      const win = { ...mockBigWin, timestamp: now };
      render(<BigWinCard bigWin={win} />);
      expect(screen.getByText(/Just now|m ago/)).toBeInTheDocument();
    });

    it('displays minutes ago for wins within an hour', () => {
      const pastDate = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
      const win = { ...mockBigWin, timestamp: pastDate };
      render(<BigWinCard bigWin={win} />);
      expect(screen.getByText(/30m ago/)).toBeInTheDocument();
    });

    it('displays hours ago for wins within 24 hours', () => {
      const pastDate = new Date(Date.now() - 5 * 60 * 60 * 1000); // 5 hours ago
      const win = { ...mockBigWin, timestamp: pastDate };
      render(<BigWinCard bigWin={win} />);
      expect(screen.getByText(/5h ago/)).toBeInTheDocument();
    });

    it('displays days ago for older wins', () => {
      const pastDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
      const win = { ...mockBigWin, timestamp: pastDate };
      render(<BigWinCard bigWin={win} />);
      expect(screen.getByText(/3d ago/)).toBeInTheDocument();
    });

    it('displays date for wins older than 7 days', () => {
      const pastDate = new Date('2025-12-01');
      const win = { ...mockBigWin, timestamp: pastDate };
      render(<BigWinCard bigWin={win} />);
      // Should display localized date string
      expect(screen.queryByText(/ago/)).not.toBeInTheDocument();
    });
  });

  describe('Verified Badge', () => {
    it('displays verified badge when isVerified is true', () => {
      render(<BigWinCard bigWin={mockBigWin} />);
      expect(screen.getByText(/Verified/)).toBeInTheDocument();
      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('does not display verified badge when isVerified is false', () => {
      const win = { ...mockBigWin, isVerified: false };
      render(<BigWinCard bigWin={win} />);
      expect(screen.queryByText(/Verified/)).not.toBeInTheDocument();
    });
  });

  describe('Screenshot Display', () => {
    it('displays screenshot image when URL provided', () => {
      const win = { ...mockBigWin, screenshotUrl: 'https://example.com/screenshot.png' };
      const { container } = render(<BigWinCard bigWin={win} />);
      const img = container.querySelector('img[alt="500x win"]');
      expect(img).toHaveAttribute('src', 'https://example.com/screenshot.png');
    });

    it('displays emoji placeholder when no screenshot', () => {
      const win = { ...mockBigWin, screenshotUrl: undefined };
      render(<BigWinCard bigWin={win} />);
      expect(screen.getByText('🎰')).toBeInTheDocument();
    });

    it('uses correct alt text for screenshot', () => {
      const win = { ...mockBigWin, multiplier: 750, screenshotUrl: 'https://example.com/img.png' };
      const { container } = render(<BigWinCard bigWin={win} />);
      const img = container.querySelector('img[alt="750x win"]');
      expect(img).toBeInTheDocument();
    });

    it('applies correct styling for screenshot', () => {
      const win = { ...mockBigWin, screenshotUrl: 'https://example.com/screenshot.png' };
      const { container } = render(<BigWinCard bigWin={win} />);
      const img = container.querySelector('img');
      expect(img).toHaveClass('w-full', 'h-full', 'object-cover');
    });
  });

  describe('Tier Color Styling', () => {
    it('applies BIG WIN color styles', () => {
      const win = { ...mockBigWin, multiplier: 100 };
      render(<BigWinCard bigWin={win} />);
      const badges = screen.getAllByTestId('badge');
      expect(badges.some((b) => b.textContent?.includes('BIG WIN'))).toBe(true);
    });

    it('applies MEGA WIN color styles', () => {
      const win = { ...mockBigWin, multiplier: 600 };
      render(<BigWinCard bigWin={win} />);
      const badges = screen.getAllByTestId('badge');
      expect(badges.some((b) => b.textContent?.includes('MEGA WIN'))).toBe(true);
    });

    it('applies ULTRA WIN color styles', () => {
      const win = { ...mockBigWin, multiplier: 2000 };
      render(<BigWinCard bigWin={win} />);
      const badges = screen.getAllByTestId('badge');
      expect(badges.some((b) => b.textContent?.includes('ULTRA WIN'))).toBe(true);
    });

    it('applies LEGENDARY color styles', () => {
      const win = { ...mockBigWin, multiplier: 5500 };
      render(<BigWinCard bigWin={win} />);
      const badges = screen.getAllByTestId('badge');
      expect(badges.some((b) => b.textContent?.includes('LEGENDARY'))).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('handles zero multiplier', () => {
      const win = { ...mockBigWin, multiplier: 0 };
      render(<BigWinCard bigWin={win} />);
      expect(screen.getByText('0x')).toBeInTheDocument();
    });

    it('handles very large multiplier', () => {
      const win = { ...mockBigWin, multiplier: 999999 };
      render(<BigWinCard bigWin={win} />);
      expect(screen.getByText('999,999x')).toBeInTheDocument();
    });

    it('handles decimal multiplier', () => {
      const win = { ...mockBigWin, multiplier: 123.456 };
      render(<BigWinCard bigWin={win} />);
      // formatNumber should handle this appropriately
      expect(screen.getByText(/123/)).toBeInTheDocument();
    });

    it('handles missing game object', () => {
      const win = { ...mockBigWin, game: undefined };
      render(<BigWinCard bigWin={win} />);
      expect(screen.getByText('Unknown Game')).toBeInTheDocument();
    });

    it('handles missing streamer object', () => {
      const win = { ...mockBigWin, streamer: undefined };
      render(<BigWinCard bigWin={win} />);
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    it('renders with minimal data', () => {
      const minimalWin: BigWin = {
        id: 'win-1',
        sessionId: 'session-1',
        gameId: 'game-1',
        streamerId: 'streamer-1',
        betAmount: 10,
        winAmount: 500,
        multiplier: 50,
        timestamp: new Date(),
        isVerified: false,
      };
      render(<BigWinCard bigWin={minimalWin} />);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('renders within acceptable time', () => {
      const startTime = performance.now();
      render(<BigWinCard bigWin={mockBigWin} />);
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Accessibility', () => {
    it('provides alt text for streamer avatar', () => {
      const win = {
        ...mockBigWin,
        streamer: { ...mockBigWin.streamer, avatarUrl: 'https://example.com/avatar.png' },
      };
      render(<BigWinCard bigWin={win} />);
      expect(screen.getByTestId('avatar-image')).toHaveAttribute('alt', 'Roshtein');
    });

    it('provides alt text for screenshot', () => {
      const win = { ...mockBigWin, screenshotUrl: 'https://example.com/screenshot.png' };
      const { container } = render(<BigWinCard bigWin={win} />);
      const img = container.querySelector('img[alt="500x win"]');
      expect(img).toBeInTheDocument();
    });
  });
});

describe('BigWinCardSkeleton', () => {
  it('renders skeleton loading state', () => {
    render(<BigWinCardSkeleton />);
    expect(screen.getByTestId('card')).toBeInTheDocument();
  });

  it('displays animated pulse elements', () => {
    const { container } = render(<BigWinCardSkeleton />);
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it('displays placeholder height for image area', () => {
    const { container } = render(<BigWinCardSkeleton />);
    const imageArea = container.querySelector('.h-40');
    expect(imageArea).toHaveClass('bg-muted', 'animate-pulse');
  });

  it('displays placeholder elements for content', () => {
    const { container } = render(<BigWinCardSkeleton />);
    const placeholders = container.querySelectorAll('[class*="bg-muted"]');
    expect(placeholders.length).toBeGreaterThan(0);
  });

  it('maintains card structure during loading', () => {
    render(<BigWinCardSkeleton />);
    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByTestId('card-content')).toBeInTheDocument();
  });
});
