/**
 * Shared Zustand Store with Cross-Platform Persistence
 * Works with AsyncStorage (React Native) and localStorage (Web)
 * Auto-syncs to Supabase for RAG system
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  syncChatMessage,
  syncJournalEntry,
  syncSovereignLog,
  syncAttunementFeedback,
} from './supabase-sync'
import { syncUserProgress, syncAchievement, syncSovereignPathData } from './supabase-sync-extended'
import type {
  UserProgress,
  ChatSession,
  ChatHistoryEntry,
  JournalEntry,
  Achievement,
  MoodType,
  PhysicalSensation,
  SovereignLogEntry,
  SovereignLogDraft,
  SovereignLogEntryType,
  UrgeStateType,
  ActionTakenType,
  CustomField,
  Kata,
  ArchetypeAnalysis,
  PatternInsight,
  AttunementFeedback,
} from '../types'
import type { HumanDesignChart, BirthData } from './hdkit/types'
import type { OEJTSAnswer, OEJTSResults } from './oejts'
import type { HealthMetrics } from '../hooks/useHealthData'

interface ProgressStore extends UserProgress {
  completeRoutine: () => void
  resetStreak: () => void
  getDaysSinceLastCompletion: () => number
  finalizeRoutineCompletion: (
    routineType: 'morning' | 'evening',
    journalCount: number
  ) => {
    userProgress: UserProgress
    newlyUnlockedAchievement: Achievement | null
  }
}

interface ChatStore {
  chatSessions: ChatSession[]
  currentSessionId: string | null
  addChatMessage: (userMessage: string, aiResponse: string, routineContext?: any) => void
  startNewSession: () => void
  deleteSession: (sessionId: string) => void
  clearAllSessions: () => void
  getSessionCount: () => number
  getCurrentSession: () => ChatSession | null
  getRecentMessages: (limit?: number) => ChatHistoryEntry[]
}

interface JournalStore {
  journalEntries: JournalEntry[]
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'timestamp'>) => void
  getJournalEntries: (filter?: {
    routineType?: 'morning' | 'evening'
    startDate?: string
    endDate?: string
  }) => JournalEntry[]
  deleteJournalEntry: (id: string) => void
  getRecentEntries: (limit?: number) => JournalEntry[]
}

interface AchievementStore {
  achievements: Achievement[]
  initializeAchievements: (
    definitions: Omit<Achievement, 'unlocked' | 'unlockedDate' | 'progress'>[]
  ) => void
  checkAchievements: (userProgress: UserProgress, journalCount: number) => void
  unlockAchievement: (id: string) => void
  unlockSpecialAchievement: (routineType: 'morning' | 'evening') => void
  getUnlockedCount: () => number
  getProgress: (id: string) => number
  getAchievementById: (id: string) => Achievement | undefined
}

interface SovereignLogStore {
  sovereignEntries: SovereignLogEntry[]
  drafts: SovereignLogDraft[]
  collapsedEntries: string[]
  attunementFeedback: AttunementFeedback[]
  addSovereignEntry: (entry: Omit<SovereignLogEntry, 'id' | 'timestamp'>) => SovereignLogEntry
  updateEntryAnalysis: (id: string, analysis: string) => void
  getSovereignEntries: (filter?: {
    entryType?: SovereignLogEntryType
    startDate?: string
    endDate?: string
  }) => SovereignLogEntry[]
  deleteSovereignEntry: (id: string) => void
  getRecentSovereignEntries: (limit?: number) => SovereignLogEntry[]
  getEntriesByTimePattern: (hourOfDay?: number) => SovereignLogEntry[]
  getLeakPatterns: () => {
    hour: number
    count: number
    urgeStates: string[]
  }[]
  // Draft functions
  saveDraft: (draft: Omit<SovereignLogDraft, 'id' | 'savedAt'>) => SovereignLogDraft
  loadDraft: (id: string) => SovereignLogDraft | null
  deleteDraft: (id: string) => void
  getDrafts: () => SovereignLogDraft[]
  // Collapse functions
  toggleCollapsed: (id: string) => void
  isCollapsed: (id: string) => boolean
  // Attunement Feedback functions
  addAttunementFeedback: (
    feedback: Omit<AttunementFeedback, 'id' | 'timestamp' | 'vectorized'>
  ) => AttunementFeedback
  getAttunementFeedback: (filter?: {
    startDate?: string
    endDate?: string
    minRating?: number
    maxRating?: number
  }) => AttunementFeedback[]
  getRecentFeedback: (limit?: number) => AttunementFeedback[]
}

// Storage adapter that works on both platforms
export const getStorage = () => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined' && window.localStorage) {
    return createJSONStorage(() => localStorage)
  }

  // For React Native, we'll use AsyncStorage (imported dynamically in the native app)
  try {
    // This will be replaced by the native app with actual AsyncStorage
    const AsyncStorage = require('@react-native-async-storage/async-storage').default
    return createJSONStorage(() => AsyncStorage)
  } catch {
    // Fallback to in-memory storage if neither is available
    const memoryStorage = new Map<string, string>()
    return createJSONStorage(() => ({
      getItem: (key: string) => memoryStorage.get(key) || null,
      setItem: (key: string, value: string) => {
        memoryStorage.set(key, value)
      },
      removeItem: (key: string) => {
        memoryStorage.delete(key)
      },
    }))
  }
}

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      complianceStreak: 0,
      lastCompletedDate: null,
      totalCompletions: 0,

      completeRoutine: () => {
        const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
        const { lastCompletedDate, complianceStreak, totalCompletions } = get()

        // Check if already completed today
        if (lastCompletedDate === today) {
          return // Don't increment if already completed today
        }

        // Check if this is a consecutive day
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]

        const isConsecutive = lastCompletedDate === yesterdayStr

        set({
          lastCompletedDate: today,
          complianceStreak: isConsecutive ? complianceStreak + 1 : 1,
          totalCompletions: totalCompletions + 1,
        })

        // Sync to Supabase
        const updatedProgress = get()
        syncUserProgress({
          complianceStreak: updatedProgress.complianceStreak,
          lastCompletedDate: updatedProgress.lastCompletedDate,
          totalCompletions: updatedProgress.totalCompletions,
        }).catch((err) => console.error('[Store] Failed to sync user progress:', err))
      },

      resetStreak: () => {
        set({
          complianceStreak: 0,
          lastCompletedDate: null,
        })
      },

      getDaysSinceLastCompletion: () => {
        const { lastCompletedDate } = get()
        if (!lastCompletedDate) return -1

        const today = new Date()
        const lastDate = new Date(lastCompletedDate)
        const diffTime = Math.abs(today.getTime() - lastDate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays
      },

      /**
       * Atomic routine completion - batches all completion operations
       * to prevent cascading re-renders across multiple stores.
       *
       * This replaces the pattern of calling completeRoutine(),
       * unlockSpecialAchievement(), and checkAchievements() separately.
       */
      finalizeRoutineCompletion: (routineType, journalCount) => {
        // Store achievements before completion
        const achievementsBefore = useAchievementStore
          .getState()
          .achievements.filter((a) => a.unlocked)
          .map((a) => a.id)

        // 1. Complete routine (updates progress)
        get().completeRoutine()

        // 2. Get updated progress immediately
        const updatedProgress = get()

        // 3. Unlock special achievement for routine type
        useAchievementStore.getState().unlockSpecialAchievement(routineType)

        // 4. Check for achievement unlocks with updated progress
        useAchievementStore.getState().checkAchievements(
          {
            complianceStreak: updatedProgress.complianceStreak,
            lastCompletedDate: updatedProgress.lastCompletedDate,
            totalCompletions: updatedProgress.totalCompletions,
          },
          journalCount
        )

        // 5. Find newly unlocked achievement
        const achievementsAfter = useAchievementStore.getState().achievements
        const newlyUnlocked =
          achievementsAfter.find((a) => a.unlocked && !achievementsBefore.includes(a.id)) || null

        return {
          userProgress: {
            complianceStreak: updatedProgress.complianceStreak,
            lastCompletedDate: updatedProgress.lastCompletedDate,
            totalCompletions: updatedProgress.totalCompletions,
          },
          newlyUnlockedAchievement: newlyUnlocked,
        }
      },
    }),
    {
      name: 'somatic-alignment-progress',
      storage: getStorage(),
    }
  )
)

// Chat History Store with Persistence
export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      chatSessions: [],
      currentSessionId: null,

      startNewSession: () => {
        const sessionId = `session-${Date.now()}`
        const newSession: ChatSession = {
          id: sessionId,
          startDate: new Date().toISOString(),
          lastActive: new Date().toISOString(),
          messages: [],
          messageCount: 0,
        }

        set({
          chatSessions: [...get().chatSessions, newSession],
          currentSessionId: sessionId,
        })
      },

      addChatMessage: (userMessage: string, aiResponse: string, routineContext?: any) => {
        const { chatSessions, currentSessionId } = get()

        // If no current session, start one
        if (!currentSessionId) {
          get().startNewSession()
        }

        const sessionId = get().currentSessionId!
        const entry: ChatHistoryEntry = {
          id: `msg-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userMessage,
          aiResponse,
          routineContext,
        }

        const updatedSessions = chatSessions.map((session) => {
          if (session.id === sessionId) {
            return {
              ...session,
              messages: [...session.messages, entry],
              messageCount: session.messageCount + 1,
              lastActive: new Date().toISOString(),
            }
          }
          return session
        })

        set({ chatSessions: updatedSessions })

        // Auto-sync to Supabase for RAG system
        syncChatMessage(entry, sessionId).catch((err) => {
          console.error('[Store] Failed to sync chat message:', err)
        })
      },

      deleteSession: (sessionId: string) => {
        const { chatSessions, currentSessionId } = get()
        const updatedSessions = chatSessions.filter((session) => session.id !== sessionId)

        set({
          chatSessions: updatedSessions,
          currentSessionId: currentSessionId === sessionId ? null : currentSessionId,
        })
      },

      clearAllSessions: () => {
        set({
          chatSessions: [],
          currentSessionId: null,
        })
      },

      getSessionCount: () => {
        return get().chatSessions.length
      },

      getCurrentSession: () => {
        const { chatSessions, currentSessionId } = get()
        if (!currentSessionId) return null
        return chatSessions.find((session) => session.id === currentSessionId) || null
      },

      getRecentMessages: (limit: number = 5) => {
        const currentSession = get().getCurrentSession()
        if (!currentSession) return []

        // Return last N messages
        return currentSession.messages.slice(-limit)
      },
    }),
    {
      name: 'somatic-alignment-chat',
      storage: getStorage(),
    }
  )
)

// Journal Store with Persistence
export const useJournalStore = create<JournalStore>()(
  persist(
    (set, get) => ({
      journalEntries: [],

      addJournalEntry: (entry) => {
        const newEntry: JournalEntry = {
          ...entry,
          id: `journal-${Date.now()}`,
          timestamp: new Date().toISOString(),
        }

        set({
          journalEntries: [...get().journalEntries, newEntry],
        })

        // Auto-sync to Supabase for RAG system
        syncJournalEntry(newEntry).catch((err) => {
          console.error('[Store] Failed to sync journal entry:', err)
        })
      },

      getJournalEntries: (filter) => {
        const { journalEntries } = get()

        if (!filter) return journalEntries

        return journalEntries.filter((entry) => {
          if (filter.routineType && entry.routineType !== filter.routineType) {
            return false
          }

          if (filter.startDate && entry.timestamp < filter.startDate) {
            return false
          }

          if (filter.endDate && entry.timestamp > filter.endDate) {
            return false
          }

          return true
        })
      },

      deleteJournalEntry: (id) => {
        set({
          journalEntries: get().journalEntries.filter((entry) => entry.id !== id),
        })
      },

      getRecentEntries: (limit = 10) => {
        const { journalEntries } = get()
        return journalEntries.slice(-limit).reverse() // Most recent first
      },
    }),
    {
      name: 'somatic-alignment-journal',
      storage: getStorage(),
    }
  )
)

// Achievement Store with Persistence
export const useAchievementStore = create<AchievementStore>()(
  persist(
    (set, get) => ({
      achievements: [],

      initializeAchievements: (definitions) => {
        const { achievements } = get()

        // Only initialize if achievements array is empty or new definitions exist
        const existingIds = new Set(achievements.map((a) => a.id))
        const newAchievements = definitions
          .filter((def) => !existingIds.has(def.id))
          .map((def) => ({
            ...def,
            unlocked: false,
            unlockedDate: undefined,
            progress: 0,
          }))

        if (newAchievements.length > 0) {
          set({
            achievements: [...achievements, ...newAchievements],
          })
        }
      },

      checkAchievements: (userProgress, journalCount) => {
        const { achievements } = get()

        achievements.forEach((achievement) => {
          if (achievement.unlocked) return // Skip already unlocked

          let shouldUnlock = false
          let progress = 0

          // Check achievement requirements based on category
          switch (achievement.category) {
            case 'completion':
              // Milestone achievements based on total completions
              progress = userProgress.totalCompletions
              shouldUnlock = userProgress.totalCompletions >= achievement.requirement
              break

            case 'streak':
              // Streak achievements based on consecutive days
              progress = userProgress.complianceStreak
              shouldUnlock = userProgress.complianceStreak >= achievement.requirement
              break

            case 'journey':
              // Journey achievements based on journal entries
              progress = journalCount
              shouldUnlock = journalCount >= achievement.requirement
              break

            case 'special':
              // Special achievements checked elsewhere (e.g., specific routine types)
              break
          }

          // Update progress
          if (!achievement.unlocked) {
            const updatedAchievements = achievements.map((a) => {
              if (a.id === achievement.id) {
                return { ...a, progress }
              }
              return a
            })
            set({ achievements: updatedAchievements })
          }

          // Unlock if requirement met
          if (shouldUnlock) {
            get().unlockAchievement(achievement.id)
          }
        })
      },

      unlockAchievement: (id) => {
        const { achievements } = get()
        const updatedAchievements = achievements.map((achievement) => {
          if (achievement.id === id && !achievement.unlocked) {
            const unlockedAchievement = {
              ...achievement,
              unlocked: true,
              unlockedDate: new Date().toISOString(),
            }

            // Sync to Supabase
            syncAchievement(unlockedAchievement).catch((err) =>
              console.error('[Store] Failed to sync achievement:', err)
            )

            return unlockedAchievement
          }
          return achievement
        })

        set({ achievements: updatedAchievements })
      },

      unlockSpecialAchievement: (routineType) => {
        const achievementId = routineType === 'morning' ? 'early-bird' : 'night-owl'
        get().unlockAchievement(achievementId)
      },

      getUnlockedCount: () => {
        return get().achievements.filter((a) => a.unlocked).length
      },

      getProgress: (id) => {
        const achievement = get().achievements.find((a) => a.id === id)
        return achievement?.progress || 0
      },

      getAchievementById: (id) => {
        return get().achievements.find((a) => a.id === id)
      },
    }),
    {
      name: 'somatic-alignment-achievements',
      storage: getStorage(),
    }
  )
)

// Sovereign's Log Store with Persistence
export const useSovereignLogStore = create<SovereignLogStore>()(
  persist(
    (set, get) => ({
      sovereignEntries: [],
      drafts: [],
      collapsedEntries: [],
      attunementFeedback: [],

      addSovereignEntry: (entry) => {
        const newEntry: SovereignLogEntry = {
          ...entry,
          id: `sovereign-${Date.now()}`,
          timestamp: new Date().toISOString(),
        }

        set({
          sovereignEntries: [...get().sovereignEntries, newEntry],
        })

        // Auto-sync to Supabase for RAG system
        syncSovereignLog(newEntry).catch((err) => {
          console.error('[Store] Failed to sync sovereign entry:', err)
        })

        return newEntry
      },

      updateEntryAnalysis: (id, analysis) => {
        const { sovereignEntries } = get()
        const updatedEntries = sovereignEntries.map((entry) => {
          if (entry.id === id) {
            return {
              ...entry,
              aiAnalysis: analysis,
              analyzedAt: new Date().toISOString(),
            }
          }
          return entry
        })

        set({ sovereignEntries: updatedEntries })
      },

      getSovereignEntries: (filter) => {
        const { sovereignEntries } = get()

        if (!filter) return sovereignEntries

        return sovereignEntries.filter((entry) => {
          if (filter.entryType && entry.entryType !== filter.entryType) {
            return false
          }

          if (filter.startDate && entry.timestamp < filter.startDate) {
            return false
          }

          if (filter.endDate && entry.timestamp > filter.endDate) {
            return false
          }

          return true
        })
      },

      deleteSovereignEntry: (id) => {
        set({
          sovereignEntries: get().sovereignEntries.filter((entry) => entry.id !== id),
        })
      },

      getRecentSovereignEntries: (limit = 20) => {
        const { sovereignEntries } = get()
        return sovereignEntries.slice(-limit).reverse() // Most recent first
      },

      getEntriesByTimePattern: (hourOfDay) => {
        const { sovereignEntries } = get()

        if (hourOfDay === undefined) return sovereignEntries

        return sovereignEntries.filter((entry) => {
          const entryHour = new Date(entry.timestamp).getHours()
          return entryHour === hourOfDay
        })
      },

      getLeakPatterns: () => {
        const { sovereignEntries } = get()

        // Filter for "leak" entries
        const leakEntries = sovereignEntries.filter((entry) =>
          entry.actionTaken?.includes('Leaked')
        )

        // Group by hour of day
        const hourMap = new Map<number, { count: number; urgeStates: Set<string> }>()

        leakEntries.forEach((entry) => {
          const hour = new Date(entry.timestamp).getHours()
          const urgeState =
            entry.urgeState === 'Custom' && entry.customUrgeState
              ? entry.customUrgeState
              : entry.urgeState || 'Unknown'

          if (!hourMap.has(hour)) {
            hourMap.set(hour, { count: 0, urgeStates: new Set() })
          }

          const hourData = hourMap.get(hour)!
          hourData.count++
          hourData.urgeStates.add(urgeState)
        })

        // Convert to array and sort by count (most leaks first)
        return Array.from(hourMap.entries())
          .map(([hour, data]) => ({
            hour,
            count: data.count,
            urgeStates: Array.from(data.urgeStates),
          }))
          .sort((a, b) => b.count - a.count)
      },

      // Draft functions
      saveDraft: (draft) => {
        const newDraft: SovereignLogDraft = {
          ...draft,
          id: `draft-${Date.now()}`,
          savedAt: new Date().toISOString(),
        }

        set({
          drafts: [...get().drafts, newDraft],
        })

        return newDraft
      },

      loadDraft: (id) => {
        const { drafts } = get()
        return drafts.find((d) => d.id === id) || null
      },

      deleteDraft: (id) => {
        set({
          drafts: get().drafts.filter((d) => d.id !== id),
        })
      },

      getDrafts: () => {
        return get().drafts.sort(
          (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
        )
      },

      // Collapse functions
      toggleCollapsed: (id) => {
        const { collapsedEntries } = get()
        const entries = Array.isArray(collapsedEntries) ? collapsedEntries : []

        if (entries.includes(id)) {
          // Remove from array
          set({ collapsedEntries: entries.filter((entryId) => entryId !== id) })
        } else {
          // Add to array
          set({ collapsedEntries: [...entries, id] })
        }
      },

      isCollapsed: (id) => {
        const { collapsedEntries } = get()
        return Array.isArray(collapsedEntries) ? collapsedEntries.includes(id) : false
      },

      // Attunement Feedback functions
      addAttunementFeedback: (feedback) => {
        const newFeedback: AttunementFeedback = {
          ...feedback,
          id: `feedback-${Date.now()}`,
          timestamp: new Date().toISOString(),
          vectorized: false,
        }

        set({
          attunementFeedback: [...get().attunementFeedback, newFeedback],
        })

        // Auto-sync to Supabase for RAG system
        syncAttunementFeedback(newFeedback).catch((err) => {
          console.error('[Store] Failed to sync attunement feedback:', err)
        })

        return newFeedback
      },

      getAttunementFeedback: (filter) => {
        const { attunementFeedback } = get()

        if (!filter) return attunementFeedback

        return attunementFeedback.filter((feedback) => {
          if (filter.startDate && feedback.date < filter.startDate) {
            return false
          }

          if (filter.endDate && feedback.date > filter.endDate) {
            return false
          }

          if (filter.minRating !== undefined && feedback.userRating < filter.minRating) {
            return false
          }

          if (filter.maxRating !== undefined && feedback.userRating > filter.maxRating) {
            return false
          }

          return true
        })
      },

      getRecentFeedback: (limit = 10) => {
        const { attunementFeedback } = get()
        return attunementFeedback.slice(-limit).reverse() // Most recent first
      },
    }),
    {
      name: 'somatic-alignment-sovereign-log',
      storage: getStorage(),
      merge: (persistedState, currentState) => {
        // Merge persisted state with current state, ensuring new fields have defaults
        const persisted = (persistedState || {}) as Partial<SovereignLogStore>
        return {
          ...currentState,
          ...persisted,
          // Ensure collapsedEntries is always an array
          collapsedEntries: persisted.collapsedEntries || [],
          // Ensure drafts is always an array
          drafts: persisted.drafts || [],
          // Ensure attunementFeedback is always an array
          attunementFeedback: persisted.attunementFeedback || [],
        }
      },
    }
  )
)

// Sovereign's Path Store with Persistence
// Manages Katas, Archetype Analysis, Human Design, MBTI/OEJTS, and HealthKit metrics
interface SovereignPathStore {
  // Katas & Archetype
  katas: Kata[]
  archetypeAnalysis: ArchetypeAnalysis | null
  lastArchetypeUpdate: string | null

  // Human Design Chart
  humanDesignChart: HumanDesignChart | null
  birthData: BirthData | null // Store birth data for astrology API

  // MBTI/OEJTS Assessment
  oejtsAnswers: OEJTSAnswer[]
  oejtsResults: OEJTSResults | null
  mbtiProfile: OEJTSResults | null // Alias for easier access

  // HealthKit Metrics
  healthMetrics: HealthMetrics | null

  // Sync tracking
  lastSyncDate: string | null

  // Kata management
  addKata: (kata: Omit<Kata, 'id' | 'createdAt'>) => void
  updateKata: (id: string, updates: Partial<Omit<Kata, 'id' | 'createdAt'>>) => void
  deleteKata: (id: string) => void
  completeKata: (id: string) => void
  getKataById: (id: string) => Kata | undefined
  getKatasByCategory: (category: Kata['category']) => Kata[]

  // Archetype analysis
  setArchetypeAnalysis: (analysis: ArchetypeAnalysis) => void
  needsArchetypeUpdate: (entryCount: number) => boolean

  // Pattern insights (computed from sovereign log)
  getPatternInsights: (sovereignEntries: SovereignLogEntry[]) => PatternInsight[]

  // Human Design
  setHumanDesignChart: (chart: HumanDesignChart) => void
  setBirthData: (data: BirthData) => void

  // MBTI/OEJTS
  addOEJTSAnswer: (answer: OEJTSAnswer) => void
  recalculateOEJTSResults: () => void

  // HealthKit
  setHealthMetrics: (metrics: HealthMetrics) => void

  // Utility
  updateSyncDate: () => void
  clearAllData: () => void
  resetAssessment: () => void
}

export const useSovereignPathStore = create<SovereignPathStore>()(
  persist(
    (set, get) => ({
      // Initial state - Katas & Archetype
      katas: [],
      archetypeAnalysis: null,
      lastArchetypeUpdate: null,

      // Initial state - Blueprint
      humanDesignChart: null,
      birthData: null,
      oejtsAnswers: [],
      oejtsResults: null,
      mbtiProfile: null,
      healthMetrics: null,
      lastSyncDate: null,

      // Kata management
      addKata: (kata) => {
        const newKata: Kata = {
          ...kata,
          id: `kata-${Date.now()}`,
          createdAt: new Date().toISOString(),
          completionCount: 0,
        }

        set({ katas: [...get().katas, newKata] })

        // Sync to Supabase
        const state = get()
        syncSovereignPathData({
          humanDesignChart: state.humanDesignChart,
          birthData: state.birthData,
          oejtsAnswers: state.oejtsAnswers,
          oejtsResults: state.oejtsResults,
          katas: state.katas,
          archetypeAnalysis: state.archetypeAnalysis,
          lastArchetypeUpdate: state.lastArchetypeUpdate,
          healthMetrics: state.healthMetrics,
        }).catch((err) => console.error('[Store] Failed to sync sovereign path data:', err))
      },

      updateKata: (id, updates) => {
        set({
          katas: get().katas.map((kata) => (kata.id === id ? { ...kata, ...updates } : kata)),
        })

        // Sync to Supabase
        const state = get()
        syncSovereignPathData({
          humanDesignChart: state.humanDesignChart,
          birthData: state.birthData,
          oejtsAnswers: state.oejtsAnswers,
          oejtsResults: state.oejtsResults,
          katas: state.katas,
          archetypeAnalysis: state.archetypeAnalysis,
          lastArchetypeUpdate: state.lastArchetypeUpdate,
          healthMetrics: state.healthMetrics,
        }).catch((err) => console.error('[Store] Failed to sync sovereign path data:', err))
      },

      deleteKata: (id) => {
        set({ katas: get().katas.filter((kata) => kata.id !== id) })

        // Sync to Supabase
        const state = get()
        syncSovereignPathData({
          humanDesignChart: state.humanDesignChart,
          birthData: state.birthData,
          oejtsAnswers: state.oejtsAnswers,
          oejtsResults: state.oejtsResults,
          katas: state.katas,
          archetypeAnalysis: state.archetypeAnalysis,
          lastArchetypeUpdate: state.lastArchetypeUpdate,
          healthMetrics: state.healthMetrics,
        }).catch((err) => console.error('[Store] Failed to sync sovereign path data:', err))
      },

      completeKata: (id) => {
        set({
          katas: get().katas.map((kata) =>
            kata.id === id
              ? {
                  ...kata,
                  completionCount: (kata.completionCount || 0) + 1,
                  lastCompletedAt: new Date().toISOString(),
                }
              : kata
          ),
        })
      },

      getKataById: (id) => {
        return get().katas.find((kata) => kata.id === id)
      },

      getKatasByCategory: (category) => {
        return get().katas.filter((kata) => kata.category === category)
      },

      setArchetypeAnalysis: (analysis) => {
        set({
          archetypeAnalysis: analysis,
          lastArchetypeUpdate: new Date().toISOString(),
        })
      },

      needsArchetypeUpdate: (entryCount) => {
        const { archetypeAnalysis, lastArchetypeUpdate } = get()

        // Need update if never analyzed
        if (!archetypeAnalysis) return entryCount >= 5

        // Need update if significant new entries (10+ since last analysis)
        if (entryCount - archetypeAnalysis.basedOnEntryCount >= 10) return true

        // Need update if 30+ days since last update
        if (lastArchetypeUpdate) {
          const daysSinceUpdate = Math.floor(
            (Date.now() - new Date(lastArchetypeUpdate).getTime()) / (1000 * 60 * 60 * 24)
          )
          return daysSinceUpdate >= 30
        }

        return false
      },

      getPatternInsights: (sovereignEntries) => {
        const insights: PatternInsight[] = []

        if (sovereignEntries.length < 3) return insights

        // Leak Pattern Analysis
        const leakEntries = sovereignEntries.filter((e) => e.actionTaken === 'Leaked (Released)')

        if (leakEntries.length >= 3) {
          const hourCounts = new Map<number, number>()
          leakEntries.forEach((entry) => {
            const hour = new Date(entry.timestamp).getHours()
            hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1)
          })

          const topLeakHours = Array.from(hourCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)

          if (topLeakHours[0] && topLeakHours[0][1] >= 2) {
            const hour = topLeakHours[0][0]
            const ampm = hour >= 12 ? 'PM' : 'AM'
            const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour

            insights.push({
              type: 'leak',
              title: 'Primary Leak Window Identified',
              description: `You have leaked energy ${topLeakHours[0][1]} times around ${displayHour} ${ampm}. This is your battlefield.`,
              timePattern: `${displayHour}:00 ${ampm}`,
              frequency: topLeakHours[0][1],
              recommendation: `Set an alarm for ${displayHour - 1}:55 ${ampm}. When it fires, stand, perform Alchemical Breath (3 cycles), and 10 RKC Planks. Win this battle.`,
            })
          }
        }

        // Potency Pattern Analysis
        const transmutedEntries = sovereignEntries.filter(
          (e) => e.actionTaken === 'Transmuted (Alchemized)'
        )

        if (transmutedEntries.length >= 3) {
          insights.push({
            type: 'potency',
            title: 'Transmutation Mastery Building',
            description: `You have successfully transmuted energy ${transmutedEntries.length} times. Your container is strengthening.`,
            frequency: transmutedEntries.length,
            recommendation:
              'Continue the path. Each transmutation rewires your nervous system toward sovereignty.',
          })
        }

        // Consistency Pattern Analysis
        const last7Days = sovereignEntries.filter((e) => {
          const daysDiff = Math.floor(
            (Date.now() - new Date(e.timestamp).getTime()) / (1000 * 60 * 60 * 24)
          )
          return daysDiff <= 7
        })

        if (last7Days.length >= 5) {
          insights.push({
            type: 'consistency',
            title: 'Daily Practice Established',
            description: `${last7Days.length} entries in the last 7 days. You are building the Kata of awareness.`,
            frequency: last7Days.length,
            recommendation:
              'Maintain this rhythm. Consistency is the alchemical fire that transforms lead to gold.',
          })
        }

        // Breakthrough Pattern Analysis
        const recentHighEnergy = sovereignEntries
          .filter((e) => e.energyLevel && e.energyLevel >= 8)
          .slice(-3)

        if (recentHighEnergy.length === 3) {
          insights.push({
            type: 'breakthrough',
            title: 'Energy Surge Detected',
            description:
              'Your last 3 entries show energy levels of 8+. Your container is holding more potency.',
            recommendation:
              'This is the sign. Your physical and energetic work is manifesting. Do not let the fog convince you otherwise.',
          })
        }

        return insights
      },

      // Human Design methods
      setHumanDesignChart: (chart) => {
        set({ humanDesignChart: chart })
        get().updateSyncDate()

        // Sync to Supabase
        const state = get()
        syncSovereignPathData({
          humanDesignChart: state.humanDesignChart,
          birthData: state.birthData,
          oejtsAnswers: state.oejtsAnswers,
          oejtsResults: state.oejtsResults,
          katas: state.katas,
          archetypeAnalysis: state.archetypeAnalysis,
          lastArchetypeUpdate: state.lastArchetypeUpdate,
          healthMetrics: state.healthMetrics,
        }).catch((err) => console.error('[Store] Failed to sync sovereign path data:', err))
      },

      setBirthData: (data) => {
        set({ birthData: data })
      },

      // MBTI/OEJTS methods
      addOEJTSAnswer: (answer) => {
        const { oejtsAnswers } = get()

        // Replace existing answer for this question if it exists
        const filteredAnswers = oejtsAnswers.filter((a) => a.questionId !== answer.questionId)

        set({ oejtsAnswers: [...filteredAnswers, answer] })
        get().recalculateOEJTSResults()
        get().updateSyncDate()

        // Sync to Supabase
        const state = get()
        syncSovereignPathData({
          humanDesignChart: state.humanDesignChart,
          birthData: state.birthData,
          oejtsAnswers: state.oejtsAnswers,
          oejtsResults: state.oejtsResults,
          katas: state.katas,
          archetypeAnalysis: state.archetypeAnalysis,
          lastArchetypeUpdate: state.lastArchetypeUpdate,
          healthMetrics: state.healthMetrics,
        }).catch((err) => console.error('[Store] Failed to sync sovereign path data:', err))
      },

      recalculateOEJTSResults: () => {
        const { oejtsAnswers } = get()

        // Import calculateOEJTSResults dynamically to avoid circular dependency
        import('./oejts').then(({ calculateOEJTSResults }) => {
          const results = calculateOEJTSResults(oejtsAnswers)
          set({ oejtsResults: results, mbtiProfile: results })
        })
      },

      // HealthKit methods
      setHealthMetrics: (metrics) => {
        set({ healthMetrics: metrics })
        get().updateSyncDate()
      },

      // Utility methods
      updateSyncDate: () => {
        set({ lastSyncDate: new Date().toISOString() })
      },

      clearAllData: () => {
        set({
          katas: [],
          archetypeAnalysis: null,
          lastArchetypeUpdate: null,
          humanDesignChart: null,
          oejtsAnswers: [],
          oejtsResults: null,
          mbtiProfile: null,
          healthMetrics: null,
          lastSyncDate: null,
        })
      },

      resetAssessment: function resetAssessment() {
        set({
          oejtsAnswers: [],
          oejtsResults: null,
          mbtiProfile: null,
        })
      },
    }),
    {
      name: 'somatic-alignment-sovereign-path',
      storage: getStorage(),
    }
  )
)
