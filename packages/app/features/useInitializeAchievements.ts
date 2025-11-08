/**
 * Initialize Achievement System
 * Call this hook in the root of your app to initialize achievements from definitions
 */

import { useEffect } from 'react'
import { useAchievementStore } from '../lib/store'
import { achievementDefinitions } from '../lib/content'

export function useInitializeAchievements() {
  const initializeAchievements = useAchievementStore((state) => state.initializeAchievements)

  useEffect(() => {
    // Initialize achievements from definitions on app startup
    initializeAchievements(achievementDefinitions)
  }, [initializeAchievements])
}
