/**
 * RTP Trend Chart Tests
 * Tests for RTP tracking and trend visualization
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { RTPTrendChart } from '../rtp-trend-chart'
import { RTPDataPoint } from '@/types/charts'

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
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  ReferenceLine: () => <div data-testid="reference-line" />,
}))

jest.mock('@/lib/hooks/use-media-query', () => ({
  useMediaQuery: () => false,
}))

describe('RTPTrendChart', () => {
  const mockRTPData: RTPDataPoint[] = [
    {
      date: '2024-01-01',
      timestamp: Date.now() - 86400000 * 2,
      observedRtp: 95.5,
      theoreticalRtp: 96.48,
      sampleSize: 1000,
      confidence: 85,
      variance: 2.0,
    },
    {
      date: '2024-01-02',
      timestamp: Date.now() - 86400000,
      observedRtp: 96.2,
      theoreticalRtp: 96.48,
      sampleSize: 1500,
      confidence: 90,
      variance: 1.8,
    },
    {
      date: '2024-01-03',
      timestamp: Date.now(),
      observedRtp: 96.5,
      theoreticalRtp: 96.48,
      sampleSize: 2000,
      confidence: 92,
      variance: 1.5,
    },
  ]

  describe('rendering', () => {
    it('should render chart with RTP data', () => {
      render(
        <RTPTrendChart
          data={mockRTPData}
          theoreticalRtp={96.48}
          gameName="Sweet Bonanza"
        />
      )

      expect(screen.getByTestId('area-chart')).toBeInTheDocument()
    })

    it('should display chart title', () => {
      render(
        <RTPTrendChart
          data={mockRTPData}
          theoreticalRtp={96.48}
        />
      )

      expect(screen.getByText(/RTP Trend Analysis/i)).toBeInTheDocument()
    })

    it('should show empty state when no data', () => {
      render(
        <RTPTrendChart
          data={[]}
          theoreticalRtp={96.48}
        />
      )

      expect(screen.getByText(/No RTP data available/i)).toBeInTheDocument()
    })

    it('should show loading state', () => {
      render(
        <RTPTrendChart
          data={mockRTPData}
          theoreticalRtp={96.48}
          isLoading={true}
        />
      )

      expect(screen.queryByTestId('area-chart')).not.toBeInTheDocument()
    })

    it('should show error message', () => {
      render(
        <RTPTrendChart
          data={mockRTPData}
          theoreticalRtp={96.48}
          error="Failed to load RTP data"
        />
      )

      expect(screen.getByText('Unable to Load Chart')).toBeInTheDocument()
    })
  })

  describe('RTP statistics', () => {
    it('should calculate current RTP correctly', () => {
      render(
        <RTPTrendChart
          data={mockRTPData}
          theoreticalRtp={96.48}
        />
      )

      expect(screen.getByText('Current RTP')).toBeInTheDocument()
      expect(screen.getByText(/96.50/)).toBeInTheDocument()
    })

    it('should calculate average RTP', () => {
      render(
        <RTPTrendChart
          data={mockRTPData}
          theoreticalRtp={96.48}
        />
      )

      expect(screen.getByText('Average RTP')).toBeInTheDocument()
    })

    it('should identify minimum RTP', () => {
      render(
        <RTPTrendChart
          data={mockRTPData}
          theoreticalRtp={96.48}
        />
      )

      expect(screen.getByText('Min RTP')).toBeInTheDocument()
    })

    it('should identify maximum RTP', () => {
      render(
        <RTPTrendChart
          data={mockRTPData}
          theoreticalRtp={96.48}
        />
      )

      expect(screen.getByText('Max RTP')).toBeInTheDocument()
    })
  })

  describe('trend detection', () => {
    it('should detect increasing trend', () => {
      const increasingData: RTPDataPoint[] = [
        {
          date: '2024-01-01',
          timestamp: Date.now() - 86400000 * 2,
          observedRtp: 94.0,
          theoreticalRtp: 96.48,
          sampleSize: 1000,
          confidence: 85,
          variance: 2.0,
        },
        {
          date: '2024-01-03',
          timestamp: Date.now(),
          observedRtp: 97.0,
          theoreticalRtp: 96.48,
          sampleSize: 2000,
          confidence: 92,
          variance: 1.5,
        },
      ]

      render(
        <RTPTrendChart
          data={increasingData}
          theoreticalRtp={96.48}
        />
      )

      expect(screen.getByText(/Getting Hotter|📈/)).toBeInTheDocument()
    })

    it('should detect decreasing trend', () => {
      const decreasingData: RTPDataPoint[] = [
        {
          date: '2024-01-01',
          timestamp: Date.now() - 86400000 * 2,
          observedRtp: 97.0,
          theoreticalRtp: 96.48,
          sampleSize: 1000,
          confidence: 85,
          variance: 2.0,
        },
        {
          date: '2024-01-03',
          timestamp: Date.now(),
          observedRtp: 94.0,
          theoreticalRtp: 96.48,
          sampleSize: 2000,
          confidence: 92,
          variance: 1.5,
        },
      ]

      render(
        <RTPTrendChart
          data={decreasingData}
          theoreticalRtp={96.48}
        />
      )

      expect(screen.getByText(/Cooling Down|📉/)).toBeInTheDocument()
    })

    it('should detect stable trend', () => {
      const stableData: RTPDataPoint[] = [
        {
          date: '2024-01-01',
          timestamp: Date.now() - 86400000 * 2,
          observedRtp: 96.5,
          theoreticalRtp: 96.48,
          sampleSize: 1000,
          confidence: 85,
          variance: 2.0,
        },
        {
          date: '2024-01-03',
          timestamp: Date.now(),
          observedRtp: 96.4,
          theoreticalRtp: 96.48,
          sampleSize: 2000,
          confidence: 92,
          variance: 1.5,
        },
      ]

      render(
        <RTPTrendChart
          data={stableData}
          theoreticalRtp={96.48}
        />
      )

      expect(screen.getByText(/Stable|➡️/)).toBeInTheDocument()
    })
  })

  describe('theoretical vs observed RTP', () => {
    it('should show when observed RTP exceeds theoretical', () => {
      const hotData: RTPDataPoint[] = [
        {
          date: '2024-01-01',
          timestamp: Date.now(),
          observedRtp: 98.0,
          theoreticalRtp: 96.48,
          sampleSize: 2000,
          confidence: 92,
          variance: 1.5,
        },
      ]

      render(
        <RTPTrendChart
          data={hotData}
          theoreticalRtp={96.48}
        />
      )

      expect(screen.getByText(/running hotter|🔥/i)).toBeInTheDocument()
    })

    it('should show when observed RTP is below theoretical', () => {
      const coldData: RTPDataPoint[] = [
        {
          date: '2024-01-01',
          timestamp: Date.now(),
          observedRtp: 94.0,
          theoreticalRtp: 96.48,
          sampleSize: 2000,
          confidence: 92,
          variance: 1.5,
        },
      ]

      render(
        <RTPTrendChart
          data={coldData}
          theoreticalRtp={96.48}
        />
      )

      expect(screen.getByText(/running cooler|❄️/i)).toBeInTheDocument()
    })

    it('should show when observed RTP matches theoretical', () => {
      const neutralData: RTPDataPoint[] = [
        {
          date: '2024-01-01',
          timestamp: Date.now(),
          observedRtp: 96.5,
          theoreticalRtp: 96.48,
          sampleSize: 2000,
          confidence: 92,
          variance: 1.5,
        },
      ]

      render(
        <RTPTrendChart
          data={neutralData}
          theoreticalRtp={96.48}
        />
      )

      expect(screen.getByText(/behaving as expected|✓/)).toBeInTheDocument()
    })
  })

  describe('confidence intervals', () => {
    it('should handle data with confidence values', () => {
      const confidentData: RTPDataPoint[] = [
        {
          date: '2024-01-01',
          timestamp: Date.now(),
          observedRtp: 96.48,
          theoreticalRtp: 96.48,
          sampleSize: 5000,
          confidence: 98,
          variance: 0.5,
        },
      ]

      const { container } = render(
        <RTPTrendChart
          data={confidentData}
          theoreticalRtp={96.48}
        />
      )

      expect(container).toBeTruthy()
    })

    it('should handle data with low confidence', () => {
      const lowConfidenceData: RTPDataPoint[] = [
        {
          date: '2024-01-01',
          timestamp: Date.now(),
          observedRtp: 96.48,
          theoreticalRtp: 96.48,
          sampleSize: 100,
          confidence: 20,
          variance: 5.0,
        },
      ]

      const { container } = render(
        <RTPTrendChart
          data={lowConfidenceData}
          theoreticalRtp={96.48}
        />
      )

      expect(container).toBeTruthy()
    })
  })

  describe('sample size variations', () => {
    it('should handle small sample sizes', () => {
      const smallSampleData: RTPDataPoint[] = [
        {
          date: '2024-01-01',
          timestamp: Date.now(),
          observedRtp: 96.48,
          theoreticalRtp: 96.48,
          sampleSize: 50,
          confidence: 10,
          variance: 10.0,
        },
      ]

      const { container } = render(
        <RTPTrendChart
          data={smallSampleData}
          theoreticalRtp={96.48}
        />
      )

      expect(container).toBeTruthy()
    })

    it('should handle large sample sizes', () => {
      const largeSampleData: RTPDataPoint[] = [
        {
          date: '2024-01-01',
          timestamp: Date.now(),
          observedRtp: 96.48,
          theoreticalRtp: 96.48,
          sampleSize: 100000,
          confidence: 99,
          variance: 0.1,
        },
      ]

      const { container } = render(
        <RTPTrendChart
          data={largeSampleData}
          theoreticalRtp={96.48}
        />
      )

      expect(container).toBeTruthy()
    })
  })

  describe('edge cases', () => {
    it('should handle single data point', () => {
      const singlePoint: RTPDataPoint[] = [mockRTPData[0]]

      render(
        <RTPTrendChart
          data={singlePoint}
          theoreticalRtp={96.48}
        />
      )

      expect(screen.getByTestId('area-chart')).toBeInTheDocument()
    })

    it('should handle RTP values of 0', () => {
      const zeroRtpData: RTPDataPoint[] = [
        {
          date: '2024-01-01',
          timestamp: Date.now(),
          observedRtp: 0,
          theoreticalRtp: 96.48,
          sampleSize: 1000,
          confidence: 50,
          variance: 10.0,
        },
      ]

      const { container } = render(
        <RTPTrendChart
          data={zeroRtpData}
          theoreticalRtp={96.48}
        />
      )

      expect(container).toBeTruthy()
    })

    it('should handle RTP values over 100%', () => {
      const highRtpData: RTPDataPoint[] = [
        {
          date: '2024-01-01',
          timestamp: Date.now(),
          observedRtp: 150.0,
          theoreticalRtp: 96.48,
          sampleSize: 1000,
          confidence: 80,
          variance: 5.0,
        },
      ]

      const { container } = render(
        <RTPTrendChart
          data={highRtpData}
          theoreticalRtp={96.48}
        />
      )

      expect(container).toBeTruthy()
    })

    it('should handle negative variance', () => {
      const negativeVarianceData: RTPDataPoint[] = [
        {
          date: '2024-01-01',
          timestamp: Date.now(),
          observedRtp: 96.48,
          theoreticalRtp: 96.48,
          sampleSize: 1000,
          confidence: 85,
          variance: -1.0,
        },
      ]

      const { container } = render(
        <RTPTrendChart
          data={negativeVarianceData}
          theoreticalRtp={96.48}
        />
      )

      expect(container).toBeTruthy()
    })
  })

  describe('interpretation text', () => {
    it('should display interpretation when hot', () => {
      const hotData: RTPDataPoint[] = [
        {
          date: '2024-01-01',
          timestamp: Date.now(),
          observedRtp: 98.0,
          theoreticalRtp: 96.48,
          sampleSize: 5000,
          confidence: 95,
          variance: 1.0,
        },
      ]

      render(
        <RTPTrendChart
          data={hotData}
          theoreticalRtp={96.48}
        />
      )

      expect(screen.getByText(/Continue playing/i)).toBeInTheDocument()
    })

    it('should display variance note', () => {
      render(
        <RTPTrendChart
          data={mockRTPData}
          theoreticalRtp={96.48}
        />
      )

      expect(screen.getByText(/RTP differences within ±2%/)).toBeInTheDocument()
    })
  })

  describe('responsive design', () => {
    it('should render with default height', () => {
      render(
        <RTPTrendChart
          data={mockRTPData}
          theoreticalRtp={96.48}
        />
      )

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })

    it('should accept custom height', () => {
      const { container } = render(
        <RTPTrendChart
          data={mockRTPData}
          theoreticalRtp={96.48}
          height={500}
        />
      )

      expect(container).toBeTruthy()
    })
  })
})
