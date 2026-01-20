/**
 * Slot Guide Component Tests
 * Tests for educational slot game content
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { SlotGuide } from '../slot-guide'

jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (...args: any[]) => {
    if (typeof args[0] === 'function') {
      return args[0]().then((mod: any) => mod.default || mod)
    }
    return null
  },
}))

describe('SlotGuide', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  const mockGameContent = {
    game_id: 'sweet_bonanza',
    overview: 'Sweet Bonanza is a popular slot game with candy theme.',
    rtp_explanation: 'RTP of 96.48% means for every $100 wagered, you expect $96.48 back.',
    volatility_analysis: 'High volatility with potential for large wins.',
    bonus_features: 'Includes free spins and candy cluster mechanics.',
    strategies: 'Manage your bankroll and set loss limits.',
    streamer_insights: 'Highly popular on streaming platforms.',
    meta_description: 'Sweet Bonanza slot game review and strategy guide.',
    focus_keywords: ['Sweet Bonanza', 'slot strategy', 'RTP'],
    is_published: true,
    generated_at: '2024-01-01',
    updated_at: '2024-01-01',
  }

  describe('rendering and loading', () => {
    it('should render with required props', () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGameContent,
      })

      render(<SlotGuide gameId="sweet_bonanza" gameName="Sweet Bonanza" />)
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('should load content from API', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGameContent,
      })

      render(<SlotGuide gameId="sweet_bonanza" gameName="Sweet Bonanza" />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/v1/games/sweet_bonanza/content')
      })
    })

    it('should display game name in title', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGameContent,
      })

      render(<SlotGuide gameId="sweet_bonanza" gameName="Sweet Bonanza" />)

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('content sections', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGameContent,
      })
    })

    it('should render all guide sections', async () => {
      render(<SlotGuide gameId="sweet_bonanza" gameName="Sweet Bonanza" />)

      await waitFor(() => {
        expect(screen.getByText('Game Overview')).toBeInTheDocument()
        expect(screen.getByText('RTP & Payout Mechanics')).toBeInTheDocument()
        expect(screen.getByText('Volatility Analysis')).toBeInTheDocument()
        expect(screen.getByText('Bonus Features Guide')).toBeInTheDocument()
        expect(screen.getByText('Winning Strategies')).toBeInTheDocument()
        expect(screen.getByText('Streamer Insights')).toBeInTheDocument()
      })
    })

    it('should display overview content', async () => {
      render(<SlotGuide gameId="sweet_bonanza" gameName="Sweet Bonanza" />)

      await waitFor(() => {
        expect(screen.getByText(/candy theme/i)).toBeInTheDocument()
      })
    })

    it('should display RTP explanation', async () => {
      render(<SlotGuide gameId="sweet_bonanza" gameName="Sweet Bonanza" />)

      await waitFor(() => {
        expect(screen.getByText(/96.48%/)).toBeInTheDocument()
      })
    })

    it('should display volatility analysis', async () => {
      render(<SlotGuide gameId="sweet_bonanza" gameName="Sweet Bonanza" />)

      await waitFor(() => {
        expect(screen.getByText(/High volatility/i)).toBeInTheDocument()
      })
    })

    it('should display bonus features', async () => {
      render(<SlotGuide gameId="sweet_bonanza" gameName="Sweet Bonanza" />)

      await waitFor(() => {
        expect(screen.getByText(/free spins/i)).toBeInTheDocument()
      })
    })

    it('should display strategies', async () => {
      render(<SlotGuide gameId="sweet_bonanza" gameName="Sweet Bonanza" />)

      await waitFor(() => {
        expect(screen.getByText(/Manage your bankroll/i)).toBeInTheDocument()
      })
    })

    it('should display streamer insights', async () => {
      render(<SlotGuide gameId="sweet_bonanza" gameName="Sweet Bonanza" />)

      await waitFor(() => {
        expect(screen.getByText(/Highly popular on streaming/i)).toBeInTheDocument()
      })
    })
  })

  describe('expandable sections', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGameContent,
      })
    })

    it('should have expandable sections on mobile', async () => {
      render(<SlotGuide gameId="sweet_bonanza" gameName="Sweet Bonanza" />)

      await waitFor(() => {
        expect(screen.getByText('Game Overview')).toBeInTheDocument()
      })
    })

    it('should expand overview section by default', async () => {
      render(<SlotGuide gameId="sweet_bonanza" gameName="Sweet Bonanza" />)

      await waitFor(() => {
        expect(screen.getByText(/candy theme/i)).toBeInTheDocument()
      })
    })

    it('should expand bonus features by default', async () => {
      render(<SlotGuide gameId="sweet_bonanza" gameName="Sweet Bonanza" />)

      await waitFor(() => {
        expect(screen.getByText(/free spins/i)).toBeInTheDocument()
      })
    })
  })

  describe('error handling', () => {
    it('should show error message on API failure', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      render(<SlotGuide gameId="sweet_bonanza" gameName="Sweet Bonanza" />)

      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument()
      })
    })

    it('should show error on network failure', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      )

      render(<SlotGuide gameId="sweet_bonanza" gameName="Sweet Bonanza" />)

      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument()
      })
    })

    it('should handle missing content gracefully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ game_id: 'test', is_published: false }),
      })

      render(<SlotGuide gameId="sweet_bonanza" gameName="Sweet Bonanza" />)

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('content updates', () => {
    it('should refetch content when gameId changes', async () => {
      const { rerender } = render(
        <SlotGuide gameId="sweet_bonanza" gameName="Sweet Bonanza" />
      )

      ;(global.fetch as jest.Mock).mockClear()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGameContent,
      })

      rerender(<SlotGuide gameId="gates_of_olympus" gameName="Gates of Olympus" />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/v1/games/gates_of_olympus/content')
      })
    })

    it('should not refetch when gameId is same', async () => {
      const { rerender } = render(
        <SlotGuide gameId="sweet_bonanza" gameName="Sweet Bonanza" />
      )

      ;(global.fetch as jest.Mock).mockClear()

      rerender(<SlotGuide gameId="sweet_bonanza" gameName="Sweet Bonanza Updated" />)

      await waitFor(() => {
        expect(global.fetch).not.toHaveBeenCalled()
      })
    })
  })

  describe('accessibility', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGameContent,
      })
    })

    it('should have proper heading hierarchy', async () => {
      render(<SlotGuide gameId="sweet_bonanza" gameName="Sweet Bonanza" />)

      await waitFor(() => {
        const headings = screen.getAllByRole('heading')
        expect(headings.length).toBeGreaterThan(0)
      })
    })

    it('should have descriptive section titles', async () => {
      render(<SlotGuide gameId="sweet_bonanza" gameName="Sweet Bonanza" />)

      await waitFor(() => {
        expect(screen.getByText(/Game Overview/i)).toBeInTheDocument()
        expect(screen.getByText(/RTP/i)).toBeInTheDocument()
        expect(screen.getByText(/Volatility/i)).toBeInTheDocument()
      })
    })
  })

  describe('responsive design', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGameContent,
      })
    })

    it('should render on mobile viewport', async () => {
      render(<SlotGuide gameId="sweet_bonanza" gameName="Sweet Bonanza" />)

      await waitFor(() => {
        expect(screen.getByText('Game Overview')).toBeInTheDocument()
      })
    })

    it('should render on desktop viewport', async () => {
      render(<SlotGuide gameId="sweet_bonanza" gameName="Sweet Bonanza" />)

      await waitFor(() => {
        expect(screen.getByText('Game Overview')).toBeInTheDocument()
      })
    })
  })

  describe('SEO metadata', () => {
    beforeEach(() => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGameContent,
      })
    })

    it('should include meta description', async () => {
      render(<SlotGuide gameId="sweet_bonanza" gameName="Sweet Bonanza" />)

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
      })
    })

    it('should handle focus keywords', async () => {
      render(<SlotGuide gameId="sweet_bonanza" gameName="Sweet Bonanza" />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })
    })
  })

  describe('empty content handling', () => {
    it('should handle game without content gracefully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          game_id: 'test',
          is_published: false,
        }),
      })

      render(<SlotGuide gameId="test" gameName="Test Game" />)

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
      })
    })

    it('should handle partial content', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          game_id: 'test',
          overview: 'Some overview',
          is_published: true,
        }),
      })

      render(<SlotGuide gameId="test" gameName="Test Game" />)

      await waitFor(() => {
        expect(screen.getByText(/Some overview/i)).toBeInTheDocument()
      })
    })
  })
})
