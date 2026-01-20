import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChatStats } from '../ChatStats';

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div data-testid="card" className={className}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div data-testid="card-header" className={className}>{children}</div>,
  CardTitle: ({ children, className }: any) => <h3 data-testid="card-title" className={className}>{children}</h3>,
  CardContent: ({ children, className }: any) => <div data-testid="card-content" className={className}>{children}</div>,
}));

describe('ChatStats', () => {
  describe('Rendering', () => {
    it('renders card container', () => {
      render(
        <ChatStats
          totalMessages={1000}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={0.5}
          peakMessagesPerMinute={100}
          peakHypeScore={0.8}
        />
      );
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('renders title', () => {
      render(
        <ChatStats
          totalMessages={1000}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={0.5}
          peakMessagesPerMinute={100}
          peakHypeScore={0.8}
        />
      );
      expect(screen.getByText('Chat Statistics')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <ChatStats
          totalMessages={1000}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={0.5}
          peakMessagesPerMinute={100}
          peakHypeScore={0.8}
          className="custom-class"
        />
      );
      const card = container.querySelector('[data-testid="card"]');
      expect(card).toHaveClass('custom-class');
    });
  });

  describe('Total Messages Display', () => {
    it('displays total messages', () => {
      render(
        <ChatStats
          totalMessages={1000}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={0.5}
          peakMessagesPerMinute={100}
          peakHypeScore={0.8}
        />
      );
      expect(screen.getByText('1K')).toBeInTheDocument();
      expect(screen.getByText('Total Messages')).toBeInTheDocument();
    });

    it('formats large message counts in thousands', () => {
      render(
        <ChatStats
          totalMessages={5000}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={0.5}
          peakMessagesPerMinute={100}
          peakHypeScore={0.8}
        />
      );
      expect(screen.getByText('5K')).toBeInTheDocument();
    });

    it('formats message counts in millions', () => {
      render(
        <ChatStats
          totalMessages={1500000}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={0.5}
          peakMessagesPerMinute={100}
          peakHypeScore={0.8}
        />
      );
      expect(screen.getByText('1.5M')).toBeInTheDocument();
    });

    it('displays raw number for < 1000 messages', () => {
      render(
        <ChatStats
          totalMessages={500}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={0.5}
          peakMessagesPerMinute={100}
          peakHypeScore={0.8}
        />
      );
      expect(screen.getByText('500')).toBeInTheDocument();
    });

    it('displays zero messages', () => {
      render(
        <ChatStats
          totalMessages={0}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={0.5}
          peakMessagesPerMinute={100}
          peakHypeScore={0.8}
        />
      );
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Unique Chatters Display', () => {
    it('displays unique chatters count', () => {
      render(
        <ChatStats
          totalMessages={1000}
          uniqueChatters={250}
          totalEmotes={200}
          avgSentiment={0.5}
          peakMessagesPerMinute={100}
          peakHypeScore={0.8}
        />
      );
      expect(screen.getByText('250')).toBeInTheDocument();
      expect(screen.getByText('Unique Chatters')).toBeInTheDocument();
    });

    it('formats chatters in thousands', () => {
      render(
        <ChatStats
          totalMessages={1000}
          uniqueChatters={5000}
          totalEmotes={200}
          avgSentiment={0.5}
          peakMessagesPerMinute={100}
          peakHypeScore={0.8}
        />
      );
      expect(screen.getByText('5K')).toBeInTheDocument();
    });

    it('formats chatters in millions', () => {
      render(
        <ChatStats
          totalMessages={1000}
          uniqueChatters={2500000}
          totalEmotes={200}
          avgSentiment={0.5}
          peakMessagesPerMinute={100}
          peakHypeScore={0.8}
        />
      );
      expect(screen.getByText('2.5M')).toBeInTheDocument();
    });
  });

  describe('Total Emotes Display', () => {
    it('displays total emotes', () => {
      render(
        <ChatStats
          totalMessages={1000}
          uniqueChatters={100}
          totalEmotes={500}
          avgSentiment={0.5}
          peakMessagesPerMinute={100}
          peakHypeScore={0.8}
        />
      );
      expect(screen.getByText('500')).toBeInTheDocument();
      expect(screen.getByText('Total Emotes')).toBeInTheDocument();
    });

    it('formats emotes in thousands', () => {
      render(
        <ChatStats
          totalMessages={1000}
          uniqueChatters={100}
          totalEmotes={3500}
          avgSentiment={0.5}
          peakMessagesPerMinute={100}
          peakHypeScore={0.8}
        />
      );
      expect(screen.getByText('3.5K')).toBeInTheDocument();
    });
  });

  describe('Sentiment Analysis', () => {
    it('displays positive sentiment', () => {
      render(
        <ChatStats
          totalMessages={1000}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={0.5}
          peakMessagesPerMinute={100}
          peakHypeScore={0.8}
        />
      );
      expect(screen.getByText('Positive')).toBeInTheDocument();
      expect(screen.getByText('0.50')).toBeInTheDocument();
    });

    it('displays negative sentiment', () => {
      render(
        <ChatStats
          totalMessages={1000}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={-0.5}
          peakMessagesPerMinute={100}
          peakHypeScore={0.8}
        />
      );
      expect(screen.getByText('Negative')).toBeInTheDocument();
      expect(screen.getByText('-0.50')).toBeInTheDocument();
    });

    it('displays neutral sentiment', () => {
      render(
        <ChatStats
          totalMessages={1000}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={0.1}
          peakMessagesPerMinute={100}
          peakHypeScore={0.8}
        />
      );
      expect(screen.getByText('Neutral')).toBeInTheDocument();
      expect(screen.getByText('0.10')).toBeInTheDocument();
    });

    it('displays N/A for null sentiment', () => {
      render(
        <ChatStats
          totalMessages={1000}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={null}
          peakMessagesPerMinute={100}
          peakHypeScore={0.8}
        />
      );
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    it('formats sentiment to 2 decimal places', () => {
      render(
        <ChatStats
          totalMessages={1000}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={0.567}
          peakMessagesPerMinute={100}
          peakHypeScore={0.8}
        />
      );
      expect(screen.getByText('0.57')).toBeInTheDocument();
    });

    it('classifies boundary at 0.3 as positive', () => {
      render(
        <ChatStats
          totalMessages={1000}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={0.3}
          peakMessagesPerMinute={100}
          peakHypeScore={0.8}
        />
      );
      expect(screen.getByText('Positive')).toBeInTheDocument();
    });

    it('classifies boundary at -0.3 as negative', () => {
      render(
        <ChatStats
          totalMessages={1000}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={-0.3}
          peakMessagesPerMinute={100}
          peakHypeScore={0.8}
        />
      );
      expect(screen.getByText('Negative')).toBeInTheDocument();
    });

    it('classifies values between -0.3 and 0.3 as neutral', () => {
      render(
        <ChatStats
          totalMessages={1000}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={0}
          peakMessagesPerMinute={100}
          peakHypeScore={0.8}
        />
      );
      expect(screen.getByText('Neutral')).toBeInTheDocument();
    });
  });

  describe('Peak Activity Display', () => {
    it('displays peak messages per minute', () => {
      render(
        <ChatStats
          totalMessages={1000}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={0.5}
          peakMessagesPerMinute={250}
          peakHypeScore={0.8}
        />
      );
      expect(screen.getByText('250/min')).toBeInTheDocument();
      expect(screen.getByText('Peak Activity')).toBeInTheDocument();
    });

    it('displays zero peak activity', () => {
      render(
        <ChatStats
          totalMessages={1000}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={0.5}
          peakMessagesPerMinute={0}
          peakHypeScore={0.8}
        />
      );
      expect(screen.getByText('0/min')).toBeInTheDocument();
    });

    it('displays large peak activity values', () => {
      render(
        <ChatStats
          totalMessages={1000}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={0.5}
          peakMessagesPerMinute={5000}
          peakHypeScore={0.8}
        />
      );
      expect(screen.getByText('5000/min')).toBeInTheDocument();
    });
  });

  describe('Peak Hype Display', () => {
    it('displays peak hype score as percentage', () => {
      render(
        <ChatStats
          totalMessages={1000}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={0.5}
          peakMessagesPerMinute={100}
          peakHypeScore={0.8}
        />
      );
      expect(screen.getByText('80%')).toBeInTheDocument();
      expect(screen.getByText('Peak Hype')).toBeInTheDocument();
    });

    it('displays N/A for null peak hype', () => {
      render(
        <ChatStats
          totalMessages={1000}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={0.5}
          peakMessagesPerMinute={100}
          peakHypeScore={null}
        />
      );
      const n_a_items = screen.getAllByText('N/A');
      expect(n_a_items.length).toBeGreaterThan(0);
    });

    it('rounds hype score to nearest percent', () => {
      render(
        <ChatStats
          totalMessages={1000}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={0.5}
          peakMessagesPerMinute={100}
          peakHypeScore={0.556}
        />
      );
      expect(screen.getByText('56%')).toBeInTheDocument();
    });

    it('displays 0% for zero hype', () => {
      render(
        <ChatStats
          totalMessages={1000}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={0.5}
          peakMessagesPerMinute={100}
          peakHypeScore={0}
        />
      );
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('displays 100% for max hype', () => {
      render(
        <ChatStats
          totalMessages={1000}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={0.5}
          peakMessagesPerMinute={100}
          peakHypeScore={1}
        />
      );
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('Number Formatting', () => {
    it('handles decimal thousands', () => {
      render(
        <ChatStats
          totalMessages={1250}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={0.5}
          peakMessagesPerMinute={100}
          peakHypeScore={0.8}
        />
      );
      expect(screen.getByText('1.3K')).toBeInTheDocument();
    });

    it('handles decimal millions', () => {
      render(
        <ChatStats
          totalMessages={1250000}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={0.5}
          peakMessagesPerMinute={100}
          peakHypeScore={0.8}
        />
      );
      expect(screen.getByText('1.3M')).toBeInTheDocument();
    });

    it('rounds to one decimal place for K', () => {
      render(
        <ChatStats
          totalMessages={1456}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={0.5}
          peakMessagesPerMinute={100}
          peakHypeScore={0.8}
        />
      );
      expect(screen.getByText('1.5K')).toBeInTheDocument();
    });
  });

  describe('Icon Display', () => {
    it('displays message icon', () => {
      render(
        <ChatStats
          totalMessages={1000}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={0.5}
          peakMessagesPerMinute={100}
          peakHypeScore={0.8}
        />
      );
      expect(screen.getByText('💬')).toBeInTheDocument();
    });

    it('displays chatters icon', () => {
      render(
        <ChatStats
          totalMessages={1000}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={0.5}
          peakMessagesPerMinute={100}
          peakHypeScore={0.8}
        />
      );
      expect(screen.getByText('👥')).toBeInTheDocument();
    });

    it('displays emotes icon', () => {
      render(
        <ChatStats
          totalMessages={1000}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={0.5}
          peakMessagesPerMinute={100}
          peakHypeScore={0.8}
        />
      );
      expect(screen.getByText('🎭')).toBeInTheDocument();
    });

    it('displays sentiment icon for positive', () => {
      render(
        <ChatStats
          totalMessages={1000}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={0.5}
          peakMessagesPerMinute={100}
          peakHypeScore={0.8}
        />
      );
      expect(screen.getByText('+')).toBeInTheDocument();
    });

    it('displays sentiment icon for negative', () => {
      render(
        <ChatStats
          totalMessages={1000}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={-0.5}
          peakMessagesPerMinute={100}
          peakHypeScore={0.8}
        />
      );
      const negativeIcons = screen.getAllByText('-');
      expect(negativeIcons.length).toBeGreaterThan(0);
    });

    it('displays activity icon', () => {
      render(
        <ChatStats
          totalMessages={1000}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={0.5}
          peakMessagesPerMinute={100}
          peakHypeScore={0.8}
        />
      );
      expect(screen.getByText('📈')).toBeInTheDocument();
    });

    it('displays hype icon', () => {
      render(
        <ChatStats
          totalMessages={1000}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={0.5}
          peakMessagesPerMinute={100}
          peakHypeScore={0.8}
        />
      );
      expect(screen.getByText('🔥')).toBeInTheDocument();
    });
  });

  describe('Color Styling', () => {
    it('applies green color for positive sentiment', () => {
      const { container } = render(
        <ChatStats
          totalMessages={1000}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={0.5}
          peakMessagesPerMinute={100}
          peakHypeScore={0.8}
        />
      );
      const positiveText = container.querySelector('.text-green-500');
      expect(positiveText).toBeInTheDocument();
    });

    it('applies red color for negative sentiment', () => {
      const { container } = render(
        <ChatStats
          totalMessages={1000}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={-0.5}
          peakMessagesPerMinute={100}
          peakHypeScore={0.8}
        />
      );
      const negativeText = container.querySelector('.text-red-500');
      expect(negativeText).toBeInTheDocument();
    });

    it('applies yellow color for neutral sentiment', () => {
      const { container } = render(
        <ChatStats
          totalMessages={1000}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={0.1}
          peakMessagesPerMinute={100}
          peakHypeScore={0.8}
        />
      );
      const neutralText = container.querySelector('.text-yellow-500');
      expect(neutralText).toBeInTheDocument();
    });
  });

  describe('Grid Layout', () => {
    it('renders grid with 2 columns on mobile', () => {
      const { container } = render(
        <ChatStats
          totalMessages={1000}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={0.5}
          peakMessagesPerMinute={100}
          peakHypeScore={0.8}
        />
      );
      const grid = container.querySelector('[class*="grid"]');
      expect(grid).toHaveClass('grid-cols-2', 'md:grid-cols-3');
    });
  });

  describe('Edge Cases', () => {
    it('handles all zero values', () => {
      render(
        <ChatStats
          totalMessages={0}
          uniqueChatters={0}
          totalEmotes={0}
          avgSentiment={null}
          peakMessagesPerMinute={0}
          peakHypeScore={null}
        />
      );
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('handles very large numbers', () => {
      render(
        <ChatStats
          totalMessages={999999999}
          uniqueChatters={999999999}
          totalEmotes={999999999}
          avgSentiment={0.5}
          peakMessagesPerMinute={99999}
          peakHypeScore={1}
        />
      );
      expect(screen.getByText('1000.0M')).toBeInTheDocument();
    });

    it('handles extreme sentiment values', () => {
      render(
        <ChatStats
          totalMessages={1000}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={-1}
          peakMessagesPerMinute={100}
          peakHypeScore={0.8}
        />
      );
      expect(screen.getByText('Negative')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('renders within acceptable time', () => {
      const startTime = performance.now();
      render(
        <ChatStats
          totalMessages={1000}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={0.5}
          peakMessagesPerMinute={100}
          peakHypeScore={0.8}
        />
      );
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('All Stats Display Together', () => {
    it('displays all 6 stats', () => {
      render(
        <ChatStats
          totalMessages={1000}
          uniqueChatters={100}
          totalEmotes={200}
          avgSentiment={0.5}
          peakMessagesPerMinute={100}
          peakHypeScore={0.8}
        />
      );
      expect(screen.getByText('Total Messages')).toBeInTheDocument();
      expect(screen.getByText('Unique Chatters')).toBeInTheDocument();
      expect(screen.getByText('Total Emotes')).toBeInTheDocument();
      expect(screen.getByText('Avg Sentiment')).toBeInTheDocument();
      expect(screen.getByText('Peak Activity')).toBeInTheDocument();
      expect(screen.getByText('Peak Hype')).toBeInTheDocument();
    });
  });
});
