/**
 * useAstrologyData Hook
 *
 * React hook for fetching advanced astrological insights from RapidAPI Astrology API
 * Integrates with Human Design birth data for comprehensive natal + transit analysis
 */

import { useState, useCallback } from 'react'
import type { AstrologicalInsight } from 'app/types'

interface AstrologyOptions {
  analysisType?: 'personal_trading' | 'natal_chart' | 'transits' | 'all'
  tradingStyle?: 'day_trading' | 'swing_trading' | 'long_term'
  analysisPeriodDays?: number
  includeLunarCycles?: boolean
  language?: string
}

interface UseAstrologyDataReturn {
  data: AstrologicalInsight | null
  loading: boolean
  error: Error | null
  refetch: (birthData: any, options?: AstrologyOptions) => Promise<void>
}

/**
 * Hook to fetch astrological insights based on birth data
 */
export function useAstrologyData(options?: AstrologyOptions): UseAstrologyDataReturn {
  const [data, setData] = useState<AstrologicalInsight | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const refetch = useCallback(
    async (birthData: any, overrideOptions?: AstrologyOptions) => {
      if (!birthData) {
        setError(new Error('Birth data is required for astrological analysis'))
        return
      }

      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/astrology', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            birthData: {
              year: birthData.year,
              month: birthData.month,
              day: birthData.day,
              hour: birthData.hour || 12,
              minute: birthData.minute || 0,
              city: birthData.city || 'New York',
              country_code: birthData.countryCode || birthData.country_code || 'US',
            },
            analysisType: overrideOptions?.analysisType || options?.analysisType || 'all',
            options: {
              trading_style:
                overrideOptions?.tradingStyle || options?.tradingStyle || 'day_trading',
              analysis_period_days:
                overrideOptions?.analysisPeriodDays || options?.analysisPeriodDays || 30,
              include_lunar_cycles:
                overrideOptions?.includeLunarCycles ?? options?.includeLunarCycles ?? true,
              language: overrideOptions?.language || options?.language || 'en',
            },
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch astrological data')
        }

        const astrologyData: AstrologicalInsight = await response.json()
        setData(astrologyData)
      } catch (err) {
        console.error('[useAstrologyData] Error:', err)
        setError(err instanceof Error ? err : new Error('Unknown error'))
        setData(null)
      } finally {
        setLoading(false)
      }
    },
    [options]
  )

  return { data, loading, error, refetch }
}

/**
 * Format astrological data for AI consumption (attunement synthesis)
 */
export function formatAstrologyForAI(astrology: AstrologicalInsight | null): string {
  if (!astrology) {
    return 'ASTROLOGICAL TRANSITS: Not available'
  }

  let formatted = '--- ASTROLOGICAL TRANSITS & INSIGHTS ---\n\n'

  // Natal Chart
  if (astrology.natalChart) {
    formatted += `NATAL CHART:\n`
    formatted += `Sun Sign: ${astrology.natalChart.sun_sign}\n`
    formatted += `Moon Sign: ${astrology.natalChart.moon_sign}\n`
    formatted += `Ascendant: ${astrology.natalChart.ascendant}\n`

    if (astrology.natalChart.planets && astrology.natalChart.planets.length > 0) {
      formatted += `Planetary Positions:\n`
      astrology.natalChart.planets.forEach((planet) => {
        formatted += `  ${planet.name}: ${planet.sign} (House ${planet.house}, ${planet.degree.toFixed(2)}°)\n`
      })
    }
    formatted += '\n'
  }

  // Current Transits
  if (astrology.transits) {
    formatted += `CURRENT TRANSITS:\n`

    if (astrology.transits.major_aspects && astrology.transits.major_aspects.length > 0) {
      formatted += `Major Aspects:\n`
      astrology.transits.major_aspects.forEach((aspect) => {
        formatted += `  ${aspect.planet1} ${aspect.aspect} ${aspect.planet2} (Orb: ${aspect.orb.toFixed(2)}°)\n`
        if (aspect.interpretation) {
          formatted += `    → ${aspect.interpretation}\n`
        }
      })
    }

    if (
      astrology.transits.transit_interpretations &&
      astrology.transits.transit_interpretations.length > 0
    ) {
      formatted += `\nTransit Interpretations:\n`
      astrology.transits.transit_interpretations.forEach((interp, idx) => {
        formatted += `${idx + 1}. ${interp}\n`
      })
    }
    formatted += '\n'
  }

  // Personal Trading Insights (Energy Timing)
  if (astrology.personalTrading) {
    formatted += `ENERGETIC TIMING & FLOW (${astrology.personalTrading.overall_rating}/10 favorability):\n`
    formatted += `Recommended Approach: ${astrology.personalTrading.recommended_approach}\n\n`

    if (astrology.personalTrading.lunar_cycle_influence) {
      formatted += `Lunar Cycle: ${astrology.personalTrading.lunar_cycle_influence.phase}\n`
      formatted += `  ${astrology.personalTrading.lunar_cycle_influence.trading_advice}\n\n`
    }

    if (
      astrology.personalTrading.favorable_periods &&
      astrology.personalTrading.favorable_periods.length > 0
    ) {
      formatted += `Favorable Periods (High Potency):\n`
      astrology.personalTrading.favorable_periods.forEach((period) => {
        formatted += `  ${period.start_date} to ${period.end_date}\n`
        formatted += `    ${period.description}\n`
        formatted += `    Planetary Influence: ${period.planetary_influence}\n`
      })
      formatted += '\n'
    }

    if (
      astrology.personalTrading.caution_periods &&
      astrology.personalTrading.caution_periods.length > 0
    ) {
      formatted += `Caution Periods (Risk of Leakage):\n`
      astrology.personalTrading.caution_periods.forEach((period) => {
        formatted += `  ${period.start_date} to ${period.end_date}\n`
        formatted += `    ${period.description}\n`
        formatted += `    Planetary Influence: ${period.planetary_influence}\n`
      })
    }
  }

  if (astrology.cached_at) {
    formatted += `\nCached at: ${astrology.cached_at}`
  }

  return formatted
}

/**
 * Extract key insights for quick UI display
 */
export function extractKeyInsights(astrology: AstrologicalInsight | null): {
  currentEnergy: string
  keyTransit: string
  lunarPhase: string
  favorabilityScore: number
} {
  if (!astrology) {
    return {
      currentEnergy: 'Unknown',
      keyTransit: 'No transit data available',
      lunarPhase: 'Unknown',
      favorabilityScore: 5,
    }
  }

  const currentEnergy =
    astrology.personalTrading?.recommended_approach || 'Balanced observation recommended'

  const keyTransit = astrology.transits?.major_aspects?.[0]
    ? `${astrology.transits.major_aspects[0].planet1} ${astrology.transits.major_aspects[0].aspect} ${astrology.transits.major_aspects[0].planet2}`
    : astrology.transits?.transit_interpretations?.[0] || 'Stable planetary configuration'

  const lunarPhase =
    astrology.personalTrading?.lunar_cycle_influence?.phase || 'Current lunar cycle'

  const favorabilityScore = astrology.personalTrading?.overall_rating || 5

  return { currentEnergy, keyTransit, lunarPhase, favorabilityScore }
}
