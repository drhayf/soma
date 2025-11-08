// leave this blank
// don't re-export files from this workspace. it'll break next.js tree shaking
// https://github.com/vercel/next.js/issues/12557

// Export shared types
export * from './types'

// Export shared content
export * from './lib/content'
// OEJTS types are already exported from './types'
export * from './lib/hdkit'

// Export shared store
export * from './lib/store'
export * from './lib/theme-store'
export { useAutoTheme } from './lib/useAutoTheme'

// Export shared hooks
export { useHealthData } from './hooks/useHealthData'
export type { HealthMetrics, HealthDataHook } from './hooks/useHealthData'
export {
  useCosmicData,
  formatCosmicDataForAI,
  getCurrentLocationCosmicData,
} from './hooks/useCosmicData'
export {
  useAstrologyData,
  formatAstrologyForAI,
  extractKeyInsights,
} from './hooks/useAstrologyData'

// Export API configuration utilities
export {
  getApiUrl,
  getApiConfig,
  getBaseUrl,
  LOCAL_DEV_IP,
  diagnoseApiConfig,
  testApiConnectivity,
} from './lib/api-config'

// Export shared features
export { RoutinePlayer } from './features/RoutinePlayer'
export { KnowledgeVault } from './features/KnowledgeVault'
export { JournalModal } from './features/JournalModal'
export { AchievementUnlock } from './features/AchievementUnlock'
export { AchievementGallery } from './features/AchievementGallery'
export { ProgressDashboard } from './features/ProgressDashboard'
export { SovereignProfile } from './features/SovereignProfile'
export { DailyAttunement } from './features/DailyAttunement'
export { useInitializeAchievements } from './features/useInitializeAchievements'

// Export animated components
export { AnimatedCard } from './components/AnimatedCard'
export { AnimatedNumber } from './components/AnimatedNumber'
export { AnimatedButton } from './components/AnimatedButton'
export { AnimatedProgress } from './components/AnimatedProgress'
export { AnimatedSheet } from './components/AnimatedSheet'
export { ShineEffect } from './components/ShineEffect'
export { SuccessCelebration } from './components/SuccessCelebration'
export { FloatingThemeWidget } from './components/FloatingThemeWidget'
export { FloatingNavPill, FLOATING_NAV_HEIGHT } from './components/FloatingNavPill'
export { KeyboardDismissButton } from './components/KeyboardDismissButton'

// Export animation utilities
export * from './lib/animations'

// Export achievement definitions
export { achievementDefinitions } from './lib/content'
