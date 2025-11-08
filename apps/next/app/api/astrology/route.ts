/**
 * RapidAPI Astrology API Proxy Route
 *
 * Provides advanced astrological insights including:
 * - Natal chart calculations
 * - Current planetary transits
 * - Financial/personal trading insights based on planetary positions
 * - Lunar cycle analysis
 *
 * Uses RapidAPI "Best Astrology API - Natal Charts, Transits, Synastry"
 */

import { NextRequest, NextResponse } from 'next/server'
import type { AstrologicalInsight } from 'app/types'

export const runtime = 'edge'

// In-memory cache with TTL
const cache = new Map<string, { data: AstrologicalInsight; cachedAt: number }>()
const CACHE_DURATION = 1000 * 60 * 60 * 24 // 24 hours (astrological data changes slowly)

interface AstrologyRequestBody {
  birthData: {
    year: number
    month: number
    day: number
    hour: number
    minute: number
    city: string
    country_code: string
  }
  analysisType?: 'personal_trading' | 'natal_chart' | 'transits' | 'all'
  options?: {
    trading_style?: 'day_trading' | 'swing_trading' | 'long_term'
    analysis_period_days?: number
    include_lunar_cycles?: boolean
    language?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.RAPIDAPI_ASTROLOGY_KEY
    const apiHost = process.env.RAPIDAPI_ASTROLOGY_HOST

    if (!apiKey || !apiHost) {
      return NextResponse.json(
        { error: 'RapidAPI Astrology API credentials not configured' },
        { status: 500 }
      )
    }

    const body: AstrologyRequestBody = await request.json()

    if (!body.birthData) {
      return NextResponse.json(
        { error: 'Birth data is required (year, month, day, hour, minute, city, country_code)' },
        { status: 400 }
      )
    }

    // Create cache key from birth data and date
    const today = new Date().toISOString().split('T')[0]
    const cacheKey = `${body.birthData.year}-${body.birthData.month}-${body.birthData.day}-${body.birthData.hour}-${body.birthData.minute}-${today}`

    // Check cache
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.cachedAt < CACHE_DURATION) {
      console.log('[Astrology API] Cache hit for:', cacheKey)
      return NextResponse.json(cached.data)
    }

    console.log('[Astrology API] Fetching fresh data for:', cacheKey)

    // Initialize result object
    const result: AstrologicalInsight = {}

    // Determine which analyses to run
    const analysisType = body.analysisType || 'all'
    const runPersonalTrading = analysisType === 'all' || analysisType === 'personal_trading'
    const runNatalChart = analysisType === 'all' || analysisType === 'natal_chart'
    const runTransits = analysisType === 'all' || analysisType === 'transits'

    // Fetch Personal Trading Insights
    if (runPersonalTrading) {
      try {
        const tradingResponse = await fetch(
          `https://${apiHost}/api/v3/insights/financial/personal-trading`,
          {
            method: 'POST',
            headers: {
              'x-rapidapi-key': apiKey,
              'x-rapidapi-host': apiHost,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              subject: {
                name: 'User',
                birth_data: body.birthData,
              },
              options: {
                trading_style: body.options?.trading_style || 'day_trading',
                analysis_period_days: body.options?.analysis_period_days || 30,
                include_lunar_cycles: body.options?.include_lunar_cycles ?? true,
                language: body.options?.language || 'en',
              },
            }),
          }
        )

        if (tradingResponse.ok) {
          const tradingData = await tradingResponse.json()
          result.personalTrading = parseTradingInsights(tradingData)
        } else {
          console.error('[Astrology API] Personal trading fetch failed:', tradingResponse.status)
        }
      } catch (error) {
        console.error('[Astrology API] Personal trading error:', error)
      }
    }

    // Fetch Natal Chart
    if (runNatalChart) {
      try {
        const natalResponse = await fetch(`https://${apiHost}/api/v3/natal-chart`, {
          method: 'POST',
          headers: {
            'x-rapidapi-key': apiKey,
            'x-rapidapi-host': apiHost,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subject: {
              name: 'User',
              birth_data: body.birthData,
            },
            options: {
              house_system: 'placidus',
              language: body.options?.language || 'en',
            },
          }),
        })

        if (natalResponse.ok) {
          const natalData = await natalResponse.json()
          result.natalChart = parseNatalChart(natalData)
        } else {
          console.error('[Astrology API] Natal chart fetch failed:', natalResponse.status)
        }
      } catch (error) {
        console.error('[Astrology API] Natal chart error:', error)
      }
    }

    // Fetch Current Transits
    if (runTransits) {
      try {
        const transitsResponse = await fetch(`https://${apiHost}/api/v3/transits`, {
          method: 'POST',
          headers: {
            'x-rapidapi-key': apiKey,
            'x-rapidapi-host': apiHost,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subject: {
              name: 'User',
              birth_data: body.birthData,
            },
            transit_date: new Date().toISOString().split('T')[0],
            options: {
              language: body.options?.language || 'en',
            },
          }),
        })

        if (transitsResponse.ok) {
          const transitsData = await transitsResponse.json()
          result.transits = parseTransits(transitsData)
        } else {
          console.error('[Astrology API] Transits fetch failed:', transitsResponse.status)
        }
      } catch (error) {
        console.error('[Astrology API] Transits error:', error)
      }
    }

    // Add cache timestamp
    result.cached_at = new Date().toISOString()

    // Cache the result
    cache.set(cacheKey, {
      data: result,
      cachedAt: Date.now(),
    })

    // Clean up old cache entries (simple strategy: keep only last 100)
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value
      if (firstKey) cache.delete(firstKey)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Astrology API] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch astrological data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Parse trading insights from RapidAPI response
 */
function parseTradingInsights(data: any) {
  return {
    overall_rating: data.overall_rating || 5,
    favorable_periods:
      data.favorable_periods?.map((p: any) => ({
        start_date: p.start_date || '',
        end_date: p.end_date || '',
        description: p.description || '',
        planetary_influence: p.planetary_influence || '',
      })) || [],
    caution_periods:
      data.caution_periods?.map((p: any) => ({
        start_date: p.start_date || '',
        end_date: p.end_date || '',
        description: p.description || '',
        planetary_influence: p.planetary_influence || '',
      })) || [],
    recommended_approach: data.recommended_approach || '',
    lunar_cycle_influence: {
      phase: data.lunar_cycle_influence?.phase || '',
      trading_advice: data.lunar_cycle_influence?.trading_advice || '',
    },
  }
}

/**
 * Parse natal chart from RapidAPI response
 */
function parseNatalChart(data: any) {
  return {
    sun_sign: data.sun_sign || '',
    moon_sign: data.moon_sign || '',
    ascendant: data.ascendant || '',
    planets:
      data.planets?.map((p: any) => ({
        name: p.name || '',
        sign: p.sign || '',
        house: p.house || 0,
        degree: p.degree || 0,
      })) || [],
  }
}

/**
 * Parse transits from RapidAPI response
 */
function parseTransits(data: any) {
  return {
    major_aspects:
      data.major_aspects?.map((a: any) => ({
        planet1: a.planet1 || '',
        planet2: a.planet2 || '',
        aspect: a.aspect || '',
        orb: a.orb || 0,
        interpretation: a.interpretation || '',
      })) || [],
    transit_interpretations: data.transit_interpretations || [],
  }
}
