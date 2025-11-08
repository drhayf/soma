/**
 * Cosmic Data Proxy API Route
 * Fetches solar, lunar, and twilight data from IP Geolocation Astronomy API
 * Implements 24-hour caching to minimize API calls
 * POST /api/cosmos
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

interface CosmosRequest {
  latitude?: number
  longitude?: number
  location?: string
  date?: string // YYYY-MM-DD format
}

// In-memory cache (resets on cold starts, good enough for 24h cache)
const cache = new Map<string, { data: any; cachedAt: number }>()
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    if (!process.env.IPGEOLOCATION_API_KEY) {
      return NextResponse.json({ error: 'IPGEOLOCATION_API_KEY not configured' }, { status: 500 })
    }

    const body: CosmosRequest = await request.json()
    const { latitude, longitude, location, date } = body

    // Validate input - must provide either coordinates or location
    if (!latitude && !longitude && !location) {
      return NextResponse.json(
        { error: 'Either latitude/longitude or location must be provided' },
        { status: 400 }
      )
    }

    // Build cache key
    const cacheKey = location
      ? `loc:${location}:${date || 'today'}`
      : `coords:${latitude},${longitude}:${date || 'today'}`

    // Check cache
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      console.log('[Cosmos API] Cache hit for:', cacheKey)
      return NextResponse.json({
        ...cached.data,
        cached: true,
        cachedAt: new Date(cached.cachedAt).toISOString(),
      })
    }

    // Build API URL
    const baseUrl = 'https://api.ipgeolocation.io/astronomy'
    const params = new URLSearchParams({
      apiKey: process.env.IPGEOLOCATION_API_KEY,
    })

    if (location) {
      params.append('location', location)
    } else if (latitude !== undefined && longitude !== undefined) {
      params.append('lat', latitude.toString())
      params.append('long', longitude.toString())
    }

    if (date) {
      params.append('date', date)
    }

    const url = `${baseUrl}?${params.toString()}`

    console.log('[Cosmos API] Fetching from IP Geolocation...')

    // Fetch from IP Geolocation API
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[Cosmos API] IP Geolocation error:', errorData)

      return NextResponse.json(
        {
          error: 'Failed to fetch cosmic data',
          details: errorData.message || response.statusText,
          status: response.status,
        },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Extract and structure the data
    const structuredData = {
      location: {
        latitude: data.location?.latitude || latitude?.toString() || '',
        longitude: data.location?.longitude || longitude?.toString() || '',
        city: data.location?.city || '',
        country: data.location?.country_name || '',
      },
      astronomy: {
        date: data.astronomy?.date || '',
        current_time: data.astronomy?.current_time || '',
        sunrise: data.astronomy?.sunrise || '',
        sunset: data.astronomy?.sunset || '',
        solar_noon: data.astronomy?.solar_noon || '',
        day_length: data.astronomy?.day_length || '',
        sun_altitude: data.astronomy?.sun_altitude || 0,
        sun_azimuth: data.astronomy?.sun_azimuth || 0,
        sun_distance: data.astronomy?.sun_distance || 0,
        moon_phase: data.astronomy?.moon_phase || '',
        moonrise: data.astronomy?.moonrise || '',
        moonset: data.astronomy?.moonset || '',
        moon_altitude: data.astronomy?.moon_altitude || 0,
        moon_azimuth: data.astronomy?.moon_azimuth || 0,
        moon_illumination_percentage: data.astronomy?.moon_illumination_percentage || '0',
        morning: {
          astronomical_twilight_begin: data.astronomy?.morning?.astronomical_twilight_begin || '',
          civil_twilight_begin: data.astronomy?.morning?.civil_twilight_begin || '',
          golden_hour_begin: data.astronomy?.morning?.golden_hour_begin || '',
          golden_hour_end: data.astronomy?.morning?.golden_hour_end || '',
        },
        evening: {
          golden_hour_begin: data.astronomy?.evening?.golden_hour_begin || '',
          golden_hour_end: data.astronomy?.evening?.golden_hour_end || '',
          civil_twilight_end: data.astronomy?.evening?.civil_twilight_end || '',
          astronomical_twilight_end: data.astronomy?.evening?.astronomical_twilight_end || '',
        },
      },
      cached_at: new Date().toISOString(),
    }

    // Cache the result
    cache.set(cacheKey, {
      data: structuredData,
      cachedAt: Date.now(),
    })

    console.log('[Cosmos API] Successfully fetched and cached cosmic data')

    return NextResponse.json({
      ...structuredData,
      cached: false,
    })
  } catch (error: any) {
    console.error('[Cosmos API] Unexpected error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

// GET endpoint for health check
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'healthy',
    endpoint: '/api/cosmos',
    methods: ['POST'],
    description: 'Fetches solar, lunar, and twilight data with 24h caching',
    requiredEnv: ['IPGEOLOCATION_API_KEY'],
    configured: {
      ipGeolocationKey: !!process.env.IPGEOLOCATION_API_KEY,
    },
    cacheStats: {
      entries: cache.size,
      ttl: '24 hours',
    },
  })
}
