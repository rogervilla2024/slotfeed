/**
 * Sentry error tracking configuration for Next.js frontend
 */

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

export function initSentry() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || 'development';
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || 'unknown';

  if (!dsn) {
    console.warn('⚠️  Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  try {
    Sentry.init({
      dsn,
      integrations: [
        new BrowserTracing({
          // Set sampling rate for performance monitoring
          tracingOrigins: [
            'localhost',
            /^\//,
            /^http:\/\/localhost/,
            /^https:\/\/[^/]*\.(slotfeed|localhost)/,
          ],
          routingInstrumentation: Sentry.reactRouterV6Instrumentation(
            window.history
          ),
        }),
        new Sentry.Replay({
          // Mask all text content to avoid capturing sensitive info
          maskAllText: true,
          // Mask all media playback
          blockAllMedia: true,
        }),
      ],
      // Performance monitoring sample rate
      tracesSampleRate: parseFloat(
        process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || '0.1'
      ),
      // Session replay sample rate
      replaysSessionSampleRate: parseFloat(
        process.env.NEXT_PUBLIC_SENTRY_REPLAY_SESSION_SAMPLE_RATE || '0.1'
      ),
      // Session replay on error sample rate (100% for error sessions)
      replaysOnErrorSampleRate: 1.0,
      environment,
      release: `slotfeed-frontend@${appVersion}`,
      // Don't send personal information
      sendDefaultPii: false,
      // Maximum number of breadcrumbs
      maxBreadcrumbs: 100,
      // Attach stack traces
      attachStacktrace: true,
      // Custom filter for events
      beforeSend(event, hint) {
        // Filter out certain error types
        const error = hint.error;

        // Ignore certain exceptions
        if (error) {
          if (
            error instanceof Error &&
            (error.name === 'ChunkLoadError' ||
              error.message?.includes('Network request failed') ||
              error.message?.includes('Load failed'))
          ) {
            return null;
          }
        }

        // Only send errors from production or staging
        if (
          environment === 'development' &&
          process.env.NODE_ENV === 'development'
        ) {
          return null;
        }

        // Filter out errors from specific paths
        if (event.request?.url?.includes('/health')) {
          return null;
        }

        return event;
      },
      // Custom breadcrumb filter
      beforeBreadcrumb(breadcrumb, hint) {
        // Filter out noisy breadcrumbs
        if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
          return null;
        }

        // Filter out certain navigation breadcrumbs
        if (
          breadcrumb.category === 'navigation' &&
          breadcrumb.data?.to?.includes('/admin')
        ) {
          // Still record admin navigation but with lower priority
          return breadcrumb;
        }

        return breadcrumb;
      },
    });

    console.log(`✅ Sentry initialized for frontend (${environment})`);
  } catch (error) {
    console.error('❌ Failed to initialize Sentry:', error);
  }
}

/**
 * Capture an exception in Sentry
 */
export function captureException(
  error: Error,
  context?: Record<string, any>
) {
  if (context) {
    Sentry.setContext('error-context', context);
  }
  Sentry.captureException(error);
}

/**
 * Capture a message in Sentry
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info'
) {
  Sentry.captureMessage(message, level);
}

/**
 * Set user context for tracking
 */
export function setUserContext(
  userId: string,
  email?: string,
  username?: string
) {
  Sentry.setUser({
    id: userId,
    email,
    username,
  });
}

/**
 * Clear user context (e.g., on logout)
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * Add a breadcrumb for request tracking
 */
export function addBreadcrumb(
  message: string,
  category: string = 'info',
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
  });
}

/**
 * Set tags for event context
 */
export function setTags(tags: Record<string, string>) {
  Object.entries(tags).forEach(([key, value]) => {
    Sentry.setTag(key, value);
  });
}

/**
 * Set extra context for events
 */
export function setExtra(key: string, value: any) {
  Sentry.setContext(key, value);
}

/**
 * Start a new transaction
 */
export function startTransaction(
  name: string,
  op: string = 'http.client'
): Sentry.Transaction {
  return Sentry.startTransaction({
    name,
    op,
  });
}

/**
 * Wrap an async function with error tracking
 */
export async function withErrorTracking<T>(
  fn: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof Error) {
      captureException(error, context);
    }
    throw error;
  }
}

/**
 * Create a fetch wrapper that tracks API calls in Sentry
 */
export async function trackedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const transaction = startTransaction(`fetch ${new URL(url).pathname}`, 'http.client');

  try {
    const response = await fetch(url, options);

    transaction.setData('status_code', response.status);
    transaction.setData('url', url);
    transaction.setData('method', options?.method || 'GET');

    if (!response.ok) {
      captureMessage(`API Error: ${response.status} ${url}`, 'error');
    }

    return response;
  } catch (error) {
    if (error instanceof Error) {
      captureException(error, {
        url,
        method: options?.method || 'GET',
      });
    }
    throw error;
  } finally {
    transaction.finish();
  }
}

/**
 * Get Sentry hub for advanced operations
 */
export function getSentryHub(): Sentry.Hub {
  return Sentry.getCurrentHub();
}

export default Sentry;
