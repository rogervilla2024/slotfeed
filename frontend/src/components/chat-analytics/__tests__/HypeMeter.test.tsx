import React from 'react';
import { render, screen } from '@testing-library/react';
import { HypeMeter } from '../HypeMeter';

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div data-testid="card" className={className}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div data-testid="card-header" className={className}>{children}</div>,
  CardTitle: ({ children, className }: any) => <h3 data-testid="card-title" className={className}>{children}</h3>,
  CardContent: ({ children, className }: any) => <div data-testid="card-content" className={className}>{children}</div>,
}));

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: any) => <span data-testid="badge" className={className}>{children}</span>,
}));

describe('HypeMeter', () => {
  describe('Rendering', () => {
    it('renders card container', () => {
      render(<HypeMeter hypeScore={0.5} messagesPerMinute={100} uniqueChatters={50} isLive={true} />);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('renders title', () => {
      render(<HypeMeter hypeScore={0.5} messagesPerMinute={100} uniqueChatters={50} isLive={false} />);
      expect(screen.getByText('Hype Meter')).toBeInTheDocument();
    });

    it('renders progress meter', () => {
      const { container } = render(
        <HypeMeter hypeScore={0.5} messagesPerMinute={100} uniqueChatters={50} isLive={false} />
      );
      const meter = container.querySelector('[style*="width"]');
      expect(meter).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <HypeMeter
          hypeScore={0.5}
          messagesPerMinute={100}
          uniqueChatters={50}
          isLive={false}
          className="custom-class"
        />
      );
      const card = container.querySelector('[data-testid="card"]');
      expect(card).toHaveClass('custom-class');
    });
  });

  describe('Hype Score Calculation', () => {
    it('displays INSANE for score >= 0.8', () => {
      render(<HypeMeter hypeScore={0.8} messagesPerMinute={100} uniqueChatters={50} isLive={false} />);
      expect(screen.getByText('INSANE')).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument();
    });

    it('displays HIGH for score 0.6-0.79', () => {
      render(<HypeMeter hypeScore={0.7} messagesPerMinute={100} uniqueChatters={50} isLive={false} />);
      expect(screen.getByText('HIGH')).toBeInTheDocument();
      expect(screen.getByText('70%')).toBeInTheDocument();
    });

    it('displays MEDIUM for score 0.4-0.59', () => {
      render(<HypeMeter hypeScore={0.5} messagesPerMinute={100} uniqueChatters={50} isLive={false} />);
      expect(screen.getByText('MEDIUM')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('displays LOW for score 0.2-0.39', () => {
      render(<HypeMeter hypeScore={0.3} messagesPerMinute={100} uniqueChatters={50} isLive={false} />);
      expect(screen.getByText('LOW')).toBeInTheDocument();
      expect(screen.getByText('30%')).toBeInTheDocument();
    });

    it('displays CHILL for score < 0.2', () => {
      render(<HypeMeter hypeScore={0.1} messagesPerMinute={100} uniqueChatters={50} isLive={false} />);
      expect(screen.getByText('CHILL')).toBeInTheDocument();
      expect(screen.getByText('10%')).toBeInTheDocument();
    });

    it('rounds percentage correctly', () => {
      render(<HypeMeter hypeScore={0.555} messagesPerMinute={100} uniqueChatters={50} isLive={false} />);
      expect(screen.getByText('56%')).toBeInTheDocument();
    });

    it('handles zero hype score', () => {
      render(<HypeMeter hypeScore={0} messagesPerMinute={0} uniqueChatters={0} isLive={false} />);
      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('CHILL')).toBeInTheDocument();
    });

    it('handles max hype score', () => {
      render(<HypeMeter hypeScore={1} messagesPerMinute={1000} uniqueChatters={500} isLive={true} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('INSANE')).toBeInTheDocument();
    });
  });

  describe('Messages Per Minute Display', () => {
    it('displays messages per minute', () => {
      render(<HypeMeter hypeScore={0.5} messagesPerMinute={150} uniqueChatters={50} isLive={false} />);
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('msgs/min')).toBeInTheDocument();
    });

    it('displays zero messages', () => {
      render(<HypeMeter hypeScore={0.5} messagesPerMinute={0} uniqueChatters={50} isLive={false} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('displays large message counts', () => {
      render(<HypeMeter hypeScore={0.9} messagesPerMinute={5000} uniqueChatters={500} isLive={true} />);
      expect(screen.getByText('5000')).toBeInTheDocument();
    });

    it('displays decimal message rates', () => {
      render(<HypeMeter hypeScore={0.2} messagesPerMinute={12.5} uniqueChatters={20} isLive={false} />);
      expect(screen.getByText('12.5')).toBeInTheDocument();
    });
  });

  describe('Unique Chatters Display', () => {
    it('displays unique chatters count', () => {
      render(<HypeMeter hypeScore={0.5} messagesPerMinute={100} uniqueChatters={75} isLive={false} />);
      expect(screen.getByText('75')).toBeInTheDocument();
      expect(screen.getByText('chatters')).toBeInTheDocument();
    });

    it('displays zero chatters', () => {
      render(<HypeMeter hypeScore={0.1} messagesPerMinute={0} uniqueChatters={0} isLive={false} />);
      // Both values have 0, need to check context
      const cards = screen.getAllByText('0');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('displays large chatter counts', () => {
      render(<HypeMeter hypeScore={0.9} messagesPerMinute={3000} uniqueChatters={2000} isLive={true} />);
      expect(screen.getByText('2000')).toBeInTheDocument();
    });
  });

  describe('Live Indicator', () => {
    it('displays LIVE badge when isLive is true', () => {
      render(<HypeMeter hypeScore={0.5} messagesPerMinute={100} uniqueChatters={50} isLive={true} />);
      expect(screen.getByText('LIVE')).toBeInTheDocument();
    });

    it('does not display LIVE badge when isLive is false', () => {
      render(<HypeMeter hypeScore={0.5} messagesPerMinute={100} uniqueChatters={50} isLive={false} />);
      expect(screen.queryByText(/LIVE/i)).not.toBeInTheDocument();
    });

    it('displays pulsing indicator when live', () => {
      const { container } = render(
        <HypeMeter hypeScore={0.5} messagesPerMinute={100} uniqueChatters={50} isLive={true} />
      );
      const pulsingDot = container.querySelector('.animate-pulse');
      expect(pulsingDot).toBeInTheDocument();
    });
  });

  describe('Color Styling', () => {
    it('applies INSANE color theme', () => {
      const { container } = render(
        <HypeMeter hypeScore={0.9} messagesPerMinute={100} uniqueChatters={50} isLive={false} />
      );
      const card = container.querySelector('[data-testid="card"]');
      expect(card).toHaveClass('bg-purple-500/10', 'border-purple-500/50');
    });

    it('applies HIGH color theme', () => {
      const { container } = render(
        <HypeMeter hypeScore={0.7} messagesPerMinute={100} uniqueChatters={50} isLive={false} />
      );
      const card = container.querySelector('[data-testid="card"]');
      expect(card).toHaveClass('bg-orange-500/10', 'border-orange-500/50');
    });

    it('applies MEDIUM color theme', () => {
      const { container } = render(
        <HypeMeter hypeScore={0.5} messagesPerMinute={100} uniqueChatters={50} isLive={false} />
      );
      const card = container.querySelector('[data-testid="card"]');
      expect(card).toHaveClass('bg-yellow-500/10', 'border-yellow-500/50');
    });

    it('applies LOW color theme', () => {
      const { container } = render(
        <HypeMeter hypeScore={0.3} messagesPerMinute={100} uniqueChatters={50} isLive={false} />
      );
      const card = container.querySelector('[data-testid="card"]');
      expect(card).toHaveClass('bg-green-500/10', 'border-green-500/50');
    });

    it('applies CHILL color theme', () => {
      const { container } = render(
        <HypeMeter hypeScore={0.1} messagesPerMinute={100} uniqueChatters={50} isLive={false} />
      );
      const card = container.querySelector('[data-testid="card"]');
      expect(card).toHaveClass('bg-blue-500/10', 'border-blue-500/50');
    });
  });

  describe('Meter Width Animation', () => {
    it('sets meter width to percentage', () => {
      const { container } = render(
        <HypeMeter hypeScore={0.75} messagesPerMinute={100} uniqueChatters={50} isLive={false} />
      );
      const meterFill = container.querySelector('[style*="width"]');
      expect(meterFill).toHaveStyle('width: 75%');
    });

    it('sets meter width to 0% for zero score', () => {
      const { container } = render(
        <HypeMeter hypeScore={0} messagesPerMinute={0} uniqueChatters={0} isLive={false} />
      );
      const meterFill = container.querySelector('[style*="width"]');
      expect(meterFill).toHaveStyle('width: 0%');
    });

    it('sets meter width to 100% for max score', () => {
      const { container } = render(
        <HypeMeter hypeScore={1} messagesPerMinute={1000} uniqueChatters={500} isLive={true} />
      );
      const meterFill = container.querySelector('[style*="width"]');
      expect(meterFill).toHaveStyle('width: 100%');
    });
  });

  describe('Badge Display', () => {
    it('renders badge with hype label', () => {
      render(<HypeMeter hypeScore={0.5} messagesPerMinute={100} uniqueChatters={50} isLive={false} />);
      expect(screen.getByTestId('badge')).toBeInTheDocument();
      expect(screen.getByText('MEDIUM')).toBeInTheDocument();
    });

    it('badge changes for different hype scores', () => {
      const { rerender } = render(
        <HypeMeter hypeScore={0.2} messagesPerMinute={100} uniqueChatters={50} isLive={false} />
      );
      expect(screen.getByText('LOW')).toBeInTheDocument();

      rerender(<HypeMeter hypeScore={0.8} messagesPerMinute={100} uniqueChatters={50} isLive={false} />);
      expect(screen.getByText('INSANE')).toBeInTheDocument();
    });
  });

  describe('Decimal Handling', () => {
    it('handles decimal hype scores', () => {
      render(<HypeMeter hypeScore={0.456} messagesPerMinute={100} uniqueChatters={50} isLive={false} />);
      expect(screen.getByText('46%')).toBeInTheDocument();
    });

    it('rounds up decimal percentages', () => {
      render(<HypeMeter hypeScore={0.555} messagesPerMinute={100} uniqueChatters={50} isLive={false} />);
      expect(screen.getByText('56%')).toBeInTheDocument();
    });

    it('handles very small decimal values', () => {
      render(<HypeMeter hypeScore={0.001} messagesPerMinute={1} uniqueChatters={1} isLive={false} />);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('handles values very close to boundary', () => {
      render(<HypeMeter hypeScore={0.199} messagesPerMinute={100} uniqueChatters={50} isLive={false} />);
      expect(screen.getByText('LOW')).toBeInTheDocument();

      const { rerender } = render(<HypeMeter hypeScore={0.2} messagesPerMinute={100} uniqueChatters={50} isLive={false} />);
      expect(screen.getByText('LOW')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles negative hype score gracefully', () => {
      render(<HypeMeter hypeScore={-0.5} messagesPerMinute={100} uniqueChatters={50} isLive={false} />);
      expect(screen.getByText('CHILL')).toBeInTheDocument();
    });

    it('handles hype score > 1', () => {
      render(<HypeMeter hypeScore={1.5} messagesPerMinute={100} uniqueChatters={50} isLive={false} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('INSANE')).toBeInTheDocument();
    });

    it('handles negative message rate', () => {
      render(<HypeMeter hypeScore={0.5} messagesPerMinute={-50} uniqueChatters={50} isLive={false} />);
      expect(screen.getByText('-50')).toBeInTheDocument();
    });

    it('handles negative chatters count', () => {
      render(<HypeMeter hypeScore={0.5} messagesPerMinute={100} uniqueChatters={-10} isLive={false} />);
      expect(screen.getByText('-10')).toBeInTheDocument();
    });
  });

  describe('Layout and Spacing', () => {
    it('renders stats grid', () => {
      const { container } = render(
        <HypeMeter hypeScore={0.5} messagesPerMinute={100} uniqueChatters={50} isLive={false} />
      );
      const grid = container.querySelector('[class*="grid"]');
      expect(grid).toBeInTheDocument();
    });

    it('displays both stats in grid', () => {
      render(<HypeMeter hypeScore={0.5} messagesPerMinute={100} uniqueChatters={50} isLive={false} />);
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('displays readable percentage text', () => {
      render(<HypeMeter hypeScore={0.75} messagesPerMinute={100} uniqueChatters={50} isLive={false} />);
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('provides context labels for metrics', () => {
      render(<HypeMeter hypeScore={0.5} messagesPerMinute={100} uniqueChatters={50} isLive={false} />);
      expect(screen.getByText('msgs/min')).toBeInTheDocument();
      expect(screen.getByText('chatters')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('renders within acceptable time', () => {
      const startTime = performance.now();
      render(<HypeMeter hypeScore={0.5} messagesPerMinute={100} uniqueChatters={50} isLive={false} />);
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Threshold Boundaries', () => {
    it('classifies score exactly at 0.2 as LOW', () => {
      render(<HypeMeter hypeScore={0.2} messagesPerMinute={100} uniqueChatters={50} isLive={false} />);
      expect(screen.getByText('LOW')).toBeInTheDocument();
    });

    it('classifies score exactly at 0.4 as MEDIUM', () => {
      render(<HypeMeter hypeScore={0.4} messagesPerMinute={100} uniqueChatters={50} isLive={false} />);
      expect(screen.getByText('MEDIUM')).toBeInTheDocument();
    });

    it('classifies score exactly at 0.6 as HIGH', () => {
      render(<HypeMeter hypeScore={0.6} messagesPerMinute={100} uniqueChatters={50} isLive={false} />);
      expect(screen.getByText('HIGH')).toBeInTheDocument();
    });

    it('classifies score exactly at 0.8 as INSANE', () => {
      render(<HypeMeter hypeScore={0.8} messagesPerMinute={100} uniqueChatters={50} isLive={false} />);
      expect(screen.getByText('INSANE')).toBeInTheDocument();
    });
  });
});
