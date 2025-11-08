/**
 * Extended Supabase Sync Functions
 * Handles all non-sovereign_logs data synchronization
 *
 * This complements supabase-sync.ts with:
 * - User progress & achievements
 * - Sovereign path data (HD, OEJTS, katas)
 * - Cosmic & astrology data caching
 * - Daily attunements
 * - Vector embeddings (RAG)
 * - Health metrics history
 */

import { supabase } from './supabase-client'
import type {
  UserProgress,
  Achievement,
  Kata,
  ArchetypeAnalysis,
  OEJTSAnswer,
  OEJTSResults,
  CosmicData,
  AstrologicalInsight,
  DailyAttunement,
  VectorEmbedding,
} from '../types'
import type { HumanDesignChart, BirthData } from './hdkit/types'
import type { HealthMetrics } from '../hooks/useHealthData'

// ============================================================================
// USER PROGRESS SYNC
// ============================================================================

export async function syncUserProgress(progress: UserProgress) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase.from('user_progress').upsert(
    {
      user_id: user.id,
      compliance_streak: progress.complianceStreak,
      last_completed_date: progress.lastCompletedDate,
      total_completions: progress.totalCompletions,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id',
    }
  )

  if (error) {
    console.error('[Sync] User progress failed:', error)
    return { success: false, error: error.message }
  }

  console.log('[Sync] User progress synced:', progress)
  return { success: true }
}

export async function fetchUserProgress(): Promise<UserProgress | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('[Sync] Fetch progress failed:', error)
    return null
  }

  return {
    complianceStreak: data.compliance_streak,
    lastCompletedDate: data.last_completed_date,
    totalCompletions: data.total_completions,
  } as UserProgress
}

// ============================================================================
// ACHIEVEMENTS SYNC
// ============================================================================

export async function syncAchievement(achievement: Achievement) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase.from('achievements').upsert(
    {
      user_id: user.id,
      achievement_id: achievement.id,
      unlocked: achievement.unlocked,
      unlocked_date: achievement.unlockedDate,
      progress: achievement.progress,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id,achievement_id',
    }
  )

  if (error) {
    console.error('[Sync] Achievement failed:', error)
    return { success: false, error: error.message }
  }

  console.log('[Sync] Achievement synced:', achievement.id)
  return { success: true }
}

export async function bulkSyncAchievements(achievements: Achievement[]) {
  const results = await Promise.allSettled(achievements.map((a) => syncAchievement(a)))

  const succeeded = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  console.log(`[Sync] Bulk achievements: ${succeeded}/${achievements.length} succeeded`)
  return { succeeded, failed, total: achievements.length }
}

export async function fetchAchievements() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase.from('achievements').select('*').eq('user_id', user.id)

  if (error) {
    console.error('[Sync] Fetch achievements failed:', error)
    return []
  }

  return data.map((row) => ({
    id: row.achievement_id,
    unlocked: row.unlocked,
    unlockedDate: row.unlocked_date,
    progress: row.progress,
    // Note: title, description, etc. come from local achievement definitions
  }))
}

// ============================================================================
// SOVEREIGN PATH DATA SYNC
// ============================================================================

export async function syncSovereignPathData(pathData: {
  humanDesignChart?: HumanDesignChart | null
  birthData?: BirthData | null
  oejtsAnswers?: OEJTSAnswer[]
  oejtsResults?: OEJTSResults | null
  archetypeAnalysis?: ArchetypeAnalysis | null
  lastArchetypeUpdate?: string | null
  katas?: Kata[]
  healthMetrics?: HealthMetrics | null
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase.from('sovereign_path_data').upsert(
    {
      user_id: user.id,
      human_design_chart: pathData.humanDesignChart,
      birth_data: pathData.birthData,
      oejts_answers: pathData.oejtsAnswers,
      oejts_results: pathData.oejtsResults,
      archetype_analysis: pathData.archetypeAnalysis,
      last_archetype_update: pathData.lastArchetypeUpdate,
      katas: pathData.katas,
      health_metrics: pathData.healthMetrics,
      last_sync_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id',
    }
  )

  if (error) {
    console.error('[Sync] Sovereign path data failed:', error)
    return { success: false, error: error.message }
  }

  console.log('[Sync] Sovereign path data synced')
  return { success: true }
}

export async function fetchSovereignPathData() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('sovereign_path_data')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('[Sync] Fetch path data failed:', error)
    return null
  }

  return {
    humanDesignChart: data.human_design_chart,
    birthData: data.birth_data,
    oejtsAnswers: data.oejts_answers || [],
    oejtsResults: data.oejts_results,
    archetypeAnalysis: data.archetype_analysis,
    lastArchetypeUpdate: data.last_archetype_update,
    katas: data.katas || [],
    healthMetrics: data.health_metrics,
    lastSyncDate: data.last_sync_date,
  }
}

// ============================================================================
// COSMIC DATA SYNC
// ============================================================================

export async function syncCosmicData(cosmic: CosmicData, date: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase.from('cosmic_data_cache').upsert(
    {
      user_id: user.id,
      date,
      location: cosmic.location,
      astronomy: cosmic.astronomy,
      cached_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id,date',
    }
  )

  if (error) {
    console.error('[Sync] Cosmic data failed:', error)
    return { success: false, error: error.message }
  }

  console.log('[Sync] Cosmic data cached for date:', date)
  return { success: true }
}

export async function fetchCosmicData(date: string): Promise<CosmicData | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('cosmic_data_cache')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', date)
    .single()

  if (error) {
    console.error('[Sync] Fetch cosmic data failed:', error)
    return null
  }

  // Check if cache is < 6 hours old
  const cacheAge = Date.now() - new Date(data.cached_at).getTime()
  if (cacheAge > 6 * 60 * 60 * 1000) {
    console.log('[Sync] Cosmic cache stale (>6h), will refetch')
    return null // Stale cache
  }

  return {
    location: data.location,
    astronomy: data.astronomy,
    cached_at: data.cached_at,
  } as CosmicData
}

// ============================================================================
// ASTROLOGY DATA SYNC
// ============================================================================

export async function syncAstrologyData(astro: AstrologicalInsight, birthData: BirthData) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase.from('astrology_data_cache').upsert(
    {
      user_id: user.id,
      birth_data: birthData,
      natal_chart: astro.natalChart,
      transits: astro.transits,
      personal_trading: astro.personalTrading,
      cached_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id',
    }
  )

  if (error) {
    console.error('[Sync] Astrology data failed:', error)
    return { success: false, error: error.message }
  }

  console.log('[Sync] Astrology data cached')
  return { success: true }
}

export async function fetchAstrologyData(): Promise<AstrologicalInsight | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('astrology_data_cache')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('[Sync] Fetch astrology data failed:', error)
    return null
  }

  return {
    natalChart: data.natal_chart,
    transits: data.transits,
    personalTrading: data.personal_trading,
    cached_at: data.cached_at,
  } as AstrologicalInsight
}

// ============================================================================
// DAILY ATTUNEMENT SYNC
// ============================================================================

export async function syncDailyAttunement(attunement: DailyAttunement) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase.from('daily_attunements').insert({
    user_id: user.id,
    date: attunement.date,
    insightful_question: attunement.insightfulQuestion,
    synthesized_answer: attunement.synthesizedAnswer,
    based_on: attunement.basedOn,
    generated_at: attunement.generatedAt,
  })

  if (error) {
    // Ignore duplicate errors (already exists for this date)
    if (error.code === '23505') {
      console.log('[Sync] Attunement already exists for date:', attunement.date)
      return { success: true }
    }
    console.error('[Sync] Daily attunement failed:', error)
    return { success: false, error: error.message }
  }

  console.log('[Sync] Daily attunement stored for:', attunement.date)
  return { success: true }
}

export async function fetchDailyAttunement(date: string): Promise<DailyAttunement | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('daily_attunements')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', date)
    .single()

  if (error) {
    console.error('[Sync] Fetch attunement failed:', error)
    return null
  }

  return {
    id: data.id,
    date: data.date,
    insightfulQuestion: data.insightful_question,
    synthesizedAnswer: data.synthesized_answer,
    basedOn: data.based_on,
    generatedAt: data.generated_at,
  } as DailyAttunement
}

export async function fetchRecentAttunements(limit: number = 7): Promise<DailyAttunement[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('daily_attunements')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[Sync] Fetch recent attunements failed:', error)
    return []
  }

  return data.map((row) => ({
    id: row.id,
    date: row.date,
    insightfulQuestion: row.insightful_question,
    synthesizedAnswer: row.synthesized_answer,
    basedOn: row.based_on,
    generatedAt: row.generated_at,
  }))
}

// ============================================================================
// VECTOR EMBEDDINGS SYNC (RAG)
// ============================================================================

export async function syncVectorEmbedding(embedding: VectorEmbedding) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase.from('vector_embeddings').insert({
    user_id: user.id,
    content: embedding.content,
    embedding: embedding.embedding,
    metadata: embedding.metadata,
  })

  if (error) {
    console.error('[Sync] Vector embedding failed:', error)
    return { success: false, error: error.message }
  }

  console.log('[Sync] Vector embedding stored:', embedding.metadata.type)
  return { success: true }
}

export async function semanticSearch(
  queryEmbedding: number[],
  threshold: number = 0.7,
  limit: number = 5
) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  // Note: match_embeddings uses RLS to filter by user automatically
  const { data, error } = await supabase.rpc('match_embeddings', {
    query_embedding: queryEmbedding,
    match_threshold: threshold,
    match_count: limit,
  })

  if (error) {
    console.error('[Sync] Semantic search failed:', error)
    return []
  }

  console.log(`[Sync] Semantic search found ${data?.length || 0} results`)
  return data || []
}

// ============================================================================
// HEALTH METRICS SYNC
// ============================================================================

export async function syncHealthMetrics(metrics: HealthMetrics, date: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase.from('health_metrics_history').upsert(
    {
      user_id: user.id,
      date,
      steps: metrics.steps,
      sleep_hours: metrics.sleepHours,
      walking_asymmetry: metrics.walkingAsymmetry,
      synced_at: new Date().toISOString(),
    },
    {
      onConflict: 'user_id,date',
    }
  )

  if (error) {
    console.error('[Sync] Health metrics failed:', error)
    return { success: false, error: error.message }
  }

  console.log('[Sync] Health metrics synced for date:', date)
  return { success: true }
}

export async function fetchHealthMetricsHistory(days: number = 30) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from('health_metrics_history')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: false })

  if (error) {
    console.error('[Sync] Fetch health history failed:', error)
    return []
  }

  return data.map((row) => ({
    date: row.date,
    steps: row.steps,
    sleepHours: row.sleep_hours,
    walkingAsymmetry: row.walking_asymmetry,
    lastSync: row.synced_at,
  }))
}
