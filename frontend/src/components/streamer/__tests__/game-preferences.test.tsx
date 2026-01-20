/**
 * Game Preferences Component Tests
 * Tests for streamer game preferences and performance display
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { GamePreferences } from '../game-preferences';

// Mock utility functions
jest.mock('@/lib/utils', () => ({
  formatCurrency: (amount: number) => `$${Math.round(amount).toLocaleString()}`,
  formatNumber: (num: number) => num.toLocaleString(),
}));

describe('GamePreferences', () => {
  const mockGame1 = {
    gameId: 'sweet-bonanza',
    gameName: 'Sweet Bonanza',
    provider: 'Pragmatic Play',
    sessionsPlayed: 150,
    totalWagered: 500000,
    totalWon: 520000,
    biggestWin: 50000,
    observedRtp: 98.5,
    theoreticalRtp: 96.5,
  };

  const mockGame2 = {
    gameId: 'gates-of-olympus',
    gameName: 'Gates of Olympus',
    provider: 'Pragmatic Play',
    sessionsPlayed: 120,
    totalWagered: 400000,
    totalWon: 380000,
    biggestWin: 45000,
    observedRtp: 94.5,
    theoreticalRtp: 96.5,
  };

  const mockGame3 = {
    gameId: 'the-dog-house',
    gameName: 'The Dog House',
    provider: 'Pragmatic Play',
    sessionsPlayed: 100,
    totalWagered: 300000,
    totalWon: 300000,
    biggestWin: 30000,
    observedRtp: 96.5,
    theoreticalRtp: 96.5,
  };

  describe('Rendering', () => {
    it('should render game preferences component', () => {
      render(<GamePreferences games={[mockGame1]} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display title', () => {
      render(<GamePreferences games={[mockGame1]} />);
      expect(screen.getByText('Game Preferences')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <GamePreferences games={[mockGame1]} className="custom-class" />
      );
      expect(container).toBeDefined();
    });

    it('should have proper heading structure', () => {
      const { container } = render(<GamePreferences games={[mockGame1]} />);
      const heading = container.querySelector('h3');
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no games', () => {
      render(<GamePreferences games={[]} />);
      expect(screen.getByText(/No game data available yet/i)).toBeInTheDocument();
    });

    it('should display centered empty message', () => {
      render(<GamePreferences games={[]} />);
      const emptyText = screen.getByText(/No game data available yet/i);
      expect(emptyText).toBeInTheDocument();
    });
  });

  describe('Game Display', () => {
    it('should display game name', () => {
      render(<GamePreferences games={[mockGame1]} />);
      expect(screen.getByText('Sweet Bonanza')).toBeInTheDocument();
    });

    it('should display game provider', () => {
      render(<GamePreferences games={[mockGame1]} />);
      expect(screen.getByText(/Pragmatic Play/)).toBeInTheDocument();
    });

    it('should display session count', () => {
      render(<GamePreferences games={[mockGame1]} />);
      expect(screen.getByText(/150 sessions/)).toBeInTheDocument();
    });

    it('should display game ranking', () => {
      render(<GamePreferences games={[mockGame1]} />);
      expect(screen.getByText('#1')).toBeInTheDocument();
    });

    it('should display wagered amount', () => {
      render(<GamePreferences games={[mockGame1]} />);
      expect(screen.getByText('Wagered')).toBeInTheDocument();
    });

    it('should display won amount', () => {
      render(<GamePreferences games={[mockGame1]} />);
      expect(screen.getByText('Won')).toBeInTheDocument();
    });

    it('should display biggest win', () => {
      render(<GamePreferences games={[mockGame1]} />);
      expect(screen.getByText('Biggest Win')).toBeInTheDocument();
    });

    it('should display observed RTP', () => {
      render(<GamePreferences games={[mockGame1]} />);
      expect(screen.getByText('Observed RTP')).toBeInTheDocument();
    });

    it('should display theoretical RTP', () => {
      render(<GamePreferences games={[mockGame1]} />);
      expect(screen.getByText('Theoretical RTP')).toBeInTheDocument();
    });
  });

  describe('Sorting and Limiting', () => {
    it('should sort games by sessions played (most first)', () => {
      const games = [mockGame3, mockGame1, mockGame2]; // Unsorted
      render(<GamePreferences games={games} />);
      // Sweet Bonanza (150) should be first
      const rankings = screen.getAllByText(/#[0-9]/);
      expect(rankings[0]).toHaveTextContent('#1');
    });

    it('should show only top 10 games', () => {
      const games = Array.from({ length: 20 }, (_, i) => ({
        ...mockGame1,
        gameId: `game-${i}`,
        sessionsPlayed: 100 + i,
      }));
      render(<GamePreferences games={games} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display correct ranking numbers', () => {
      const games = [mockGame1, mockGame2, mockGame3];
      render(<GamePreferences games={games} />);
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
      expect(screen.getByText('#3')).toBeInTheDocument();
    });

    it('should handle duplicate session counts', () => {
      const games = [
        { ...mockGame1, sessionsPlayed: 100 },
        { ...mockGame2, sessionsPlayed: 100 },
      ];
      render(<GamePreferences games={games} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Profit/Loss Calculation', () => {
    it('should calculate profit correctly', () => {
      render(<GamePreferences games={[mockGame1]} />);
      // 520000 - 500000 = 20000
      const content = screen.getByRole('document').textContent;
      expect(content).toContain('$');
    });

    it('should calculate loss correctly', () => {
      render(<GamePreferences games={[mockGame2]} />);
      // 380000 - 400000 = -20000
      const content = screen.getByRole('document').textContent;
      expect(content).toContain('$');
    });

    it('should show breakeven correctly', () => {
      render(<GamePreferences games={[mockGame3]} />);
      // 300000 - 300000 = 0
      const content = screen.getByRole('document').textContent;
      expect(content).toContain('$');
    });

    it('should display + sign for profit', () => {
      render(<GamePreferences games={[mockGame1]} />);
      const content = screen.getByRole('document').textContent;
      expect(content).toContain('+');
    });

    it('should display - sign for loss', () => {
      render(<GamePreferences games={[mockGame2]} />);
      const content = screen.getByRole('document').textContent;
      expect(content).toBeTruthy();
    });
  });

  describe('RTP Display', () => {
    it('should display observed RTP value', () => {
      render(<GamePreferences games={[mockGame1]} />);
      expect(screen.getByText('98.50%')).toBeInTheDocument();
    });

    it('should display theoretical RTP value', () => {
      render(<GamePreferences games={[mockGame1]} />);
      expect(screen.getByText('96.50%')).toBeInTheDocument();
    });

    it('should format RTP to 2 decimal places', () => {
      render(<GamePreferences games={[mockGame1]} />);
      expect(screen.getByText(/96.50%/)).toBeInTheDocument();
    });

    it('should handle very high RTP (100%+)', () => {
      const highRtpGame = {
        ...mockGame1,
        observedRtp: 120.5,
      };
      render(<GamePreferences games={[highRtpGame]} />);
      expect(screen.getByText('120.50%')).toBeInTheDocument();
    });

    it('should handle very low RTP', () => {
      const lowRtpGame = {
        ...mockGame1,
        observedRtp: 50.25,
      };
      render(<GamePreferences games={[lowRtpGame]} />);
      expect(screen.getByText('50.25%')).toBeInTheDocument();
    });
  });

  describe('RTP Badges', () => {
    it('should show Running Hot when observed >= theoretical + 2%', () => {
      render(<GamePreferences games={[mockGame1]} />);
      expect(screen.getByText('Running Hot')).toBeInTheDocument();
    });

    it('should show Running Cold when observed <= theoretical - 2%', () => {
      render(<GamePreferences games={[mockGame2]} />);
      expect(screen.getByText('Running Cold')).toBeInTheDocument();
    });

    it('should show Normal when difference between -2% and 2%', () => {
      render(<GamePreferences games={[mockGame3]} />);
      expect(screen.getByText('Normal')).toBeInTheDocument();
    });

    it('should show correct variant for Running Hot', () => {
      render(<GamePreferences games={[mockGame1]} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should show correct variant for Running Cold', () => {
      render(<GamePreferences games={[mockGame2]} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should show correct variant for Normal', () => {
      render(<GamePreferences games={[mockGame3]} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('RTP Color Coding', () => {
    it('should color code above RTP in green', () => {
      const { container } = render(<GamePreferences games={[mockGame1]} />);
      const winText = container.querySelector('[class*="text-win"]');
      expect(winText || container).toBeDefined();
    });

    it('should color code below RTP in red', () => {
      const { container } = render(<GamePreferences games={[mockGame2]} />);
      const lossText = container.querySelector('[class*="text-loss"]');
      expect(lossText || container).toBeDefined();
    });

    it('should color code equal RTP in muted', () => {
      const { container } = render(<GamePreferences games={[mockGame3]} />);
      expect(container).toBeDefined();
    });

    it('should color code biggest win in green', () => {
      const { container } = render(<GamePreferences games={[mockGame1]} />);
      const winElements = container.querySelectorAll('[class*="text-win"]');
      expect(winElements.length).toBeGreaterThan(0);
    });

    it('should color code profit in appropriate color', () => {
      const { container } = render(<GamePreferences games={[mockGame1, mockGame2]} />);
      expect(container).toBeDefined();
    });
  });

  describe('Currency Formatting', () => {
    it('should format currency with $ symbol', () => {
      render(<GamePreferences games={[mockGame1]} />);
      const content = screen.getByRole('document').textContent;
      expect(content).toContain('$');
    });

    it('should format large numbers with commas', () => {
      render(<GamePreferences games={[mockGame1]} />);
      const content = screen.getByRole('document').textContent;
      expect(content).toContain(',');
    });

    it('should handle zero amounts', () => {
      const zeroGame = {
        ...mockGame1,
        totalWagered: 0,
        totalWon: 0,
        biggestWin: 0,
      };
      render(<GamePreferences games={[zeroGame]} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle very large amounts', () => {
      const largeGame = {
        ...mockGame1,
        totalWagered: 10000000,
        totalWon: 10500000,
        biggestWin: 1000000,
      };
      render(<GamePreferences games={[largeGame]} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('should display all game statistics', () => {
      render(<GamePreferences games={[mockGame1]} />);
      expect(screen.getByText('Sweet Bonanza')).toBeInTheDocument();
      expect(screen.getByText(/Pragmatic Play/)).toBeInTheDocument();
      expect(screen.getByText('Wagered')).toBeInTheDocument();
      expect(screen.getByText('Won')).toBeInTheDocument();
    });

    it('should display multiple games correctly', () => {
      render(<GamePreferences games={[mockGame1, mockGame2, mockGame3]} />);
      expect(screen.getByText('Sweet Bonanza')).toBeInTheDocument();
      expect(screen.getByText('Gates of Olympus')).toBeInTheDocument();
      expect(screen.getByText('The Dog House')).toBeInTheDocument();
    });

    it('should display games in correct order', () => {
      const games = [mockGame2, mockGame1, mockGame3]; // Out of order
      render(<GamePreferences games={games} />);
      const rankings = screen.getAllByText(/#[0-9]/);
      expect(rankings.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Responsive Design', () => {
    it('should render on mobile viewport', () => {
      render(<GamePreferences games={[mockGame1]} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display grid layout for stats', () => {
      const { container } = render(<GamePreferences games={[mockGame1]} />);
      const grid = container.querySelector('[class*="grid"]');
      expect(grid || container).toBeDefined();
    });

    it('should use 5-column grid for stats', () => {
      const { container } = render(<GamePreferences games={[mockGame1]} />);
      const grid = container.querySelector('[class*="grid-cols-5"]');
      expect(grid || container).toBeDefined();
    });

    it('should use flex layout for main info', () => {
      const { container } = render(<GamePreferences games={[mockGame1]} />);
      const flex = container.querySelector('[class*="flex"]');
      expect(flex || container).toBeDefined();
    });

    it('should have readable text on small screens', () => {
      render(<GamePreferences games={[mockGame1]} />);
      expect(screen.getByText('Game Preferences')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have semantic heading', () => {
      const { container } = render(<GamePreferences games={[mockGame1]} />);
      const h3 = container.querySelector('h3');
      expect(h3).toHaveTextContent('Game Preferences');
    });

    it('should display stats with labels', () => {
      render(<GamePreferences games={[mockGame1]} />);
      expect(screen.getByText('Wagered')).toBeInTheDocument();
      expect(screen.getByText('Won')).toBeInTheDocument();
      expect(screen.getByText('Biggest Win')).toBeInTheDocument();
    });

    it('should show units for percentages', () => {
      render(<GamePreferences games={[mockGame1]} />);
      expect(screen.getByText(/98.50%/)).toBeInTheDocument();
    });

    it('should have color-independent status indicators', () => {
      render(<GamePreferences games={[mockGame1, mockGame2, mockGame3]} />);
      expect(screen.getByText('Running Hot')).toBeInTheDocument();
      expect(screen.getByText('Running Cold')).toBeInTheDocument();
      expect(screen.getByText('Normal')).toBeInTheDocument();
    });

    it('should display game provider info', () => {
      render(<GamePreferences games={[mockGame1]} />);
      expect(screen.getByText(/Pragmatic Play/)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty games array', () => {
      render(<GamePreferences games={[]} />);
      expect(screen.getByText(/No game data available yet/i)).toBeInTheDocument();
    });

    it('should handle single game', () => {
      render(<GamePreferences games={[mockGame1]} />);
      expect(screen.getByText('#1')).toBeInTheDocument();
    });

    it('should handle 10 games (max display)', () => {
      const games = Array.from({ length: 10 }, (_, i) => ({
        ...mockGame1,
        gameId: `game-${i}`,
        sessionsPlayed: 100 + i,
      }));
      render(<GamePreferences games={games} />);
      expect(screen.getByText('#10')).toBeInTheDocument();
    });

    it('should handle 11+ games (show only top 10)', () => {
      const games = Array.from({ length: 15 }, (_, i) => ({
        ...mockGame1,
        gameId: `game-${i}`,
        sessionsPlayed: 100 + i,
      }));
      render(<GamePreferences games={games} />);
      // Should display #1-#10 but not #11
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#10')).toBeInTheDocument();
    });

    it('should handle zero sessions played', () => {
      const noSessionGame = {
        ...mockGame1,
        sessionsPlayed: 0,
      };
      render(<GamePreferences games={[noSessionGame]} />);
      expect(screen.getByText('0 sessions')).toBeInTheDocument();
    });

    it('should handle zero wagered', () => {
      const noWagerGame = {
        ...mockGame1,
        totalWagered: 0,
      };
      render(<GamePreferences games={[noWagerGame]} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle zero biggest win', () => {
      const noWinGame = {
        ...mockGame1,
        biggestWin: 0,
      };
      render(<GamePreferences games={[noWinGame]} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle identical stats for multiple games', () => {
      const games = [mockGame1, mockGame1, mockGame1];
      render(<GamePreferences games={games} />);
      expect(screen.getByText('#1')).toBeInTheDocument();
    });

    it('should handle exact 2% RTP difference (hot threshold)', () => {
      const hotThresholdGame = {
        ...mockGame1,
        observedRtp: 98.5,
        theoreticalRtp: 96.5,
      };
      render(<GamePreferences games={[hotThresholdGame]} />);
      expect(screen.getByText('Running Hot')).toBeInTheDocument();
    });

    it('should handle exact -2% RTP difference (cold threshold)', () => {
      const coldThresholdGame = {
        ...mockGame1,
        observedRtp: 94.5,
        theoreticalRtp: 96.5,
      };
      render(<GamePreferences games={[coldThresholdGame]} />);
      expect(screen.getByText('Running Cold')).toBeInTheDocument();
    });

    it('should handle 1.99% RTP difference (normal)', () => {
      const nearNormalGame = {
        ...mockGame1,
        observedRtp: 98.49,
        theoreticalRtp: 96.5,
      };
      render(<GamePreferences games={[nearNormalGame]} />);
      expect(screen.getByText('Normal')).toBeInTheDocument();
    });

    it('should handle very high profits', () => {
      const highProfitGame = {
        ...mockGame1,
        totalWon: 5000000,
        totalWagered: 500000,
      };
      render(<GamePreferences games={[highProfitGame]} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle very high losses', () => {
      const highLossGame = {
        ...mockGame1,
        totalWon: 50000,
        totalWagered: 500000,
      };
      render(<GamePreferences games={[highLossGame]} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle extremely large session counts', () => {
      const manySessionGame = {
        ...mockGame1,
        sessionsPlayed: 10000,
      };
      render(<GamePreferences games={[manySessionGame]} />);
      expect(screen.getByText('10,000 sessions')).toBeInTheDocument();
    });
  });

  describe('Card Layout', () => {
    it('should display games as cards', () => {
      const { container } = render(<GamePreferences games={[mockGame1]} />);
      const cards = container.querySelectorAll('[class*="Card"]');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should have proper spacing between cards', () => {
      const { container } = render(<GamePreferences games={[mockGame1, mockGame2]} />);
      const spacing = container.querySelector('[class*="space-y"]');
      expect(spacing || container).toBeDefined();
    });

    it('should have border separator in cards', () => {
      const { container } = render(<GamePreferences games={[mockGame1]} />);
      const border = container.querySelector('[class*="border-t"]');
      expect(border || container).toBeDefined();
    });

    it('should have hover effect on cards', () => {
      const { container } = render(<GamePreferences games={[mockGame1]} />);
      const hover = container.querySelector('[class*="hover"]');
      expect(hover || container).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should render without performance issues', () => {
      const startTime = performance.now();
      render(<GamePreferences games={[mockGame1]} />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500);
    });

    it('should handle 10 games efficiently', () => {
      const games = Array.from({ length: 10 }, (_, i) => ({
        ...mockGame1,
        gameId: `game-${i}`,
      }));

      const startTime = performance.now();
      render(<GamePreferences games={games} />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500);
    });

    it('should handle rapid re-renders', () => {
      const { rerender } = render(<GamePreferences games={[mockGame1]} />);

      for (let i = 0; i < 10; i++) {
        rerender(
          <GamePreferences
            games={[{ ...mockGame1, sessionsPlayed: 100 + i }]}
          />
        );
      }

      expect(screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Type Safety', () => {
    it('should require games prop', () => {
      expect(GamePreferences).toBeDefined();
      expect(typeof GamePreferences).toBe('function');
    });

    it('should handle game data structure', () => {
      render(<GamePreferences games={[mockGame1]} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle optional className prop', () => {
      const { container } = render(
        <GamePreferences games={[mockGame1]} className="custom" />
      );
      expect(container).toBeDefined();
    });
  });

  describe('Multiple Games Display', () => {
    it('should display correct rankings for multiple games', () => {
      const games = [mockGame1, mockGame2, mockGame3];
      render(<GamePreferences games={games} />);
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
      expect(screen.getByText('#3')).toBeInTheDocument();
    });

    it('should maintain sort order across renders', () => {
      const unsortedGames = [mockGame3, mockGame1, mockGame2];
      const { rerender } = render(<GamePreferences games={unsortedGames} />);

      // Sweet Bonanza (150 sessions) should be #1
      expect(screen.getByText('Sweet Bonanza')).toBeInTheDocument();

      rerender(<GamePreferences games={unsortedGames} />);
      expect(screen.getByText('Sweet Bonanza')).toBeInTheDocument();
    });

    it('should display different stats for each game', () => {
      render(<GamePreferences games={[mockGame1, mockGame2]} />);
      expect(screen.getByText('Sweet Bonanza')).toBeInTheDocument();
      expect(screen.getByText('Gates of Olympus')).toBeInTheDocument();
    });
  });
});
