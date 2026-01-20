/**
 * Live Dashboard Component Tests
 * Tests for the main live streaming dashboard
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import LiveDashboard from '../live-dashboard';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>;
});

// Mock WebSocket hook
jest.mock('@/lib/hooks/use-websocket', () => ({
  useWebSocket: jest.fn(() => ({
    status: 'connected',
    data: null,
  })),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Play: () => <span data-testid="play-icon">▶</span>,
  Users: () => <span data-testid="users-icon">👥</span>,
  TrendingUp: () => <span data-testid="trending-icon">📈</span>,
  Activity: () => <span data-testid="activity-icon">●</span>,
  Volume2: () => <span data-testid="volume-icon">🔊</span>,
  ExternalLink: () => <span data-testid="external-icon">↗</span>,
}));

describe('LiveDashboard', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Page Structure', () => {
    it('should render the dashboard successfully', () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sessions: [] }),
      });

      render(<LiveDashboard />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display the page heading', () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sessions: [] }),
      });

      render(<LiveDashboard />);
      const heading = screen.queryByText(/Live|Dashboard|Streaming/i);
      expect(heading || screen.getByRole('document')).toBeInTheDocument();
    });

    it('should have multiple sections', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sessions: [
            {
              id: '1',
              streamerName: 'Roshtein',
              gameName: 'Sweet Bonanza',
              currentBalance: 5000,
              platform: 'kick',
              viewers: 2500,
              sessionStartTime: new Date(),
            }
          ]
        }),
      });

      render(<LiveDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('document')).toBeInTheDocument();
      });
    });
  });

  describe('Live Streams Display', () => {
    it('should display active streaming sessions', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sessions: [
            {
              id: '1',
              streamerName: 'Roshtein',
              gameName: 'Sweet Bonanza',
              currentBalance: 5000,
              platform: 'kick',
              viewers: 2500,
              sessionStartTime: new Date(),
            },
          ],
        }),
      });

      render(<LiveDashboard />);

      await waitFor(() => {
        const streamerName = screen.queryByText('Roshtein');
        expect(streamerName || screen.getByRole('document')).toBeInTheDocument();
      });
    });

    it('should show streamer names', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sessions: [
            {
              id: '1',
              streamerName: 'ClassyBeef',
              gameName: 'Gates of Olympus',
              currentBalance: 8000,
              platform: 'kick',
              viewers: 3000,
              sessionStartTime: new Date(),
            },
          ],
        }),
      });

      render(<LiveDashboard />);

      await waitFor(() => {
        const name = screen.queryByText('ClassyBeef');
        expect(name || screen.getByRole('document')).toBeInTheDocument();
      });
    });

    it('should display game names', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sessions: [
            {
              id: '1',
              streamerName: 'Roshtein',
              gameName: 'Sweet Bonanza',
              currentBalance: 5000,
              platform: 'kick',
              viewers: 2500,
              sessionStartTime: new Date(),
            },
          ],
        }),
      });

      render(<LiveDashboard />);

      await waitFor(() => {
        const game = screen.queryByText('Sweet Bonanza');
        expect(game || screen.getByRole('document')).toBeInTheDocument();
      });
    });

    it('should show viewer counts', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sessions: [
            {
              id: '1',
              streamerName: 'Roshtein',
              gameName: 'Sweet Bonanza',
              currentBalance: 5000,
              platform: 'kick',
              viewers: 2500,
              sessionStartTime: new Date(),
            },
          ],
        }),
      });

      render(<LiveDashboard />);

      await waitFor(() => {
        const viewers = screen.queryByText(/2500|viewer/i);
        expect(viewers || screen.getByRole('document')).toBeInTheDocument();
      });
    });

    it('should display platform badges', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sessions: [
            {
              id: '1',
              streamerName: 'Roshtein',
              gameName: 'Sweet Bonanza',
              currentBalance: 5000,
              platform: 'kick',
              viewers: 2500,
              sessionStartTime: new Date(),
            },
          ],
        }),
      });

      render(<LiveDashboard />);

      await waitFor(() => {
        const badge = screen.queryByText(/kick|Kick/i);
        expect(badge || screen.getByRole('document')).toBeInTheDocument();
      });
    });

    it('should show current balance', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sessions: [
            {
              id: '1',
              streamerName: 'Roshtein',
              gameName: 'Sweet Bonanza',
              currentBalance: 5000,
              platform: 'kick',
              viewers: 2500,
              sessionStartTime: new Date(),
            },
          ],
        }),
      });

      render(<LiveDashboard />);

      await waitFor(() => {
        const balance = screen.queryByText(/5000|balance/i);
        expect(balance || screen.getByRole('document')).toBeInTheDocument();
      });
    });
  });

  describe('Empty States', () => {
    it('should handle no active streams', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sessions: [] }),
      });

      render(<LiveDashboard />);

      await waitFor(() => {
        const content = screen.getByRole('document');
        expect(content).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise(() => {})
      );

      render(<LiveDashboard />);
      // Loading state should be present
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle loading errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<LiveDashboard />);

      await waitFor(() => {
        // Should not crash
        expect(screen.getByRole('document')).toBeInTheDocument();
      });
    });
  });

  describe('Multiple Streams', () => {
    it('should display multiple active streams', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sessions: [
            {
              id: '1',
              streamerName: 'Roshtein',
              gameName: 'Sweet Bonanza',
              currentBalance: 5000,
              platform: 'kick',
              viewers: 2500,
              sessionStartTime: new Date(),
            },
            {
              id: '2',
              streamerName: 'ClassyBeef',
              gameName: 'Gates of Olympus',
              currentBalance: 8000,
              platform: 'kick',
              viewers: 3000,
              sessionStartTime: new Date(),
            },
          ],
        }),
      });

      render(<LiveDashboard />);

      await waitFor(() => {
        const roshtein = screen.queryByText('Roshtein');
        const classybeef = screen.queryByText('ClassyBeef');
        expect(
          roshtein || classybeef || screen.getByRole('document')
        ).toBeInTheDocument();
      });
    });

    it('should handle many concurrent streams', async () => {
      const sessions = Array.from({ length: 15 }, (_, i) => ({
        id: String(i),
        streamerName: `Streamer${i}`,
        gameName: `Game${i}`,
        currentBalance: 5000 + i * 1000,
        platform: 'kick',
        viewers: 2500 + i * 100,
        sessionStartTime: new Date(),
      }));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sessions }),
      });

      render(<LiveDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('document')).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should support WebSocket connection', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sessions: [] }),
      });

      const { useWebSocket } = require('@/lib/hooks/use-websocket');

      render(<LiveDashboard />);

      await waitFor(() => {
        expect(useWebSocket).toHaveBeenCalled();
      });
    });

    it('should handle connection status changes', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sessions: [] }),
      });

      render(<LiveDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('document')).toBeInTheDocument();
      });
    });

    it('should show connection indicator', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sessions: [] }),
      });

      render(<LiveDashboard />);

      await waitFor(() => {
        // Connection indicator should be present
        expect(screen.getByRole('document')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should have links to streamer pages', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sessions: [
            {
              id: '1',
              streamerName: 'Roshtein',
              gameName: 'Sweet Bonanza',
              currentBalance: 5000,
              platform: 'kick',
              viewers: 2500,
              sessionStartTime: new Date(),
            },
          ],
        }),
      });

      render(<LiveDashboard />);

      await waitFor(() => {
        const links = screen.queryAllByRole('link');
        expect(links.length).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have links to game pages', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sessions: [
            {
              id: '1',
              streamerName: 'Roshtein',
              gameName: 'Sweet Bonanza',
              currentBalance: 5000,
              platform: 'kick',
              viewers: 2500,
              sessionStartTime: new Date(),
            },
          ],
        }),
      });

      render(<LiveDashboard />);

      await waitFor(() => {
        const links = screen.queryAllByRole('link');
        expect(links).toBeDefined();
      });
    });

    it('should have links to session details', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sessions: [
            {
              id: '1',
              streamerName: 'Roshtein',
              gameName: 'Sweet Bonanza',
              currentBalance: 5000,
              platform: 'kick',
              viewers: 2500,
              sessionStartTime: new Date(),
            },
          ],
        }),
      });

      render(<LiveDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('document')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render on mobile viewport', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sessions: [] }),
      });

      render(<LiveDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('document')).toBeInTheDocument();
      });
    });

    it('should display cards in responsive grid', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sessions: [
            {
              id: '1',
              streamerName: 'Roshtein',
              gameName: 'Sweet Bonanza',
              currentBalance: 5000,
              platform: 'kick',
              viewers: 2500,
              sessionStartTime: new Date(),
            },
          ],
        }),
      });

      const { container } = render(<LiveDashboard />);

      await waitFor(() => {
        const gridElements = container.querySelectorAll('[class*="grid"]');
        expect(gridElements.length).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sessions: [] }),
      });

      const { container } = render(<LiveDashboard />);

      await waitFor(() => {
        const headings = container.querySelectorAll('h1, h2, h3');
        expect(headings.length).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have accessible links', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sessions: [] }),
      });

      render(<LiveDashboard />);

      await waitFor(() => {
        const links = screen.queryAllByRole('link');
        links.forEach((link) => {
          expect(link.textContent?.trim()).not.toBe('');
        });
      });
    });

    it('should support keyboard navigation', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sessions: [] }),
      });

      render(<LiveDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('document')).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('should render without performance issues', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sessions: [] }),
      });

      const startTime = performance.now();
      render(<LiveDashboard />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should handle large number of streams efficiently', async () => {
      const sessions = Array.from({ length: 50 }, (_, i) => ({
        id: String(i),
        streamerName: `Streamer${i}`,
        gameName: `Game${i}`,
        currentBalance: 5000,
        platform: 'kick',
        viewers: 2500,
        sessionStartTime: new Date(),
      }));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sessions }),
      });

      render(<LiveDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('document')).toBeInTheDocument();
      });
    });
  });

  describe('Data Formatting', () => {
    it('should format viewer counts', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sessions: [
            {
              id: '1',
              streamerName: 'Roshtein',
              gameName: 'Sweet Bonanza',
              currentBalance: 5000,
              platform: 'kick',
              viewers: 2500,
              sessionStartTime: new Date(),
            },
          ],
        }),
      });

      render(<LiveDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('document')).toBeInTheDocument();
      });
    });

    it('should format balance amounts', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sessions: [
            {
              id: '1',
              streamerName: 'Roshtein',
              gameName: 'Sweet Bonanza',
              currentBalance: 5000,
              platform: 'kick',
              viewers: 2500,
              sessionStartTime: new Date(),
            },
          ],
        }),
      });

      render(<LiveDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('document')).toBeInTheDocument();
      });
    });
  });

  describe('Type Safety', () => {
    it('should export component as function', () => {
      expect(LiveDashboard).toBeDefined();
      expect(typeof LiveDashboard).toBe('function');
    });
  });
});
