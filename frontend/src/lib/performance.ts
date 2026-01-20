/**
 * Performance Monitoring & Core Web Vitals
 * Phase 11-5-D Implementation
 */

import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

// ============================================
// TYPES
// ============================================

export interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: number
  rating: 'good' | 'needs-improvement' | 'poor'
}

export interface CoreWebVitals {
  lcp: PerformanceMetric | null
  fid: PerformanceMetric | null
  cls: PerformanceMetric | null
  fcp: PerformanceMetric | null
  ttfb: PerformanceMetric | null
}

// ============================================
// THRESHOLDS (Google Web Vitals Standards)
// ============================================

const THRESHOLDS = {
  lcp: { good: 2500, needsImprovement: 4000 }, // ms
  fid: { good: 100, needsImprovement: 300 }, // ms
  cls: { good: 0.1, needsImprovement: 0.25 }, // unitless
  fcp: { good: 1800, needsImprovement: 3000 }, // ms
  ttfb: { good: 600, needsImprovement: 1800 }, // ms
}

// ============================================
// RATING CALCULATION
// ============================================

function getRating(
  metric: string,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[metric as keyof typeof THRESHOLDS]
  if (!threshold) return 'needs-improvement'

  if (value <= threshold.good) return 'good'
  if (value <= threshold.needsImprovement) return 'needs-improvement'
  return 'poor'
}

// ============================================
// CORE WEB VITALS MONITORING
// ============================================

export const coreWebVitals: CoreWebVitals = {
  lcp: null,
  fid: null,
  cls: null,
  fcp: null,
  ttfb: null,
}

const metrics: PerformanceMetric[] = []

/**
 * Initialize Core Web Vitals monitoring
 */
export function initializePerformanceMonitoring(
  onMetric?: (metric: PerformanceMetric) => void
) {
  // LCP: Largest Contentful Paint
  getLCP((metric) => {
    const perfMetric: PerformanceMetric = {
      name: 'LCP',
      value: Math.round(metric.value),
      unit: 'ms',
      timestamp: Date.now(),
      rating: getRating('lcp', metric.value),
    }
    coreWebVitals.lcp = perfMetric
    metrics.push(perfMetric)
    onMetric?.(perfMetric)
    logMetric(perfMetric)
  })

  // FID: First Input Delay
  getFID((metric) => {
    const perfMetric: PerformanceMetric = {
      name: 'FID',
      value: Math.round(metric.value),
      unit: 'ms',
      timestamp: Date.now(),
      rating: getRating('fid', metric.value),
    }
    coreWebVitals.fid = perfMetric
    metrics.push(perfMetric)
    onMetric?.(perfMetric)
    logMetric(perfMetric)
  })

  // CLS: Cumulative Layout Shift
  getCLS((metric) => {
    const perfMetric: PerformanceMetric = {
      name: 'CLS',
      value: parseFloat(metric.value.toFixed(3)),
      unit: 'unitless',
      timestamp: Date.now(),
      rating: getRating('cls', metric.value),
    }
    coreWebVitals.cls = perfMetric
    metrics.push(perfMetric)
    onMetric?.(perfMetric)
    logMetric(perfMetric)
  })

  // FCP: First Contentful Paint
  getFCP((metric) => {
    const perfMetric: PerformanceMetric = {
      name: 'FCP',
      value: Math.round(metric.value),
      unit: 'ms',
      timestamp: Date.now(),
      rating: getRating('fcp', metric.value),
    }
    coreWebVitals.fcp = perfMetric
    metrics.push(perfMetric)
    onMetric?.(perfMetric)
    logMetric(perfMetric)
  })

  // TTFB: Time to First Byte
  getTTFB((metric) => {
    const perfMetric: PerformanceMetric = {
      name: 'TTFB',
      value: Math.round(metric.value),
      unit: 'ms',
      timestamp: Date.now(),
      rating: getRating('ttfb', metric.value),
    }
    coreWebVitals.ttfb = perfMetric
    metrics.push(perfMetric)
    onMetric?.(perfMetric)
    logMetric(perfMetric)
  })
}

// ============================================
// CUSTOM PERFORMANCE MEASUREMENTS
// ============================================

/**
 * Measure component render time
 */
export function measureComponentRender(
  componentName: string,
  fn: () => void
): number {
  const start = performance.now()
  fn()
  const end = performance.now()
  const duration = end - start

  if (duration > 100) {
    console.warn(`[PERF] ${componentName} render took ${duration.toFixed(2)}ms`)
  }

  return duration
}

/**
 * Measure API call time
 */
export function measureAPICall(
  endpoint: string,
  duration: number
): PerformanceMetric {
  const metric: PerformanceMetric = {
    name: `API: ${endpoint}`,
    value: Math.round(duration),
    unit: 'ms',
    timestamp: Date.now(),
    rating: duration <= 200 ? 'good' : duration <= 500 ? 'needs-improvement' : 'poor',
  }

  metrics.push(metric)
  logMetric(metric)

  return metric
}

/**
 * Get all recorded metrics
 */
export function getMetrics(): PerformanceMetric[] {
  return [...metrics]
}

/**
 * Get metrics summary
 */
export function getMetricsSummary() {
  return {
    totalMetrics: metrics.length,
    goodMetrics: metrics.filter((m) => m.rating === 'good').length,
    needsImprovementMetrics: metrics.filter(
      (m) => m.rating === 'needs-improvement'
    ).length,
    poorMetrics: metrics.filter((m) => m.rating === 'poor').length,
    averageTime:
      metrics.length > 0
        ? Math.round(metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length)
        : 0,
  }
}

// ============================================
// LOGGING & ANALYTICS
// ============================================

function logMetric(metric: PerformanceMetric) {
  const emoji =
    metric.rating === 'good'
      ? '✅'
      : metric.rating === 'needs-improvement'
        ? '⚠️'
        : '❌'

  console.log(
    `${emoji} [${metric.name}] ${metric.value}${metric.unit} (${metric.rating})`
  )
}

/**
 * Send metrics to analytics service
 */
export async function sendMetricsToAnalytics(
  serviceUrl?: string
): Promise<void> {
  const url = serviceUrl || process.env.NEXT_PUBLIC_ANALYTICS_URL
  if (!url) return

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metrics: getMetrics(),
        summary: getMetricsSummary(),
        timestamp: Date.now(),
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      }),
    })
  } catch (error) {
    console.error('Failed to send metrics to analytics:', error)
  }
}

// ============================================
// PERFORMANCE BUDGETS
// ============================================

export const PERFORMANCE_BUDGETS = {
  maxBundleSize: 150 * 1024, // 150KB gzipped
  maxMainChunk: 50 * 1024, // 50KB gzipped
  maxComponentRenderTime: 100, // ms
  maxAPIResponseTime: 200, // ms (p95)
}

/**
 * Check if metrics meet performance budgets
 */
export function checkPerformanceBudget(): {
  pass: boolean
  issues: string[]
} {
  const issues: string[] = []

  // Check Core Web Vitals
  if (coreWebVitals.lcp && coreWebVitals.lcp.value > 2500) {
    issues.push(`LCP (${coreWebVitals.lcp.value}ms) exceeds target (2500ms)`)
  }
  if (coreWebVitals.fid && coreWebVitals.fid.value > 100) {
    issues.push(`FID (${coreWebVitals.fid.value}ms) exceeds target (100ms)`)
  }
  if (coreWebVitals.cls && coreWebVitals.cls.value > 0.1) {
    issues.push(`CLS (${coreWebVitals.cls.value}) exceeds target (0.1)`)
  }

  return {
    pass: issues.length === 0,
    issues,
  }
}

// ============================================
// RESOURCE TIMING API
// ============================================

/**
 * Get resource timings (e.g., for images, scripts)
 */
export function getResourceTimings(filterType?: string) {
  if (typeof window === 'undefined' || !window.performance) {
    return []
  }

  const resources = performance.getEntriesByType('resource')

  if (filterType) {
    return resources.filter((r) => r.name.includes(filterType))
  }

  return resources.map((resource: any) => ({
    name: resource.name,
    duration: Math.round(resource.duration),
    size: resource.transferSize || 0,
    cached: resource.transferSize === 0,
  }))
}

/**
 * Get largest resources (potential optimizations)
 */
export function getLargestResources(limit = 10) {
  return getResourceTimings()
    .sort((a, b) => b.size - a.size)
    .slice(0, limit)
}

// ============================================
// MEMORY MONITORING
// ============================================

/**
 * Get memory usage (if available)
 */
export function getMemoryUsage() {
  if (typeof window === 'undefined' || !(performance as any).memory) {
    return null
  }

  const memory = (performance as any).memory
  return {
    usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
    totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
    jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024), // MB
    usagePercent: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100),
  }
}

// ============================================
// PERFORMANCE OBSERVER
// ============================================

/**
 * Setup performance observer for tracking metrics over time
 */
export function setupPerformanceObserver(
  callback?: (entries: PerformanceEntryList) => void
) {
  if (typeof window === 'undefined' || !window.PerformanceObserver) {
    return null
  }

  try {
    const observer = new PerformanceObserver((list) => {
      callback?.(list)

      // Log long tasks
      list.getEntries().forEach((entry) => {
        if (entry.duration > 50) {
          console.warn(`[PERF] Long task detected: ${entry.name} (${entry.duration.toFixed(2)}ms)`)
        }
      })
    })

    observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] })
    return observer
  } catch (error) {
    console.warn('PerformanceObserver not supported:', error)
    return null
  }
}

// ============================================
// EXPORTS
// ============================================

export default {
  initializePerformanceMonitoring,
  measureComponentRender,
  measureAPICall,
  getMetrics,
  getMetricsSummary,
  sendMetricsToAnalytics,
  checkPerformanceBudget,
  getResourceTimings,
  getLargestResources,
  getMemoryUsage,
  setupPerformanceObserver,
  coreWebVitals,
  PERFORMANCE_BUDGETS,
}
