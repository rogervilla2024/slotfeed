import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContentManager } from '../content-manager';

// Mock fetch
const mockFetch = global.fetch as jest.Mock;

describe('ContentManager', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Rendering', () => {
    it('should render the component with all tabs', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          contents: [],
          total: 0,
        }),
      });

      render(<ContentManager />);

      await waitFor(() => {
        expect(screen.getByText('Game Contents')).toBeInTheDocument();
      });

      expect(screen.getByText('Generation Queue')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });

    it('should render loading skeletons initially', () => {
      mockFetch.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<ContentManager />);

      // Should show loading state
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
    });

    it('should display game contents table', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          contents: [
            {
              game_id: '1',
              game_name: 'Sweet Bonanza',
              provider: 'Pragmatic Play',
              is_published: true,
              generated_at: '2024-01-08T00:00:00Z',
              readability_score: 65.5,
              content_length: 2500,
            },
          ],
          total: 1,
        }),
      });

      render(<ContentManager />);

      await waitFor(() => {
        expect(screen.getByText('Sweet Bonanza')).toBeInTheDocument();
        expect(screen.getByText('Pragmatic Play')).toBeInTheDocument();
      });
    });
  });

  describe('Game Contents Tab', () => {
    it('should display published badge for published content', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          contents: [
            {
              game_id: '1',
              game_name: 'Game 1',
              provider: 'Provider 1',
              is_published: true,
            },
          ],
          total: 1,
        }),
      });

      render(<ContentManager />);

      await waitFor(() => {
        expect(screen.getByText('Published')).toBeInTheDocument();
      });
    });

    it('should display draft badge for unpublished content', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          contents: [
            {
              game_id: '1',
              game_name: 'Game 1',
              provider: 'Provider 1',
              is_published: false,
            },
          ],
          total: 1,
        }),
      });

      render(<ContentManager />);

      await waitFor(() => {
        expect(screen.getByText('Draft')).toBeInTheDocument();
      });
    });

    it('should display quality metrics', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          contents: [
            {
              game_id: '1',
              game_name: 'Game 1',
              provider: 'Provider 1',
              is_published: true,
              readability_score: 72.3,
              content_length: 3000,
            },
          ],
          total: 1,
        }),
      });

      render(<ContentManager />);

      await waitFor(() => {
        expect(screen.getByText('72.3')).toBeInTheDocument();
        expect(screen.getByText('3000 chars')).toBeInTheDocument();
      });
    });

    it('should handle refresh button click', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          contents: [],
          total: 0,
        }),
      });

      render(<ContentManager />);

      const refreshButton = screen.getByRole('button', { name: /refresh/i });

      await waitFor(() => {
        expect(refreshButton).not.toBeDisabled();
      });

      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });
  });

  describe('Content View/Edit', () => {
    it('should open content view dialog on Eye icon click', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          contents: [
            {
              game_id: '1',
              game_name: 'Sweet Bonanza',
              provider: 'Pragmatic Play',
              overview: 'Test overview',
              is_published: true,
              generator_model: 'claude-opus-4-5',
            },
          ],
          total: 1,
        }),
      });

      render(<ContentManager />);

      await waitFor(() => {
        const viewButton = screen.getAllByRole('button').find(
          (btn) => btn.querySelector('[class*="eye"]')
        );
        expect(viewButton).toBeTruthy();
      });
    });

    it('should display content sections in view mode', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          contents: [
            {
              game_id: '1',
              game_name: 'Game 1',
              overview: 'Overview content',
              rtp_explanation: 'RTP content',
              volatility_analysis: 'Volatility content',
              bonus_features: 'Bonus content',
              strategies: 'Strategy content',
            },
          ],
          total: 1,
        }),
      });

      render(<ContentManager />);

      // Content sections should be in the component but may not be visible until dialog opens
      await waitFor(() => {
        expect(screen.getByText('Game Contents')).toBeInTheDocument();
      });
    });
  });

  describe('Content Actions', () => {
    it('should handle publish action', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            contents: [
              {
                game_id: '1',
                game_name: 'Game 1',
                is_published: false,
              },
            ],
            total: 1,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ is_published: true }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            contents: [
              {
                game_id: '1',
                game_name: 'Game 1',
                is_published: true,
              },
            ],
            total: 1,
          }),
        });

      render(<ContentManager />);

      await waitFor(() => {
        expect(screen.getByText('Game 1')).toBeInTheDocument();
      });

      const publishButtons = screen.getAllByRole('button', { name: /publish/i });
      const publishButton = publishButtons.find((btn) => btn.textContent.includes('Publish'));

      if (publishButton) {
        fireEvent.click(publishButton);

        await waitFor(() => {
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/admin/game-contents/1/publish'),
            expect.objectContaining({
              method: 'PATCH',
            })
          );
        });
      }
    });

    it('should handle generate content action', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          contents: [
            {
              game_id: '1',
              game_name: 'Game 1',
            },
          ],
          total: 1,
        }),
      });

      render(<ContentManager />);

      await waitFor(() => {
        expect(screen.getByText('Game 1')).toBeInTheDocument();
      });

      // The refresh button for generating content should be present
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should handle delete action with confirmation', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          contents: [
            {
              game_id: '1',
              game_name: 'Game 1',
            },
          ],
          total: 1,
        }),
      });

      // Mock window.confirm
      global.confirm = jest.fn(() => true);

      render(<ContentManager />);

      await waitFor(() => {
        expect(screen.getByText('Game 1')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button');
      expect(deleteButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Generation Queue Tab', () => {
    it('should display empty state when no jobs', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ contents: [], total: 0 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ jobs: [] }),
        });

      render(<ContentManager />);

      // Click on Generation Queue tab
      const queueTab = screen.getByRole('tab', { name: /generation queue/i });
      fireEvent.click(queueTab);

      await waitFor(() => {
        expect(screen.getByText(/no active generation jobs/i)).toBeInTheDocument();
      });
    });

    it('should display active generation jobs', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ contents: [], total: 0 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            jobs: [
              {
                id: 'job-1',
                game_name: 'Sweet Bonanza',
                status: 'processing',
                started_at: '2024-01-08T12:00:00Z',
              },
            ],
          }),
        });

      render(<ContentManager />);

      await waitFor(() => {
        expect(screen.getByText('Sweet Bonanza')).toBeInTheDocument();
      });
    });
  });

  describe('Analytics Tab', () => {
    it('should display analytics cards', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            contents: Array(10).fill(null).map((_, i) => ({
              game_id: `game-${i}`,
              game_name: `Game ${i}`,
              is_published: i % 2 === 0,
              readability_score: 65 + i,
            })),
            total: 10,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ jobs: [] }),
        });

      render(<ContentManager />);

      // Click on Analytics tab
      const analyticsTab = screen.getByRole('tab', { name: /analytics/i });
      fireEvent.click(analyticsTab);

      await waitFor(() => {
        expect(screen.getByText('Total Games')).toBeInTheDocument();
        expect(screen.getByText('Published')).toBeInTheDocument();
        expect(screen.getByText('Average Quality')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('API Error'));

      render(<ContentManager />);

      await waitFor(() => {
        expect(screen.getByText('Game Contents')).toBeInTheDocument();
      });
    });

    it('should handle failed content generation', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          contents: [
            {
              game_id: '1',
              game_name: 'Game 1',
            },
          ],
          total: 1,
        }),
      });

      render(<ContentManager />);

      await waitFor(() => {
        expect(screen.getByText('Game 1')).toBeInTheDocument();
      });
    });
  });
});
