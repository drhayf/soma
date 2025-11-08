/**
 * useAutoTheme - Hook to handle automatic theme switching based on time of day
 *
 * Auto mode switches between light/dark based on time:
 * - Light: 6am - 6pm
 * - Dark: 6pm - 6am
 */

import { useEffect } from 'react'
import { useColorScheme } from 'react-native'
import { useThemeStore, type ThemeMode } from '../lib/theme-store'

export function useAutoTheme() {
  const colorScheme = useColorScheme()
  const themeSetting = useThemeStore((state) => state.themeSetting)
  const currentTheme = useThemeStore((state) => state.currentTheme)
  const setCurrentTheme = useThemeStore((state) => state.setCurrentTheme)
  const isAuto = useThemeStore((state) => state.isAuto)

  // Determine theme based on time of day
  const getAutoTheme = (): ThemeMode => {
    const hour = new Date().getHours()
    // Light mode: 6am - 6pm (6-18)
    // Dark mode: 6pm - 6am (18-6)
    return hour >= 6 && hour < 18 ? 'light' : 'dark'
  }

  useEffect(() => {
    let theme: ThemeMode

    if (themeSetting === 'auto') {
      // Use time-based auto theme
      theme = getAutoTheme()

      // Set up interval to check every minute for theme changes
      const interval = setInterval(() => {
        const newTheme = getAutoTheme()
        if (newTheme !== currentTheme) {
          setCurrentTheme(newTheme)
        }
      }, 60000) // Check every minute

      // Cleanup interval on unmount
      return () => clearInterval(interval)
    } else {
      // Use manual theme setting
      theme = themeSetting as ThemeMode
    }

    // Update current theme if it changed
    if (theme !== currentTheme) {
      setCurrentTheme(theme)
    }
  }, [themeSetting, currentTheme, setCurrentTheme])

  return {
    currentTheme,
    themeSetting,
    isAuto: isAuto(),
  }
}
