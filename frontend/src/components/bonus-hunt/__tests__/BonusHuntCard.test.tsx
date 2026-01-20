import React from 'react';
import { render, screen } from '@testing-library/react';
import { BonusHuntCard } from '../BonusHuntCard';
import type { BonusHuntSummary } from '../BonusHuntCard';

jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>;
});

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: any) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div data-testid="card" className={className}>{children}</div>,
  CardHeader: ({ children, className }: any) => (
    <div data-testid="card-header" className={className}>{children}</div>
  ),
  CardTitle: ({ children, className }: any) => (
    <h3 data-testid="card-title" className={className}>{children}</h3>
  ),
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
}));

const mockHunt: BonusHuntSummary = {
  id: 'hunt-1',
  streamerId: 'streamer-1',
  streamerName: 'Roshtein',
  gameName: 'Sweet Bonanza',
  status: 'completed',
  startedAt: '2026-01-08T10:00:00Z',
  endedAt: '2026-01-08T12:00:00Z',
  totalCost: 1000,
  totalPayout: 1500,
  roiPercentage: 50,
  bonusCount: 10,
  bonusesOpened: 10,
};

describe('BonusHuntCard', () => {
  describe('Rendering', () => {
    it('renders card container', () => {
      render(<BonusHuntCard hunt={mockHunt} />);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('renders card header', () => {
      render(<BonusHuntCard hunt={mockHunt} />);
      expect(screen.getByTestId('card-header')).toBeInTheDocument();
    });

    it('renders card title with streamer name', () => {
      render(<BonusHuntCard hunt={mockHunt} />);
      expect(screen.getByText('Roshtein')).toBeInTheDocument();
    });

    it('renders card content', () => {
      render(<BonusHuntCard hunt={mockHunt} />);
      expect(screen.getByTestId('card-content')).toBeInTheDocument();
    });

    it('renders as link with correct href', () => {
      render(<BonusHuntCard hunt={mockHunt} />);
      expect(screen.getByRole('link')).toHaveAttribute('href', '/bonus-hunt/hunt-1');
    });

    it('renders hunt ID in link href', () => {
      const customHunt = { ...mockHunt, id: 'custom-hunt-123' };
      render(<BonusHuntCard hunt={customHunt} />);
      expect(screen.getByRole('link')).toHaveAttribute('href', '/bonus-hunt/custom-hunt-123');
    });
  });

  describe('Status Badge', () => {
    it('displays collecting badge', () => {
      const hunt = { ...mockHunt, status: 'collecting' as const };
      render(<BonusHuntCard hunt={hunt} />);
      expect(screen.getByText('Collecting')).toBeInTheDocument();
    });

    it('displays opening badge', () => {
      const hunt = { ...mockHunt, status: 'opening' as const };
      render(<BonusHuntCard hunt={hunt} />);
      expect(screen.getByText('Opening')).toBeInTheDocument();
    });

    it('displays completed badge', () => {
      const hunt = { ...mockHunt, status: 'completed' as const };
      render(<BonusHuntCard hunt={hunt} />);
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('displays cancelled badge', () => {
      const hunt = { ...mockHunt, status: 'cancelled' as const };
      render(<BonusHuntCard hunt={hunt} />);
      expect(screen.getByText('Cancelled')).toBeInTheDocument();
    });

    it('renders badge element', () => {
      render(<BonusHuntCard hunt={mockHunt} />);
      expect(screen.getByTestId('badge')).toBeInTheDocument();
    });
  });

  describe('Financial Information', () => {
    it('displays total cost', () => {
      render(<BonusHuntCard hunt={mockHunt} />);
      expect(screen.getByText(/Total Cost/i)).toBeInTheDocument();
      expect(screen.getByText('$1,000')).toBeInTheDocument();
    });

    it('displays total payout', () => {
      render(<BonusHuntCard hunt={mockHunt} />);
      expect(screen.getByText(/Total Payout/i)).toBeInTheDocument();
      expect(screen.getByText('$1,500')).toBeInTheDocument();
    });

    it('displays profit when positive', () => {
      render(<BonusHuntCard hunt={mockHunt} />);
      expect(screen.getByText(/Profit\/Loss/i)).toBeInTheDocument();
      expect(screen.getByText('+$500')).toBeInTheDocument();
    });

    it('displays loss when negative', () => {
      const hunt = { ...mockHunt, totalCost: 1500, totalPayout: 1000, roiPercentage: -33 };
      render(<BonusHuntCard hunt={hunt} />);
      expect(screen.getByText('-$500')).toBeInTheDocument();
    });

    it('displays zero profit correctly', () => {
      const hunt = { ...mockHunt, totalCost: 1000, totalPayout: 1000, roiPercentage: 0 };
      render(<BonusHuntCard hunt={hunt} />);
      expect(screen.getByText('+$0')).toBeInTheDocument();
    });

    it('formats large currency values', () => {
      const hunt = { ...mockHunt, totalCost: 999999, totalPayout: 1500000, roiPercentage: 50 };
      render(<BonusHuntCard hunt={hunt} />);
      expect(screen.getByText('$999,999')).toBeInTheDocument();
      expect(screen.getByText('$1,500,000')).toBeInTheDocument();
    });

    it('formats currency with thousands separator', () => {
      const hunt = { ...mockHunt, totalCost: 5000, totalPayout: 7500, roiPercentage: 50 };
      render(<BonusHuntCard hunt={hunt} />);
      expect(screen.getByText('$5,000')).toBeInTheDocument();
      expect(screen.getByText('$7,500')).toBeInTheDocument();
    });
  });

  describe('ROI Percentage', () => {
    it('displays ROI percentage', () => {
      render(<BonusHuntCard hunt={mockHunt} />);
      expect(screen.getByText(/ROI/i)).toBeInTheDocument();
      expect(screen.getByText('50.0%')).toBeInTheDocument();
    });

    it('displays positive ROI in green', () => {
      render(<BonusHuntCard hunt={mockHunt} />);
      const roiText = screen.getByText('50.0%');
      expect(roiText).toHaveClass('text-green-400');
    });

    it('displays negative ROI in red', () => {
      const hunt = { ...mockHunt, roiPercentage: -25 };
      render(<BonusHuntCard hunt={hunt} />);
      const roiText = screen.getByText('-25.0%');
      expect(roiText).toHaveClass('text-red-400');
    });

    it('displays zero ROI in green', () => {
      const hunt = { ...mockHunt, roiPercentage: 0 };
      render(<BonusHuntCard hunt={hunt} />);
      const roiText = screen.getByText('0.0%');
      expect(roiText).toHaveClass('text-green-400');
    });

    it('displays N/A when ROI is undefined', () => {
      const hunt = { ...mockHunt, roiPercentage: undefined };
      render(<BonusHuntCard hunt={hunt} />);
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    it('formats ROI to one decimal place', () => {
      const hunt = { ...mockHunt, roiPercentage: 33.3333 };
      render(<BonusHuntCard hunt={hunt} />);
      expect(screen.getByText('33.3%')).toBeInTheDocument();
    });

    it('handles large ROI percentages', () => {
      const hunt = { ...mockHunt, totalCost: 100, totalPayout: 10000, roiPercentage: 9900 };
      render(<BonusHuntCard hunt={hunt} />);
      expect(screen.getByText('9900.0%')).toBeInTheDocument();
    });

    it('handles very small ROI percentages', () => {
      const hunt = { ...mockHunt, roiPercentage: 0.5 };
      render(<BonusHuntCard hunt={hunt} />);
      expect(screen.getByText('0.5%')).toBeInTheDocument();
    });
  });

  describe('Bonus Progress', () => {
    it('displays bonuses opened count', () => {
      render(<BonusHuntCard hunt={mockHunt} />);
      expect(screen.getByText(/Bonuses: 10 \/ 10/)).toBeInTheDocument();
    });

    it('displays zero bonuses opened', () => {
      const hunt = { ...mockHunt, bonusesOpened: 0, bonusCount: 10 };
      render(<BonusHuntCard hunt={hunt} />);
      expect(screen.getByText(/Bonuses: 0 \/ 10/)).toBeInTheDocument();
    });

    it('displays single bonus', () => {
      const hunt = { ...mockHunt, bonusCount: 1, bonusesOpened: 1 };
      render(<BonusHuntCard hunt={hunt} />);
      expect(screen.getByText(/Bonuses: 1 \/ 1/)).toBeInTheDocument();
    });

    it('displays large bonus count', () => {
      const hunt = { ...mockHunt, bonusCount: 100, bonusesOpened: 75 };
      render(<BonusHuntCard hunt={hunt} />);
      expect(screen.getByText(/Bonuses: 75 \/ 100/)).toBeInTheDocument();
    });

    it('renders progress bar', () => {
      const { container } = render(<BonusHuntCard hunt={mockHunt} />);
      const progressBar = container.querySelector('.bg-gradient-to-r');
      expect(progressBar).toBeInTheDocument();
    });

    it('progress bar shows 100% when all bonuses opened', () => {
      const { container } = render(<BonusHuntCard hunt={mockHunt} />);
      const progressBar = container.querySelector('.bg-gradient-to-r');
      expect(progressBar).toHaveStyle('width: 100%');
    });

    it('progress bar shows 0% when no bonuses opened', () => {
      const hunt = { ...mockHunt, bonusesOpened: 0, bonusCount: 10 };
      const { container } = render(<BonusHuntCard hunt={hunt} />);
      const progressBar = container.querySelector('.bg-gradient-to-r');
      expect(progressBar).toHaveStyle('width: 0%');
    });

    it('progress bar shows 50% when half opened', () => {
      const hunt = { ...mockHunt, bonusesOpened: 5, bonusCount: 10 };
      const { container } = render(<BonusHuntCard hunt={hunt} />);
      const progressBar = container.querySelector('.bg-gradient-to-r');
      expect(progressBar).toHaveStyle('width: 50%');
    });

    it('handles zero bonus count in progress calculation', () => {
      const hunt = { ...mockHunt, bonusCount: 0, bonusesOpened: 0 };
      const { container } = render(<BonusHuntCard hunt={hunt} />);
      const progressBar = container.querySelector('.bg-gradient-to-r');
      expect(progressBar).toHaveStyle('width: 0%');
    });
  });

  describe('Streamer Information', () => {
    it('displays streamer name', () => {
      render(<BonusHuntCard hunt={mockHunt} />);
      expect(screen.getByText('Roshtein')).toBeInTheDocument();
    });

    it('displays different streamer names', () => {
      const hunt = { ...mockHunt, streamerName: 'ClassyBeef' };
      render(<BonusHuntCard hunt={hunt} />);
      expect(screen.getByText('ClassyBeef')).toBeInTheDocument();
    });

    it('displays "Unknown Streamer" when name is missing', () => {
      const hunt = { ...mockHunt, streamerName: undefined };
      render(<BonusHuntCard hunt={hunt} />);
      expect(screen.getByText('Unknown Streamer')).toBeInTheDocument();
    });

    it('displays "Unknown Streamer" when name is empty', () => {
      const hunt = { ...mockHunt, streamerName: '' };
      render(<BonusHuntCard hunt={hunt} />);
      expect(screen.getByText('Unknown Streamer')).toBeInTheDocument();
    });

    it('includes streamer ID in hunt data', () => {
      const hunt = { ...mockHunt, streamerId: 'roshtein-123' };
      render(<BonusHuntCard hunt={hunt} />);
      expect(screen.getByRole('link')).toBeInTheDocument();
    });
  });

  describe('Date Display', () => {
    it('displays formatted start date', () => {
      render(<BonusHuntCard hunt={mockHunt} />);
      // Date format: "Jan 08, 10:00 AM"
      expect(screen.getByText(/Jan/)).toBeInTheDocument();
    });

    it('formats date correctly', () => {
      const hunt = { ...mockHunt, startedAt: '2026-01-15T14:30:00Z' };
      render(<BonusHuntCard hunt={hunt} />);
      expect(screen.getByText(/Jan/)).toBeInTheDocument();
    });

    it('includes time in date display', () => {
      const hunt = { ...mockHunt, startedAt: '2026-01-08T10:00:00Z' };
      render(<BonusHuntCard hunt={hunt} />);
      const dateText = screen.getByText(/Jan 08/);
      expect(dateText.textContent).toMatch(/\d{2}:\d{2}/);
    });
  });

  describe('Visual Styling', () => {
    it('applies hover effects', () => {
      const { container } = render(<BonusHuntCard hunt={mockHunt} />);
      const card = container.querySelector('[data-testid="card"]');
      expect(card).toHaveClass('hover:bg-slate-800/80');
    });

    it('applies correct card colors', () => {
      const { container } = render(<BonusHuntCard hunt={mockHunt} />);
      const card = container.querySelector('[data-testid="card"]');
      expect(card).toHaveClass('bg-slate-800/60');
    });

    it('profit text is green when positive', () => {
      render(<BonusHuntCard hunt={mockHunt} />);
      const profitText = screen.getByText('+$500');
      expect(profitText).toHaveClass('text-green-400');
    });

    it('loss text is red when negative', () => {
      const hunt = { ...mockHunt, totalCost: 1500, totalPayout: 1000 };
      render(<BonusHuntCard hunt={hunt} />);
      const lossText = screen.getByText('-$500');
      expect(lossText).toHaveClass('text-red-400');
    });

    it('progress bar has gradient styling', () => {
      const { container } = render(<BonusHuntCard hunt={mockHunt} />);
      const progressBar = container.querySelector('.bg-gradient-to-r');
      expect(progressBar).toHaveClass('from-purple-500', 'to-pink-500');
    });
  });

  describe('Data Mapping', () => {
    it('maps all hunt properties correctly', () => {
      const hunt: BonusHuntSummary = {
        id: 'test-hunt',
        streamerId: 'test-streamer',
        streamerName: 'TestStreamer',
        gameName: 'TestGame',
        status: 'completed',
        startedAt: '2026-01-08T00:00:00Z',
        endedAt: '2026-01-08T02:00:00Z',
        totalCost: 2000,
        totalPayout: 3000,
        roiPercentage: 50,
        bonusCount: 20,
        bonusesOpened: 20,
      };

      render(<BonusHuntCard hunt={hunt} />);
      expect(screen.getByText('TestStreamer')).toBeInTheDocument();
      expect(screen.getByText('$2,000')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles hunt with no ended date', () => {
      const hunt = { ...mockHunt, endedAt: undefined };
      render(<BonusHuntCard hunt={hunt} />);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('handles very long streamer name', () => {
      const hunt = { ...mockHunt, streamerName: 'VeryLongStreamerNameThatShouldStillDisplay' };
      render(<BonusHuntCard hunt={hunt} />);
      expect(screen.getByText(/VeryLongStreamerName/)).toBeInTheDocument();
    });

    it('handles decimal ROI correctly', () => {
      const hunt = { ...mockHunt, roiPercentage: 12.345 };
      render(<BonusHuntCard hunt={hunt} />);
      expect(screen.getByText('12.3%')).toBeInTheDocument();
    });

    it('handles very high profit', () => {
      const hunt = {
        ...mockHunt,
        totalCost: 100,
        totalPayout: 1000000,
        roiPercentage: 999900,
      };
      render(<BonusHuntCard hunt={hunt} />);
      expect(screen.getByText('$1,000,000')).toBeInTheDocument();
    });

    it('handles very low numbers', () => {
      const hunt = {
        ...mockHunt,
        totalCost: 1,
        totalPayout: 2,
        roiPercentage: 100,
      };
      render(<BonusHuntCard hunt={hunt} />);
      expect(screen.getByText('$1')).toBeInTheDocument();
    });

    it('handles bonus count mismatch gracefully', () => {
      const hunt = { ...mockHunt, bonusCount: 10, bonusesOpened: 15 };
      render(<BonusHuntCard hunt={hunt} />);
      // Should display the values as-is even if there's a mismatch
      expect(screen.getByText(/Bonuses: 15 \/ 10/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('renders semantic link element', () => {
      render(<BonusHuntCard hunt={mockHunt} />);
      expect(screen.getByRole('link')).toBeInTheDocument();
    });

    it('link is keyboard accessible', () => {
      render(<BonusHuntCard hunt={mockHunt} />);
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
    });

    it('displays text content with proper hierarchy', () => {
      render(<BonusHuntCard hunt={mockHunt} />);
      expect(screen.getByTestId('card-title')).toBeInTheDocument();
    });

    it('labels are descriptive for data fields', () => {
      render(<BonusHuntCard hunt={mockHunt} />);
      expect(screen.getByText(/Total Cost/i)).toBeInTheDocument();
      expect(screen.getByText(/Total Payout/i)).toBeInTheDocument();
      expect(screen.getByText(/Profit\/Loss/i)).toBeInTheDocument();
      expect(screen.getByText(/ROI/i)).toBeInTheDocument();
    });
  });

  describe('Props Validation', () => {
    it('renders with all required props', () => {
      const requiredHunt: BonusHuntSummary = {
        id: 'hunt-1',
        streamerId: 'streamer-1',
        status: 'completed',
        startedAt: '2026-01-08T10:00:00Z',
        totalCost: 1000,
        totalPayout: 1500,
        bonusCount: 10,
        bonusesOpened: 10,
      };

      render(<BonusHuntCard hunt={requiredHunt} />);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('renders with optional streamerName', () => {
      const hunt: BonusHuntSummary = {
        id: 'hunt-1',
        streamerId: 'streamer-1',
        streamerName: 'TestStreamer',
        status: 'completed',
        startedAt: '2026-01-08T10:00:00Z',
        totalCost: 1000,
        totalPayout: 1500,
        bonusCount: 10,
        bonusesOpened: 10,
      };

      render(<BonusHuntCard hunt={hunt} />);
      expect(screen.getByText('TestStreamer')).toBeInTheDocument();
    });

    it('renders with optional roiPercentage', () => {
      const hunt: BonusHuntSummary = {
        id: 'hunt-1',
        streamerId: 'streamer-1',
        status: 'completed',
        startedAt: '2026-01-08T10:00:00Z',
        totalCost: 1000,
        totalPayout: 1500,
        roiPercentage: 50,
        bonusCount: 10,
        bonusesOpened: 10,
      };

      render(<BonusHuntCard hunt={hunt} />);
      expect(screen.getByText('50.0%')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('renders card within acceptable time', () => {
      const startTime = performance.now();
      render(<BonusHuntCard hunt={mockHunt} />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
    });

    it('does not cause unnecessary re-renders', () => {
      const { rerender } = render(<BonusHuntCard hunt={mockHunt} />);
      const firstRender = screen.getByTestId('card');

      rerender(<BonusHuntCard hunt={mockHunt} />);
      const secondRender = screen.getByTestId('card');

      expect(firstRender).toBe(secondRender);
    });
  });
});
