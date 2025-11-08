/**
 * Shared TypeScript types for the Somatic Alignment Guide
 * Used across both Expo (native) and Next.js (web) apps
 */

export interface Exercise {
  name: string
  instructions: string[]
  reps?: string
  duration?: string
  sets?: string
}

export interface RoutineStep extends Exercise {
  id: number
}

export interface AccordionSection {
  id: string
  title: string
  content: string[]
}

export interface KnowledgeVaultTab {
  id: string
  title: string
  sections: AccordionSection[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface RoutineContext {
  routineName: string
  completedAt: string
  difficulty?: 'easy' | 'moderate' | 'challenging'
}

export interface ChatHistoryEntry {
  id: string
  timestamp: string
  userMessage: string
  aiResponse: string
  routineContext?: RoutineContext
}

export interface ChatSession {
  id: string
  startDate: string
  lastActive: string
  messages: ChatHistoryEntry[]
  messageCount: number
}

export interface UserProgress {
  complianceStreak: number
  lastCompletedDate: string | null
  totalCompletions: number
}

export type MoodType = 'great' | 'good' | 'neutral' | 'tired' | 'stressed' | 'pain' | 'focused'

export type PhysicalSensation =
  | 'relaxed'
  | 'energized'
  | 'tension'
  | 'soreness'
  | 'flexibility'
  | 'stiffness'
  | 'pain'
  | 'lightness'
  | 'heaviness'

export interface JournalEntry {
  id: string
  timestamp: string
  routineType: 'morning' | 'evening'
  routineName: string
  mood: MoodType
  physicalSensations: PhysicalSensation[]
  emotionalState?: string
  notes?: string
  difficulty?: 'easy' | 'moderate' | 'challenging'
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'streak' | 'completion' | 'journey' | 'special'
  requirement: number // e.g., 7 for "7-Day Streak"
  unlocked: boolean
  unlockedDate?: string
  progress?: number // current progress toward requirement
}

/**
 * Cosmic Data Types - IP Geolocation Astronomy API
 */
export interface CosmicData {
  location: {
    latitude: string
    longitude: string
    city: string
    country: string
  }
  astronomy: {
    date: string
    current_time: string
    sunrise: string
    sunset: string
    solar_noon: string
    day_length: string
    sun_altitude: number
    sun_azimuth: number
    sun_distance: number
    moon_phase: string
    moonrise: string
    moonset: string
    moon_altitude: number
    moon_azimuth: number
    moon_illumination_percentage: string
    morning: {
      astronomical_twilight_begin: string
      civil_twilight_begin: string
      golden_hour_begin: string
      golden_hour_end: string
    }
    evening: {
      golden_hour_begin: string
      golden_hour_end: string
      civil_twilight_end: string
      astronomical_twilight_end: string
    }
  }
  cached_at?: string
}

/**
 * Advanced Astrology Data Types - RapidAPI Astrology API
 */
export interface AstrologicalInsight {
  // Personal Trading Insights (Financial Astrology)
  personalTrading?: {
    overall_rating: number // 0-10 scale
    favorable_periods: Array<{
      start_date: string
      end_date: string
      description: string
      planetary_influence: string
    }>
    caution_periods: Array<{
      start_date: string
      end_date: string
      description: string
      planetary_influence: string
    }>
    recommended_approach: string
    lunar_cycle_influence: {
      phase: string
      trading_advice: string
    }
  }
  // Natal Chart Data
  natalChart?: {
    sun_sign: string
    moon_sign: string
    ascendant: string
    planets: Array<{
      name: string
      sign: string
      house: number
      degree: number
    }>
  }
  // Current Transits
  transits?: {
    major_aspects: Array<{
      planet1: string
      planet2: string
      aspect: string
      orb: number
      interpretation: string
    }>
    transit_interpretations: string[]
  }
  cached_at?: string
}

/**
 * Daily Attunement Types
 */
export interface DailyAttunement {
  id: string
  date: string // YYYY-MM-DD
  insightfulQuestion: string
  synthesizedAnswer: string
  generatedAt: string // ISO timestamp
  basedOn: {
    logCount: number
    healthMetricsAvailable: boolean
    humanDesignAvailable: boolean
    cosmicDataAvailable: boolean
    astrologyDataAvailable: boolean
  }
}

export interface AttunementFeedback {
  id: string
  attunementId: string
  date: string
  originalQuestion: string
  originalAnswer: string
  userRating: 1 | 2 | 3 | 4 | 5
  userCustomAnswer?: string
  timestamp: string
  vectorized: boolean // Track if feedback has been added to RAG
}

/**
 * Vector Embedding Types
 */
export interface VectorEmbedding {
  id: string
  content: string
  embedding: number[]
  metadata: {
    type: 'sovereign_log' | 'attunement_feedback' | 'journal_entry'
    timestamp: string
    entryId?: string
    [key: string]: any
  }
  created_at: string
}

export interface SemanticSearchResult {
  id: string
  content: string
  metadata: Record<string, any>
  similarity: number
}

// Sovereign's Log Types
export type SovereignLogEntryType =
  | 'Urge/Symptom'
  | 'Interaction'
  | 'Dream'
  | 'Thought'
  | 'Win/Kata'
  | 'Custom'

export type UrgeStateType = 'Arousal' | 'Fog' | 'Boredom' | 'Anger' | 'Clarity' | 'Power' | 'Custom'

export type ActionTakenType =
  | 'Leaked (Released)'
  | 'Transmuted (Alchemized)'
  | 'Observed (Mushin)'
  | 'Acted (Kata)'
  | 'Custom'

export interface CustomField {
  id: string
  label: string
  value: string
}

export interface SovereignLogEntry {
  id: string
  timestamp: string
  entryType: SovereignLogEntryType

  // Common fields
  urgeState?: UrgeStateType
  customUrgeState?: string
  actionTaken?: ActionTakenType
  customActionTaken?: string
  energyLevel?: number // 1-10
  notes?: string

  // Interaction-specific fields
  personsInvolved?: string
  myAction?: string
  theirReaction?: string

  // Dream-specific fields
  dreamDescription?: string
  dreamSymbols?: string[]

  // Win/Kata (Routine Completion) fields
  routineType?: 'morning' | 'evening'
  routineName?: string
  mood?: MoodType
  physicalSensations?: PhysicalSensation[]
  emotionalState?: string
  difficulty?: 'easy' | 'moderate' | 'challenging'

  // Custom fields (user-defined)
  customFields?: CustomField[]

  // AI Analysis
  aiAnalysis?: string
  analyzedAt?: string
}

export interface SovereignLogDraft {
  id: string
  savedAt: string
  entryType: SovereignLogEntryType

  // All the same fields as SovereignLogEntry but optional
  urgeState?: UrgeStateType
  customUrgeState?: string
  actionTaken?: ActionTakenType
  customActionTaken?: string
  energyLevel?: number
  notes?: string
  personsInvolved?: string
  myAction?: string
  theirReaction?: string
  dreamDescription?: string
  customFields?: CustomField[]
}

// Sovereign's Path Types
export interface Kata {
  id: string
  name: string
  description: string
  frequency: 'daily' | 'weekly' | 'as-needed'
  category: 'physical' | 'energetic' | 'mental' | 'custom'
  createdAt: string
  completionCount?: number
  lastCompletedAt?: string
}

export interface ArchetypeAnalysis {
  archetype: string
  description: string
  strengths: string[]
  challenges: string[]
  guidance: string
  analyzedAt: string
  basedOnEntryCount: number
}

export interface PatternInsight {
  type: 'leak' | 'potency' | 'consistency' | 'breakthrough'
  title: string
  description: string
  timePattern?: string // e.g., "3 PM daily", "Weekend mornings"
  frequency?: number
  recommendation?: string
}

/**
 * Open Extended Jungian Type Scales (OEJTS) Types
 */
export interface OEJTSAnswer {
  questionId: number
  value: number // 1-5 scale
  answeredAt: string // ISO timestamp
}

export interface OEJTSResults {
  type: string // e.g., "INTJ"
  scores: {
    E: number // 0-100 (higher = more extroverted)
    I: number // Complement of E
    S: number // 0-100 (higher = more sensing)
    N: number // Complement of S
    T: number // 0-100 (higher = more thinking)
    F: number // Complement of T
    J: number // 0-100 (higher = more judging)
    P: number // Complement of P
  }
  dominantFunctions: string[]
  completionPercentage: number
  lastUpdated: string
}
