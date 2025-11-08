-- ============================================================
-- Somatic Alignment - Extended Database Migration
-- Adds tables for complete app sync architecture
-- Run this AFTER database-setup.sql
-- ============================================================

-- This migration adds:
-- 1. user_progress (routine tracking)
-- 2. achievements (gamification)
-- 3. sovereign_path_data (HD, OEJTS, katas, health)
-- 4. cosmic_data_cache (astronomy API cache)
-- 5. astrology_data_cache (RapidAPI astrology cache)
-- 6. daily_attunements (AI-generated questions)
-- 7. vector_embeddings (enhanced RAG with universal types)
-- 8. health_metrics_history (HealthKit timeline)

-- ============================================================
-- CLEAN SLATE - Drop extended tables if they exist
-- ============================================================

DROP TABLE IF EXISTS public.health_metrics_history CASCADE;
DROP TABLE IF EXISTS public.vector_embeddings CASCADE;
DROP TABLE IF EXISTS public.daily_attunements CASCADE;
DROP TABLE IF EXISTS public.astrology_data_cache CASCADE;
DROP TABLE IF EXISTS public.cosmic_data_cache CASCADE;
DROP TABLE IF EXISTS public.sovereign_path_data CASCADE;
DROP TABLE IF EXISTS public.achievements CASCADE;
DROP TABLE IF EXISTS public.user_progress CASCADE;

-- Drop functions (both old signatures)
DROP FUNCTION IF EXISTS public.match_embeddings(vector(384), uuid, float, int);
DROP FUNCTION IF EXISTS public.match_embeddings(vector(384), float, int);

-- ============================================================
-- TABLE 1: user_progress
-- Tracks routine completions and streaks
-- ============================================================

CREATE TABLE public.user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  compliance_streak INTEGER DEFAULT 0,
  last_completed_date DATE,
  total_completions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_progress_user_id ON public.user_progress(user_id);

-- RLS Policies
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress"
  ON public.user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON public.user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON public.user_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress"
  ON public.user_progress FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- TABLE 2: achievements
-- Gamification and milestone tracking
-- ============================================================

CREATE TABLE public.achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  unlocked BOOLEAN DEFAULT FALSE,
  unlocked_date TIMESTAMPTZ,
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, achievement_id)
);

-- Indexes
CREATE INDEX idx_achievements_user_id ON public.achievements(user_id);
CREATE INDEX idx_achievements_unlocked ON public.achievements(user_id, unlocked);

-- RLS Policies
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievements"
  ON public.achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON public.achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements"
  ON public.achievements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own achievements"
  ON public.achievements FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- TABLE 3: sovereign_path_data
-- Blueprint data: Human Design, OEJTS, Katas, Archetype Analysis
-- ============================================================

CREATE TABLE public.sovereign_path_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Human Design
  human_design_chart JSONB,
  birth_data JSONB,
  
  -- OEJTS/MBTI Assessment
  oejts_answers JSONB DEFAULT '[]'::jsonb,
  oejts_results JSONB,
  
  -- Archetype Analysis
  archetype_analysis JSONB,
  last_archetype_update TIMESTAMPTZ,
  
  -- Katas
  katas JSONB DEFAULT '[]'::jsonb,
  
  -- Health Metrics (latest snapshot)
  health_metrics JSONB,
  
  -- Sync tracking
  last_sync_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sovereign_path_user_id ON public.sovereign_path_data(user_id);

-- RLS Policies
ALTER TABLE public.sovereign_path_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own path data"
  ON public.sovereign_path_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own path data"
  ON public.sovereign_path_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own path data"
  ON public.sovereign_path_data FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own path data"
  ON public.sovereign_path_data FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- TABLE 4: cosmic_data_cache
-- IP Geolocation Astronomy API cache
-- ============================================================

CREATE TABLE public.cosmic_data_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  location JSONB NOT NULL, -- {latitude, longitude, city, country}
  astronomy JSONB NOT NULL, -- Full astronomy object
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

-- Indexes
CREATE INDEX idx_cosmic_cache_user_date ON public.cosmic_data_cache(user_id, date DESC);

-- RLS Policies
ALTER TABLE public.cosmic_data_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cosmic cache"
  ON public.cosmic_data_cache FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cosmic cache"
  ON public.cosmic_data_cache FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cosmic cache"
  ON public.cosmic_data_cache FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cosmic cache"
  ON public.cosmic_data_cache FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- TABLE 5: astrology_data_cache
-- RapidAPI Astrology cache (natal chart, transits)
-- ============================================================

CREATE TABLE public.astrology_data_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  birth_data JSONB NOT NULL, -- {date, time, latitude, longitude}
  natal_chart JSONB,
  transits JSONB,
  personal_trading JSONB, -- Financial astrology insights
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_astrology_cache_user_id ON public.astrology_data_cache(user_id);

-- RLS Policies
ALTER TABLE public.astrology_data_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own astrology cache"
  ON public.astrology_data_cache FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own astrology cache"
  ON public.astrology_data_cache FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own astrology cache"
  ON public.astrology_data_cache FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own astrology cache"
  ON public.astrology_data_cache FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- TABLE 6: daily_attunements
-- AI-generated personalized questions and answers
-- ============================================================

CREATE TABLE public.daily_attunements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  insightful_question TEXT NOT NULL,
  synthesized_answer TEXT NOT NULL,
  based_on JSONB DEFAULT '{}'::jsonb, -- {logCount, healthMetricsAvailable, etc.}
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

-- Indexes
CREATE INDEX idx_attunements_user_date ON public.daily_attunements(user_id, date DESC);

-- RLS Policies
ALTER TABLE public.daily_attunements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own attunements"
  ON public.daily_attunements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attunements"
  ON public.daily_attunements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attunements"
  ON public.daily_attunements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own attunements"
  ON public.daily_attunements FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- TABLE 7: vector_embeddings
-- Universal RAG embeddings (sovereign logs, feedback, journals)
-- ============================================================

CREATE TABLE public.vector_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(384) NOT NULL, -- BAAI/bge-small-en-v1.5
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_vector_embeddings_user_id ON public.vector_embeddings(user_id);
CREATE INDEX idx_vector_embeddings_metadata ON public.vector_embeddings USING GIN(metadata jsonb_path_ops);

-- Vector similarity indexes
CREATE INDEX idx_vector_embeddings_ivfflat
  ON public.vector_embeddings 
  USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 100);

CREATE INDEX idx_vector_embeddings_hnsw
  ON public.vector_embeddings 
  USING hnsw (embedding vector_cosine_ops);

-- RLS Policies
ALTER TABLE public.vector_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own embeddings"
  ON public.vector_embeddings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own embeddings"
  ON public.vector_embeddings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own embeddings"
  ON public.vector_embeddings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own embeddings"
  ON public.vector_embeddings FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- TABLE 8: health_metrics_history
-- HealthKit data timeline (iOS only)
-- ============================================================

CREATE TABLE public.health_metrics_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  steps INTEGER,
  sleep_hours DECIMAL(4,2),
  walking_asymmetry DECIMAL(5,2),
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

-- Indexes
CREATE INDEX idx_health_metrics_user_date ON public.health_metrics_history(user_id, date DESC);

-- RLS Policies
ALTER TABLE public.health_metrics_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own health metrics"
  ON public.health_metrics_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health metrics"
  ON public.health_metrics_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health metrics"
  ON public.health_metrics_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health metrics"
  ON public.health_metrics_history FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- RPC FUNCTION: match_embeddings
-- Universal semantic search for vector_embeddings table
-- Uses SECURITY INVOKER to respect RLS policies automatically
-- ============================================================

CREATE OR REPLACE FUNCTION public.match_embeddings(
  query_embedding vector(384),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  content TEXT,
  similarity FLOAT,
  metadata JSONB
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    vector_embeddings.id,
    vector_embeddings.user_id,
    vector_embeddings.content,
    1 - (vector_embeddings.embedding <=> query_embedding) AS similarity,
    vector_embeddings.metadata
  FROM vector_embeddings
  WHERE 1 - (vector_embeddings.embedding <=> query_embedding) > match_threshold
    AND vector_embeddings.user_id = auth.uid()
  ORDER BY vector_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================
-- VERIFICATION QUERIES
-- Run these to confirm migration succeeded
-- ============================================================

-- Check all extended tables exist (should return 8 rows)
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'user_progress',
  'achievements',
  'sovereign_path_data',
  'cosmic_data_cache',
  'astrology_data_cache',
  'daily_attunements',
  'vector_embeddings',
  'health_metrics_history'
)
ORDER BY table_name;

-- Check all indexes created (should see multiple per table)
SELECT 
  tablename, 
  indexname
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN (
  'user_progress',
  'achievements',
  'sovereign_path_data',
  'cosmic_data_cache',
  'astrology_data_cache',
  'daily_attunements',
  'vector_embeddings',
  'health_metrics_history'
)
ORDER BY tablename, indexname;

-- Check RLS is enabled on all tables (should return 8 rows with rowsecurity=true)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN (
  'user_progress',
  'achievements',
  'sovereign_path_data',
  'cosmic_data_cache',
  'astrology_data_cache',
  'daily_attunements',
  'vector_embeddings',
  'health_metrics_history'
)
ORDER BY tablename;

-- Check all RLS policies (should see 4 policies per table = 32 total)
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN (
  'user_progress',
  'achievements',
  'sovereign_path_data',
  'cosmic_data_cache',
  'astrology_data_cache',
  'daily_attunements',
  'vector_embeddings',
  'health_metrics_history'
)
ORDER BY tablename, policyname;

-- Check match_embeddings function exists
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name = 'match_embeddings';

-- Check vector indexes on vector_embeddings table
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'vector_embeddings'
AND indexname LIKE '%vector%';

-- Summary: Count all objects created
SELECT 
  'Tables' as object_type,
  COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'user_progress', 'achievements', 'sovereign_path_data',
  'cosmic_data_cache', 'astrology_data_cache', 'daily_attunements',
  'vector_embeddings', 'health_metrics_history'
)
UNION ALL
SELECT 
  'RLS Policies' as object_type,
  COUNT(*) as count
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN (
  'user_progress', 'achievements', 'sovereign_path_data',
  'cosmic_data_cache', 'astrology_data_cache', 'daily_attunements',
  'vector_embeddings', 'health_metrics_history'
)
UNION ALL
SELECT 
  'Functions' as object_type,
  COUNT(*) as count
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name = 'match_embeddings';

-- ============================================================
-- Expected Results:
-- - 8 tables created
-- - 32 RLS policies (4 per table)
-- - 16+ indexes (2+ per table)
-- - 1 RPC function (match_embeddings)
-- ============================================================

-- SUCCESS! ✅
-- All extended tables, indexes, policies, and functions created.
-- Your Somatic Alignment app now has complete sync architecture.
