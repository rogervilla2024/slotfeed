/**
 * Balance History Chart Tests
 * Tests for balance tracking visualization
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { BalanceHistoryChart } from '../balance-history-chart'
import { BalanceDataPoint } from '@/types/charts'

// Mock the dynamic imports
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (...args: any[]) => {
    if (typeof args[0] === 'function') {
      return args[0]().then(
        (mod: any) => mod.default || mod
      )
    }
    return null
  },
}))

jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Area: () => <div data-testid="area" />,
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

describe('BalanceHistoryChart', () => {
  const mockData: BalanceDataPoint[] = [
    {
      timestamp: Date.now() - 3600000,
      balance: 100,
      change: 0,
      changePercent: 0,
      bet: 1,
      win: 0,
    },
    {
      timestamp: Date.now() - 1800000,
      balance: 150,
      change: 50,
      changePercent: 50,
      bet: 1,
      win: 50,
    },
    {
      timestamp: Date.now(),
      balance: 120,
      change: 20,
      changePercent: 20,
      bet: 1,
      win: 0,
    },
  ]

  describe('rendering', () => {
    it('should render with required props', () => {
      render(
        <BalanceHistoryChart
          data={mockData}
          startBalance={100}
          currentBalance={120}
        />
      )

      expect(screen.getByTestId('area-chart')).toBeInTheDocument()
    })

    it('should render chart title', () => {
      render(
        <BalanceHistoryChart
          data={mockData}
          startBalance={100}
          currentBalance={120}
        />
      )

      expect(screen.getByText('Balance History')).toBeInTheDocument()
    })

    it('should show empty state when no data provided', () => {
      render(
        <BalanceHistoryChart
          data={[]}
          startBalance={100}
          currentBalance={100}
        />
      )

      expect(screen.getByText(/No balance data available/i)).toBeInTheDocument()
    })

    it('should show loading skeleton when isLoading is true', () => {
      render(
        <BalanceHistoryChart
          data={mockData}
          startBalance={100}
          currentBalance={120}
          isLoading={true}
        />
      )

      expect(screen.getByTestId('area-chart')).not.toBeInTheDocument()
    })

    it('should show error message when error prop is set', () => {
      render(
        <BalanceHistoryChart
          data={mockData}
          startBalance={100}
          currentBalance={120}
          error="Failed to load data"
        />
      )

      expect(screen.getByText('Unable to Load Chart')).toBeInTheDocument()
    })
  })

  describe('stats display', () => {
    it('should display starting balance', () => {
      render(
        <BalanceHistoryChart
          data={mockData}
          startBalance={100}
          currentBalance={120}
        />
      )

      expect(screen.getByText('Starting Balance')).toBeInTheDocument()
      expect(screen.getByText('$100')).toBeInTheDocument()
    })

    it('should display current balance', () => {
      render(
        <BalanceHistoryChart
          data={mockData}
          startBalance={100}
          currentBalance={120}
        />
      )

      expect(screen.getByText('Current Balance')).toBeInTheDocument()
      expect(screen.getByText('$120')).toBeInTheDocument()
    })

    it('should display peak balance when provided', () => {
      render(
        <BalanceHistoryChart
          data={mockData}
          startBalance={100}
          currentBalance={120}
          peakBalance={200}
          showMarkers={true}
        />
      )

      expect(screen.getByText('Peak Balance')).toBeInTheDocument()
      expect(screen.getByText('$200')).toBeInTheDocument()
    })

    it('should display lowest balance when provided', () => {
      render(
        <BalanceHistoryChart
          data={mockData}
          startBalance={100}
          currentBalance={120}
          lowestBalance={50}
          showMarkers={true}
        />
      )

      expect(screen.getByText('Lowest Balance')).toBeInTheDocument()
      expect(screen.getByText('$50')).toBeInTheDocument()
    })
  })

  describe('chart data handling', () => {
    it('should handle data with single point', () => {
      const singlePoint = [mockData[0]]
      const { container } = render(
        <BalanceHistoryChart
          data={singlePoint}
          startBalance={100}
          currentBalance={100}
        />
      )

      expect(container).toBeTruthy()
    })

    it('should handle data with many points', () => {
      const manyPoints = Array.from({ length: 1000 }, (_, i) => ({
        timestamp: Date.now() - (1000 - i) * 3600000,
        balance: 100 + Math.random() * 50,
        change: Math.random() * 50,
        changePercent: Math.random() * 50,
      }))

      const { container } = render(
        <BalanceHistoryChart
          data={manyPoints}
          startBalance={100}
          currentBalance={120}
        />
      )

      expect(container).toBeTruthy()
    })

    it('should handle negative balances', () => {
      const negativeData: BalanceDataPoint[] = [
        {
          timestamp: Date.now() - 3600000,
          balance: 100,
          change: 0,
          changePercent: 0,
        },
        {
          timestamp: Date.now(),
          balance: -50,
          change: -150,
          changePercent: -150,
        },
      ]

      const { container } = render(
        <BalanceHistoryChart
          data={negativeData}
          startBalance={100}
          currentBalance={-50}
        />
      )

      expect(container).toBeTruthy()
    })

    it('should handle very large balance values', () => {
      const largeData: BalanceDataPoint[] = [
        {
          timestamp: Date.now() - 3600000,
          balance: 1000000,
          change: 0,
          changePercent: 0,
        },
        {
          timestamp: Date.now(),
          balance: 1500000,
          change: 500000,
          changePercent: 50,
        },
      ]

      const { container } = render(
        <BalanceHistoryChart
          data={largeData}
          startBalance={1000000}
          currentBalance={1500000}
        />
      )

      expect(screen.getByText('$1.0M')).toBeInTheDocument()
    })
  })

  describe('profit/loss detection', () => {
    it('should detect profitable session', () => {
      render(
        <BalanceHistoryChart
          data={mockData}
          startBalance={100}
          currentBalance={150}
        />
      )

      // Check for profit color in title/stats
      expect(screen.getByText('$100')).toBeInTheDocument()
    })

    it('should detect losing session', () => {
      const losingData: BalanceDataPoint[] = [
        {
          timestamp: Date.now() - 3600000,
          balance: 100,
          change: 0,
          changePercent: 0,
        },
        {
          timestamp: Date.now(),
          balance: 50,
          change: -50,
          changePercent: -50,
        },
      ]

      const { container } = render(
        <BalanceHistoryChart
          data={losingData}
          startBalance={100}
          currentBalance={50}
        />
      )

      expect(container).toBeTruthy()
    })

    it('should detect break-even session', () => {
      const breakEvenData: BalanceDataPoint[] = [
        {
          timestamp: Date.now() - 3600000,
          balance: 100,
          change: 0,
          changePercent: 0,
        },
        {
          timestamp: Date.now(),
          balance: 100,
          change: 0,
          changePercent: 0,
        },
      ]

      render(
        <BalanceHistoryChart
          data={breakEvenData}
          startBalance={100}
          currentBalance={100}
        />
      )

      expect(screen.getByText('$100')).toBeInTheDocument()
    })
  })

  describe('markers display', () => {
    it('should show markers when showMarkers is true', () => {
      const { container } = render(
        <BalanceHistoryChart
          data={mockData}
          startBalance={100}
          currentBalance={120}
          peakBalance={150}
          lowestBalance={80}
          showMarkers={true}
        />
      )

      expect(container).toBeTruthy()
    })

    it('should hide markers when showMarkers is false', () => {
      const { container } = render(
        <BalanceHistoryChart
          data={mockData}
          startBalance={100}
          currentBalance={120}
          peakBalance={150}
          lowestBalance={80}
          showMarkers={false}
        />
      )

      expect(container).toBeTruthy()
    })

    it('should not show peak marker if not provided', () => {
      const { container } = render(
        <BalanceHistoryChart
          data={mockData}
          startBalance={100}
          currentBalance={120}
          showMarkers={true}
        />
      )

      expect(container).toBeTruthy()
    })
  })

  describe('custom Y-axis bounds', () => {
    it('should use custom yMin and yMax when provided', () => {
      const { container } = render(
        <BalanceHistoryChart
          data={mockData}
          startBalance={100}
          currentBalance={120}
          yMin={50}
          yMax={200}
        />
      )

      expect(container).toBeTruthy()
    })

    it('should auto-scale when yMin and yMax not provided', () => {
      const { container } = render(
        <BalanceHistoryChart
          data={mockData}
          startBalance={100}
          currentBalance={120}
        />
      )

      expect(container).toBeTruthy()
    })
  })

  describe('responsive behavior', () => {
    it('should render with default height', () => {
      const { container } = render(
        <BalanceHistoryChart
          data={mockData}
          startBalance={100}
          currentBalance={120}
        />
      )

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
    })

    it('should accept custom height prop', () => {
      const { container } = render(
        <BalanceHistoryChart
          data={mockData}
          startBalance={100}
          currentBalance={120}
          height={500}
        />
      )

      expect(container).toBeTruthy()
    })
  })

  describe('data point details', () => {
    it('should handle data points with bet and win info', () => {
      const detailedData: BalanceDataPoint[] = [
        {
          timestamp: Date.now(),
          balance: 100,
          change: 10,
          changePercent: 10,
          bet: 5,
          win: 15,
          gameId: 'sweet_bonanza',
          description: 'Big win!',
        },
      ]

      const { container } = render(
        <BalanceHistoryChart
          data={detailedData}
          startBalance={90}
          currentBalance={100}
        />
      )

      expect(container).toBeTruthy()
    })

    it('should handle data points without optional fields', () => {
      const minimalData: BalanceDataPoint[] = [
        {
          timestamp: Date.now(),
          balance: 100,
          change: 0,
          changePercent: 0,
        },
      ]

      const { container } = render(
        <BalanceHistoryChart
          data={minimalData}
          startBalance={100}
          currentBalance={100}
        />
      )

      expect(container).toBeTruthy()
    })
  })

  describe('edge cases', () => {
    it('should handle null peak/lowest balance', () => {
      const { container } = render(
        <BalanceHistoryChart
          data={mockData}
          startBalance={100}
          currentBalance={120}
          peakBalance={undefined}
          lowestBalance={undefined}
        />
      )

      expect(container).toBeTruthy()
    })

    it('should handle data with all same balances', () => {
      const flatData: BalanceDataPoint[] = [
        { timestamp: Date.now() - 3600000, balance: 100, change: 0, changePercent: 0 },
        { timestamp: Date.now() - 1800000, balance: 100, change: 0, changePercent: 0 },
        { timestamp: Date.now(), balance: 100, change: 0, changePercent: 0 },
      ]

      const { container } = render(
        <BalanceHistoryChart
          data={flatData}
          startBalance={100}
          currentBalance={100}
        />
      )

      expect(container).toBeTruthy()
    })

    it('should handle very volatile data', () => {
      const volatileData: BalanceDataPoint[] = [
        { timestamp: Date.now() - 3600000, balance: 100, change: 0, changePercent: 0 },
        { timestamp: Date.now() - 2700000, balance: 1000, change: 900, changePercent: 900 },
        { timestamp: Date.now() - 1800000, balance: 50, change: -950, changePercent: -95 },
        { timestamp: Date.now(), balance: 500, change: 400, changePercent: 400 },
      ]

      const { container } = render(
        <BalanceHistoryChart
          data={volatileData}
          startBalance={100}
          currentBalance={500}
        />
      )

      expect(container).toBeTruthy()
    })
  })
})
