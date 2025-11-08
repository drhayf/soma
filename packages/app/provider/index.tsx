import { useEffect } from 'react'
import { useColorScheme } from 'react-native'
import {
  CustomToast,
  TamaguiProvider,
  type TamaguiProviderProps,
  ToastProvider,
  config,
  isWeb,
} from '@my/ui'
import { ToastViewport } from './ToastViewport'
import { useThemeStore } from '../lib/theme-store'
import { useAuthStore } from '../lib/auth-store'
import offlineSync from '../lib/offline-sync'

export function Provider({
  children,
  defaultTheme = 'light',
  ...rest
}: Omit<TamaguiProviderProps, 'config'> & { defaultTheme?: string }) {
  const colorScheme = useColorScheme()
  const currentTheme = useThemeStore((state) => state.currentTheme)
  const themeSetting = useThemeStore((state) => state.themeSetting)
  const setCurrentTheme = useThemeStore((state) => state.setCurrentTheme)

  // Initialize auth on app start
  const initializeAuth = useAuthStore((state) => state.initialize)

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  // Attempt a background sync of any queued offline items after auth initializes
  useEffect(() => {
    let mounted = true
    const runSync = async () => {
      try {
        // small delay to let network stabilize
        await new Promise((r) => setTimeout(r, 1200))
        const report = await offlineSync.syncPending({
          onProgress: (msg) => console.log('[Sync]', msg),
        })
        if (mounted) console.log('[Sync] Report', report)
      } catch (err) {
        console.warn('[Sync] Background sync failed', err)
      }
    }
    runSync()
    return () => {
      mounted = false
    }
  }, [])

  // Auto theme based on time of day
  useEffect(() => {
    if (themeSetting === 'auto') {
      const hour = new Date().getHours()
      const autoTheme = hour >= 6 && hour < 18 ? 'light' : 'dark'

      setCurrentTheme(autoTheme)

      // Check every minute for theme changes
      const interval = setInterval(() => {
        const newHour = new Date().getHours()
        const newAutoTheme = newHour >= 6 && newHour < 18 ? 'light' : 'dark'
        setCurrentTheme(newAutoTheme)
      }, 60000)

      return () => clearInterval(interval)
    } else {
      // Manual theme setting (light or dark)
      const manualTheme = themeSetting as 'light' | 'dark'
      setCurrentTheme(manualTheme)
    }
  }, [themeSetting, setCurrentTheme])

  const theme = currentTheme || defaultTheme

  return (
    <TamaguiProvider config={config} defaultTheme={theme} {...rest}>
      <ToastProvider swipeDirection="horizontal" duration={6000} native={isWeb ? [] : ['mobile']}>
        {children}
        <CustomToast />
        <ToastViewport />
      </ToastProvider>
    </TamaguiProvider>
  )
}
