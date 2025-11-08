/**
 * Cross-Platform HealthKit Integration Hook
 * Provides access to Apple HealthKit data on iOS via react-native-health
 * Returns mock data on web and Android for development
 */

import { useState, useEffect } from 'react'
import { Platform } from 'react-native'
import { syncHealthMetrics } from '../lib/supabase-sync-extended'

// Type definitions for health data
export interface HealthMetrics {
  steps: number
  sleepHours: number
  walkingAsymmetry: number | null
  lastSync: string
}

export interface HealthDataHook {
  metrics: HealthMetrics | null
  isLoading: boolean
  error: string | null
  requestPermissions: () => Promise<boolean>
  fetchDailySummary: () => Promise<void>
  isAvailable: boolean
}

// Lazy import for react-native-health (only on native iOS)
let AppleHealthKit: any = null
let isHealthKitAvailable = false

if (Platform.OS === 'ios') {
  try {
    const healthModule = require('react-native-health')
    AppleHealthKit = healthModule.default

    // Verify the module has required properties
    if (
      AppleHealthKit &&
      AppleHealthKit.Constants &&
      typeof AppleHealthKit.initHealthKit === 'function'
    ) {
      isHealthKitAvailable = true
    } else {
      console.warn(
        '[HealthKit] Module loaded but missing required APIs. Needs development/production build.'
      )
      AppleHealthKit = null
    }
  } catch (e) {
    console.warn('[HealthKit] Library not available:', e)
    // Library not available - development build needed
  }
}

export function useHealthData(): HealthDataHook {
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isAvailable = Platform.OS === 'ios' && isHealthKitAvailable

  /**
   * Request HealthKit permissions for reading health data
   * Permissions: Steps, Sleep, Walking Asymmetry Percentage
   */
  const requestPermissions = async (): Promise<boolean> => {
    if (!isAvailable) {
      const errorMsg =
        Platform.OS !== 'ios'
          ? 'HealthKit is only available on iOS devices.'
          : 'HealthKit requires a development or production build. Not available in Expo Go.'
      setError(errorMsg)
      return false
    }

    if (!AppleHealthKit || !AppleHealthKit.Constants) {
      setError('HealthKit module not properly initialized.')
      return false
    }

    return new Promise((resolve) => {
      try {
        const permissions = {
          permissions: {
            read: [
              AppleHealthKit.Constants.Permissions.StepCount,
              AppleHealthKit.Constants.Permissions.SleepAnalysis,
              AppleHealthKit.Constants.Permissions.WalkingAsymmetryPercentage,
            ],
            write: [
              AppleHealthKit.Constants.Permissions.MindfulSession,
              AppleHealthKit.Constants.Permissions.Workout,
            ],
          },
        }

        AppleHealthKit.initHealthKit(permissions, (err: string) => {
          if (err) {
            setError(`HealthKit initialization failed: ${err}`)
            resolve(false)
            return
          }
          setError(null)
          resolve(true)
        })
      } catch (err: any) {
        setError(`HealthKit error: ${err.message || 'Unknown error'}`)
        resolve(false)
      }
    })
  }

  /**
   * Fetch today's health summary
   * Gets steps, sleep duration, and walking asymmetry
   */
  const fetchDailySummary = async (): Promise<void> => {
    if (!isAvailable) {
      // Mock data for web/development
      setMetrics({
        steps: 8234,
        sleepHours: 7.5,
        walkingAsymmetry: null,
        lastSync: new Date().toISOString(),
      })
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const todayDate = new Date()
      todayDate.setHours(0, 0, 0, 0)
      const now = new Date()

      const options = {
        startDate: todayDate.toISOString(),
        endDate: now.toISOString(),
      }

      // Fetch steps
      const stepsPromise = new Promise<number>((resolve) => {
        AppleHealthKit.getStepCount(options, (err: string, results: { value: number }) => {
          if (err || !results) {
            resolve(0)
            return
          }
          resolve(results.value)
        })
      })

      // Fetch sleep (from last night)
      const sleepPromise = new Promise<number>((resolve) => {
        const yesterday = new Date(todayDate)
        yesterday.setDate(yesterday.getDate() - 1)
        yesterday.setHours(20, 0, 0, 0) // Start from 8 PM yesterday

        const sleepOptions = {
          startDate: yesterday.toISOString(),
          endDate: todayDate.toISOString(),
        }

        AppleHealthKit.getSleepSamples(
          sleepOptions,
          (err: string, results: Array<{ startDate: string; endDate: string }>) => {
            if (err || !results || results.length === 0) {
              resolve(0)
              return
            }

            // Calculate total sleep duration in hours
            const totalMinutes = results.reduce((sum, sample) => {
              const start = new Date(sample.startDate)
              const end = new Date(sample.endDate)
              return sum + (end.getTime() - start.getTime()) / (1000 * 60)
            }, 0)

            resolve(totalMinutes / 60)
          }
        )
      })

      // Fetch walking asymmetry (latest sample)
      const asymmetryPromise = new Promise<number | null>((resolve) => {
        // Get last 7 days of data
        const weekAgo = new Date(todayDate)
        weekAgo.setDate(weekAgo.getDate() - 7)

        const asymmetryOptions = {
          startDate: weekAgo.toISOString(),
          endDate: now.toISOString(),
        }

        AppleHealthKit.getSamples(
          {
            ...asymmetryOptions,
            type: 'WalkingAsymmetryPercentage',
          },
          (err: string, results: Array<{ value: number }>) => {
            if (err || !results || results.length === 0) {
              resolve(null)
              return
            }

            // Get most recent value and convert to percentage
            const latestValue =
              results && results.length > 0 ? (results[results.length - 1]?.value || 0) * 100 : 0
            resolve(latestValue)
          }
        )
      })

      const [steps, sleepHours, walkingAsymmetry] = await Promise.all([
        stepsPromise,
        sleepPromise,
        asymmetryPromise,
      ])

      const healthMetrics: HealthMetrics = {
        steps,
        sleepHours,
        walkingAsymmetry,
        lastSync: new Date().toISOString(),
      }

      setMetrics(healthMetrics)

      // Sync to Supabase
      const today = todayDate.toISOString().split('T')[0]
      syncHealthMetrics(healthMetrics, today || '').catch((err) => {
        console.error('[HealthKit] Failed to sync health metrics:', err)
      })
    } catch (err) {
      setError(`Failed to fetch health data: ${err}`)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    metrics,
    isLoading,
    error,
    requestPermissions,
    fetchDailySummary,
    isAvailable,
  }
}
