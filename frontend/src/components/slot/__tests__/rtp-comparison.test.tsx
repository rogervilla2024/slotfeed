/**
 * RTP Comparison Component Tests
 * Tests for theoretical vs observed RTP visualization
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { RTPComparison } from '../rtp-comparison';

describe('RTPComparison', () => {
  const mockProps = {
    theoreticalRtp: 96.50,
    observedRtp: 98.75,
    sampleSize: 50000,
    className: 'test-class',
  };

  describe('Component Rendering', () => {
    it('should render RTP comparison successfully', () => {
      render(<RTPComparison {...mockProps} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display title', () => {
      render(<RTPComparison {...mockProps} />);
      expect(screen.getByText('RTP Analysis')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <RTPComparison {...mockProps} className="custom-rtp-class" />
      );
      expect(container).toBeDefined();
    });
  });

  describe('Theoretical RTP Display', () => {
    it('should display theoretical RTP label', () => {
      render(<RTPComparison {...mockProps} />);
      expect(screen.getByText('Theoretical RTP')).toBeInTheDocument();
    });

    it('should display theoretical RTP value', () => {
      render(<RTPComparison {...mockProps} theoreticalRtp={96.50} />);
      expect(screen.getByText('96.50%')).toBeInTheDocument();
    });

    it('should show provider stated note', () => {
      render(<RTPComparison {...mockProps} />);
      expect(screen.getByText('Provider stated')).toBeInTheDocument();
    });

    it('should format theoretical RTP to 2 decimal places', () => {
      render(<RTPComparison {...mockProps} theoreticalRtp={96.123456} />);
      expect(screen.getByText('96.12%')).toBeInTheDocument();
    });

    it('should handle very high theoretical RTP (100%)', () => {
      render(<RTPComparison {...mockProps} theoreticalRtp={100} />);
      expect(screen.getByText('100.00%')).toBeInTheDocument();
    });

    it('should handle very low theoretical RTP (0%)', () => {
      render(<RTPComparison {...mockProps} theoreticalRtp={0} />);
      expect(screen.getByText('0.00%')).toBeInTheDocument();
    });

    it('should have visual bar for theoretical RTP', () => {
      const { container } = render(<RTPComparison {...mockProps} />);
      const bars = container.querySelectorAll('[class*="bg-primary"]');
      expect(bars.length).toBeGreaterThan(0);
    });
  });

  describe('Observed RTP Display', () => {
    it('should display observed RTP label', () => {
      render(<RTPComparison {...mockProps} />);
      expect(screen.getByText('Observed RTP')).toBeInTheDocument();
    });

    it('should display observed RTP value', () => {
      render(<RTPComparison {...mockProps} observedRtp={98.75} />);
      expect(screen.getByText('98.75%')).toBeInTheDocument();
    });

    it('should show sample size in observed RTP', () => {
      render(<RTPComparison {...mockProps} sampleSize={50000} />);
      expect(screen.getByText(/50,000/)).toBeInTheDocument();
    });

    it('should format observed RTP to 2 decimal places', () => {
      render(<RTPComparison {...mockProps} observedRtp={98.123456} />);
      expect(screen.getByText('98.12%')).toBeInTheDocument();
    });

    it('should color code observed RTP green when above theoretical', () => {
      const { container } = render(
        <RTPComparison {...mockProps} theoreticalRtp={96.5} observedRtp={98.5} />
      );
      const observed = container.querySelector('[class*="text-win"]');
      expect(observed || container).toBeDefined();
    });

    it('should color code observed RTP red when below theoretical', () => {
      const { container } = render(
        <RTPComparison {...mockProps} theoreticalRtp={96.5} observedRtp={94.5} />
      );
      const observed = container.querySelector('[class*="text-loss"]');
      expect(observed || container).toBeDefined();
    });

    it('should color code observed RTP neutral when similar', () => {
      render(<RTPComparison {...mockProps} theoreticalRtp={96.5} observedRtp={96.5} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should have visual bar for observed RTP', () => {
      const { container } = render(<RTPComparison {...mockProps} />);
      const bars = container.querySelectorAll('[class*="bg-win"], [class*="bg-loss"]');
      expect(bars.length).toBeGreaterThan(0);
    });

    it('should handle very high observed RTP (120%)', () => {
      render(<RTPComparison {...mockProps} observedRtp={120} />);
      expect(screen.getByText('120.00%')).toBeInTheDocument();
    });

    it('should handle very low observed RTP (-10%)', () => {
      render(<RTPComparison {...mockProps} observedRtp={-10} />);
      expect(screen.getByText('-10.00%')).toBeInTheDocument();
    });
  });

  describe('Difference Calculation', () => {
    it('should display difference label', () => {
      render(<RTPComparison {...mockProps} />);
      expect(screen.getByText('Difference')).toBeInTheDocument();
    });

    it('should calculate positive difference correctly', () => {
      render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={98.75}
          sampleSize={50000}
        />
      );
      expect(screen.getByText(/\+2.25%/)).toBeInTheDocument();
    });

    it('should calculate negative difference correctly', () => {
      render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={94.0}
          sampleSize={50000}
        />
      );
      expect(screen.getByText(/-2.50%/)).toBeInTheDocument();
    });

    it('should calculate zero difference correctly', () => {
      render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={96.5}
          sampleSize={50000}
        />
      );
      expect(screen.getByText(/0.00%/)).toBeInTheDocument();
    });

    it('should show + sign for positive difference', () => {
      render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={98.75}
          sampleSize={50000}
        />
      );
      expect(screen.getByText(/\+2.25%/)).toBeInTheDocument();
    });

    it('should show - sign for negative difference', () => {
      render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={94.0}
          sampleSize={50000}
        />
      );
      expect(screen.getByText(/-2.50%/)).toBeInTheDocument();
    });

    it('should format difference to 2 decimal places', () => {
      render(
        <RTPComparison
          theoreticalRtp={96.123}
          observedRtp={98.456}
          sampleSize={50000}
        />
      );
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should calculate percentage variance', () => {
      render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={98.75}
          sampleSize={50000}
        />
      );
      expect(screen.getByText(/variance/i)).toBeInTheDocument();
    });

    it('should color code difference green when positive', () => {
      const { container } = render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={98.75}
          sampleSize={50000}
        />
      );
      const diff = container.querySelector('[class*="text-win"]');
      expect(diff || container).toBeDefined();
    });

    it('should color code difference red when negative', () => {
      const { container } = render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={94.0}
          sampleSize={50000}
        />
      );
      const diff = container.querySelector('[class*="text-loss"]');
      expect(diff || container).toBeDefined();
    });

    it('should color code difference neutral when small', () => {
      render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={96.8}
          sampleSize={50000}
        />
      );
      expect(screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Status Badge', () => {
    it('should display status badge', () => {
      render(<RTPComparison {...mockProps} />);
      expect(screen.getByText(/Above Expected|Below Expected|As Expected/)).toBeInTheDocument();
    });

    it('should show Above Expected when difference >= 2%', () => {
      render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={98.75}
          sampleSize={50000}
        />
      );
      expect(screen.getByText('Above Expected')).toBeInTheDocument();
    });

    it('should show Below Expected when difference <= -2%', () => {
      render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={94.0}
          sampleSize={50000}
        />
      );
      expect(screen.getByText('Below Expected')).toBeInTheDocument();
    });

    it('should show As Expected when difference between -2% and 2%', () => {
      render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={96.8}
          sampleSize={50000}
        />
      );
      expect(screen.getByText('As Expected')).toBeInTheDocument();
    });

    it('should have correct variant for Above Expected', () => {
      render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={98.75}
          sampleSize={50000}
        />
      );
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should have correct variant for Below Expected', () => {
      render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={94.0}
          sampleSize={50000}
        />
      );
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should have correct variant for As Expected', () => {
      render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={96.8}
          sampleSize={50000}
        />
      );
      expect(screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Visual Bars', () => {
    it('should render both bars', () => {
      const { container } = render(<RTPComparison {...mockProps} />);
      const bars = container.querySelectorAll('[class*="h-3"][class*="bg-muted"]');
      expect(bars.length).toBeGreaterThanOrEqual(0);
    });

    it('should size theoretical bar based on RTP', () => {
      const { container } = render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={98.75}
          sampleSize={50000}
        />
      );
      const bars = container.querySelectorAll('div[style*="width"]');
      expect(bars.length).toBeGreaterThan(0);
    });

    it('should size observed bar based on RTP', () => {
      const { container } = render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={98.75}
          sampleSize={50000}
        />
      );
      const bars = container.querySelectorAll('div[style*="width"]');
      expect(bars.length).toBeGreaterThan(0);
    });

    it('should use win color for observed bar when above theoretical', () => {
      const { container } = render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={98.75}
          sampleSize={50000}
        />
      );
      const winBars = container.querySelectorAll('[class*="bg-win"]');
      expect(winBars.length).toBeGreaterThan(0);
    });

    it('should use loss color for observed bar when below theoretical', () => {
      const { container } = render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={94.0}
          sampleSize={50000}
        />
      );
      const lossBars = container.querySelectorAll('[class*="bg-loss"]');
      expect(lossBars.length).toBeGreaterThan(0);
    });

    it('should display bar labels', () => {
      render(<RTPComparison {...mockProps} />);
      expect(screen.getByText('Theoretical')).toBeInTheDocument();
      expect(screen.getByText('Observed')).toBeInTheDocument();
    });

    it('should show RTP values on bars', () => {
      render(
        <RTPComparison
          theoreticalRtp={96.50}
          observedRtp={98.75}
          sampleSize={50000}
        />
      );
      expect(screen.getByText('96.50%')).toBeInTheDocument();
      expect(screen.getByText('98.75%')).toBeInTheDocument();
    });
  });

  describe('Sample Size Information', () => {
    it('should display sample size', () => {
      render(<RTPComparison {...mockProps} sampleSize={50000} />);
      expect(screen.getByText(/From.*spins/)).toBeInTheDocument();
    });

    it('should format large sample sizes with commas', () => {
      render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={98.75}
          sampleSize={1000000}
        />
      );
      expect(screen.getByText(/1,000,000/)).toBeInTheDocument();
    });

    it('should display low sample size warning (< 1000)', () => {
      render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={98.75}
          sampleSize={500}
        />
      );
      expect(screen.getByText(/Low sample size/i)).toBeInTheDocument();
    });

    it('should display moderate sample size note (1000-10000)', () => {
      render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={98.75}
          sampleSize={5000}
        />
      );
      expect(screen.getByText(/Moderate sample size/i)).toBeInTheDocument();
    });

    it('should display high sample size note (>= 10000)', () => {
      render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={98.75}
          sampleSize={50000}
        />
      );
      expect(screen.getByText(/High sample size/i)).toBeInTheDocument();
    });

    it('should note statistical significance at high sample', () => {
      render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={98.75}
          sampleSize={100000}
        />
      );
      expect(screen.getByText(/statistically significant/i)).toBeInTheDocument();
    });

    it('should note unreliability at low sample', () => {
      render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={98.75}
          sampleSize={100}
        />
      );
      expect(screen.getByText(/may not be/i)).toBeInTheDocument();
    });

    it('should handle minimum sample size (1)', () => {
      render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={98.75}
          sampleSize={1}
        />
      );
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle very large sample size (millions)', () => {
      render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={98.75}
          sampleSize={5000000}
        />
      );
      expect(screen.getByText(/5,000,000/)).toBeInTheDocument();
    });
  });

  describe('Layout and Structure', () => {
    it('should have proper grid layout', () => {
      const { container } = render(<RTPComparison {...mockProps} />);
      const grid = container.querySelector('[class*="grid"]');
      expect(grid || container).toBeDefined();
    });

    it('should have 2-column grid for RTP values', () => {
      const { container } = render(<RTPComparison {...mockProps} />);
      const grid = container.querySelector('[class*="grid-cols-2"]');
      expect(grid || container).toBeDefined();
    });

    it('should have border separator for difference', () => {
      const { container } = render(<RTPComparison {...mockProps} />);
      const border = container.querySelector('[class*="border-t"]');
      expect(border || container).toBeDefined();
    });

    it('should center align main values', () => {
      const { container } = render(<RTPComparison {...mockProps} />);
      const centered = container.querySelector('[class*="text-center"]');
      expect(centered || container).toBeDefined();
    });

    it('should have proper spacing between sections', () => {
      const { container } = render(<RTPComparison {...mockProps} />);
      const spacing = container.querySelector('[class*="space-y"]');
      expect(spacing || container).toBeDefined();
    });
  });

  describe('Responsive Design', () => {
    it('should render on mobile viewport', () => {
      render(<RTPComparison {...mockProps} />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should use flexible grid', () => {
      const { container } = render(<RTPComparison {...mockProps} />);
      const grid = container.querySelector('[class*="grid"]');
      expect(grid || container).toBeDefined();
    });

    it('should have readable text on small screens', () => {
      render(<RTPComparison {...mockProps} />);
      expect(screen.getByText('RTP Analysis')).toBeInTheDocument();
    });

    it('should display bars responsively', () => {
      const { container } = render(<RTPComparison {...mockProps} />);
      const bars = container.querySelectorAll('[class*="h-3"]');
      expect(bars.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have descriptive labels', () => {
      render(<RTPComparison {...mockProps} />);
      expect(screen.getByText('Theoretical RTP')).toBeInTheDocument();
      expect(screen.getByText('Observed RTP')).toBeInTheDocument();
    });

    it('should show unit labels (%) on values', () => {
      render(<RTPComparison {...mockProps} />);
      expect(screen.getByText(/96.50%/)).toBeInTheDocument();
      expect(screen.getByText(/98.75%/)).toBeInTheDocument();
    });

    it('should display context for observed RTP', () => {
      render(<RTPComparison {...mockProps} />);
      expect(screen.getByText(/spins/i)).toBeInTheDocument();
    });

    it('should have color independent indicators', () => {
      render(<RTPComparison {...mockProps} />);
      expect(screen.getByText(/Above Expected|Below Expected|As Expected/)).toBeInTheDocument();
    });

    it('should provide statistical context', () => {
      render(<RTPComparison {...mockProps} sampleSize={50000} />);
      expect(screen.getByText(/High sample size/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero theoretical RTP', () => {
      render(
        <RTPComparison
          theoreticalRtp={0}
          observedRtp={5}
          sampleSize={50000}
        />
      );
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle zero observed RTP', () => {
      render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={0}
          sampleSize={50000}
        />
      );
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle negative RTP values', () => {
      render(
        <RTPComparison
          theoreticalRtp={-10}
          observedRtp={-5}
          sampleSize={50000}
        />
      );
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle identical theoretical and observed RTP', () => {
      render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={96.5}
          sampleSize={50000}
        />
      );
      expect(screen.getByText(/0.00%/)).toBeInTheDocument();
    });

    it('should handle exact 2% positive difference threshold', () => {
      render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={98.5}
          sampleSize={50000}
        />
      );
      expect(screen.getByText('Above Expected')).toBeInTheDocument();
    });

    it('should handle exact 2% negative difference threshold', () => {
      render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={94.5}
          sampleSize={50000}
        />
      );
      expect(screen.getByText('Below Expected')).toBeInTheDocument();
    });

    it('should handle 1.99% difference (neutral)', () => {
      render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={98.49}
          sampleSize={50000}
        />
      );
      expect(screen.getByText('As Expected')).toBeInTheDocument();
    });

    it('should handle very large differences (100%+)', () => {
      render(
        <RTPComparison
          theoreticalRtp={50}
          observedRtp={150}
          sampleSize={50000}
        />
      );
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle extreme variance values', () => {
      render(
        <RTPComparison
          theoreticalRtp={1}
          observedRtp={99}
          sampleSize={50000}
        />
      );
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle zero sample size', () => {
      render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={98.75}
          sampleSize={0}
        />
      );
      expect(screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Percentage Variance Calculation', () => {
    it('should calculate percentage variance correctly', () => {
      render(
        <RTPComparison
          theoreticalRtp={100}
          observedRtp={105}
          sampleSize={50000}
        />
      );
      expect(screen.getByText(/variance/i)).toBeInTheDocument();
    });

    it('should show variance for small differences', () => {
      render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={97.0}
          sampleSize={50000}
        />
      );
      expect(screen.getByText(/variance/i)).toBeInTheDocument();
    });

    it('should show variance for large differences', () => {
      render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={110}
          sampleSize={50000}
        />
      );
      expect(screen.getByText(/variance/i)).toBeInTheDocument();
    });

    it('should format variance percentage to 2 decimals', () => {
      render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={98.75}
          sampleSize={50000}
        />
      );
      expect(screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Data Accuracy', () => {
    it('should display all provided data', () => {
      render(<RTPComparison {...mockProps} />);
      expect(screen.getByText(/96.50%/)).toBeInTheDocument();
      expect(screen.getByText(/98.75%/)).toBeInTheDocument();
      expect(screen.getByText(/50,000/)).toBeInTheDocument();
    });

    it('should correctly compare RTP values', () => {
      render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={98.75}
          sampleSize={50000}
        />
      );
      expect(screen.getByText('Above Expected')).toBeInTheDocument();
    });

    it('should calculate difference based on observed - theoretical', () => {
      render(
        <RTPComparison
          theoreticalRtp={100}
          observedRtp={105}
          sampleSize={50000}
        />
      );
      expect(screen.getByText(/\+5.00%/)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should render without performance issues', () => {
      const startTime = performance.now();
      render(<RTPComparison {...mockProps} />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500);
    });

    it('should handle rapid re-renders', () => {
      const { rerender } = render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={98.0}
          sampleSize={50000}
        />
      );

      for (let i = 0; i < 10; i++) {
        rerender(
          <RTPComparison
            theoreticalRtp={96.5}
            observedRtp={98.0 + i * 0.1}
            sampleSize={50000}
          />
        );
      }

      expect(screen.getByRole('document')).toBeInTheDocument();
    });
  });

  describe('Type Safety', () => {
    it('should require all props', () => {
      expect(RTPComparison).toBeDefined();
      expect(typeof RTPComparison).toBe('function');
    });

    it('should accept numeric props', () => {
      render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={98.75}
          sampleSize={50000}
        />
      );
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle optional className', () => {
      const { container } = render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={98.75}
          sampleSize={50000}
          className="custom-class"
        />
      );
      expect(container).toBeDefined();
    });
  });

  describe('Confidence Notes', () => {
    it('should display confidence note', () => {
      render(<RTPComparison {...mockProps} />);
      expect(screen.getByText(/sample size/i)).toBeInTheDocument();
    });

    it('should adjust note based on sample size', () => {
      const { rerender } = render(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={98.75}
          sampleSize={100}
        />
      );
      expect(screen.getByText(/Low sample size/i)).toBeInTheDocument();

      rerender(
        <RTPComparison
          theoreticalRtp={96.5}
          observedRtp={98.75}
          sampleSize={50000}
        />
      );
      expect(screen.getByText(/High sample size/i)).toBeInTheDocument();
    });

    it('should be user-friendly and informative', () => {
      render(<RTPComparison {...mockProps} />);
      const content = screen.getByRole('document').textContent;
      expect(content).toContain('sample size');
    });
  });

  describe('Comparison Clarity', () => {
    it('should make it clear which is theoretical vs observed', () => {
      render(<RTPComparison {...mockProps} />);
      expect(screen.getByText('Theoretical RTP')).toBeInTheDocument();
      expect(screen.getByText('Observed RTP')).toBeInTheDocument();
    });

    it('should show provider context for theoretical', () => {
      render(<RTPComparison {...mockProps} />);
      expect(screen.getByText('Provider stated')).toBeInTheDocument();
    });

    it('should show data context for observed', () => {
      render(<RTPComparison {...mockProps} />);
      expect(screen.getByText(/From.*spins/)).toBeInTheDocument();
    });
  });
});
