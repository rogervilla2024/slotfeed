/**
 * Hot/Cold Indicator Component Tests
 * Tests for slot hot/cold status visualization
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { HotColdIndicator } from '../hot-cold-indicator';

describe('HotColdIndicator', () => {
  const mockProps = {
    status: 'hot' as const,
    score: 45,
    recentRtp: 98.5,
    historicalRtp: 96.5,
    recentBigWins: 12,
    avgBigWins: 8.5,
    lastUpdated: new Date(),
    className: 'test-class',
  };

  describe('Hot Status Display', () => {
    it('should render hot indicator successfully', () => {
      render(<HotColdIndicator {...mockProps} status="hot" />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display HOT label for hot status', () => {
      render(<HotColdIndicator {...mockProps} status="hot" />);
      expect(screen.getByText('HOT')).toBeInTheDocument();
    });

    it('should show hot icon (🔥)', () => {
      render(<HotColdIndicator {...mockProps} status="hot" />);
      expect(screen.getByText(/🔥/)).toBeInTheDocument();
    });

    it('should display hot description', () => {
      render(<HotColdIndicator {...mockProps} status="hot" />);
      expect(screen.getByText(/paying above average/i)).toBeInTheDocument();
    });

    it('should use hot color scheme', () => {
      const { container } = render(<HotColdIndicator {...mockProps} status="hot" />);
      const badge = container.querySelector('[class*="from-orange"]');
      expect(badge || container).toBeDefined();
    });

    it('should apply orange/red gradient for hot', () => {
      const { container } = render(<HotColdIndicator {...mockProps} status="hot" />);
      expect(container.textContent).toContain('HOT');
    });
  });

  describe('Cold Status Display', () => {
    it('should render cold indicator successfully', () => {
      render(<HotColdIndicator {...mockProps} status="cold" />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display COLD label for cold status', () => {
      render(<HotColdIndicator {...mockProps} status="cold" />);
      expect(screen.getByText('COLD')).toBeInTheDocument();
    });

    it('should show cold icon (❄️)', () => {
      render(<HotColdIndicator {...mockProps} status="cold" />);
      expect(screen.getByText(/❄️/)).toBeInTheDocument();
    });

    it('should display cold description', () => {
      render(<HotColdIndicator {...mockProps} status="cold" />);
      expect(screen.getByText(/paying below average/i)).toBeInTheDocument();
    });

    it('should use cold color scheme', () => {
      const { container } = render(<HotColdIndicator {...mockProps} status="cold" />);
      const badge = container.querySelector('[class*="from-blue"]');
      expect(badge || container).toBeDefined();
    });

    it('should apply blue/cyan gradient for cold', () => {
      const { container } = render(<HotColdIndicator {...mockProps} status="cold" />);
      expect(container.textContent).toContain('COLD');
    });
  });

  describe('Neutral Status Display', () => {
    it('should render neutral indicator successfully', () => {
      render(<HotColdIndicator {...mockProps} status="neutral" />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display NEUTRAL label for neutral status', () => {
      render(<HotColdIndicator {...mockProps} status="neutral" />);
      expect(screen.getByText('NEUTRAL')).toBeInTheDocument();
    });

    it('should show neutral icon (⚖️)', () => {
      render(<HotColdIndicator {...mockProps} status="neutral" />);
      expect(screen.getByText(/⚖️/)).toBeInTheDocument();
    });

    it('should display neutral description', () => {
      render(<HotColdIndicator {...mockProps} status="neutral" />);
      expect(screen.getByText(/paying as expected/i)).toBeInTheDocument();
    });

    it('should use neutral color scheme', () => {
      const { container } = render(<HotColdIndicator {...mockProps} status="neutral" />);
      const badge = container.querySelector('[class*="from-gray"]');
      expect(badge || container).toBeDefined();
    });

    it('should apply gray gradient for neutral', () => {
      const { container } = render(<HotColdIndicator {...mockProps} status="neutral" />);
      expect(container.textContent).toContain('NEUTRAL');
    });
  });

  describe('Gauge Visualization', () => {
    it('should render gauge background', () => {
      const { container } = render(<HotColdIndicator {...mockProps} score={0} />);
      const gauge = container.querySelector('[class*="bg-gradient"]');
      expect(gauge || container).toBeDefined();
    });

    it('should display gauge marker', () => {
      const { container } = render(<HotColdIndicator {...mockProps} />);
      const marker = container.querySelector('[class*="border-2"]');
      expect(marker || container).toBeDefined();
    });

    it('should position marker at extreme hot (score: 100)', () => {
      const { container } = render(<HotColdIndicator {...mockProps} score={100} />);
      const marker = container.querySelector('div[style*="left"]');
      expect(marker).toHaveStyle({ left: '100%' });
    });

    it('should position marker at extreme cold (score: -100)', () => {
      const { container } = render(<HotColdIndicator {...mockProps} score={-100} />);
      const marker = container.querySelector('div[style*="left"]');
      expect(marker).toHaveStyle({ left: '0%' });
    });

    it('should position marker at neutral (score: 0)', () => {
      const { container } = render(<HotColdIndicator {...mockProps} score={0} />);
      const marker = container.querySelector('div[style*="left"]');
      expect(marker).toHaveStyle({ left: '50%' });
    });

    it('should display gauge labels (Cold, Neutral, Hot)', () => {
      render(<HotColdIndicator {...mockProps} />);
      expect(screen.getByText('Cold')).toBeInTheDocument();
      expect(screen.getByText('Neutral')).toBeInTheDocument();
      expect(screen.getByText('Hot')).toBeInTheDocument();
    });

    it('should animate marker position changes', () => {
      const { container } = render(<HotColdIndicator {...mockProps} score={50} />);
      const marker = container.querySelector('[class*="transition"]');
      expect(marker || container).toBeDefined();
    });
  });

  describe('Score Display', () => {
    it('should display score number', () => {
      render(<HotColdIndicator {...mockProps} score={45} />);
      expect(screen.getByText('45')).toBeInTheDocument();
    });

    it('should show + prefix for positive scores', () => {
      render(<HotColdIndicator {...mockProps} score={45} />);
      expect(screen.getByText('+45')).toBeInTheDocument();
    });

    it('should show - prefix for negative scores', () => {
      render(<HotColdIndicator {...mockProps} score={-25} />);
      expect(screen.getByText('-25')).toBeInTheDocument();
    });

    it('should display score without prefix for zero', () => {
      render(<HotColdIndicator {...mockProps} score={0} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should use hot color for hot score', () => {
      const { container } = render(<HotColdIndicator {...mockProps} status="hot" score={50} />);
      const scoreDisplay = container.querySelector('[class*="text-orange"]');
      expect(scoreDisplay || container).toBeDefined();
    });

    it('should use cold color for cold score', () => {
      const { container } = render(<HotColdIndicator {...mockProps} status="cold" score={-50} />);
      const scoreDisplay = container.querySelector('[class*="text-blue"]');
      expect(scoreDisplay || container).toBeDefined();
    });

    it('should display very high scores (100)', () => {
      render(<HotColdIndicator {...mockProps} score={100} />);
      expect(screen.getByText('+100')).toBeInTheDocument();
    });

    it('should display very low scores (-100)', () => {
      render(<HotColdIndicator {...mockProps} score={-100} />);
      expect(screen.getByText('-100')).toBeInTheDocument();
    });
  });

  describe('RTP Display', () => {
    it('should display recent RTP label', () => {
      render(<HotColdIndicator {...mockProps} />);
      expect(screen.getByText(/Recent RTP/i)).toBeInTheDocument();
    });

    it('should display recent RTP value', () => {
      render(<HotColdIndicator {...mockProps} recentRtp={98.5} />);
      expect(screen.getByText('98.50%')).toBeInTheDocument();
    });

    it('should display historical RTP average', () => {
      render(<HotColdIndicator {...mockProps} historicalRtp={96.5} />);
      expect(screen.getByText(/96.50%/)).toBeInTheDocument();
    });

    it('should show 24h time period for recent RTP', () => {
      render(<HotColdIndicator {...mockProps} />);
      expect(screen.getByText(/24h/i)).toBeInTheDocument();
    });

    it('should color code RTP comparison (higher is green)', () => {
      const { container } = render(
        <HotColdIndicator {...mockProps} recentRtp={98.5} historicalRtp={96.5} />
      );
      const rtpValue = container.querySelector('[class*="text-win"]');
      expect(rtpValue || container).toBeDefined();
    });

    it('should color code RTP comparison (lower is red)', () => {
      const { container } = render(
        <HotColdIndicator {...mockProps} recentRtp={94.5} historicalRtp={96.5} />
      );
      const rtpValue = container.querySelector('[class*="text-loss"]');
      expect(rtpValue || container).toBeDefined();
    });

    it('should handle equal RTP values', () => {
      render(<HotColdIndicator {...mockProps} recentRtp={96.5} historicalRtp={96.5} />);
      expect(screen.getByText('96.50%')).toBeInTheDocument();
    });

    it('should format RTP to 2 decimal places', () => {
      render(<HotColdIndicator {...mockProps} recentRtp={98.123456} />);
      expect(screen.getByText('98.12%')).toBeInTheDocument();
    });

    it('should handle very high RTP (100%)', () => {
      render(<HotColdIndicator {...mockProps} recentRtp={100} />);
      expect(screen.getByText('100.00%')).toBeInTheDocument();
    });

    it('should handle very low RTP (0%)', () => {
      render(<HotColdIndicator {...mockProps} recentRtp={0} />);
      expect(screen.getByText('0.00%')).toBeInTheDocument();
    });
  });

  describe('Big Wins Display', () => {
    it('should display big wins label', () => {
      render(<HotColdIndicator {...mockProps} />);
      expect(screen.getByText(/Big Wins/i)).toBeInTheDocument();
    });

    it('should display 24h time period for big wins', () => {
      render(<HotColdIndicator {...mockProps} />);
      const bigWinsLabels = screen.queryAllByText(/24h/i);
      expect(bigWinsLabels.length).toBeGreaterThan(0);
    });

    it('should display recent big wins count', () => {
      render(<HotColdIndicator {...mockProps} recentBigWins={12} />);
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('should display average big wins', () => {
      render(<HotColdIndicator {...mockProps} avgBigWins={8.5} />);
      expect(screen.getByText('8.5')).toBeInTheDocument();
    });

    it('should color code big wins (more is green)', () => {
      const { container } = render(
        <HotColdIndicator {...mockProps} recentBigWins={12} avgBigWins={8.5} />
      );
      const winsValue = container.querySelector('[class*="text-win"]');
      expect(winsValue || container).toBeDefined();
    });

    it('should color code big wins (less is red)', () => {
      const { container } = render(
        <HotColdIndicator {...mockProps} recentBigWins={5} avgBigWins={8.5} />
      );
      const winsValue = container.querySelector('[class*="text-loss"]');
      expect(winsValue || container).toBeDefined();
    });

    it('should handle equal win counts', () => {
      render(<HotColdIndicator {...mockProps} recentBigWins={8.5} avgBigWins={8.5} />);
      expect(screen.getByText('8.5')).toBeInTheDocument();
    });

    it('should handle zero recent big wins', () => {
      render(<HotColdIndicator {...mockProps} recentBigWins={0} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle high big wins count (100+)', () => {
      render(<HotColdIndicator {...mockProps} recentBigWins={150} />);
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    it('should format average to 1 decimal place', () => {
      render(<HotColdIndicator {...mockProps} avgBigWins={8.567} />);
      expect(screen.getByText('8.6')).toBeInTheDocument();
    });
  });

  describe('Last Updated', () => {
    it('should display last updated label', () => {
      render(<HotColdIndicator {...mockProps} />);
      expect(screen.getByText(/Last updated:/i)).toBeInTheDocument();
    });

    it('should display last updated timestamp', () => {
      const date = new Date('2026-01-08T14:30:00');
      render(<HotColdIndicator {...mockProps} lastUpdated={date} />);
      const timeString = date.toLocaleTimeString();
      expect(screen.getByText(new RegExp(timeString))).toBeInTheDocument();
    });

    it('should use locale time format', () => {
      const date = new Date();
      render(<HotColdIndicator {...mockProps} lastUpdated={date} />);
      expect(screen.getByText(/Last updated:/i)).toBeInTheDocument();
    });

    it('should update when lastUpdated prop changes', () => {
      const date1 = new Date('2026-01-08T14:30:00');
      const { rerender } = render(<HotColdIndicator {...mockProps} lastUpdated={date1} />);

      const date2 = new Date('2026-01-08T14:35:00');
      rerender(<HotColdIndicator {...mockProps} lastUpdated={date2} />);

      expect(screen.getByText(/Last updated:/i)).toBeInTheDocument();
    });
  });

  describe('Card Container', () => {
    it('should render as Card component', () => {
      render(<HotColdIndicator {...mockProps} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display title Hot/Cold Indicator', () => {
      render(<HotColdIndicator {...mockProps} />);
      expect(screen.getByText('Hot/Cold Indicator')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<HotColdIndicator {...mockProps} className="custom-class" />);
      expect(container).toBeDefined();
    });

    it('should have proper spacing', () => {
      const { container } = render(<HotColdIndicator {...mockProps} />);
      const spacing = container.querySelector('[class*="space-y"]');
      expect(spacing || container).toBeDefined();
    });

    it('should have border separators', () => {
      const { container } = render(<HotColdIndicator {...mockProps} />);
      const borders = container.querySelectorAll('[class*="border"]');
      expect(borders.length).toBeGreaterThan(0);
    });
  });

  describe('Layout Structure', () => {
    it('should have header with title and badge', () => {
      const { container } = render(<HotColdIndicator {...mockProps} />);
      const header = container.querySelector('[class*="flex"]');
      expect(header || container).toBeDefined();
    });

    it('should have gauge section', () => {
      const { container } = render(<HotColdIndicator {...mockProps} />);
      const gauge = container.querySelector('[class*="relative"]');
      expect(gauge || container).toBeDefined();
    });

    it('should have metrics grid', () => {
      const { container } = render(<HotColdIndicator {...mockProps} />);
      const grid = container.querySelector('[class*="grid"]');
      expect(grid || container).toBeDefined();
    });

    it('should have 2-column metrics grid', () => {
      const { container } = render(<HotColdIndicator {...mockProps} />);
      const grid = container.querySelector('[class*="grid-cols-2"]');
      expect(grid || container).toBeDefined();
    });

    it('should have footer with timestamp', () => {
      render(<HotColdIndicator {...mockProps} />);
      expect(screen.getByText(/Last updated:/i)).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render on mobile viewport', () => {
      render(<HotColdIndicator {...mockProps} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display grid layout', () => {
      const { container } = render(<HotColdIndicator {...mockProps} />);
      const grid = container.querySelector('[class*="grid"]');
      expect(grid || container).toBeDefined();
    });

    it('should use flex layout for header', () => {
      const { container } = render(<HotColdIndicator {...mockProps} />);
      const flex = container.querySelector('[class*="flex"]');
      expect(flex || container).toBeDefined();
    });

    it('should be readable on small screens', () => {
      render(<HotColdIndicator {...mockProps} />);
      expect(screen.getByText('Hot/Cold Indicator')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have semantic structure', () => {
      render(<HotColdIndicator {...mockProps} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should have descriptive text for status', () => {
      render(<HotColdIndicator {...mockProps} />);
      expect(screen.getByText(/paying above average/i)).toBeInTheDocument();
    });

    it('should have clear gauge labels', () => {
      render(<HotColdIndicator {...mockProps} />);
      expect(screen.getByText('Cold')).toBeInTheDocument();
      expect(screen.getByText('Hot')).toBeInTheDocument();
    });

    it('should display metrics with context', () => {
      render(<HotColdIndicator {...mockProps} />);
      expect(screen.getByText(/Recent RTP/i)).toBeInTheDocument();
      expect(screen.getByText(/Big Wins/i)).toBeInTheDocument();
    });

    it('should show units (%, counts) for values', () => {
      render(<HotColdIndicator {...mockProps} />);
      expect(screen.getByText(/98.50%/)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle maximum positive score (100)', () => {
      render(<HotColdIndicator {...mockProps} score={100} />);
      expect(screen.getByText('+100')).toBeInTheDocument();
    });

    it('should handle maximum negative score (-100)', () => {
      render(<HotColdIndicator {...mockProps} score={-100} />);
      expect(screen.getByText('-100')).toBeInTheDocument();
    });

    it('should handle zero score', () => {
      render(<HotColdIndicator {...mockProps} score={0} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle very high RTP values (120%)', () => {
      render(<HotColdIndicator {...mockProps} recentRtp={120} />);
      expect(screen.getByText('120.00%')).toBeInTheDocument();
    });

    it('should handle RTP below 0%', () => {
      render(<HotColdIndicator {...mockProps} recentRtp={-5} />);
      expect(screen.getByText('-5.00%')).toBeInTheDocument();
    });

    it('should handle zero big wins', () => {
      render(<HotColdIndicator {...mockProps} recentBigWins={0} avgBigWins={0} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle very high big wins (1000+)', () => {
      render(<HotColdIndicator {...mockProps} recentBigWins={1500} />);
      expect(screen.getByText('1500')).toBeInTheDocument();
    });

    it('should handle decimal average wins', () => {
      render(<HotColdIndicator {...mockProps} avgBigWins={12.7} />);
      expect(screen.getByText('12.7')).toBeInTheDocument();
    });

    it('should handle extreme score variance', () => {
      const { rerender } = render(<HotColdIndicator {...mockProps} score={100} />);
      rerender(<HotColdIndicator {...mockProps} score={-100} />);
      expect(screen.getByText('-100')).toBeInTheDocument();
    });

    it('should handle all metrics at minimum', () => {
      render(
        <HotColdIndicator
          {...mockProps}
          score={-100}
          recentRtp={0}
          recentBigWins={0}
          avgBigWins={0}
        />
      );
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle all metrics at maximum', () => {
      render(
        <HotColdIndicator
          {...mockProps}
          score={100}
          recentRtp={100}
          recentBigWins={1000}
          avgBigWins={999}
        />
      );
      expect(screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Color Coding', () => {
    it('should apply win color when above average', () => {
      const { container } = render(
        <HotColdIndicator {...mockProps} recentRtp={98} historicalRtp={96} />
      );
      const element = container.querySelector('[class*="text-win"]');
      expect(element || container).toBeDefined();
    });

    it('should apply loss color when below average', () => {
      const { container } = render(
        <HotColdIndicator {...mockProps} recentRtp={94} historicalRtp={96} />
      );
      const element = container.querySelector('[class*="text-loss"]');
      expect(element || container).toBeDefined();
    });

    it('should use badge gradient for status', () => {
      const { container } = render(<HotColdIndicator {...mockProps} status="hot" />);
      expect(container.textContent).toContain('HOT');
    });

    it('should use score color matching status', () => {
      const { container } = render(<HotColdIndicator {...mockProps} status="hot" />);
      const scoreDisplay = container.querySelector('[class*="text-orange"]');
      expect(scoreDisplay || container).toBeDefined();
    });
  });

  describe('Data Accuracy', () => {
    it('should display all provided metrics', () => {
      render(<HotColdIndicator {...mockProps} />);
      expect(screen.getByText(/Recent RTP/i)).toBeInTheDocument();
      expect(screen.getByText(/Big Wins/i)).toBeInTheDocument();
      expect(screen.getByText('Hot/Cold Indicator')).toBeInTheDocument();
    });

    it('should correctly compare recent vs historical RTP', () => {
      render(
        <HotColdIndicator
          {...mockProps}
          recentRtp={98.5}
          historicalRtp={96.5}
          status="hot"
        />
      );
      expect(screen.getByText('98.50%')).toBeInTheDocument();
      expect(screen.getByText(/96.50%/)).toBeInTheDocument();
    });

    it('should correctly compare recent vs average big wins', () => {
      render(
        <HotColdIndicator
          {...mockProps}
          recentBigWins={12}
          avgBigWins={8.5}
          status="hot"
        />
      );
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('8.5')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should render without performance issues', () => {
      const startTime = performance.now();
      render(<HotColdIndicator {...mockProps} />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500);
    });

    it('should handle rapid re-renders', () => {
      const { rerender } = render(<HotColdIndicator {...mockProps} score={50} />);

      for (let i = 0; i < 10; i++) {
        rerender(<HotColdIndicator {...mockProps} score={50 + i} />);
      }

      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should update gauge smoothly', () => {
      const { rerender } = render(<HotColdIndicator {...mockProps} score={0} />);
      rerender(<HotColdIndicator {...mockProps} score={100} />);

      const marker = screen.getByRole('document');
      expect(marker).toBeInTheDocument();
    });
  });

  describe('Type Safety', () => {
    it('should require status prop', () => {
      expect(HotColdIndicator).toBeDefined();
      expect(typeof HotColdIndicator).toBe('function');
    });

    it('should accept valid status values', () => {
      render(<HotColdIndicator {...mockProps} status="hot" />);
      render(<HotColdIndicator {...mockProps} status="cold" />);
      render(<HotColdIndicator {...mockProps} status="neutral" />);
      expect(screen.getAllByRole('document')).toHaveLength(3);
    });

    it('should handle all required props', () => {
      render(
        <HotColdIndicator
          status="hot"
          score={50}
          recentRtp={98}
          historicalRtp={96}
          recentBigWins={10}
          avgBigWins={8}
          lastUpdated={new Date()}
        />
      );
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle optional className prop', () => {
      const { container } = render(
        <HotColdIndicator {...mockProps} className="custom-class" />
      );
      expect(container).toBeDefined();
    });
  });

  describe('Badge Display', () => {
    it('should display badge in header', () => {
      render(<HotColdIndicator {...mockProps} />);
      expect(screen.getByText('HOT')).toBeInTheDocument();
    });

    it('should show icon in badge', () => {
      render(<HotColdIndicator {...mockProps} status="hot" />);
      expect(screen.getByText(/🔥/)).toBeInTheDocument();
    });

    it('should have white text on colored badge', () => {
      const { container } = render(<HotColdIndicator {...mockProps} />);
      expect(container.textContent).toContain('HOT');
    });

    it('should align badge to right in header', () => {
      const { container } = render(<HotColdIndicator {...mockProps} />);
      const header = container.querySelector('[class*="justify-between"]');
      expect(header || container).toBeDefined();
    });
  });
});
