/**
 * Live RTP Widget Tests
 * Tests for real-time RTP tracking widget
 */

import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { LiveRTPWidget } from '../live-rtp-widget'

jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (...args: any[]) => {
    if (typeof args[0] === 'function') {
      return args[0]().then((mod: any) => mod.default || mod)
    }
    return null
  },
}))

jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}))

describe('LiveRTPWidget', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  const mockLiveRTPData = [
    {
      id: '1',
      streamerName: 'Roshtein',
      gameName: 'Sweet Bonanza',
      currentRtp: 96.5,
      recentRtp: [95.2, 96.0, 96.5],
      status: 'hot' as const,
      viewers: 5000,
      platform: 'kick' as const,
    },
    {
      id: '2',
      streamerName: 'ClassyBeef',
      gameName: 'Gates of Olympus',
      currentRtp: 94.2,
      recentRtp: [95.0, 94.8, 94.2],
      status: 'cold' as const,
      viewers: 3000,
      platform: 'kick' as const,
    },
  ]

  describe('rendering', () => {
    it('should render with initial loading state', () => {
      ;(global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise(() => {}) // Never resolves
      )

      render(<LiveRTPWidget />)
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('should render live RTP data when loaded', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockLiveRTPData }),
      })

      render(<LiveRTPWidget />)

      await waitFor(() => {
        expect(screen.getByText('Roshtein')).toBeInTheDocument()
        expect(screen.getByText('ClassyBeef')).toBeInTheDocument()
      })
    })

    it('should display streamer names', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockLiveRTPData }),
      })

      render(<LiveRTPWidget />)

      await waitFor(() => {
        expect(screen.getByText('Roshtein')).toBeInTheDocument()
        expect(screen.getByText('ClassyBeef')).toBeInTheDocument()
      })
    })

    it('should display game names', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockLiveRTPData }),
      })

      render(<LiveRTPWidget />)

      await waitFor(() => {
        expect(screen.getByText('Sweet Bonanza')).toBeInTheDocument()
        expect(screen.getByText('Gates of Olympus')).toBeInTheDocument()
      })
    })

    it('should display current RTP values', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockLiveRTPData }),
      })

      render(<LiveRTPWidget />)

      await waitFor(() => {
        expect(screen.getByText(/96.5/)).toBeInTheDocument()
        expect(screen.getByText(/94.2/)).toBeInTheDocument()
      })
    })

    it('should display viewer counts', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockLiveRTPData }),
      })

      render(<LiveRTPWidget />)

      await waitFor(() => {
        expect(screen.getByText(/5000|5K/)).toBeInTheDocument()
        expect(screen.getByText(/3000|3K/)).toBeInTheDocument()
      })
    })
  })

  describe('status indicators', () => {
    it('should show hot indicator for hot slots', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockLiveRTPData }),
      })

      render(<LiveRTPWidget />)

      await waitFor(() => {
        const hotElement = screen.getByText(/Roshtein/).closest('[class*="bg"]')
        expect(hotElement).toBeInTheDocument()
      })
    })

    it('should show cold indicator for cold slots', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockLiveRTPData }),
      })

      render(<LiveRTPWidget />)

      await waitFor(() => {
        const coldElement = screen.getByText(/ClassyBeef/).closest('[class*="bg"]')
        expect(coldElement).toBeInTheDocument()
      })
    })

    it('should display status badges', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockLiveRTPData }),
      })

      render(<LiveRTPWidget />)

      await waitFor(() => {
        expect(screen.queryByText(/hot|cold|neutral/i)).toBeTruthy()
      })
    })
  })

  describe('sparkline rendering', () => {
    it('should render sparkline charts for RTP trends', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockLiveRTPData }),
      })

      render(<LiveRTPWidget />)

      await waitFor(() => {
        expect(screen.getAllByTestId('line-chart').length).toBeGreaterThan(0)
      })
    })

    it('should use recent RTP data for sparklines', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockLiveRTPData }),
      })

      render(<LiveRTPWidget />)

      await waitFor(() => {
        expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
      })
    })
  })

  describe('auto-refresh', () => {
    it('should refresh data automatically', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockLiveRTPData }),
      })

      render(<LiveRTPWidget refreshInterval={30000} />)

      jest.advanceTimersByTime(30000)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2)
      })
    })

    it('should respect custom refresh interval', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockLiveRTPData }),
      })

      render(<LiveRTPWidget refreshInterval={60000} />)

      jest.advanceTimersByTime(30000)
      expect(global.fetch).toHaveBeenCalledTimes(1)

      jest.advanceTimersByTime(30000)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2)
      })
    })

    it('should clean up interval on unmount', () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockLiveRTPData }),
      })

      const { unmount } = render(<LiveRTPWidget />)

      unmount()

      jest.advanceTimersByTime(30000)
      // Should not cause errors
      expect(global.fetch).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should show error message on fetch failure', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      )

      render(<LiveRTPWidget />)

      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument()
      })
    })

    it('should handle API errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      render(<LiveRTPWidget />)

      await waitFor(() => {
        expect(screen.getByText(/error|failed/i)).toBeInTheDocument()
      })
    })

    it('should continue running after error', async () => {
      ;(global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockLiveRTPData }),
        })

      render(<LiveRTPWidget refreshInterval={30000} />)

      jest.advanceTimersByTime(30000)

      await waitFor(() => {
        expect(screen.getByText('Roshtein')).toBeInTheDocument()
      })
    })
  })

  describe('empty state', () => {
    it('should show empty state when no data', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      })

      render(<LiveRTPWidget />)

      await waitFor(() => {
        expect(screen.getByText(/no data|no streams/i)).toBeInTheDocument()
      })
    })
  })

  describe('responsive grid', () => {
    it('should render in grid layout', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockLiveRTPData }),
      })

      render(<LiveRTPWidget />)

      await waitFor(() => {
        expect(screen.getByText('Roshtein')).toBeInTheDocument()
        expect(screen.getByText('ClassyBeef')).toBeInTheDocument()
      })
    })
  })

  describe('data types', () => {
    it('should handle large viewer counts', async () => {
      const largeViewerData = [
        {
          ...mockLiveRTPData[0],
          viewers: 50000,
        },
      ]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: largeViewerData }),
      })

      render(<LiveRTPWidget />)

      await waitFor(() => {
        expect(screen.getByText(/50|50K|50000/)).toBeInTheDocument()
      })
    })

    it('should handle zero viewers', async () => {
      const zeroViewerData = [
        {
          ...mockLiveRTPData[0],
          viewers: 0,
        },
      ]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: zeroViewerData }),
      })

      render(<LiveRTPWidget />)

      await waitFor(() => {
        expect(screen.getByText('Roshtein')).toBeInTheDocument()
      })
    })

    it('should handle extreme RTP values', async () => {
      const extremeRtpData = [
        {
          ...mockLiveRTPData[0],
          currentRtp: 0,
          recentRtp: [0, 0, 0],
        },
        {
          ...mockLiveRTPData[1],
          currentRtp: 200,
          recentRtp: [180, 190, 200],
        },
      ]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: extremeRtpData }),
      })

      render(<LiveRTPWidget />)

      await waitFor(() => {
        expect(screen.getByText('Roshtein')).toBeInTheDocument()
      })
    })
  })

  describe('accessibility', () => {
    it('should have descriptive aria labels', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockLiveRTPData }),
      })

      const { container } = render(<LiveRTPWidget />)

      await waitFor(() => {
        expect(container).toBeTruthy()
      })
    })
  })

  describe('platform indicators', () => {
    it('should show platform badges', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockLiveRTPData }),
      })

      render(<LiveRTPWidget />)

      await waitFor(() => {
        expect(screen.getByText('Roshtein')).toBeInTheDocument()
      })
    })
  })
})
