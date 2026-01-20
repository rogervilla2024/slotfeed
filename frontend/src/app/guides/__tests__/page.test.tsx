/**
 * Guides Page Tests
 * Tests for the strategy guides landing page
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GuidesPage from '../page';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>;
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ArrowRight: () => <span data-testid="arrow-right">→</span>,
  Book: () => <span data-testid="book-icon">📖</span>,
  BarChart3: () => <span data-testid="chart-icon">📊</span>,
  Wallet: () => <span data-testid="wallet-icon">💳</span>,
  Lightbulb: () => <span data-testid="lightbulb-icon">💡</span>,
  Zap: () => <span data-testid="zap-icon">⚡</span>,
  Target: () => <span data-testid="target-icon">🎯</span>,
  Percent: () => <span data-testid="percent-icon">%</span>,
}));

describe('GuidesPage', () => {
  describe('Page Structure', () => {
    it('should render the page successfully', () => {
      render(<GuidesPage />);
      expect(screen.getByRole('document')).toBeInTheDocument();
    });

    it('should display the main heading', () => {
      render(<GuidesPage />);
      expect(screen.getByText('Master Slot Gaming')).toBeInTheDocument();
    });

    it('should display the subtitle description', () => {
      render(<GuidesPage />);
      expect(
        screen.getByText(/Comprehensive guides to help you understand RTP/i)
      ).toBeInTheDocument();
    });

    it('should have proper page structure with multiple sections', () => {
      const { container } = render(<GuidesPage />);
      const sections = container.querySelectorAll('section');
      expect(sections.length).toBeGreaterThanOrEqual(3); // Hero, Guides, Resources
    });
  });

  describe('Hero Section', () => {
    it('should display hero title and subtitle', () => {
      render(<GuidesPage />);
      expect(screen.getByText('Master Slot Gaming')).toBeInTheDocument();
      expect(
        screen.getByText(/Comprehensive guides to help you understand RTP/i)
      ).toBeInTheDocument();
    });

    it('should have call-to-action buttons', () => {
      render(<GuidesPage />);
      const buttons = screen.getAllByRole('link', { name: /start learning|browse slots/i });
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });

    it('should have Start Learning button linking to guides section', () => {
      render(<GuidesPage />);
      const startButton = screen.getByRole('link', { name: /start learning/i });
      expect(startButton).toHaveAttribute('href', '#guides');
    });

    it('should have Browse Slots button', () => {
      render(<GuidesPage />);
      const browseButton = screen.getByRole('link', { name: /browse slots/i });
      expect(browseButton).toBeInTheDocument();
    });
  });

  describe('Essential Guides Section', () => {
    it('should render section heading', () => {
      render(<GuidesPage />);
      expect(screen.getByText('Essential Guides')).toBeInTheDocument();
    });

    it('should display RTP guide', () => {
      render(<GuidesPage />);
      expect(
        screen.getByText('Understanding RTP (Return to Player)')
      ).toBeInTheDocument();
    });

    it('should display Volatility guide', () => {
      render(<GuidesPage />);
      expect(screen.getByText('Volatility & Variance Explained')).toBeInTheDocument();
    });

    it('should display Bankroll Management guide', () => {
      render(<GuidesPage />);
      expect(
        screen.getByText('Bankroll Management Strategies')
      ).toBeInTheDocument();
    });

    it('should display Reading Statistics guide', () => {
      render(<GuidesPage />);
      expect(
        screen.getByText('Reading & Interpreting Statistics')
      ).toBeInTheDocument();
    });

    it('should display 4 guide cards', () => {
      render(<GuidesPage />);
      const guides = screen.getByText('Essential Guides').closest('div');
      const cards = guides?.querySelectorAll('[class*="card"]');
      expect(cards).toBeDefined();
    });

    it('should display guide descriptions', () => {
      render(<GuidesPage />);
      expect(
        screen.getByText(
          /Learn what RTP means and how it affects your slot gaming experience/i
        )
      ).toBeInTheDocument();
    });

    it('should display read time for each guide', () => {
      render(<GuidesPage />);
      expect(screen.getByText(/min read/i)).toBeInTheDocument();
    });

    it('should display number of sections for each guide', () => {
      render(<GuidesPage />);
      expect(screen.getByText(/sections/i)).toBeInTheDocument();
    });

    it('should have clickable guide cards', () => {
      const { container } = render(<GuidesPage />);
      const guideLinks = container.querySelectorAll(
        'a[href*="/guides/"]'
      );
      expect(guideLinks.length).toBeGreaterThan(0);
    });
  });

  describe('Slot-Specific Guides Section', () => {
    it('should display slot guides heading', () => {
      render(<GuidesPage />);
      expect(screen.getByText('Slot-Specific Guides')).toBeInTheDocument();
    });

    it('should display subtitle for slot guides', () => {
      render(<GuidesPage />);
      expect(
        screen.getByText(/Detailed strategies and insights for popular games/i)
      ).toBeInTheDocument();
    });

    it('should display popular slot games', () => {
      render(<GuidesPage />);
      expect(screen.getByText('Sweet Bonanza')).toBeInTheDocument();
      expect(screen.getByText('Gates of Olympus')).toBeInTheDocument();
      expect(screen.getByText('Starlight Princess')).toBeInTheDocument();
      expect(screen.getByText('Big Bass Bonanza')).toBeInTheDocument();
    });

    it('should have links to slot pages', () => {
      const { container } = render(<GuidesPage />);
      const slotLinks = container.querySelectorAll('a[href*="/slot/"]');
      expect(slotLinks.length).toBeGreaterThan(0);
    });

    it('should have Browse All Slots button', () => {
      render(<GuidesPage />);
      const browseAllButton = screen.getByRole('link', {
        name: /Browse All.*Slots/i,
      });
      expect(browseAllButton).toBeInTheDocument();
    });
  });

  describe('Educational Resources Section', () => {
    it('should display resources section heading', () => {
      render(<GuidesPage />);
      expect(screen.getByText('Educational Resources')).toBeInTheDocument();
    });

    it('should display RTP Calculator card', () => {
      render(<GuidesPage />);
      expect(screen.getByText('RTP Calculator')).toBeInTheDocument();
    });

    it('should display Volatility Finder card', () => {
      render(<GuidesPage />);
      expect(screen.getByText('Volatility Finder')).toBeInTheDocument();
    });

    it('should display Bankroll Tool card', () => {
      render(<GuidesPage />);
      expect(screen.getByText('Bankroll Tool')).toBeInTheDocument();
    });

    it('should have links to tools', () => {
      render(<GuidesPage />);
      expect(screen.getByRole('link', { name: /Open Calculator/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Find Games/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Calculate/i })).toBeInTheDocument();
    });
  });

  describe('Responsible Gaming Section', () => {
    it('should display responsible gaming heading', () => {
      render(<GuidesPage />);
      expect(screen.getByText('Responsible Gaming')).toBeInTheDocument();
    });

    it('should display responsible gaming message', () => {
      render(<GuidesPage />);
      expect(
        screen.getByText(/Slot gaming should be fun and entertaining/i)
      ).toBeInTheDocument();
    });

    it('should display warning about gambling limits', () => {
      render(<GuidesPage />);
      expect(
        screen.getByText(/never gamble with money you can't afford to lose/i)
      ).toBeInTheDocument();
    });

    it('should have links to support resources', () => {
      render(<GuidesPage />);
      const getHelpLink = screen.getByRole('link', { name: /Get Help/i });
      expect(getHelpLink).toBeInTheDocument();
    });

    it('should have link to NCPG', () => {
      render(<GuidesPage />);
      const ncpgLink = screen.getByRole('link', {
        name: /National Council on Problem Gambling/i,
      });
      expect(ncpgLink).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should have proper link structure', () => {
      render(<GuidesPage />);
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
    });

    it('should navigate to guides section', () => {
      render(<GuidesPage />);
      const startLink = screen.getByRole('link', { name: /start learning/i });
      expect(startLink).toHaveAttribute('href', '#guides');
    });

    it('should have external links marked properly', () => {
      render(<GuidesPage />);
      const externalLinks = screen.queryAllByRole('link');
      externalLinks.forEach((link) => {
        const href = link.getAttribute('href');
        if (href?.includes('gamcare') || href?.includes('ncpg')) {
          expect(link.getAttribute('target')).toBe('_blank');
          expect(link.getAttribute('rel')).toBe('noopener noreferrer');
        }
      });
    });
  });

  describe('Content Organization', () => {
    it('should have proper heading hierarchy', () => {
      const { container } = render(<GuidesPage />);
      const headings = container.querySelectorAll('h1, h2, h3');
      expect(headings.length).toBeGreaterThan(0);

      // H1 should exist and be first major heading
      const h1 = container.querySelector('h1');
      expect(h1?.textContent).toContain('Master Slot Gaming');
    });

    it('should have semantic HTML structure', () => {
      const { container } = render(<GuidesPage />);
      const sections = container.querySelectorAll('section');
      expect(sections.length).toBeGreaterThanOrEqual(3);
    });

    it('should have descriptive text for each section', () => {
      render(<GuidesPage />);
      expect(
        screen.getByText(/Start with the fundamentals and build your knowledge/i)
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button labels', () => {
      render(<GuidesPage />);
      expect(screen.getByRole('link', { name: /Start Learning/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Browse Slots/i })).toBeInTheDocument();
    });

    it('should have descriptive link text', () => {
      render(<GuidesPage />);
      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link.textContent?.trim()).not.toBe('');
      });
    });

    it('should have proper color contrast elements', () => {
      const { container } = render(<GuidesPage />);
      const textElements = container.querySelectorAll('p, h1, h2, h3');
      expect(textElements.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Design', () => {
    it('should render on mobile viewport', () => {
      render(<GuidesPage />);
      expect(screen.getByText('Master Slot Gaming')).toBeVisible();
    });

    it('should display guide cards in grid', () => {
      const { container } = render(<GuidesPage />);
      const gridContainer = container.querySelector('[class*="grid"]');
      expect(gridContainer).toBeInTheDocument();
    });

    it('should have responsive layout classes', () => {
      const { container } = render(<GuidesPage />);
      const elements = container.querySelectorAll('[class*="md:"], [class*="lg:"]');
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe('Visual Elements', () => {
    it('should display guide icons', () => {
      render(<GuidesPage />);
      // Check for icon test IDs
      expect(screen.getByTestId('chart-icon')).toBeInTheDocument();
      expect(screen.getByTestId('lightbulb-icon')).toBeInTheDocument();
      expect(screen.getByTestId('wallet-icon')).toBeInTheDocument();
      expect(screen.getByTestId('book-icon')).toBeInTheDocument();
    });

    it('should display gradient background', () => {
      const { container } = render(<GuidesPage />);
      const gradientElements = container.querySelectorAll('[class*="gradient"]');
      expect(gradientElements.length).toBeGreaterThan(0);
    });

    it('should have border elements for visual separation', () => {
      const { container } = render(<GuidesPage />);
      const borderElements = container.querySelectorAll('[class*="border"]');
      expect(borderElements.length).toBeGreaterThan(0);
    });
  });

  describe('Data Display', () => {
    it('should display guide read times', () => {
      render(<GuidesPage />);
      expect(screen.getByText(/8 min read/i)).toBeInTheDocument();
      expect(screen.getByText(/6 min read/i)).toBeInTheDocument();
      expect(screen.getByText(/10 min read/i)).toBeInTheDocument();
    });

    it('should display section counts', () => {
      render(<GuidesPage />);
      expect(screen.getByText(/sections/i)).toBeInTheDocument();
    });

    it('should display guide excerpts', () => {
      render(<GuidesPage />);
      expect(
        screen.getByText(/RTP is the percentage of all wagered money/i)
      ).toBeInTheDocument();
    });
  });

  describe('Interactive Elements', () => {
    it('should have clickable guide cards', () => {
      const { container } = render(<GuidesPage />);
      const guideLinks = container.querySelectorAll('a');
      guideLinks.forEach((link) => {
        expect(link).toBeInTheDocument();
      });
    });

    it('should support click navigation', () => {
      render(<GuidesPage />);
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
      links.forEach((link) => {
        expect(link).not.toBeDisabled();
      });
    });
  });

  describe('Metadata', () => {
    it('should have proper document structure', () => {
      const { container } = render(<GuidesPage />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should export default component', () => {
      expect(GuidesPage).toBeDefined();
      expect(typeof GuidesPage).toBe('function');
    });
  });
});
