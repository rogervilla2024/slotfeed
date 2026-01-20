'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to check if a media query matches
 * Useful for responsive behavior in components
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Create media query list
    const mediaQueryList = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQueryList.matches);

    // Create event handler
    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Use addEventListener with proper cleanup
    mediaQueryList.addEventListener('change', handleChange);

    // Cleanup
    return () => {
      mediaQueryList.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}

/**
 * Pre-defined media query hooks for common breakpoints
 */

/** Mobile devices (max-width: 640px) */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 640px)');
}

/** Tablet devices (max-width: 1024px) */
export function useIsTablet(): boolean {
  return useMediaQuery('(max-width: 1024px)');
}

/** Desktop devices (min-width: 1025px) */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1025px)');
}

/** Large screens (min-width: 1280px) */
export function useIsLargeScreen(): boolean {
  return useMediaQuery('(min-width: 1280px)');
}

/** Dark mode preference */
export function useIsDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

/** Landscape orientation */
export function useIsLandscape(): boolean {
  return useMediaQuery('(orientation: landscape)');
}
