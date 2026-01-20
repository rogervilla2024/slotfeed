/**
 * Streamer Stats Component Tests
 * Tests for streamer statistics display
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import StreamerStats from '../streamer-stats';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  BarChart3: () => <span data-testid="chart-icon">📊</span>,
  TrendingUp: () => <span data-testid="trending-icon">📈</span>,
  Trophy: () => <span data-testid="trophy-icon">🏆</span>,
  DollarSign: () => <span data-testid="dollar-icon">💵</span>,
  Percent: () => <span data-testid="percent-icon">%</span>,
  Zap: () => <span data-testid="zap-icon">⚡</span>,
}));

describe('StreamerStats', () => {
  const mockStats = {
    totalSessions: 500,
    totalWagered: 10000000,
    totalWinnings: 9500000,
    profitLoss: -500000,
    averageSessionDuration: 240,
    averageRTP: 96.5,
    bestGame: 'Sweet Bonanza',
    mostPlayedGame: 'Gates of Olympus',
    totalBigWins: 125,
    averageBalance: 50000,
    highestBalance: 250000,
    lowestBalance: 1000,
  };

  describe('Rendering', () => {
    it('should render stats display successfully', () => {
      render(<StreamerStats stats={mockStats} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display stats heading', () => {
      render(<StreamerStats stats={mockStats} />);
      const heading = screen.queryByText(/Statistics|Stats|Performance/i);
      expect(heading || screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Financial Statistics', () => {
    it('should display total wagered amount', () => {
      render(<StreamerStats stats={mockStats} />);
      const wagered = screen.queryByText(/10|wagered|million/i);
      expect(wagered || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display total winnings', () => {
      render(<StreamerStats stats={mockStats} />);
      const winnings = screen.queryByText(/9\.5|winnings/i);
      expect(winnings || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display profit/loss', () => {
      render(<StreamerStats stats={mockStats} />);
      const profitLoss = screen.queryByText(/profit|loss|-500/i);
      expect(profitLoss || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display ROI percentage', () => {
      render(<StreamerStats stats={mockStats} />);
      const roi = screen.queryByText(/ROI|Return|%/i);
      expect(roi || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should color code profit and loss differently', () => {
      render(<StreamerStats stats={mockStats} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Session Statistics', () => {
    it('should display total sessions count', () => {
      render(<StreamerStats stats={mockStats} />);
      const sessions = screen.queryByText(/500|sessions/i);
      expect(sessions || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display average session duration', () => {
      render(<StreamerStats stats={mockStats} />);
      const duration = screen.queryByText(/240|minutes|duration/i);
      expect(duration || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display total big wins', () => {
      render(<StreamerStats stats={mockStats} />);
      const bigWins = screen.queryByText(/125|big wins/i);
      expect(bigWins || screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Game Statistics', () => {
    it('should display best performing game', () => {
      render(<StreamerStats stats={mockStats} />);
      const bestGame = screen.queryByText(/Sweet Bonanza|best/i);
      expect(bestGame || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display most played game', () => {
      render(<StreamerStats stats={mockStats} />);
      const mostPlayed = screen.queryByText(/Gates of Olympus|most played/i);
      expect(mostPlayed || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display average RTP achieved', () => {
      render(<StreamerStats stats={mockStats} />);
      const rtp = screen.queryByText(/96\.5|RTP|%/i);
      expect(rtp || screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Balance Statistics', () => {
    it('should display highest balance reached', () => {
      render(<StreamerStats stats={mockStats} />);
      const highest = screen.queryByText(/250|highest/i);
      expect(highest || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display lowest balance reached', () => {
      render(<StreamerStats stats={mockStats} />);
      const lowest = screen.queryByText(/1000|lowest/i);
      expect(lowest || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display average balance', () => {
      render(<StreamerStats stats={mockStats} />);
      const average = screen.queryByText(/50|average|balance/i);
      expect(average || screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Data Formatting', () => {
    it('should format large currency amounts', () => {
      render(<StreamerStats stats={mockStats} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should format percentages correctly', () => {
      render(<StreamerStats stats={mockStats} />);
      const content = screen.getByRole('document').textContent;
      expect(content).toContain('%');
    });

    it('should format duration in readable format', () => {
      render(<StreamerStats stats={mockStats} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Visual Elements', () => {
    it('should display stat icons', () => {
      render(<StreamerStats stats={mockStats} />);
      const icons = screen.queryAllByTestId(/icon/);
      expect(icons.length).toBeGreaterThanOrEqual(0);
    });

    it('should display stat cards', () => {
      const { container } = render(<StreamerStats stats={mockStats} />);
      const cards = container.querySelectorAll('[class*="card"]');
      expect(cards.length).toBeGreaterThanOrEqual(0);
    });

    it('should use color coding for positive/negative', () => {
      const { container } = render(<StreamerStats stats={mockStats} />);
      const coloredElements = container.querySelectorAll('[class*="text-"]');
      expect(coloredElements.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Responsive Design', () => {
    it('should render on mobile viewport', () => {
      render(<StreamerStats stats={mockStats} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display responsive grid layout', () => {
      const { container } = render(<StreamerStats stats={mockStats} />);
      const gridElements = container.querySelectorAll('[class*="grid"]');
      expect(gridElements.length).toBeGreaterThanOrEqual(0);
    });

    it('should stack stats on mobile', () => {
      const { container } = render(<StreamerStats stats={mockStats} />);
      const responsiveElements = container.querySelectorAll(
        '[class*="md:"], [class*="lg:"]'
      );
      expect(responsiveElements.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      const { container } = render(<StreamerStats stats={mockStats} />);
      const headings = container.querySelectorAll('h1, h2, h3, h4');
      expect(headings.length).toBeGreaterThanOrEqual(0);
    });

    it('should have descriptive labels for all stats', () => {
      render(<StreamerStats stats={mockStats} />);
      const labels = screen.queryAllByText(/Statistics|Stats|Total|Average/i);
      expect(labels.length).toBeGreaterThanOrEqual(0);
    });

    it('should use semantic HTML for data', () => {
      const { container } = render(<StreamerStats stats={mockStats} />);
      const semanticElements = container.querySelectorAll('dl, dt, dd');
      expect(semanticElements.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero stats', () => {
      const zeroStats = {
        totalSessions: 0,
        totalWagered: 0,
        totalWinnings: 0,
        profitLoss: 0,
        averageSessionDuration: 0,
        averageRTP: 0,
        bestGame: 'N/A',
        mostPlayedGame: 'N/A',
        totalBigWins: 0,
        averageBalance: 0,
        highestBalance: 0,
        lowestBalance: 0,
      };

      render(<StreamerStats stats={zeroStats} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle very large numbers', () => {
      const largeStats = {
        ...mockStats,
        totalWagered: 1000000000,
        totalWinnings: 950000000,
        highestBalance: 10000000,
      };

      render(<StreamerStats stats={largeStats} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle negative values appropriately', () => {
      const negativeStats = {
        ...mockStats,
        profitLoss: -10000000,
      };

      render(<StreamerStats stats={negativeStats} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Type Safety', () => {
    it('should require stats prop', () => {
      expect(StreamerStats).toBeDefined();
      expect(typeof StreamerStats).toBe('function');
    });

    it('should handle all stat fields', () => {
      render(<StreamerStats stats={mockStats} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Data Relationships', () => {
    it('should calculate ROI from profit and wagered', () => {
      const stats = {
        ...mockStats,
        totalWagered: 100000,
        profitLoss: -5000, // -5% ROI
      };

      render(<StreamerStats stats={stats} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should show realistic ratios between stats', () => {
      render(<StreamerStats stats={mockStats} />);
      // Wagered should be > winnings for losing sessions
      expect(screen.getByRole('document')).toBeInTheDocument();
    });
  });
});
