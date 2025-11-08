/**
 * useCosmicData Hook
 * Fetches solar, lunar, and twilight data from /api/cosmos
 * Implements local caching and loading states
 */

import { useState, useEffect } from 'react'
import {
  syncCosmicData,
  fetchCosmicData as fetchCachedCosmicData,
} from '../lib/supabase-sync-extended'
import type { CosmicData } from '../types'

interface UseCosmicDataOptions {
  latitude?: number
  longitude?: number
  location?: string
  date?: string
  enabled?: boolean // Allow disabling auto-fetch
  useCache?: boolean // Default true - check Supabase cache first
}

interface UseCosmicDataReturn {
  data: CosmicData | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useCosmicData(options: UseCosmicDataOptions = {}): UseCosmicDataReturn {
  const { latitude, longitude, location, date, enabled = true, useCache = true } = options

  const [data, setData] = useState<CosmicData | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCosmicData = async () => {
    // Skip if disabled or no location provided
    if (!enabled || (!latitude && !longitude && !location)) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const today = date || new Date().toISOString().split('T')[0]

      // 1. Try cache first if enabled
      if (useCache) {
        const cachedData = await fetchCachedCosmicData(today || '')
        if (cachedData) {
          console.log('[useCosmicData] Using cached data from Supabase')
          setData(cachedData)
          setError(null)
          setLoading(false)
          return
        }
      }

      // 2. Fetch fresh data from API
      const response = await fetch('/api/cosmos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude,
          longitude,
          location,
          date,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const cosmicData: CosmicData = await response.json()

      setData(cosmicData)
      setError(null)

      // 3. Cache the fresh data in Supabase
      syncCosmicData(cosmicData, today || '').catch((err) => {
        console.error('[useCosmicData] Failed to cache cosmic data:', err)
      })
    } catch (err: any) {
      console.error('[useCosmicData] Error fetching cosmic data:', err)
      setError(err.message || 'Failed to fetch cosmic data')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    fetchCosmicData()
  }, [latitude, longitude, location, date, enabled])

  return {
    data,
    loading,
    error,
    refetch: fetchCosmicData,
  }
}

/**
 * Helper function to get cosmic data for current user location
 * Uses browser geolocation API if available
 */
export async function getCurrentLocationCosmicData(): Promise<CosmicData | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('[useCosmicData] Geolocation not supported')
      resolve(null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch('/api/cosmos', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }),
          })

          if (!response.ok) {
            resolve(null)
            return
          }

          const data = await response.json()
          resolve(data)
        } catch (err) {
          console.error('[useCosmicData] Error fetching with geolocation:', err)
          resolve(null)
        }
      },
      (error) => {
        console.error('[useCosmicData] Geolocation error:', error)
        resolve(null)
      }
    )
  })
}

/**
 * Format cosmic data for AI prompts
 * Creates a concise, informative string for context injection
 */
export function formatCosmicDataForAI(cosmic: CosmicData | null): string {
  if (!cosmic) return ''

  const { astronomy } = cosmic

  return `COSMIC STATE (${astronomy.date}):
- Sun: ${astronomy.sun_altitude.toFixed(1)}° altitude, ${astronomy.sun_azimuth.toFixed(1)}° azimuth
- Solar Timing: Sunrise ${astronomy.sunrise} | Solar Noon ${astronomy.solar_noon} | Sunset ${astronomy.sunset}
- Day Length: ${astronomy.day_length}
- Moon: ${astronomy.moon_phase} (${astronomy.moon_illumination_percentage}% illuminated)
- Lunar Position: ${astronomy.moon_altitude.toFixed(1)}° altitude, ${astronomy.moon_azimuth.toFixed(1)}° azimuth
- Golden Hour: Morning ${astronomy.morning.golden_hour_begin}-${astronomy.morning.golden_hour_end} | Evening ${astronomy.evening.golden_hour_begin}-${astronomy.evening.golden_hour_end}
`
}
