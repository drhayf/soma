# Supabase Sync Architecture - Complete System Design

## Executive Summary

This document defines the **complete data synchronization architecture** for the Somatic Alignment app, ensuring all local stores, API integrations, and computed data sync to Supabase for:

1. **Cross-device persistence** (use app on multiple devices)
2. **RAG system intelligence** (AI learns from your complete history)
3. **Advanced analytics** (pattern detection, archetype evolution)
4. **Data sovereignty** (your data, your ownership)

---

## Data Source Inventory

### Local Zustand Stores (7 Stores)

| Store                   | Purpose                              | Persistence | Current Sync Status            |
| ----------------------- | ------------------------------------ | ----------- | ------------------------------ |
| `useProgressStore`      | Routine completions, streaks         | ✅ Local    | ❌ Not synced                  |
| `useChatStore`          | AI conversations                     | ✅ Local    | ✅ **SYNCED** (sovereign_logs) |
| `useJournalStore`       | Journal entries                      | ✅ Local    | ✅ **SYNCED** (sovereign_logs) |
| `useAchievementStore`   | Unlocked achievements                | ✅ Local    | ❌ Not synced                  |
| `useSovereignLogStore`  | Urge tracking, transmutations        | ✅ Local    | ✅ **SYNCED** (sovereign_logs) |
| `useAuthStore`          | Session, PIN, email                  | ✅ Local    | ⚠️ Partial (session only)      |
| `useSovereignPathStore` | Katas, archetypes, HD, OEJTS, health | ✅ Local    | ❌ Not synced                  |
| `useThemeStore`         | UI theme preference                  | ✅ Local    | ❌ Not needed                  |

### External API Integrations (4 APIs)

| API                      | Purpose                                | Caching         | Current Sync Status |
| ------------------------ | -------------------------------------- | --------------- | ------------------- |
| IP Geolocation Astronomy | Solar/lunar cycles, golden hours       | Browser only    | ❌ Not synced       |
| RapidAPI Astrology       | Natal chart, transits, financial astro | Component state | ❌ Not synced       |
| Hugging Face Embeddings  | Vector embeddings for RAG              | None            | ❌ Not synced       |
| Google Gemini 2.0 Flash  | AI responses (already in chat)         | None            | ✅ Via chat sync    |

### Computed/Derived Data (5 Categories)

| Data Type          | Source                      | Update Frequency      | Current Sync Status |
| ------------------ | --------------------------- | --------------------- | ------------------- |
| OEJTS Assessment   | User answers (60 questions) | Progressive (stealth) | ❌ Not synced       |
| Human Design Chart | Birth data calculation      | One-time              | ❌ Not synced       |
| Archetype Analysis | Sovereign log patterns      | Every 10 entries      | ❌ Not synced       |
| Pattern Insights   | Leak/transmutation analysis | Real-time             | ❌ Not synced       |
| Daily Attunements  | AI-generated questions      | Daily                 | ❌ Not synced       |

### HealthKit Data (iOS Only)

| Metric            | Frequency | Current Sync Status |
| ----------------- | --------- | ------------------- |
| Steps             | Daily     | ❌ Not synced       |
| Sleep Hours       | Daily     | ❌ Not synced       |
| Walking Asymmetry | Daily     | ❌ Not synced       |

---

## Database Schema Design

### Core Tables

#### 1. `sovereign_logs` (EXISTING - Universal Log)

```sql
CREATE TABLE sovereign_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'chat', 'journal', 'sovereign', 'feedback'
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes
  INDEX idx_sovereign_logs_user_id (user_id),
  INDEX idx_sovereign_logs_category (category),
  INDEX idx_sovereign_logs_created_at (created_at DESC)
);

-- RLS Policies
ALTER TABLE sovereign_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own logs"
  ON sovereign_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own logs"
  ON sovereign_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own logs"
  ON sovereign_logs FOR UPDATE
  USING (auth.uid() = user_id);
```

**Current Usage:**

- ✅ Chat messages (`category='chat'`)
- ✅ Journal entries (`category='journal'`)
- ✅ Sovereign logs (`category='sovereign'`)
- ✅ Attunement feedback (`category='feedback'`)

**Metadata Structure by Category:**

```typescript
// Chat
metadata: {
  sessionId: string
  messageId: string
  routineContext?: any
}

// Journal
metadata: {
  journalId: string
  routineType: 'morning' | 'evening'
  mood?: string
  physicalSensations?: string[]
  energyLevel?: number
  insights?: string
}

// Sovereign
metadata: {
  entryId: string
  entryType: 'Urge/Symptom' | 'Kata Performed' | 'Win' | 'Leak/Drain' | 'Insight'
  urgeState?: string
  actionTaken?: string
  kataPerformed?: string[]
  energyLevel?: number
  analysisId?: string
}

// Feedback
metadata: {
  feedbackId: string
  attunementId: string
  userRating: 1 | 2 | 3 | 4 | 5
  hasCustomAnswer: boolean
  vectorized: boolean
}
```

#### 2. `user_progress` (NEW - Routine Tracking)

```sql
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  compliance_streak INTEGER DEFAULT 0,
  last_completed_date DATE,
  total_completions INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_user_progress_user_id (user_id)
);

-- RLS
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert their own progress"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);
```

**Sync Strategy:** Upsert on every routine completion

#### 3. `achievements` (NEW - Gamification)

```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL, -- 'first-day', 'week-warrior', etc.
  unlocked BOOLEAN DEFAULT FALSE,
  unlocked_date TIMESTAMPTZ,
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, achievement_id),
  INDEX idx_achievements_user_id (user_id),
  INDEX idx_achievements_unlocked (user_id, unlocked)
);

-- RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievements"
  ON achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert their own achievements"
  ON achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements"
  ON achievements FOR UPDATE
  USING (auth.uid() = user_id);
```

**Sync Strategy:** Upsert on unlock, update progress on check

#### 4. `sovereign_path_data` (NEW - Blueprint & Assessments)

```sql
CREATE TABLE sovereign_path_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Human Design
  human_design_chart JSONB,
  birth_data JSONB,

  -- OEJTS/MBTI
  oejts_answers JSONB, -- Array of {questionId, value, answeredAt}
  oejts_results JSONB, -- {type, scores, dominantFunctions, completionPercentage}

  -- Archetype Analysis
  archetype_analysis JSONB,
  last_archetype_update TIMESTAMPTZ,

  -- Katas
  katas JSONB, -- Array of Kata objects

  -- Health Metrics
  health_metrics JSONB,

  last_sync_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_sovereign_path_user_id (user_id)
);

-- RLS
ALTER TABLE sovereign_path_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own path data"
  ON sovereign_path_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert their own path data"
  ON sovereign_path_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own path data"
  ON sovereign_path_data FOR UPDATE
  USING (auth.uid() = user_id);
```

**Sync Strategy:** Upsert on significant changes (answer submitted, chart calculated, kata completed)

#### 5. `cosmic_data_cache` (NEW - Astronomy API Cache)

```sql
CREATE TABLE cosmic_data_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  location JSONB, -- {latitude, longitude, city, country}
  astronomy JSONB, -- Full astronomy object
  cached_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, date),
  INDEX idx_cosmic_cache_user_date (user_id, date DESC)
);

-- RLS
ALTER TABLE cosmic_data_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cosmic cache"
  ON cosmic_data_cache FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert their own cosmic cache"
  ON cosmic_data_cache FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Sync Strategy:** Cache daily fetches, reuse if < 6 hours old

#### 6. `astrology_data_cache` (NEW - RapidAPI Astrology Cache)

```sql
CREATE TABLE astrology_data_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  birth_data JSONB, -- {date, time, latitude, longitude}
  natal_chart JSONB,
  transits JSONB,
  personal_trading JSONB, -- Financial astrology insights
  cached_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_astrology_cache_user_id (user_id)
);

-- RLS
ALTER TABLE astrology_data_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own astrology cache"
  ON astrology_data_cache FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert their own astrology cache"
  ON astrology_data_cache FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own astrology cache"
  ON astrology_data_cache FOR UPDATE
  USING (auth.uid() = user_id);
```

**Sync Strategy:** Cache transits (update daily), cache natal chart (permanent)

#### 7. `daily_attunements` (NEW - AI-Generated Questions)

```sql
CREATE TABLE daily_attunements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  insightful_question TEXT NOT NULL,
  synthesized_answer TEXT NOT NULL,
  based_on JSONB, -- {logCount, healthMetricsAvailable, etc.}
  generated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, date),
  INDEX idx_attunements_user_date (user_id, date DESC)
);

-- RLS
ALTER TABLE daily_attunements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own attunements"
  ON daily_attunements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attunements"
  ON daily_attunements FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Sync Strategy:** Store each generated attunement for historical tracking

#### 8. `vector_embeddings` (NEW - RAG System)

```sql
CREATE TABLE vector_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(384), -- BAAI/bge-small-en-v1.5 dimensions
  metadata JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_embeddings_user_id (user_id),
  INDEX idx_embeddings_metadata (metadata jsonb_path_ops)
);

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- RLS
ALTER TABLE vector_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own embeddings"
  ON vector_embeddings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own embeddings"
  ON vector_embeddings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function for similarity search
CREATE OR REPLACE FUNCTION match_embeddings(
  query_embedding vector(384),
  match_user_id UUID,
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    vector_embeddings.id,
    vector_embeddings.content,
    vector_embeddings.metadata,
    1 - (vector_embeddings.embedding <=> query_embedding) AS similarity
  FROM vector_embeddings
  WHERE vector_embeddings.user_id = match_user_id
    AND 1 - (vector_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY vector_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

**Sync Strategy:** Generate embeddings for high-value feedback (rating >= 4), journal insights, key sovereign logs

#### 9. `health_metrics_history` (NEW - HealthKit Timeline)

```sql
CREATE TABLE health_metrics_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  steps INTEGER,
  sleep_hours DECIMAL(4,2),
  walking_asymmetry DECIMAL(5,2),
  synced_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, date),
  INDEX idx_health_metrics_user_date (user_id, date DESC)
);

-- RLS
ALTER TABLE health_metrics_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own health metrics"
  ON health_metrics_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert their own health metrics"
  ON health_metrics_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health metrics"
  ON health_metrics_history FOR UPDATE
  USING (auth.uid() = user_id);
```

**Sync Strategy:** Daily upsert after HealthKit fetch

---

## Sync Function Implementation Plan

### File: `packages/app/lib/supabase-sync-extended.ts`

```typescript
/**
 * Extended Supabase Sync Functions
 * Handles all non-sovereign_logs data synchronization
 */

import { supabase } from './supabase-client'
import type {
  UserProgress,
  Achievement,
  Kata,
  ArchetypeAnalysis,
  OEJTSAnswer,
  OEJTSResults,
  HumanDesignChart,
  BirthData,
  CosmicData,
  AstrologicalInsight,
  DailyAttunement,
  VectorEmbedding,
  HealthMetrics,
} from '../types'

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

  return { success: true }
}

export async function fetchUserProgress() {
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

  return { success: true }
}

export async function bulkSyncAchievements(achievements: Achievement[]) {
  const results = await Promise.allSettled(achievements.map((a) => syncAchievement(a)))

  const succeeded = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

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

  return { success: true }
}

export async function fetchCosmicData(date: string) {
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

  return { success: true }
}

export async function fetchAstrologyData() {
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
    console.error('[Sync] Daily attunement failed:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function fetchDailyAttunement(date: string) {
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

  const { data, error } = await supabase.rpc('match_embeddings', {
    query_embedding: queryEmbedding,
    match_user_id: user.id,
    match_threshold: threshold,
    match_count: limit,
  })

  if (error) {
    console.error('[Sync] Semantic search failed:', error)
    return []
  }

  return data
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
```

---

## Store Integration Strategy

### 1. Update `useProgressStore` (packages/app/lib/store.ts)

```typescript
completeRoutine: () => {
  // ... existing logic ...

  // Auto-sync to Supabase
  syncUserProgress(get()).catch((err) => {
    console.error('[Store] Failed to sync progress:', err)
  })
}
```

### 2. Update `useAchievementStore`

```typescript
unlockAchievement: (id) => {
  // ... existing logic ...

  const achievement = get().achievements.find((a) => a.id === id)
  if (achievement) {
    syncAchievement(achievement).catch((err) => {
      console.error('[Store] Failed to sync achievement:', err)
    })
  }
}
```

### 3. Update `useSovereignPathStore`

```typescript
addOEJTSAnswer: (answer) => {
  // ... existing logic ...

  // Sync full path data after answer
  const state = get()
  syncSovereignPathData({
    oejtsAnswers: state.oejtsAnswers,
    oejtsResults: state.oejtsResults,
  }).catch(err => {
    console.error('[Store] Failed to sync OEJTS data:', err)
  })
},

setHumanDesignChart: (chart) => {
  set({ humanDesignChart: chart })

  // Sync to Supabase
  const state = get()
  syncSovereignPathData({
    humanDesignChart: chart,
    birthData: state.birthData,
  }).catch(err => {
    console.error('[Store] Failed to sync HD chart:', err)
  })
}
```

---

## API Integration Updates

### 1. Update `useCosmicData` Hook

```typescript
// After successful fetch
setData(cosmicData)

// Sync to cache
syncCosmicData(cosmicData, date || new Date().toISOString().split('T')[0]).catch((err) =>
  console.error('[useCosmicData] Sync failed:', err)
)
```

### 2. Create Astrology Sync in `SovereignProfile.tsx`

```typescript
// After fetching astrology data
syncAstrologyData(astrologyData, birthData).catch((err) =>
  console.error('[SovereignProfile] Astrology sync failed:', err)
)
```

### 3. Add Attunement Sync (New Component)

```typescript
// When generating daily attunement
const attunement: DailyAttunement = {
  id: `attune-${Date.now()}`,
  date: new Date().toISOString().split('T')[0],
  insightfulQuestion: generatedQuestion,
  synthesizedAnswer: generatedAnswer,
  basedOn: {
    logCount: sovereignEntries.length,
    healthMetricsAvailable: !!healthMetrics,
    humanDesignAvailable: !!humanDesignChart,
    cosmicDataAvailable: !!cosmicData,
    astrologyDataAvailable: !!astrologyData,
  },
  generatedAt: new Date().toISOString(),
}

syncDailyAttunement(attunement).catch((err) => {
  console.error('[Attunement] Sync failed:', err)
})
```

---

## Testing Strategy

### 1. Update SyncTestPanel to test ALL syncs

File: `packages/app/features/user/sync-test-panel.tsx`

Add tests for:

- ✅ User progress sync
- ✅ Achievement sync
- ✅ Sovereign path data sync
- ✅ Cosmic data sync
- ✅ Astrology data sync
- ✅ Daily attunement sync
- ✅ Vector embedding sync
- ✅ Health metrics sync

### 2. Bulk Sync All Data

```typescript
const bulkSyncAllData = async () => {
  // ... existing chat/journal sync ...

  // Sync progress
  await syncUserProgress(useProgressStore.getState())

  // Sync all achievements
  const achievements = useAchievementStore.getState().achievements
  await bulkSyncAchievements(achievements)

  // Sync sovereign path
  const pathState = useSovereignPathStore.getState()
  await syncSovereignPathData({
    humanDesignChart: pathState.humanDesignChart,
    birthData: pathState.birthData,
    oejtsAnswers: pathState.oejtsAnswers,
    oejtsResults: pathState.oejtsResults,
    archetypeAnalysis: pathState.archetypeAnalysis,
    katas: pathState.katas,
    healthMetrics: pathState.healthMetrics,
  })

  // Sync health metrics history (last 30 days)
  if (pathState.healthMetrics) {
    const today = new Date().toISOString().split('T')[0]
    await syncHealthMetrics(pathState.healthMetrics, today)
  }
}
```

---

## Migration & Deployment Checklist

### Phase 1: Database Setup

- [ ] Run SQL migrations in Supabase Dashboard
- [ ] Enable pgvector extension for embeddings
- [ ] Test RLS policies
- [ ] Create match_embeddings function

### Phase 2: Code Implementation

- [ ] Create `supabase-sync-extended.ts`
- [ ] Update all stores with auto-sync
- [ ] Update API hooks with cache sync
- [ ] Add embedding generation on high-value feedback

### Phase 3: Testing

- [ ] Test each sync function individually
- [ ] Run bulk sync on test account
- [ ] Verify RLS works (can't see other users' data)
- [ ] Test semantic search with embeddings

### Phase 4: Production

- [ ] Deploy database schema
- [ ] Deploy updated app code
- [ ] Monitor sync errors in Supabase logs
- [ ] Set up alerts for failed syncs

---

## Future Enhancements

1. **Offline Queue**: Queue syncs when offline, retry on reconnect
2. **Conflict Resolution**: Handle simultaneous edits from multiple devices
3. **Incremental Sync**: Only sync changed data (delta updates)
4. **Real-time Subscriptions**: Live updates across devices via Supabase Realtime
5. **Export/Backup**: Download all data as JSON for sovereignty
6. **Advanced RAG**: Auto-generate embeddings for all sovereign logs (not just feedback)
7. **Pattern Analytics**: Server-side functions to analyze patterns across all users (anonymized)

---

## Performance Considerations

- **Batch Operations**: Use `bulkSyncAchievements()` instead of individual calls
- **Debouncing**: Don't sync on every keystroke, wait for user to finish typing
- **Caching**: Use `cosmic_data_cache` and `astrology_data_cache` to avoid API rate limits
- **Selective Sync**: Only sync when data actually changes (use dirty flags)
- **Background Sync**: Use service workers on web, background tasks on native

---

## Data Sovereignty

All data is:

- **User-owned**: RLS ensures you only see your data
- **Portable**: Export functions to download everything
- **Deletable**: Cascade deletes when user account deleted
- **Private**: No cross-user analytics without explicit consent
- **Encrypted**: Supabase encrypts at rest, TLS in transit

---

**End of Document**
