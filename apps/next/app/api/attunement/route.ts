/**
 * Daily Attunement API Route
 * THE CROWN JEWEL: Synthesizes Blueprint + Logs + HealthKit + Cosmos → Provocative Q&A
 * POST /api/attunement
 */

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { ATTUNEMENT_SYSTEM_PROMPT } from 'app/lib/content'
import { semanticSearch } from '../../../lib/supabase'
import { generateEmbedding } from 'app/lib/embeddings'
import type { HumanDesignChart } from 'app/lib/hdkit/types'
import type { HealthMetrics } from 'app/hooks/useHealthData'
import type { CosmicData, AstrologicalInsight } from 'app/types'

export const runtime = 'edge'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '')

// Formatting utilities (can't import from hooks - those are client-only)
function formatCosmicDataForAI(cosmicData: CosmicData): string {
  if (!cosmicData || !cosmicData.astronomy) return ''

  const astro = cosmicData.astronomy
  let formatted = '📅 COSMIC STATE:\n'

  formatted += `  • Date: ${astro.date}\n`
  formatted += `  • Current Time: ${astro.current_time}\n`
  formatted += `  • Sunrise: ${astro.sunrise} | Sunset: ${astro.sunset}\n`
  formatted += `  • Day Length: ${astro.day_length}\n`
  formatted += `  • Moon Phase: ${astro.moon_phase}\n`
  formatted += `  • Lunar Illumination: ${astro.moon_illumination_percentage}%\n`

  if (astro.morning) {
    formatted += `  • Morning Golden Hour: ${astro.morning.golden_hour_begin} - ${astro.morning.golden_hour_end}\n`
  }

  if (astro.evening) {
    formatted += `  • Evening Golden Hour: ${astro.evening.golden_hour_begin} - ${astro.evening.golden_hour_end}\n`
  }

  return formatted + '\n'
}

function formatAstrologyForAI(astrologyData: AstrologicalInsight): string {
  if (!astrologyData) return ''

  let formatted = '🌟 ASTROLOGICAL TRANSITS:\n'

  if (astrologyData.natalChart) {
    formatted += '  Natal Chart:\n'
    formatted += `    • Sun: ${astrologyData.natalChart.sun_sign}\n`
    formatted += `    • Moon: ${astrologyData.natalChart.moon_sign}\n`
    formatted += `    • Ascendant: ${astrologyData.natalChart.ascendant}\n`

    if (astrologyData.natalChart.planets && astrologyData.natalChart.planets.length > 0) {
      formatted += '    • Planetary Positions:\n'
      astrologyData.natalChart.planets.slice(0, 5).forEach((planet) => {
        formatted += `      - ${planet.name}: ${planet.sign} (House ${planet.house}, ${planet.degree}°)\n`
      })
    }
  }

  if (astrologyData.transits) {
    if (astrologyData.transits.major_aspects && astrologyData.transits.major_aspects.length > 0) {
      formatted += '  Major Aspects:\n'
      astrologyData.transits.major_aspects.slice(0, 5).forEach((aspect) => {
        formatted += `    • ${aspect.planet1} ${aspect.aspect} ${aspect.planet2} (orb: ${aspect.orb}°)\n`
        if (aspect.interpretation) {
          formatted += `      → ${aspect.interpretation}\n`
        }
      })
    }

    if (
      astrologyData.transits.transit_interpretations &&
      astrologyData.transits.transit_interpretations.length > 0
    ) {
      formatted += '  Transit Interpretations:\n'
      astrologyData.transits.transit_interpretations.slice(0, 3).forEach((interp) => {
        formatted += `    • ${interp}\n`
      })
    }
  }

  if (astrologyData.personalTrading) {
    formatted += '  Energy Trading Insights:\n'
    formatted += `    • Overall Rating: ${astrologyData.personalTrading.overall_rating}/10\n`
    formatted += `    • Approach: ${astrologyData.personalTrading.recommended_approach}\n`

    if (astrologyData.personalTrading.lunar_cycle_influence) {
      formatted += `    • Lunar Phase: ${astrologyData.personalTrading.lunar_cycle_influence.phase}\n`
      formatted += `    • Advice: ${astrologyData.personalTrading.lunar_cycle_influence.trading_advice}\n`
    }

    if (
      astrologyData.personalTrading.favorable_periods &&
      astrologyData.personalTrading.favorable_periods.length > 0
    ) {
      formatted += '    • Favorable Periods:\n'
      astrologyData.personalTrading.favorable_periods.forEach((period) => {
        formatted += `      - ${period.start_date} to ${period.end_date}: ${period.description}\n`
      })
    }
  }

  return formatted + '\n'
}

// In-memory cache for 24-hour attunement storage
const cache = new Map<string, { data: any; cachedAt: number }>()
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

interface AttunementRequest {
  userId?: string // For future multi-user support
  humanDesignChart?: HumanDesignChart | null
  healthMetrics?: HealthMetrics | null
  cosmicData?: CosmicData | null
  astrologyData?: AstrologicalInsight | null
  location?: { latitude: number; longitude: number }
  birthData?: {
    year: number
    month: number
    day: number
    hour: number
    minute: number
    city: string
    countryCode: string
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json({ error: 'GOOGLE_API_KEY not configured' }, { status: 500 })
    }

    const body: AttunementRequest = await request.json()
    const {
      userId = 'default',
      humanDesignChart,
      healthMetrics,
      cosmicData,
      astrologyData,
      location,
      birthData,
    } = body

    // Build cache key (one attunement per user per day)
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const cacheKey = `attunement:${userId}:${today}`

    // Check cache
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      console.log('[Attunement API] Cache hit for:', cacheKey)
      return NextResponse.json({
        ...cached.data,
        cached: true,
        cachedAt: new Date(cached.cachedAt).toISOString(),
      })
    }

    // STEP 1: Semantic Search for Last 7 Days of Sovereign Logs
    console.log('[Attunement API] Fetching last 7 days of logs via semantic search...')

    let recentLogsContext = ''
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    if (process.env.HF_API_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        // Search query focused on recent patterns
        const searchQuery = `Recent sovereign log entries from the last 7 days: urges, leaks, transmutations, energy levels, patterns`
        const queryEmbeddingResult = await generateEmbedding(searchQuery, process.env.HF_API_KEY)

        if ('embedding' in queryEmbeddingResult) {
          const searchResults = await semanticSearch(
            queryEmbeddingResult.embedding,
            0.6, // Lower threshold for broader retrieval
            20 // Get more logs for pattern detection
          )

          if (searchResults.length > 0) {
            console.log(`[Attunement API] Found ${searchResults.length} relevant logs`)

            // Filter for last 7 days and format
            const recentLogs = searchResults
              .filter((result) => {
                const timestamp = result.metadata?.timestamp
                return timestamp && new Date(timestamp) >= sevenDaysAgo
              })
              .slice(0, 15) // Top 15 most relevant from last 7 days

            if (recentLogs.length > 0) {
              recentLogsContext = `
RECENT LOGS (Last 7 Days - ${recentLogs.length} entries):
${recentLogs
  .map((log, idx) => {
    const type = log.metadata?.type || 'unknown'
    const timestamp = log.metadata?.timestamp || 'unknown'
    const date = new Date(timestamp).toLocaleDateString()
    const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    return `[${idx + 1}] ${date} ${time} (${type}):
${log.content}
`
  })
  .join('\n')}
`
            } else {
              recentLogsContext = 'RECENT LOGS: No entries from the last 7 days available.\n'
            }
          }
        }
      } catch (ragError: any) {
        console.error('[Attunement API] RAG error:', ragError)
        recentLogsContext = 'RECENT LOGS: Unable to retrieve logs due to technical error.\n'
      }
    } else {
      recentLogsContext = 'RECENT LOGS: Logging system not yet configured.\n'
    }

    // STEP 2: Format Human Design Blueprint
    let blueprintContext = ''
    if (humanDesignChart) {
      const { type, strategy, authority, profile, centers, gates } = humanDesignChart

      const definedCenters = Object.entries(centers || {})
        .filter(([_, defined]) => defined)
        .map(([center, _]) => center)
        .join(', ')

      const undefinedCenters = Object.entries(centers || {})
        .filter(([_, defined]) => !defined)
        .map(([center, _]) => center)
        .join(', ')

      blueprintContext = `
BLUEPRINT (Human Design):
- Type: ${type || 'Unknown'}
- Strategy: ${strategy || 'Unknown'}
- Authority: ${authority || 'Unknown'}
- Profile: ${profile || 'Unknown'}
- Defined Centers: ${definedCenters || 'None'}
- Undefined Centers: ${undefinedCenters || 'All'}
- Active Gates: ${gates?.length ? gates.join(', ') : 'Unknown'}
`
    } else {
      blueprintContext = 'BLUEPRINT: Not yet calculated. Focus on behavioral patterns from logs.\n'
    }

    // STEP 3: Format HealthKit Vessel Data
    let vesselContext = ''
    if (healthMetrics) {
      const { steps, sleepHours, walkingAsymmetry, lastSync } = healthMetrics

      vesselContext = `
VESSEL DATA (HealthKit):
- Steps (today): ${steps.toLocaleString()}
- Sleep (last night): ${sleepHours.toFixed(1)} hours
- Walking Asymmetry: ${walkingAsymmetry !== null ? `${walkingAsymmetry.toFixed(1)}%` : 'Not available'}
- Last Sync: ${new Date(lastSync).toLocaleString()}
`
    } else {
      vesselContext = 'VESSEL DATA: Not yet synced. Focus on logs and cosmic patterns.\n'
    }

    // STEP 4: Format Cosmic State (Basic Solar/Lunar Data)
    let cosmicContext = ''
    if (cosmicData) {
      cosmicContext = formatCosmicDataForAI(cosmicData)
    } else if (location) {
      // Fetch cosmic data on the fly if location provided
      try {
        const cosmicResponse = await fetch(`${request.nextUrl.origin}/api/cosmos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(location),
        })

        if (cosmicResponse.ok) {
          const fetchedCosmic = await cosmicResponse.json()
          cosmicContext = formatCosmicDataForAI(fetchedCosmic)
        }
      } catch (e) {
        console.warn('[Attunement API] Failed to fetch cosmic data:', e)
      }
    }

    if (!cosmicContext) {
      cosmicContext = 'COSMIC STATE: Not yet fetched. Focus on internal patterns.\n'
    }

    // STEP 5: Format Advanced Astrological Transits
    let astrologyContext = ''
    if (astrologyData) {
      astrologyContext = formatAstrologyForAI(astrologyData)
    } else if (birthData && process.env.RAPIDAPI_ASTROLOGY_KEY) {
      // Fetch astrology data on the fly if birth data provided
      console.log('[Attunement API] Fetching advanced astrological transits...')
      try {
        const astrologyResponse = await fetch(`${request.nextUrl.origin}/api/astrology`, {
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
              country_code: birthData.countryCode || 'US',
            },
            analysisType: 'all', // Get natal chart + transits + personal trading insights
            options: {
              trading_style: 'day_trading', // For intraday energy timing
              analysis_period_days: 7, // Next week's transits
              include_lunar_cycles: true,
              language: 'en',
            },
          }),
        })

        if (astrologyResponse.ok) {
          const fetchedAstrology: AstrologicalInsight = await astrologyResponse.json()
          astrologyContext = formatAstrologyForAI(fetchedAstrology)
          console.log('[Attunement API] Successfully fetched astrology data')
        } else {
          console.warn('[Attunement API] Astrology API returned error:', astrologyResponse.status)
        }
      } catch (e) {
        console.warn('[Attunement API] Failed to fetch astrology data:', e)
      }
    }

    if (!astrologyContext) {
      astrologyContext =
        'ASTROLOGICAL TRANSITS: Not yet configured. Focus on Blueprint + Vessel alignment.\n'
    }

    // STEP 6: Build Complete Input for Gemini
    const synthesisInput = `${ATTUNEMENT_SYSTEM_PROMPT}

=== TODAY'S DATA FOR SYNTHESIS ===

${blueprintContext}
${recentLogsContext}
${vesselContext}
${cosmicContext}
${astrologyContext}

=== GENERATE DAILY ATTUNEMENT ===

Based on the above data, generate TODAY's attunement as a JSON object with:
1. An insightful question that reveals the biggest pattern or friction
2. A synthesized answer with a concrete action for today

INTEGRATION REQUIREMENTS:
- Cross-reference BLUEPRINT (Human Design) with TRANSITS (Astrology)
- Identify if vessel leaks (HealthKit) correlate with unfavorable planetary periods
- Detect if recent logs show resistance patterns during caution periods
- Highlight if favorable transit periods align with potency moments in logs
- Synthesize natal chart placements with Human Design gates for deeper insight

Remember:
- Use REAL data points from the logs (counts, timestamps, energy levels)
- If data is sparse, focus on Blueprint + Cosmic + Transit alignment
- If data is rich, prioritize LEAK PATTERNS correlated with PLANETARY TRANSITS
- Reference specific planetary aspects if they illuminate behavioral patterns
- Return ONLY the JSON object, no extra text
`

    console.log('[Attunement API] Generating attunement with Gemini...')

    // Call Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
    const result = await model.generateContent(synthesisInput)
    const response = result.response.text()

    // Parse JSON response
    let attunement
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch =
        response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/)
      const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : response

      attunement = JSON.parse(jsonString)

      // Validate structure
      if (!attunement.insightfulQuestion || !attunement.synthesizedAnswer) {
        throw new Error('Invalid attunement structure')
      }
    } catch (parseError: any) {
      console.error('[Attunement API] Failed to parse attunement:', parseError)
      console.log('[Attunement API] Raw response:', response)

      return NextResponse.json(
        {
          error: 'Failed to generate valid attunement',
          details: parseError.message,
          rawResponse: response.substring(0, 500),
        },
        { status: 500 }
      )
    }

    // STEP 7: Build Response
    const attunementResponse = {
      id: `attunement-${Date.now()}`,
      date: today,
      insightfulQuestion: attunement.insightfulQuestion,
      synthesizedAnswer: attunement.synthesizedAnswer,
      generatedAt: new Date().toISOString(),
      basedOn: {
        logCount: recentLogsContext.includes('entries)')
          ? parseInt(recentLogsContext.match(/(\d+) entries/)?.[1] || '0')
          : 0,
        humanDesignAvailable: !!humanDesignChart,
        healthMetricsAvailable: !!healthMetrics,
        cosmicDataAvailable: !!cosmicData || !!location,
        astrologyDataAvailable: !!astrologyData || !!birthData,
      },
    }

    // Cache the result
    cache.set(cacheKey, {
      data: attunementResponse,
      cachedAt: Date.now(),
    })

    console.log('[Attunement API] Successfully generated and cached attunement')

    return NextResponse.json({
      ...attunementResponse,
      cached: false,
    })
  } catch (error: any) {
    console.error('[Attunement API] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

// GET endpoint for health check and cache stats
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'healthy',
    endpoint: '/api/attunement',
    methods: ['POST'],
    description:
      'Generates Daily Attunement by synthesizing Blueprint + Logs + HealthKit + Cosmos + Astrology',
    requiredEnv: ['GOOGLE_API_KEY', 'HF_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
    optionalEnv: ['IPGEOLOCATION_API_KEY', 'RAPIDAPI_ASTROLOGY_KEY'],
    configured: {
      googleAI: !!process.env.GOOGLE_API_KEY,
      huggingFace: !!process.env.HF_API_KEY,
      supabase: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      ipGeolocation: !!process.env.IPGEOLOCATION_API_KEY,
      astrology: !!process.env.RAPIDAPI_ASTROLOGY_KEY,
    },
    cacheStats: {
      entries: cache.size,
      ttl: '24 hours',
    },
  })
}
