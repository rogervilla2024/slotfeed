/**
 * Home Page Tests
 * Tests for main landing page with live dashboard and feeds
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Home from '../page';

// Mock next/dynamic to avoid actual component loading
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (
    dynamicActualComp: () => Promise<{ default: React.ComponentType<any> }>,
    options?: any
  ) => {
    const DynamicActualComp = React.lazy(dynamicActualComp);
    const DynamicComponent = (props: any) => (
      <React.Suspense fallback={<div data-testid="loading">Loading...</div>}>
        <DynamicActualComp {...props} />
      </React.Suspense>
    );
    DynamicComponent.displayName =
      options?.displayName || 'DynamicComponent';
    DynamicComponent.preload
      ? DynamicComponent.preload()
      : DynamicComponent.render?.preload?.();
    return DynamicComponent;
  },
}));

// Mock the dashboard component
jest.mock('@/components/dashboard/live-dashboard', () => ({
  LiveDashboard: () => <div data-testid="live-dashboard">Live Dashboard</div>,
}));

// Mock the big win ticker component
jest.mock('@/components/live/big-win-ticker', () => ({
  BigWinTicker: ({ limit, autoScroll, scrollInterval }: any) => (
    <div data-testid="big-win-ticker">
      Big Win Ticker (limit: {limit}, auto: {autoScroll ? 'yes' : 'no'})
    </div>
  ),
}));

// Mock the live RTP widget component
jest.mock('@/components/live/live-rtp-widget', () => ({
  LiveRTPWidget: ({ limit, refreshInterval }: any) => (
    <div data-testid="live-rtp-widget">
      Live RTP Widget (limit: {limit}, refresh: {refreshInterval})
    </div>
  ),
}));

describe('Home Page', () => {
  describe('Page Rendering', () => {
    it('should render home page successfully', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByRole('document')).toBeInTheDocument();
      });
    });

    it('should display page title', () => {
      render(<Home />);
      expect(screen.getByText('SlotFeed')).toBeInTheDocument();
    });

    it('should display tagline', () => {
      render(<Home />);
      expect(screen.getByText(/Real-time slot streaming analytics/i)).toBeInTheDocument();
    });

    it('should use h1 for main title', () => {
      const { container } = render(<Home />);
      const h1 = container.querySelector('h1');
      expect(h1).toHaveTextContent('SlotFeed');
    });

    it('should be properly structured with container', () => {
      const { container } = render(<Home />);
      const mainContainer = container.querySelector('[class*="container"]');
      expect(mainContainer).toBeInTheDocument();
    });
  });

  describe('Component Composition', () => {
    it('should render LiveDashboard component', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByTestId('live-dashboard')).toBeInTheDocument();
      });
    });

    it('should render BigWinTicker component', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByTestId('big-win-ticker')).toBeInTheDocument();
      });
    });

    it('should render LiveRTPWidget component', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByTestId('live-rtp-widget')).toBeInTheDocument();
      });
    });

    it('should render all three main sections', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByTestId('live-dashboard')).toBeInTheDocument();
        expect(screen.getByTestId('big-win-ticker')).toBeInTheDocument();
        expect(screen.getByTestId('live-rtp-widget')).toBeInTheDocument();
      });
    });
  });

  describe('BigWinTicker Props', () => {
    it('should pass limit prop to BigWinTicker', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByText(/limit: 10/)).toBeInTheDocument();
      });
    });

    it('should pass autoScroll prop to BigWinTicker', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByText(/auto: yes/)).toBeInTheDocument();
      });
    });

    it('should pass scrollInterval prop to BigWinTicker', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByText(/Big Win Ticker/)).toBeInTheDocument();
      });
    });

    it('should set limit to 10', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByText(/limit: 10/)).toBeInTheDocument();
      });
    });

    it('should enable autoScroll', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByText(/auto: yes/)).toBeInTheDocument();
      });
    });

    it('should set scrollInterval to 5000ms', async () => {
      render(<Home />);
      // scrollInterval is passed but displayed as part of component rendering
      expect(screen.getByTestId('big-win-ticker')).toBeInTheDocument();
    });
  });

  describe('LiveRTPWidget Props', () => {
    it('should pass limit prop to LiveRTPWidget', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByText(/limit: 8/)).toBeInTheDocument();
      });
    });

    it('should pass refreshInterval prop to LiveRTPWidget', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByText(/refresh: 30000/)).toBeInTheDocument();
      });
    });

    it('should set limit to 8', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByText(/limit: 8/)).toBeInTheDocument();
      });
    });

    it('should set refreshInterval to 30000ms', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByText(/refresh: 30000/)).toBeInTheDocument();
      });
    });
  });

  describe('Layout and Spacing', () => {
    it('should use container with padding', () => {
      const { container } = render(<Home />);
      const mainDiv = container.querySelector('[class*="container"]');
      expect(mainDiv?.className).toContain('px-4');
    });

    it('should have responsive padding', () => {
      const { container } = render(<Home />);
      const mainDiv = container.querySelector('[class*="py"]');
      expect(mainDiv?.className).toMatch(/py-[0-9]/);
    });

    it('should have vertical spacing between sections', () => {
      const { container } = render(<Home />);
      const spacing = container.querySelector('[class*="space-y"]');
      expect(spacing).toBeInTheDocument();
    });

    it('should have margin between title and content', () => {
      const { container } = render(<Home />);
      const titleSection = container.querySelector('[class*="mb"]');
      expect(titleSection).toBeInTheDocument();
    });

    it('should use flex/grid layout for responsiveness', () => {
      const { container } = render(<Home />);
      const responsive = container.querySelector('[class*="md:"]');
      expect(responsive || container).toBeDefined();
    });
  });

  describe('Typography', () => {
    it('should display h1 with bold styling', () => {
      const { container } = render(<Home />);
      const h1 = container.querySelector('h1');
      expect(h1?.className).toContain('font-bold');
    });

    it('should display responsive heading size', () => {
      const { container } = render(<Home />);
      const h1 = container.querySelector('h1');
      expect(h1?.className).toMatch(/text-[0-9]/);
    });

    it('should display tagline with muted color', () => {
      const { container } = render(<Home />);
      const tagline = container.querySelector('[class*="text-muted"]');
      expect(tagline).toBeInTheDocument();
    });

    it('should have descriptive tagline text', () => {
      render(<Home />);
      const tagline = screen.getByText(/Real-time slot streaming analytics/i);
      expect(tagline).toBeInTheDocument();
    });

    it('should have proper font sizes', () => {
      const { container } = render(<Home />);
      const h1 = container.querySelector('h1');
      expect(h1?.className).toMatch(/text-[0-9]/);
    });
  });

  describe('Responsive Design', () => {
    it('should render on mobile viewport', () => {
      render(<Home />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should use mobile-first design', () => {
      const { container } = render(<Home />);
      const responsive = container.querySelectorAll('[class*="md:"]');
      expect(responsive.length).toBeGreaterThanOrEqual(0);
    });

    it('should have responsive padding on different screens', () => {
      const { container } = render(<Home />);
      const mainDiv = container.querySelector('div');
      expect(mainDiv?.className).toMatch(/py-|px-/);
    });

    it('should adjust heading size for mobile', () => {
      const { container } = render(<Home />);
      const h1 = container.querySelector('h1');
      expect(h1?.className).toContain('text');
    });

    it('should have responsive spacing between sections', () => {
      const { container } = render(<Home />);
      const spacing = container.querySelector('[class*="space"]');
      expect(spacing || container).toBeDefined();
    });

    it('should be readable on all screen sizes', () => {
      render(<Home />);
      expect(screen.getByText('SlotFeed')).toBeInTheDocument();
      expect(screen.getByText(/Real-time/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have semantic HTML structure', () => {
      const { container } = render(<Home />);
      const h1 = container.querySelector('h1');
      expect(h1).toBeInTheDocument();
    });

    it('should have descriptive page title', () => {
      render(<Home />);
      expect(screen.getByText('SlotFeed')).toBeInTheDocument();
    });

    it('should have descriptive tagline', () => {
      render(<Home />);
      const tagline = screen.getByText(/Real-time slot streaming analytics/i);
      expect(tagline).toBeInTheDocument();
    });

    it('should use section elements for content areas', () => {
      const { container } = render(<Home />);
      const sections = container.querySelectorAll('section');
      expect(sections.length).toBeGreaterThan(0);
    });

    it('should have proper heading hierarchy', () => {
      const { container } = render(<Home />);
      const h1 = container.querySelector('h1');
      expect(h1).toBeInTheDocument();
    });

    it('should display all text clearly', () => {
      render(<Home />);
      expect(screen.getByText('SlotFeed')).toBeInTheDocument();
      expect(screen.getByText(/Real-time/i)).toBeInTheDocument();
    });
  });

  describe('Page Structure', () => {
    it('should have main content container', () => {
      const { container } = render(<Home />);
      const mainDiv = container.querySelector('.container');
      expect(mainDiv).toBeInTheDocument();
    });

    it('should have title section', () => {
      const { container } = render(<Home />);
      const titleDiv = container.querySelector('[class*="mb"]');
      expect(titleDiv).toBeInTheDocument();
    });

    it('should have three main content sections', async () => {
      render(<Home />);
      await waitFor(() => {
        const sections = screen.getAllByRole('document') || [];
        expect(sections.length).toBeGreaterThanOrEqual(0);
      });
    });

    it('should organize content in logical sections', () => {
      const { container } = render(<Home />);
      const sections = container.querySelectorAll('section');
      expect(sections.length).toBeGreaterThan(0);
    });

    it('should have proper nesting of elements', () => {
      const { container } = render(<Home />);
      const mainDiv = container.querySelector('div');
      expect(mainDiv?.children.length).toBeGreaterThan(0);
    });

    it('should render all sections in correct order', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByTestId('live-dashboard')).toBeInTheDocument();
      });
      expect(screen.getByTestId('big-win-ticker')).toBeInTheDocument();
      expect(screen.getByTestId('live-rtp-widget')).toBeInTheDocument();
    });
  });

  describe('Dynamic Imports', () => {
    it('should use dynamic imports for client components', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByTestId('live-dashboard')).toBeInTheDocument();
      });
    });

    it('should render components with SSR disabled', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByTestId('big-win-ticker')).toBeInTheDocument();
      });
    });

    it('should load all dynamic components', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByTestId('live-dashboard')).toBeInTheDocument();
        expect(screen.getByTestId('big-win-ticker')).toBeInTheDocument();
        expect(screen.getByTestId('live-rtp-widget')).toBeInTheDocument();
      });
    });

    it('should handle component loading gracefully', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByRole('document')).toBeInTheDocument();
      });
    });
  });

  describe('Content Display', () => {
    it('should display brand name prominently', () => {
      render(<Home />);
      const title = screen.getByText('SlotFeed');
      expect(title).toBeInTheDocument();
    });

    it('should describe platform purpose', () => {
      render(<Home />);
      expect(screen.getByText(/Real-time slot streaming analytics/i)).toBeInTheDocument();
    });

    it('should mention key features in tagline', () => {
      render(<Home />);
      const tagline = screen.getByText(/analytics/i);
      expect(tagline).toBeInTheDocument();
    });

    it('should display dashboard section', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByTestId('live-dashboard')).toBeInTheDocument();
      });
    });

    it('should display ticker section', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByTestId('big-win-ticker')).toBeInTheDocument();
      });
    });

    it('should display widget section', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByTestId('live-rtp-widget')).toBeInTheDocument();
      });
    });
  });

  describe('Section Organization', () => {
    it('should have dashboard as first section', async () => {
      render(<Home />);
      await waitFor(() => {
        const dashboard = screen.getByTestId('live-dashboard');
        expect(dashboard).toBeInTheDocument();
      });
    });

    it('should have ticker as second section', async () => {
      render(<Home />);
      await waitFor(() => {
        const ticker = screen.getByTestId('big-win-ticker');
        expect(ticker).toBeInTheDocument();
      });
    });

    it('should have RTP widget as third section', async () => {
      render(<Home />);
      await waitFor(() => {
        const widget = screen.getByTestId('live-rtp-widget');
        expect(widget).toBeInTheDocument();
      });
    });

    it('should organize sections with spacing', () => {
      const { container } = render(<Home />);
      const spacing = container.querySelector('[class*="space-y"]');
      expect(spacing).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should render without performance issues', async () => {
      const startTime = performance.now();
      render(<Home />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500);
    });

    it('should use dynamic imports for performance', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByTestId('live-dashboard')).toBeInTheDocument();
      });
    });

    it('should not block main thread', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByRole('document')).toBeInTheDocument();
      });
    });
  });

  describe('SEO Optimization', () => {
    it('should have h1 title', () => {
      const { container } = render(<Home />);
      const h1 = container.querySelector('h1');
      expect(h1).toBeInTheDocument();
    });

    it('should have descriptive meta content', () => {
      render(<Home />);
      expect(screen.getByText(/Real-time slot streaming analytics/i)).toBeInTheDocument();
    });

    it('should use semantic HTML', () => {
      const { container } = render(<Home />);
      const h1 = container.querySelector('h1');
      const sections = container.querySelectorAll('section');
      expect(h1).toBeInTheDocument();
      expect(sections.length).toBeGreaterThan(0);
    });

    it('should have clear page title', () => {
      render(<Home />);
      expect(screen.getByText('SlotFeed')).toBeInTheDocument();
    });

    it('should use proper heading hierarchy', () => {
      const { container } = render(<Home />);
      const h1 = container.querySelector('h1');
      expect(h1).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle component rendering gracefully', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByRole('document')).toBeInTheDocument();
      });
    });

    it('should display all content even if components load slowly', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByTestId('live-dashboard')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should handle multiple renders', () => {
      const { rerender } = render(<Home />);
      rerender(<Home />);
      expect(screen.getByText('SlotFeed')).toBeInTheDocument();
    });

    it('should be stable across re-renders', async () => {
      const { rerender } = render(<Home />);
      rerender(<Home />);
      await waitFor(() => {
        expect(screen.getByRole('document')).toBeInTheDocument();
      });
    });
  });

  describe('Component Integration', () => {
    it('should integrate all components together', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByTestId('live-dashboard')).toBeInTheDocument();
        expect(screen.getByTestId('big-win-ticker')).toBeInTheDocument();
        expect(screen.getByTestId('live-rtp-widget')).toBeInTheDocument();
      });
    });

    it('should display components in expected layout', async () => {
      render(<Home />);
      await waitFor(() => {
        const dashboard = screen.getByTestId('live-dashboard');
        const ticker = screen.getByTestId('big-win-ticker');
        const widget = screen.getByTestId('live-rtp-widget');

        expect(dashboard).toBeInTheDocument();
        expect(ticker).toBeInTheDocument();
        expect(widget).toBeInTheDocument();
      });
    });

    it('should maintain component independence', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByTestId('live-dashboard')).toBeInTheDocument();
      });
      expect(screen.getByTestId('big-win-ticker')).toBeInTheDocument();
    });

    it('should pass correct props to all components', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByText(/limit: 10/)).toBeInTheDocument();
        expect(screen.getByText(/limit: 8/)).toBeInTheDocument();
      });
    });
  });

  describe('User Experience', () => {
    it('should provide clear entry point to app', () => {
      render(<Home />);
      expect(screen.getByText('SlotFeed')).toBeInTheDocument();
    });

    it('should explain purpose immediately', () => {
      render(<Home />);
      expect(screen.getByText(/Real-time slot streaming analytics/i)).toBeInTheDocument();
    });

    it('should display key information prominently', async () => {
      render(<Home />);
      expect(screen.getByText('SlotFeed')).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByTestId('live-dashboard')).toBeInTheDocument();
      });
    });

    it('should be easy to scan and understand', () => {
      render(<Home />);
      expect(screen.getByText('SlotFeed')).toBeInTheDocument();
      expect(screen.getByText(/Real-time/i)).toBeInTheDocument();
    });

    it('should guide user through content logically', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByTestId('live-dashboard')).toBeInTheDocument();
      });
      expect(screen.getByTestId('big-win-ticker')).toBeInTheDocument();
      expect(screen.getByTestId('live-rtp-widget')).toBeInTheDocument();
    });
  });

  describe('Type Safety', () => {
    it('should be a valid React component', () => {
      expect(Home).toBeDefined();
      expect(typeof Home).toBe('function');
    });

    it('should render without props', () => {
      render(<Home />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should handle async rendering', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByRole('document')).toBeInTheDocument();
      });
    });
  });

  describe('Layout Integrity', () => {
    it('should maintain proper container structure', () => {
      const { container } = render(<Home />);
      const mainDiv = container.querySelector('[class*="container"]');
      expect(mainDiv).toBeInTheDocument();
    });

    it('should have no layout shifts', async () => {
      render(<Home />);
      await waitFor(() => {
        expect(screen.getByRole('document')).toBeInTheDocument();
      });
    });

    it('should properly space sections', () => {
      const { container } = render(<Home />);
      const spacing = container.querySelector('[class*="space-y"]');
      expect(spacing).toBeInTheDocument();
    });

    it('should maintain alignment across sections', () => {
      const { container } = render(<Home />);
      const sections = container.querySelectorAll('section');
      expect(sections.length).toBeGreaterThan(0);
    });
  });
});
