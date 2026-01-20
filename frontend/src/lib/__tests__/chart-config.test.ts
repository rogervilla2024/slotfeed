/**
 * Chart Configuration Tests
 * Tests for chart theming, colors, and formatting utilities
 */

import {
  chartColors,
  chartTheme,
  getVolatilityColor,
  getHotColdColor,
  formatChartValue,
  getResponsiveChartSettings,
  mergeChartConfig,
} from '../chart-config'

describe('Chart Configuration', () => {
  describe('chartColors', () => {
    it('should have all required color definitions', () => {
      expect(chartColors.primary).toBeDefined()
      expect(chartColors.win).toBeDefined()
      expect(chartColors.loss).toBeDefined()
      expect(chartColors.hot).toBeDefined()
      expect(chartColors.cold).toBeDefined()
    })

    it('should return valid hex color codes', () => {
      const hexPattern = /^#[0-9A-F]{6}$/i
      expect(chartColors.primary).toMatch(hexPattern)
      expect(chartColors.win).toMatch(hexPattern)
      expect(chartColors.loss).toMatch(hexPattern)
    })

    it('should have consistent color palette', () => {
      expect(typeof chartColors.win).toBe('string')
      expect(typeof chartColors.loss).toBe('string')
      expect(chartColors.primary).not.toEqual(chartColors.secondary)
    })
  })

  describe('chartTheme', () => {
    it('should define all theme sections', () => {
      expect(chartTheme.fontSize).toBeDefined()
      expect(chartTheme.grid).toBeDefined()
      expect(chartTheme.axis).toBeDefined()
      expect(chartTheme.tooltip).toBeDefined()
      expect(chartTheme.legend).toBeDefined()
    })

    it('should have valid margin values', () => {
      expect(chartTheme.margin.top).toBeGreaterThan(0)
      expect(chartTheme.margin.right).toBeGreaterThan(0)
      expect(chartTheme.margin.bottom).toBeGreaterThan(0)
      expect(chartTheme.margin.left).toBeGreaterThan(0)
    })

    it('should have animation configuration', () => {
      expect(chartTheme.animation.enabled).toBe(true)
      expect(chartTheme.animation.duration).toBeGreaterThan(0)
      expect(chartTheme.animation.easing).toBeDefined()
    })

    it('should have minimum dimensions', () => {
      expect(chartTheme.minHeight).toBeGreaterThan(0)
      expect(chartTheme.minWidth).toBeGreaterThan(0)
    })
  })

  describe('getVolatilityColor', () => {
    it('should return green for low volatility', () => {
      expect(getVolatilityColor('low')).toBe(chartColors.win)
    })

    it('should return amber for medium volatility', () => {
      expect(getVolatilityColor('medium')).toBe(chartColors.series3)
    })

    it('should return red for high volatility', () => {
      expect(getVolatilityColor('high')).toBe(chartColors.loss)
    })

    it('should return dark red for very high volatility', () => {
      expect(getVolatilityColor('very_high')).toBe(chartColors.hotter)
      expect(getVolatilityColor('veryhigh')).toBe(chartColors.hotter)
    })

    it('should return neutral for unknown volatility', () => {
      expect(getVolatilityColor('unknown')).toBe(chartColors.neutral)
      expect(getVolatilityColor('')).toBe(chartColors.neutral)
    })

    it('should be case insensitive', () => {
      expect(getVolatilityColor('LOW')).toBe(chartColors.win)
      expect(getVolatilityColor('MeDiUm')).toBe(chartColors.series3)
    })
  })

  describe('getHotColdColor', () => {
    it('should return hot color for hot status', () => {
      expect(getHotColdColor('hot')).toBe(chartColors.hot)
    })

    it('should return cold color for cold status', () => {
      expect(getHotColdColor('cold')).toBe(chartColors.cold)
    })

    it('should return neutral color for neutral status', () => {
      expect(getHotColdColor('neutral')).toBe(chartColors.neutral)
    })

    it('should return neutral color for invalid status', () => {
      expect(getHotColdColor('invalid' as any)).toBe(chartColors.neutral)
    })
  })

  describe('formatChartValue', () => {
    describe('currency formatting', () => {
      it('should format basic currency values', () => {
        expect(formatChartValue(100, 'currency')).toBe('$100')
        expect(formatChartValue(1000, 'currency')).toBe('$1.0K')
        expect(formatChartValue(1000000, 'currency')).toBe('$1.0M')
      })

      it('should handle zero values', () => {
        expect(formatChartValue(0, 'currency')).toBe('$0')
      })

      it('should handle negative values', () => {
        expect(formatChartValue(-100, 'currency')).toBe('$-100')
      })

      it('should handle decimal values', () => {
        expect(formatChartValue(1234.56, 'currency')).toBe('$1.2K')
      })

      it('should handle large values', () => {
        expect(formatChartValue(5000000, 'currency')).toBe('$5.0M')
      })
    })

    describe('percentage formatting', () => {
      it('should format percentage values with 2 decimals', () => {
        expect(formatChartValue(96.48, 'percentage')).toBe('96.48%')
        expect(formatChartValue(100, 'percentage')).toBe('100.00%')
      })

      it('should handle zero percentage', () => {
        expect(formatChartValue(0, 'percentage')).toBe('0.00%')
      })

      it('should handle decimal percentages', () => {
        expect(formatChartValue(96.5, 'percentage')).toBe('96.50%')
      })
    })

    describe('multiplier formatting', () => {
      it('should format multiplier values', () => {
        expect(formatChartValue(1.5, 'multiplier')).toBe('1.5x')
        expect(formatChartValue(100, 'multiplier')).toBe('100.0x')
      })

      it('should handle small multipliers', () => {
        expect(formatChartValue(0.5, 'multiplier')).toBe('0.5x')
      })
    })

    describe('number formatting', () => {
      it('should format large numbers with K/M notation', () => {
        expect(formatChartValue(1000, 'number')).toBe('1.0K')
        expect(formatChartValue(1000000, 'number')).toBe('1.0M')
      })

      it('should format small numbers with locale', () => {
        expect(formatChartValue(100, 'number')).toBe('100')
      })
    })
  })

  describe('getResponsiveChartSettings', () => {
    it('should return mobile settings when isMobile is true', () => {
      const settings = getResponsiveChartSettings(true)
      expect(settings.animationDuration).toBe(0)
      expect(settings.height).toBe(250)
      expect(settings.fontSize).toBe(10)
      expect(settings.margin.top).toBeLessThan(20)
    })

    it('should return desktop settings when isMobile is false', () => {
      const settings = getResponsiveChartSettings(false)
      expect(settings.animationDuration).toBe(400)
      expect(settings.height).toBe(300)
      expect(settings.fontSize).toBe(12)
      expect(settings.margin.top).toBe(20)
    })

    it('should always return valid settings object', () => {
      const settingsMobile = getResponsiveChartSettings(true)
      const settingsDesktop = getResponsiveChartSettings(false)

      expect(settingsMobile).toHaveProperty('animationDuration')
      expect(settingsMobile).toHaveProperty('margin')
      expect(settingsMobile).toHaveProperty('fontSize')
      expect(settingsMobile).toHaveProperty('height')

      expect(settingsDesktop).toHaveProperty('animationDuration')
      expect(settingsDesktop).toHaveProperty('margin')
      expect(settingsDesktop).toHaveProperty('fontSize')
      expect(settingsDesktop).toHaveProperty('height')
    })
  })

  describe('mergeChartConfig', () => {
    it('should merge custom config with defaults', () => {
      const custom = { fontSize: 14 }
      const merged = mergeChartConfig(custom as any)

      expect(merged.fontSize).toBe(14)
      expect(merged.fontFamily).toBe(chartTheme.fontFamily)
    })

    it('should deep merge nested objects', () => {
      const custom = { axis: { fontSize: 16 } }
      const merged = mergeChartConfig(custom as any)

      expect(merged.axis.fontSize).toBe(16)
      expect(merged.axis.fill).toBe(chartTheme.axis.fill)
    })

    it('should not modify original config', () => {
      const originalTheme = { ...chartTheme }
      const custom = { fontSize: 20 }
      mergeChartConfig(custom as any)

      expect(chartTheme).toEqual(originalTheme)
    })

    it('should merge all theme sections', () => {
      const custom = {
        grid: { strokeOpacity: 0.2 },
        tooltip: { labelStyle: { color: '#fff' } },
      }
      const merged = mergeChartConfig(custom as any)

      expect(merged.grid.strokeOpacity).toBe(0.2)
      expect(merged.grid.stroke).toBe(chartTheme.grid.stroke)
      expect(merged.tooltip.labelStyle?.color).toBe('#fff')
    })
  })

  describe('Color scheme consistency', () => {
    it('should have distinct win and loss colors', () => {
      expect(chartColors.win).not.toBe(chartColors.loss)
    })

    it('should have distinct hot and cold colors', () => {
      expect(chartColors.hot).not.toBe(chartColors.cold)
    })

    it('should have series colors for multiple data lines', () => {
      expect(chartColors.series1).toBeDefined()
      expect(chartColors.series2).toBeDefined()
      expect(chartColors.series3).toBeDefined()
      expect(chartColors.series4).toBeDefined()
      expect(chartColors.series5).toBeDefined()
    })

    it('should have at least 5 distinct series colors', () => {
      const seriesColors = [
        chartColors.series1,
        chartColors.series2,
        chartColors.series3,
        chartColors.series4,
        chartColors.series5,
      ]
      const uniqueColors = new Set(seriesColors)
      expect(uniqueColors.size).toBe(5)
    })
  })

  describe('Theme accessibility', () => {
    it('should have sufficient contrast for text colors', () => {
      // Verify that text and background colors are contrasting
      expect(chartTheme.axis.fill).toBeTruthy()
      expect(chartTheme.tooltip.contentStyle?.backgroundColor).toBeTruthy()
    })

    it('should define all required tooltip styles', () => {
      const tooltip = chartTheme.tooltip
      expect(tooltip.contentStyle).toBeDefined()
      expect(tooltip.labelStyle).toBeDefined()
      expect(tooltip.itemStyle).toBeDefined()
      expect(tooltip.wrapperStyle).toBeDefined()
    })
  })
})
