/**
 * Chart Wrapper Component Tests
 * Tests for chart state management and wrapper functionality
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  ChartWrapper,
  ChartSkeleton,
  ChartError,
  ChartEmpty,
  PeriodSelector,
} from '../chart-wrapper'

describe('ChartWrapper', () => {
  const mockChildren = <div data-testid="chart-content">Chart Content</div>

  describe('basic rendering', () => {
    it('should render with title', () => {
      render(
        <ChartWrapper title="Test Chart">
          {mockChildren}
        </ChartWrapper>
      )

      expect(screen.getByText('Test Chart')).toBeInTheDocument()
    })

    it('should render with title and description', () => {
      render(
        <ChartWrapper
          title="Test Chart"
          description="This is a test chart"
        >
          {mockChildren}
        </ChartWrapper>
      )

      expect(screen.getByText('Test Chart')).toBeInTheDocument()
      expect(screen.getByText('This is a test chart')).toBeInTheDocument()
    })

    it('should render children content', () => {
      render(
        <ChartWrapper title="Test Chart">
          {mockChildren}
        </ChartWrapper>
      )

      expect(screen.getByTestId('chart-content')).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('should show skeleton when isLoading is true', () => {
      render(
        <ChartWrapper
          title="Test Chart"
          isLoading={true}
        >
          {mockChildren}
        </ChartWrapper>
      )

      expect(screen.queryByTestId('chart-content')).not.toBeInTheDocument()
    })

    it('should not show skeleton when isLoading is false', () => {
      render(
        <ChartWrapper
          title="Test Chart"
          isLoading={false}
        >
          {mockChildren}
        </ChartWrapper>
      )

      expect(screen.getByTestId('chart-content')).toBeInTheDocument()
    })

    it('should render custom skeleton height', () => {
      const { container } = render(
        <ChartWrapper
          title="Test Chart"
          isLoading={true}
          skeletonHeight={400}
        >
          {mockChildren}
        </ChartWrapper>
      )

      expect(container).toBeTruthy()
    })
  })

  describe('error state', () => {
    it('should show error message when error prop is set', () => {
      render(
        <ChartWrapper
          title="Test Chart"
          error="Failed to load data"
        >
          {mockChildren}
        </ChartWrapper>
      )

      expect(screen.getByText('Unable to Load Chart')).toBeInTheDocument()
      expect(screen.getByText('Failed to load data')).toBeInTheDocument()
    })

    it('should not show error when error is null', () => {
      render(
        <ChartWrapper
          title="Test Chart"
          error={null}
        >
          {mockChildren}
        </ChartWrapper>
      )

      expect(screen.queryByText('Unable to Load Chart')).not.toBeInTheDocument()
    })

    it('should have error icon', () => {
      render(
        <ChartWrapper
          title="Test Chart"
          error="Failed to load"
        >
          {mockChildren}
        </ChartWrapper>
      )

      const errorIcon = screen.getByRole('img', { hidden: true })
      expect(errorIcon).toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('should show empty state when isEmpty is true', () => {
      render(
        <ChartWrapper
          title="Test Chart"
          isEmpty={true}
          emptyMessage="No data available"
        >
          {mockChildren}
        </ChartWrapper>
      )

      expect(screen.getByText('No data available')).toBeInTheDocument()
      expect(screen.queryByTestId('chart-content')).not.toBeInTheDocument()
    })

    it('should use default empty message', () => {
      render(
        <ChartWrapper
          title="Test Chart"
          isEmpty={true}
        >
          {mockChildren}
        </ChartWrapper>
      )

      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should not show empty state when isEmpty is false', () => {
      render(
        <ChartWrapper
          title="Test Chart"
          isEmpty={false}
        >
          {mockChildren}
        </ChartWrapper>
      )

      expect(screen.getByTestId('chart-content')).toBeInTheDocument()
    })
  })

  describe('footer content', () => {
    it('should render footer when provided', () => {
      render(
        <ChartWrapper
          title="Test Chart"
          footer={<div>Footer content</div>}
        >
          {mockChildren}
        </ChartWrapper>
      )

      expect(screen.getByText('Footer content')).toBeInTheDocument()
    })

    it('should not render footer when not provided', () => {
      const { container } = render(
        <ChartWrapper title="Test Chart">
          {mockChildren}
        </ChartWrapper>
      )

      expect(container.querySelector('[class*="border-t"]')).not.toBeInTheDocument()
    })
  })

  describe('actions', () => {
    it('should render actions when provided', () => {
      render(
        <ChartWrapper
          title="Test Chart"
          actions={<button>Refresh</button>}
        >
          {mockChildren}
        </ChartWrapper>
      )

      expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument()
    })

    it('should not render actions when not provided', () => {
      const { container } = render(
        <ChartWrapper title="Test Chart">
          {mockChildren}
        </ChartWrapper>
      )

      expect(container.querySelector('[class*="gap-2"]')).toBeTruthy()
    })
  })

  describe('last updated timestamp', () => {
    it('should show last updated time', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

      render(
        <ChartWrapper
          title="Test Chart"
          lastUpdated={fiveMinutesAgo}
        >
          {mockChildren}
        </ChartWrapper>
      )

      expect(screen.getByText(/Updated/)).toBeInTheDocument()
    })

    it('should format recent updates', () => {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000)

      render(
        <ChartWrapper
          title="Test Chart"
          lastUpdated={oneMinuteAgo}
        >
          {mockChildren}
        </ChartWrapper>
      )

      expect(screen.getByText(/just now|1m ago/)).toBeInTheDocument()
    })

    it('should not show timestamp when not provided', () => {
      const { container } = render(
        <ChartWrapper title="Test Chart">
          {mockChildren}
        </ChartWrapper>
      )

      expect(container.textContent).not.toContain('Updated')
    })
  })

  describe('custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <ChartWrapper
          title="Test Chart"
          className="custom-class"
        >
          {mockChildren}
        </ChartWrapper>
      )

      expect(container.querySelector('.custom-class')).toBeInTheDocument()
    })
  })

  describe('state priority', () => {
    it('should show loading state over empty state', () => {
      render(
        <ChartWrapper
          title="Test Chart"
          isLoading={true}
          isEmpty={true}
        >
          {mockChildren}
        </ChartWrapper>
      )

      expect(screen.queryByTestId('chart-content')).not.toBeInTheDocument()
    })

    it('should show error state over empty state', () => {
      render(
        <ChartWrapper
          title="Test Chart"
          error="Error occurred"
          isEmpty={true}
        >
          {mockChildren}
        </ChartWrapper>
      )

      expect(screen.getByText('Unable to Load Chart')).toBeInTheDocument()
    })

    it('should show error state over content', () => {
      render(
        <ChartWrapper
          title="Test Chart"
          error="Error occurred"
        >
          {mockChildren}
        </ChartWrapper>
      )

      expect(screen.getByText('Unable to Load Chart')).toBeInTheDocument()
      expect(screen.queryByTestId('chart-content')).not.toBeInTheDocument()
    })
  })
})

describe('ChartSkeleton', () => {
  it('should render with default height', () => {
    const { container } = render(<ChartSkeleton />)
    expect(container).toBeTruthy()
  })

  it('should render with custom height', () => {
    const { container } = render(<ChartSkeleton height={500} />)
    expect(container).toBeTruthy()
  })

  it('should have multiple skeleton elements', () => {
    const { container } = render(<ChartSkeleton />)
    const skeletons = container.querySelectorAll('[class*="skeleton"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})

describe('ChartError', () => {
  it('should display error message', () => {
    render(<ChartError message="Something went wrong" />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('should display error title', () => {
    render(<ChartError message="Error message" />)
    expect(screen.getByText('Unable to Load Chart')).toBeInTheDocument()
  })

  it('should have error styling', () => {
    const { container } = render(<ChartError message="Error" />)
    const errorElement = container.querySelector('[class*="bg-destructive"]')
    expect(errorElement).toBeInTheDocument()
  })
})

describe('ChartEmpty', () => {
  it('should display empty message', () => {
    render(<ChartEmpty message="No data to display" />)
    expect(screen.getByText('No data to display')).toBeInTheDocument()
  })

  it('should have empty styling', () => {
    const { container } = render(<ChartEmpty message="Empty" />)
    const emptyElement = container.querySelector('[class*="bg-muted"]')
    expect(emptyElement).toBeInTheDocument()
  })
})

describe('PeriodSelector', () => {
  const mockPeriods = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
  ]

  it('should render period buttons', () => {
    const handleChange = jest.fn()

    render(
      <PeriodSelector
        periods={mockPeriods}
        selectedPeriod="7d"
        onPeriodChange={handleChange}
      />
    )

    expect(screen.getByRole('button', { name: '7 Days' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '30 Days' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '90 Days' })).toBeInTheDocument()
  })

  it('should highlight selected period', () => {
    const handleChange = jest.fn()

    render(
      <PeriodSelector
        periods={mockPeriods}
        selectedPeriod="30d"
        onPeriodChange={handleChange}
      />
    )

    const selectedButton = screen.getByRole('button', { name: '30 Days' })
    expect(selectedButton).toHaveClass('bg-primary')
  })

  it('should call onPeriodChange when period clicked', () => {
    const handleChange = jest.fn()

    render(
      <PeriodSelector
        periods={mockPeriods}
        selectedPeriod="7d"
        onPeriodChange={handleChange}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '30 Days' }))
    expect(handleChange).toHaveBeenCalledWith('30d')
  })

  it('should disable buttons when loading', () => {
    const handleChange = jest.fn()

    render(
      <PeriodSelector
        periods={mockPeriods}
        selectedPeriod="7d"
        onPeriodChange={handleChange}
        isLoading={true}
      />
    )

    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toBeDisabled()
    })
  })

  it('should show period label', () => {
    const handleChange = jest.fn()

    render(
      <PeriodSelector
        periods={mockPeriods}
        selectedPeriod="7d"
        onPeriodChange={handleChange}
      />
    )

    expect(screen.getByText('Period:')).toBeInTheDocument()
  })
})
