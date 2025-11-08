/**
 * Theme Store - Manages theme mode and auto-switching behavior
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark'
export type ThemeSetting = 'auto' | 'light' | 'dark'

interface ThemeStore {
  // Settings
  themeSetting: ThemeSetting // User's preference (auto, light, or dark)

  // State
  currentTheme: ThemeMode // Actual theme being displayed

  // Actions
  setThemeSetting: (setting: ThemeSetting) => void
  setCurrentTheme: (theme: ThemeMode) => void

  // Helpers
  isAuto: () => boolean
}

// Cross-platform storage adapter
const getStorage = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return createJSONStorage(() => localStorage)
  }

  // React Native AsyncStorage
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default
    return createJSONStorage(() => AsyncStorage)
  } catch {
    // Fallback to in-memory storage
    const storage = new Map<string, string>()
    return createJSONStorage(() => ({
      getItem: (key: string) => storage.get(key) || null,
      setItem: (key: string, value: string) => {
        storage.set(key, value)
      },
      removeItem: (key: string) => {
        storage.delete(key)
      },
    }))
  }
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      themeSetting: 'auto',
      currentTheme: 'light',

      setThemeSetting: (setting) => set({ themeSetting: setting }),
      setCurrentTheme: (theme) => set({ currentTheme: theme }),

      isAuto: () => get().themeSetting === 'auto',
    }),
    {
      name: 'somatic-alignment-theme',
      storage: getStorage(),
    }
  )
)
